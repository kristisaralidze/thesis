# Flask & MongoDB configurations

import os
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ✅ Dynamically locate Firebase Admin SDK JSON file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Get easepm-backend directory
CRED_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")  # ✅ Use the correct file name

# ✅ Initialize Firebase Admin SDK only once
if not firebase_admin._apps:
    firebase_creds = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(firebase_creds)

class Config:
    MONGO_URI = os.getenv("MONGO_URI")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey")
