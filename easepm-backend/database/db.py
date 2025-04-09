from pymongo import MongoClient
from firebase_admin import firestore
from config.settings import Config

# 🔹 Initialize MongoDB Client
mongo_client = MongoClient(Config.MONGO_URI)
mongo_db = mongo_client["easepm"]  # Replace "easepm" with your actual DB name

# 🔹 Initialize Firestore Client
firestore_db = firestore.client()  # Firestore for authentication & user profiles

# 🔹 Check MongoDB Connection
try:
    mongo_client.admin.command('ping')
    print("✅ Connected to MongoDB Atlas successfully!")
except Exception as e:
    print("❌ MongoDB Connection Error:", e)

# 🔹 Check Firestore Connection
try:
    firestore_db.collection('test').document('test_doc').get()
    print("✅ Connected to Firestore successfully!")
except Exception as e:
    print("❌ Firestore Connection Error:", e)
