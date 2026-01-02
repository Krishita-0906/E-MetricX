import pandas as pd
import numpy as np
import os

# Folder setup
output_folder = 'nuclear_datasets'
if not os.path.exists(output_folder): os.makedirs(output_folder)

years = [2021, 2022, 2023, 2024, 2025]

# --- THE STRATEGY ---
# Your code uses "Miracle Math" (High Sink Credit).
# To beat it, we need "Nuclear Emissions" (Massive Fuel Burn).

nuclear_profile = {
    "prefix": "small_mine",
    "prod_base": 500000,
    
    # 1. EMISSIONS EXPLOSION
    # We set fuel to 3.5 MILLION Liters.
    # Logic: 3.5M * 2.68 = ~9,380 Tonnes CO2 from Diesel alone.
    "diesel_haulage": 3500000, 
    "diesel_logistics": 500000,
    
    # We set Electricity to 10 MILLION kWh.
    # Logic: 10M * 0.82 = ~8,200 Tonnes CO2 from Grid.
    "elec_processing": 7000000, 
    "elec_pumping": 3000000, 
    "elec_admin": 1000000,
    
    "explosives": 50000,
    
    # 2. THE SINK (Standard)
    # Even if your code gives this 150ha a "Miracle" rating of 8t/ha,
    # 150 * 8 = 1,200 Tonnes.
    # 1,200 (Sink) vs 17,000 (Emissions) = HUGE RED GAP.
    "base_cover_ha": 150, 
    "trend_emission": 1.05, "trend_cover": 1.0 
}

def generate_file(year, profile, prev_data=None):
    # Trend Logic
    factor = profile['trend_emission']
    if prev_data:
        t_haul = prev_data['h'] * factor
        t_log = prev_data['l'] * factor
        t_proc = prev_data['p'] * factor
        t_pump = prev_data['u'] * factor
        t_adm = prev_data['a'] * factor
        t_exp = prev_data['e'] * factor
        t_prod = prev_data['prod'] * factor
        t_cover = prev_data['cover'] * profile['trend_cover']
    else:
        t_haul, t_log = profile['diesel_haulage'], profile['diesel_logistics']
        t_proc, t_pump, t_adm = profile['elec_processing'], profile['elec_pumping'], profile['elec_admin']
        t_exp, t_prod, t_cover = profile['explosives'], profile['prod_base'], profile['base_cover_ha']

    # Generate Rows
    months = pd.date_range(start=f'{year}-01-01', periods=12, freq='ME')
    data = []
    
    for i in range(12):
        noise = np.random.uniform(0.9, 1.1)
        data.append({
            'date': months[i].strftime('%Y-%m-%d'),
            # The app needs these EXACT column names to work
            'diesel_haulage_liters': int(t_haul / 12 * noise),
            'diesel_logistics_liters': int(t_log / 12 * noise),
            'electricity_processing_kwh': int(t_proc / 12 * noise),
            'electricity_pumping_kwh': int(t_pump / 12 * noise),
            'electricity_admin_kwh': int(t_adm / 12 * noise),
            'explosives_kg': int(t_exp / 12 * noise),
            'production_tonnes': int(t_prod / 12 * noise),
            'employees_present': int(np.random.normal(500, 50)),
            'green_cover_ha': round(t_cover, 2)
        })

    df = pd.DataFrame(data)
    totals = {
        'h': df['diesel_haulage_liters'].sum(), 'l': df['diesel_logistics_liters'].sum(),
        'p': df['electricity_processing_kwh'].sum(), 'u': df['electricity_pumping_kwh'].sum(),
        'a': df['electricity_admin_kwh'].sum(), 'e': df['explosives_kg'].sum(),
        'prod': df['production_tonnes'].sum(), 'cover': t_cover
    }
    return df, totals

# Generate
print("Generating NUCLEAR DATASETS...")
curr = None
for y in years:
    df, curr = generate_file(y, nuclear_profile, curr)
    fname = f"{output_folder}/small_mine_{y}_nuclear.xlsx"
    df.to_excel(fname, index=False)
    print(f"Created {fname}")

print("✅ DONE. These files will force a RED GAP on your dashboard.")