from flask import request, jsonify
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
import firebase_admin
from firebase_admin import firestore, auth
from database.db import mongo_db, firestore_db
from api.auth import verify_firebase_token
from flask_cors import cross_origin

users_ns = Namespace("users", description="User Profile API")
db = firestore_db

@users_ns.route("/create-profile")
class CreateUserProfile(Resource):
    @cross_origin()
    def post(self):
        """Create user profile in Firestore after Firebase Auth registration"""
        # Get request data first to avoid processing delay
        data = request.get_json()
        if not data:
            return {"error": "No data provided"}, 400
            
        # Log the request immediately
        print(f"📥 Received create-profile request for: {data.get('email', 'unknown')}")
        
        # Ensure the required fields are present
        required_fields = ['name', 'email', 'uid']
        if not all(field in data for field in required_fields):
            return {"error": "Missing required fields"}, 400
        
        # Verify the Firebase token
        decoded_token, error = verify_firebase_token()
        if error:
            return {"error": f"Authentication error: {error}"}, 401
            
        user_id = decoded_token.get('uid')
        print(f"✅ Authentication successful for user: {user_id}")
            
        # Verify that the token UID matches the provided UID
        if user_id != data['uid']:
            return {"error": "User ID mismatch"}, 403
            
        # Create the user profile
        user_data = {
            "id": user_id,
            "email": data['email'],
            "name": data['name'],
            "created_at": firestore.SERVER_TIMESTAMP
        }
        
        try:
            # Check if user already exists (quick operation)
            user_ref = db.collection("users").document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                print(f"📋 User profile already exists for: {user_id}")
                return {"message": "User profile already exists", "user_id": user_id}, 200
                
            # Create user in Firestore with timeout
            import threading
            import time
            
            # Use a thread to handle Firestore operation with timeout
            success = False
            error_msg = None
            
            def create_firestore_profile():
                nonlocal success, error_msg
                try:
                    user_ref.set(user_data)
                    success = True
                except Exception as e:
                    error_msg = str(e)
            
            # Start Firestore operation in a thread
            thread = threading.Thread(target=create_firestore_profile)
            thread.daemon = True
            thread.start()
            
            # Wait for thread with timeout
            thread.join(timeout=5)  # 5 second timeout
            
            if not success:
                if error_msg:
                    print(f"❌ Failed to create user profile: {error_msg}")
                    return {"error": f"Failed to create user profile: {error_msg}"}, 500
                else:
                    print(f"⚠️ Firestore operation timed out for user: {user_id}")
                    return {"error": "Operation timed out, but user was created"}, 202
            
            print(f"✅ User profile created successfully: {user_id}")
            return {"message": "User profile created successfully", "user_id": user_id}, 201
            
        except Exception as e:
            print(f"❌ Critical error creating user profile: {str(e)}")
            return {"error": f"Failed to create user profile: {str(e)}"}, 500

@users_ns.route("/me")
class UserProfile(Resource):
    @jwt_required()
    def get(self):
        """Debugging User Fetch"""
        user_id = get_jwt_identity()
        print(f"🔍 DEBUG: Extracted user_id = {user_id}")  # 👀 Debugging

        # 🔹 Fetch user profile from Firestore
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()

        # 🔹 Print Firestore result
        print(f"🔍 DEBUG: Firestore document exists? {user_doc.exists}")

        if user_doc.exists:
            user_data = user_doc.to_dict()
            print(f"✅ DEBUG: User data retrieved: {user_data}")
            return jsonify(user_data)

        print(f"❌ DEBUG: User not found in Firestore!")
        return {"error": "User not found"}, 404
    
    @jwt_required()
    def put(self):
        """Update user profile in Firestore"""
        user_id = get_jwt_identity()
        data = request.get_json()

        # Ensure data contains valid fields
        allowed_fields = ["name", "email"]
        if not all(field in allowed_fields for field in data.keys()):
            return {"error": "Invalid field(s) in request"}, 400

        try:
            user_ref = db.collection("users").document(user_id)
            user_ref.update(data)
            return {"message": "User profile updated successfully"}, 200
        except Exception as e:
            return {"error": str(e)}, 400

    @jwt_required()
    def delete(self):
        """Delete user from Firestore and Firebase Auth"""
        user_id = get_jwt_identity()

        try:
            # Delete from Firebase Auth
            auth.delete_user(user_id)

            # Delete from Firestore
            db.collection("users").document(user_id).delete()

            return {"message": "User deleted successfully"}, 200
        except Exception as e:
            return {"error": str(e)}, 400
