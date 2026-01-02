from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import pandas as pd
from datetime import datetime
from models import User, UserDataset
from models import db
from flask import Flask, render_template, url_for, flash, redirect
from flask_login import login_required, current_user, logout_user
import json
from io import BytesIO
import matplotlib
matplotlib.use('Agg') # Fixes "main thread" errors
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

# --- APP CONFIGURATION ---
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'site.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev_key'

UPLOAD_FOLDER = os.path.join(basedir, 'user_uploads')
ALLOWED_EXTENSIONS = {'xlsx', 'csv'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

CORS(app, resources={r"/api/*": {"origins": "*", "allow_headers": ["Content-Type", "X-User-ID"]}})
db.init_app(app)

# --- LOAD MINES FROM JSON FILE ---
def load_mine_registry():
    try:
        # Looks for mines.json in the same folder as app.py
        with open(os.path.join(basedir, 'mines.json'), 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("⚠️ Warning: mines.json not found. Registry will be empty.")
        return {}

MINE_REGISTRY = load_mine_registry()

# --- SINK CALCULATION CONSTANTS ---
STATE_DEFAULTS = {
    "Jharkhand": 4.5, "Odisha": 5.2, "Chhattisgarh": 6.8, 
    "Madhya Pradesh": 4.0, "Telangana": 3.5, "Maharashtra": 4.2,
    "West Bengal": 4.1, "Uttar Pradesh": 3.8, "Tamil Nadu": 5.0
}
SPECIES_RATES = {
    "synthetic": "AUTO", 
    "dense_forest": 8.0, 
    "scrub_land": 1.5,
    "bamboo": 12.0,      
    "young_plantation": 3.0,
    "mixed_forest": 5.5
}

def calculate_sink(area, age, p_type, state):
    # 1. Base Factor
    if p_type == "synthetic" or p_type not in SPECIES_RATES:
        base_factor = STATE_DEFAULTS.get(state, 4.0) 
    else:
        base_factor = SPECIES_RATES.get(p_type, 4.0)
    
    # 2. Age Adjustment 
    # Note: Operational mines (Registry) will always have Age=10, so factor=1.0
    age_factor = 1.0
    if age < 3: age_factor = 0.3
    elif age < 7: age_factor = 0.7
    
    # 3. Calculation
    sequestration = area * base_factor * age_factor
    return round(sequestration, 2), base_factor

# --- HELPERS ---

def get_user_from_header():
    user_id = request.headers.get('X-User-ID')
    if user_id:
        try: return User.query.get(int(user_id))
        except: return None
    return None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- ROUTES ---

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({'message': 'Username taken'}), 409
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Email already registered'}), 409
    
    try:
        new_user = User(
            username=data.get('username'), 
            email=data.get('email'),
            password=data.get('password'), # In production, use hashing!
            # Defaults
            mine_name="", state="Jharkhand", mine_type="Opencast", 
            production_tpa=0.0, employees=0, 
            plantation_area=0.0, plantation_age=5.0, plantation_type="synthetic"
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created', 'user_id': new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    
    if user and user.password == data.get('password'):
        return jsonify({'message': 'Login successful', 'user_id': user.id}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/get-mine-list', methods=['GET'])
def get_mine_list():
    # Reload registry dynamically
    global MINE_REGISTRY
    MINE_REGISTRY = load_mine_registry()
    return jsonify(sorted(list(MINE_REGISTRY.keys()))), 200

@app.route('/api/get-profile', methods=['GET'])
def get_profile():
    user = get_user_from_header()
    if not user: return jsonify({'message': 'Unauthorized'}), 401
    
    sink_val, _ = calculate_sink(user.plantation_area, user.plantation_age, user.plantation_type, user.state)
    
    return jsonify({
        "mine_name": user.mine_name,
        "state": user.state,
        "type": user.mine_type,
        "production": user.production_tpa,
        "employees": user.employees,
        "plantation": {
            "area": user.plantation_area,
            "age": user.plantation_age,
            "type": user.plantation_type,
            "calculated_sink_tco2e": sink_val
        }
    })

@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    user = get_user_from_header()
    if not user: return jsonify({'message': 'Unauthorized'}), 401
    
    data = request.json
    selected_mine = data.get('selected_mine') 
    
    # Reload registry
    global MINE_REGISTRY
    MINE_REGISTRY = load_mine_registry()

    # 1. CLAIM LOCK
    if selected_mine and selected_mine != "Manual":
        existing_owner = User.query.filter(User.mine_name == selected_mine, User.id != user.id).first()
        if existing_owner:
            masked_email = existing_owner.email[:3] + "****" + existing_owner.email.split('@')[-1]
            return jsonify({
                'message': f'Ownership Conflict: "{selected_mine}" is managed by ({masked_email}).'
            }), 403

    # 2. REGISTRY MODE (Operational Mines)
    if selected_mine and selected_mine in MINE_REGISTRY:
        info = MINE_REGISTRY[selected_mine]
        user.mine_name = selected_mine
        user.state = info.get('state', 'Jharkhand')
        user.mine_type = info.get('type', 'Opencast')
        user.production_tpa = info.get('prod', 0)
        user.employees = info.get('emp', 100) 
        
        # --- MATURE MINE LOGIC ---
        if 'cover_ha' in info:
            # We have exact data
            user.plantation_area = info['cover_ha']
            user.plantation_type = info.get('tree', 'synthetic')
        else:
            # We estimate based on production (20% rule)
            estimated_total_land = user.production_tpa * 0.0001 
            user.plantation_area = round(estimated_total_land * 0.20, 2) 
            if user.plantation_area < 5: user.plantation_area = 5.0
            user.plantation_type = 'synthetic'
            
        # FORCE AGE TO 10 (MATURE) FOR ALL REGISTRY MINES
        user.plantation_age = 10.0 
        
    # 3. MANUAL MODE (New Projects)
    else:
        user.mine_name = data.get('mine_name', user.mine_name)
        user.state = data.get('state', user.state)
        user.production_tpa = float(data.get('production', user.production_tpa) or 0)
        user.employees = int(data.get('employees', user.employees) or 0)
        
        raw_area = data.get('area')
        raw_age = data.get('age')
        
        if not raw_area or float(raw_area) == 0:
            estimated_total_land = user.production_tpa * 0.0001 
            user.plantation_area = round(estimated_total_land * 0.20, 2)
            if user.plantation_area < 5: user.plantation_area = 5.0
        else:
            user.plantation_area = float(raw_area)

        if not raw_age or float(raw_age) == 0:
            user.plantation_age = 5.0 
        else:
            user.plantation_age = float(raw_age)
            
        user.plantation_type = data.get('plant_type', 'synthetic')

    db.session.commit()
    return jsonify({'message': 'Profile Linked! Sink data calibrated for operational mine.'}), 200

# --- DATASET MANAGEMENT ---

@app.route('/api/user-datasets', methods=['GET'])
def get_user_datasets():
    user = get_user_from_header()
    if not user: return jsonify({'message': 'Unauthorized'}), 401
    
    datasets = UserDataset.query.filter_by(user_id=user.id).all()
    output = []
    for d in datasets:
        output.append({
            'dataset_id': d.id,
            'filename': d.filename,
            'upload_date': d.date_uploaded.strftime('%Y-%m-%d'),
            'status': 'Ready' if os.path.exists(d.file_path) else 'Missing'
        })
    return jsonify(output), 200

@app.route('/api/upload-data', methods=['POST'])
def upload_data():
    user = get_user_from_header()
    if not user: return jsonify({'message': 'Unauthorized'}), 401

    if 'files' not in request.files: return jsonify({'message': 'No files provided'}), 400

    uploaded_files = request.files.getlist('files')
    saved_files = []
    duplicate_files = []

    for file in uploaded_files:
        if file.filename == '': continue
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            
            existing = UserDataset.query.filter_by(user_id=user.id, filename=filename).first()
            
            if existing:
                duplicate_files.append(filename)
            else:
                unique_name = f"{int(datetime.now().timestamp())}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
                file.save(filepath)
                
                new_dataset = UserDataset(user_id=user.id, filename=filename, file_path=filepath)
                db.session.add(new_dataset)
                saved_files.append(filename)
    
    db.session.commit()
    
    if len(duplicate_files) > 0 and len(saved_files) == 0:
        return jsonify({'message': f'Upload blocked: File(s) already exist.'}), 409
    
    msg = f"Successfully uploaded {len(saved_files)} file(s)."
    if len(duplicate_files) > 0:
        msg += f" (Skipped {len(duplicate_files)} duplicates)."
        
    return jsonify({'message': msg}), 201

@app.route('/api/delete-dataset/<int:id>', methods=['DELETE'])
def delete_dataset(id):
    user = get_user_from_header()
    if not user: return jsonify({'message': 'Unauthorized'}), 401
    
    dataset = UserDataset.query.filter_by(id=id, user_id=user.id).first()
    if not dataset: return jsonify({'message': 'File not found'}), 404
    
    try:
        if os.path.exists(dataset.file_path):
            os.remove(dataset.file_path)
        db.session.delete(dataset)
        db.session.commit()
        return jsonify({'message': 'File deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# --- ANALYSIS ROUTES ---

@app.route("/api/analyze/<int:dataset_id>")
def analyze_dataset(dataset_id):
    user = get_user_from_header()
    if not user: return jsonify({'message': 'Unauthorized'}), 401
    
    dataset = UserDataset.query.filter_by(id=dataset_id, user_id=user.id).first()
    if not dataset or not os.path.exists(dataset.file_path): 
        return jsonify({'message': 'File not found.'}), 404
        
    try:
        if dataset.file_path.lower().endswith('.csv'): df = pd.read_csv(dataset.file_path)
        else: df = pd.read_excel(dataset.file_path)
        df.columns = [c.lower() for c in df.columns]
        
        diesel_liters = float(df['diesel_liters'].sum()) if 'diesel_liters' in df.columns else 0.0
        elec_kwh = float(df['electricity_kwh'].sum()) if 'electricity_kwh' in df.columns else 0.0
        explosives = float(df['explosives_kg'].sum()) if 'explosives_kg' in df.columns else 0.0
        
        scope1_total = ((diesel_liters * 2.68) + (explosives * 0.17)) / 1000
        scope2_total = (elec_kwh * 0.82) / 1000
        total_emissions = scope1_total + scope2_total

        sink_val, _ = calculate_sink(user.plantation_area, user.plantation_age, user.plantation_type, user.state)
        net_gap = total_emissions - sink_val
        
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df['month_label'] = df['date'].dt.strftime('%b-%Y')
            df = df.sort_values('date')
        else:
            df['month_label'] = df.index
            
        monthly_df = df.groupby('month_label', sort=False).agg({
            'diesel_liters': 'sum',
            'electricity_kwh': 'sum'
        }).reset_index()

        prod = user.production_tpa if user.production_tpa > 0 else 1.0
        emps = user.employees if user.employees > 0 else 1.0
        
        return jsonify({
            "dataset_id": dataset.id,
            "mine_profile": {"mine_name": user.mine_name, "state": user.state, "area_ha": user.plantation_area},
            "summary": {
                "total_emissions": round(total_emissions, 2),
                "scope1": round(scope1_total, 2),
                "scope2": round(scope2_total, 2),
                "total_sink": round(sink_val, 2),
                "net_gap": round(net_gap, 2)
            },
            "metrics": {
                "per_tonne_coal": round(total_emissions / prod, 5),
                "per_employee": round(total_emissions / emps, 2)
            },
            "monthly_data": monthly_df.to_dict(orient='records')
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Calculation Error: {str(e)}'}), 500

@app.route('/api/emissions-breakdown/<int:dataset_id>')
def emissions_breakdown(dataset_id):
    user = get_user_from_header()
    if not user: return jsonify({'message': 'Unauthorized'}), 401
    
    dataset = UserDataset.query.filter_by(id=dataset_id, user_id=user.id).first()
    if not dataset: return jsonify({'message': 'File not found'}), 404

    try:
        if dataset.file_path.lower().endswith('.csv'): df = pd.read_csv(dataset.file_path)
        else: df = pd.read_excel(dataset.file_path)
        df.columns = [c.lower() for c in df.columns]
        
        diesel = df['diesel_liters'].sum() if 'diesel_liters' in df.columns else 0
        elec = df['electricity_kwh'].sum() if 'electricity_kwh' in df.columns else 0
        explosives = df['explosives_kg'].sum() if 'explosives_kg' in df.columns else 0
        
        diesel_co2 = (diesel * 2.68) / 1000
        elec_co2 = (elec * 0.82) / 1000
        explosives_co2 = (explosives * 0.17) / 1000
        
        scope1 = diesel_co2 + explosives_co2 
        scope2 = elec_co2                    
        total_co2 = scope1 + scope2
        
        prod_total = df['production_tonnes'].sum() if 'production_tonnes' in df.columns else user.production_tpa
        if prod_total == 0: prod_total = 1 
        
        if 'employees_present' in df.columns:
            emp_count = df['employees_present'].mean()
        else:
            emp_count = user.employees
        if emp_count == 0: emp_count = 1

        intensity_coal = total_co2 / prod_total
        intensity_emp = total_co2 / emp_count

        max_source = "Diesel" if diesel_co2 > elec_co2 else "Electricity"
        max_pct = (max(diesel_co2, elec_co2) / total_co2 * 100) if total_co2 > 0 else 0
        
        diagnosis = (
            f"In this period, total emissions were {round(total_co2, 1)} tCO2e. "
            f"Scope 1 contributed {round((scope1/total_co2)*100, 1)}% and Scope 2 {round((scope2/total_co2)*100, 1)}%. "
            f"The largest source was {max_source} ({round(max_pct, 1)}% of total)."
        )

        activity_mix = [
            {"name": "Diesel", "value": round(diesel_co2, 2)},
            {"name": "Electricity", "value": round(elec_co2, 2)},
            {"name": "Explosives", "value": round(explosives_co2, 2)}
        ]

        return jsonify({
            "kpis": {
                "total_emissions": round(total_co2, 2),
                "intensity_coal": round(intensity_coal, 5),
                "intensity_emp": round(intensity_emp, 2),
                "scope1": round(scope1, 2),
                "scope2": round(scope2, 2)
            },
            "breakdowns": {
                "activity_mix": [x for x in activity_mix if x['value'] > 0],
                "scope_split": [
                    {"name": "Scope 1", "value": round(scope1, 2)}, 
                    {"name": "Scope 2", "value": round(scope2, 2)}
                ]
            },
            "diagnosis": diagnosis
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'message': 'Error processing data'}), 500

@app.route("/api/analyze-all")
def analyze_all_datasets():
    user = get_user_from_header()
    if not user: return jsonify({'message': 'Unauthorized'}), 401
    
    datasets = UserDataset.query.filter_by(user_id=user.id).all()
    if not datasets: 
        return jsonify({'message': 'No data found.'}), 404
        
    try:
        grand_total_emissions = 0.0
        grand_total_sink = 0.0
        grand_scope1 = 0.0
        grand_scope2 = 0.0
        
        total_prod = 0.0
        weighted_intensity_sum = 0.0
        yearly_trends = []
        import re 

        for ds in datasets:
            if not os.path.exists(ds.file_path): continue
            
            if ds.file_path.lower().endswith('.csv'): df = pd.read_csv(ds.file_path)
            else: df = pd.read_excel(ds.file_path)
            df.columns = [c.lower() for c in df.columns]
            
            diesel = float(df['diesel_liters'].sum()) if 'diesel_liters' in df.columns else 0.0
            elec = float(df['electricity_kwh'].sum()) if 'electricity_kwh' in df.columns else 0.0
            explosives = float(df['explosives_kg'].sum()) if 'explosives_kg' in df.columns else 0.0
            prod = float(df['production_tonnes'].sum()) if 'production_tonnes' in df.columns else (user.production_tpa or 0.0)

            s1 = ((diesel * 2.68) + (explosives * 0.17)) / 1000
            s2 = (elec * 0.82) / 1000
            total = s1 + s2
            
            grand_total_emissions += total
            grand_scope1 += s1
            grand_scope2 += s2
            
            year_match = re.search(r'20\d{2}', ds.filename)
            label = year_match.group(0) if year_match else ds.date_uploaded.strftime('%Y')
            
            yearly_trends.append({
                "year_label": label,
                "diesel_liters": float(diesel),
                "electricity_kwh": float(elec),
                "total_emissions": float(round(total, 2))
            })
            
            if prod > 0:
                total_prod += prod
                weighted_intensity_sum += (total / prod) * prod

        annual_sink, _ = calculate_sink(user.plantation_area, user.plantation_age, user.plantation_type, user.state)
        grand_total_sink = float(annual_sink * len(datasets))
        grand_net_gap = grand_total_emissions - grand_total_sink
        avg_intensity = (weighted_intensity_sum / total_prod) if total_prod > 0 else 0.0

        yearly_trends.sort(key=lambda x: x['year_label'])

        return jsonify({
            "summary": {
                "total_emissions": float(round(grand_total_emissions, 2)),
                "total_sink": float(round(grand_total_sink, 2)),
                "net_gap": float(round(grand_net_gap, 2)),
                "scope1": float(round(grand_scope1, 2)),
                "scope2": float(round(grand_scope2, 2))
            },
            "metrics": {
                "per_tonne_coal": float(round(avg_intensity, 5)),
                "file_count": len(datasets)
            },
            "monthly_data": yearly_trends 
        }), 200
        
    except Exception as e:
        print(f"Error in analyze-all: {e}") 
        return jsonify({'message': f'Error aggregating data: {str(e)}'}), 500

# --- ADVANCED REPORT GENERATION (WITH CHARTS) ---
def create_chart_image(data_dict, title, chart_type='pie'):
    img_buffer = BytesIO()
    plt.figure(figsize=(4, 3))
    
    if chart_type == 'pie':
        labels = [k for k, v in data_dict.items() if v > 0]
        sizes = [v for k, v in data_dict.items() if v > 0]
        plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140, colors=['#ff9999','#66b3ff','#99ff99','#ffcc99'])
    elif chart_type == 'bar':
        names = list(data_dict.keys())
        values = list(data_dict.values())
        plt.bar(names, values, color='#2e7d32')
        plt.xticks(rotation=15)
        
    plt.title(title)
    plt.tight_layout()
    plt.savefig(img_buffer, format='png')
    plt.close()
    img_buffer.seek(0)
    return RLImage(img_buffer, width=4*inch, height=3*inch)

@app.route('/api/download-report/<int:dataset_id>')
def download_report(dataset_id):
    user = get_user_from_header()
    if not user: return jsonify({'message': 'Unauthorized'}), 401

    dataset = UserDataset.query.filter_by(id=dataset_id, user_id=user.id).first()
    if not dataset: return jsonify({'message': 'File not found'}), 404

    try:
        if dataset.file_path.lower().endswith('.csv'): df = pd.read_csv(dataset.file_path)
        else: df = pd.read_excel(dataset.file_path)
        df.columns = [c.lower() for c in df.columns]
        
        user_type = getattr(user, 'mine_type', getattr(user, 'type', 'N/A'))
        
        diesel = df['diesel_liters'].sum() if 'diesel_liters' in df.columns else 0
        elec = df['electricity_kwh'].sum() if 'electricity_kwh' in df.columns else 0
        explosives = df['explosives_kg'].sum() if 'explosives_kg' in df.columns else 0
        
        scope1 = ((diesel * 2.68) + (explosives * 0.17)) / 1000
        scope2 = (elec * 0.82) / 1000
        total_emissions = scope1 + scope2
        
        sink_val, _ = calculate_sink(user.plantation_area, user.plantation_age, user.plantation_type, user.state)
        net_gap = total_emissions - sink_val
        offset_ratio = (sink_val / total_emissions * 100) if total_emissions > 0 else 0
        
        prod = df['production_tonnes'].sum() if 'production_tonnes' in df.columns else (user.production_tpa or 1)
        emps = user.employees if user.employees > 0 else 1
        intensity_coal = total_emissions / prod if prod > 0 else 0
        intensity_emp = total_emissions / emps
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle('Title', parent=styles['Heading1'], textColor=colors.darkgreen, alignment=1)
        h2_style = ParagraphStyle('H2', parent=styles['Heading2'], textColor=colors.black, spaceBefore=15, borderPadding=5, borderColor=colors.lightgrey, borderWidth=0, borderBottomWidth=1)
        text_style = styles['BodyText']
        
        elements.append(Paragraph("E-MetricX: Strategic Carbon Dossier", title_style))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d')} | Mine: {user.mine_name} ({user.state})", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        data_context = [
            ["Attribute", "Value", "Attribute", "Value"],
            ["Mine Type", user_type, "Production", f"{prod:,.0f} TPA"],
            ["Location", user.state, "Employees", str(emps)],
            ["Report ID", f"{dataset.id}-{user.id}", "File Name", dataset.filename]
        ]
        t = Table(data_context, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))

        elements.append(Paragraph("2. Methodology & Standards", h2_style))
        method_text = """
        <b>Scope 1:</b> Direct emissions from Diesel (2.68 kgCO2e/L) and Explosives (0.17 kgCO2e/kg).<br/>
        <b>Scope 2:</b> Indirect emissions from Grid Electricity (0.82 kgCO2e/kWh - Indian Grid Avg).<br/>
        <b>Sinks:</b> Based on regional sequestration rates per hectare for selected plantation type.
        """
        elements.append(Paragraph(method_text, text_style))
        elements.append(Spacer(1, 15))

        elements.append(Paragraph("3. Emissions Profile (Current Year)", h2_style))
        
        chart_data = {'Diesel': (diesel*2.68)/1000, 'Electricity': scope2, 'Explosives': (explosives*0.17)/1000}
        chart_img = create_chart_image(chart_data, "Emissions by Source (tCO2e)")
        elements.append(chart_img)
        
        summary_data = [
            ["Metric", "Value", "Notes"],
            ["Total Emissions", f"{total_emissions:,.2f} tCO2e", "Scope 1 + Scope 2"],
            ["Scope 1 (Direct)", f"{scope1:,.2f} tCO2e", f"{((scope1/total_emissions)*100):.1f}% of Total"],
            ["Scope 2 (Indirect)", f"{scope2:,.2f} tCO2e", f"{((scope2/total_emissions)*100):.1f}% of Total"],
            ["Intensity (Coal)", f"{intensity_coal:.5f} t/t", "Per tonne production"],
            ["Intensity (People)", f"{intensity_emp:.2f} t/p", "Per employee"]
        ]
        t2 = Table(summary_data, colWidths=[2*inch, 2*inch, 2.5*inch])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.darkgreen),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
        ]))
        elements.append(t2)
        elements.append(Spacer(1, 15))

        elements.append(Paragraph("4. Gap to Neutrality", h2_style))
        
        status_color = "green" if net_gap <= 0 else "red"
        gap_text = f"""
        <b>Total Carbon Sink:</b> {sink_val:,.1f} tCO2e (Offsetting {offset_ratio:.1f}% of emissions).<br/>
        <b>Net Gap:</b> <font color="{status_color}"><b>{net_gap:,.1f} tCO2e</b></font><br/>
        <br/>
        <i>Diagnosis: Your natural sinks neutralize {offset_ratio:.1f}% of your footprint. 
        You need to reduce or offset the remaining {max(0, net_gap):,.0f} tonnes to reach Net Zero.</i>
        """
        elements.append(Paragraph(gap_text, text_style))
        elements.append(Spacer(1, 15))

        elements.append(Paragraph("5. Hotspot Analysis", h2_style))
        hotspot_source = "Diesel" if scope1 > scope2 else "Electricity"
        risk_level = "High" if intensity_coal > 0.005 else "Medium" if intensity_coal > 0.002 else "Low" 
        
        risk_text = f"""
        <ul>
            <li><b>Primary Hotspot:</b> {hotspot_source} accounts for the majority of emissions.</li>
            <li><b>Risk Classification:</b> {risk_level} (Based on intensity of {intensity_coal:.4f}).</li>
            <li><b>Recommendation:</b> Focus on {hotspot_source} reduction strategies first.</li>
        </ul>
        """
        elements.append(Paragraph(risk_text, text_style))

        elements.append(Spacer(1, 30))
        elements.append(Paragraph("Disclaimer: This report is a computer-generated estimate based on user-supplied activity data and standard emission factors. It does not constitute a verified legal audit.", styles['Italic']))

        doc.build(elements)
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f"E-MetricX_Dossier_{user.mine_name}.pdf", mimetype='application/pdf')

    except Exception as e:
        print(f"PDF Gen Error: {e}")
        return jsonify({'message': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)