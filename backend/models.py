from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin

db = SQLAlchemy()

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    
    # Phase 2: Mine Profile
    mine_name = db.Column(db.String(150), default="")
    state = db.Column(db.String(100), default="Jharkhand")
    mine_type = db.Column(db.String(50), default="Opencast")
    production_tpa = db.Column(db.Float, default=0.0)
    employees = db.Column(db.Integer, default=0)

    # NEW Phase 3: Carbon Sink Data
    plantation_area = db.Column(db.Float, default=0.0) # Hectares
    plantation_age = db.Column(db.Float, default=5.0)  # Years
    plantation_type = db.Column(db.String(100), default="synthetic") # 'synthetic', 'dense', 'bamboo', etc.

class UserDataset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    date_uploaded = db.Column(db.DateTime, default=datetime.utcnow)