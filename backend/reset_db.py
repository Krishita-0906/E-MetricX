import os
from app import app, db

# 1. Find and Delete the old, broken database
db_path = os.path.join(os.getcwd(), 'site.db')
if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print(f"✅ SUCCESS: Deleted old database at: {db_path}")
    except PermissionError:
        print("❌ ERROR: Could not delete. Please STOP 'python app.py' first!")
else:
    print("ℹ️ Note: No existing database found to delete.")

# 2. Create a fresh database with the new 'password' and 'mine_name' columns
with app.app_context():
    db.create_all()
    print("✅ SUCCESS: Created a fresh 'site.db' with all correct columns!")
    print("👉 You can now run 'python app.py' and Sign Up.")