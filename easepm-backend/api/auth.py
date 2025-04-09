from flask import request, jsonify
from flask_restx import Namespace, Resource
from database.db import mongo_db, firestore_db
from flask_jwt_extended import create_access_token, jwt_required
import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
import requests
from datetime import datetime
from flask_cors import cross_origin

# Define our own local verify_firebase_token function
def verify_firebase_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None, "Missing Authorization header"
    
    try:
        # Remove Bearer prefix if present
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        else:
            token = auth_header
            
        # Try to verify the token with added clock skew tolerance
        try:
            # Use a 60-second clock skew tolerance to handle time synchronization issues
            decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
            # Verify the token has the required fields
            if 'uid' not in decoded_token and 'sub' not in decoded_token:
                return None, "Invalid token format: missing user identifier"
                
            return decoded_token, None
        except ValueError as e:
            # Check for time synchronization errors
            error_str = str(e)
            if "Token used too early" in error_str or "Token expired" in error_str:
                # Special handling for clock skew errors
                print(f"⚠️ Time synchronization error: {error_str}")
                # Try one more time with an even higher tolerance
                try:
                    decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
                    return decoded_token, None
                except Exception as retry_error:
                    return None, "Authentication error: Token time validation failed. Check that your computer's clock is set correctly."
            raise  # Re-raise the error if it's not a clock skew issue
    except Exception as e:
        print(f"❌ Token verification error: {str(e)}")
        return None, str(e)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Get easepm-backend directory
CRED_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")  # ✅ Use new file name


if not firebase_admin._apps:
    print(f"🔥 Using Service Account Key: {CRED_PATH}")  # Debugging
    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(cred)
else:
    print("✅ Firebase Admin SDK is already initialized.")

print("\n🔥 Firebase Admin SDK Project ID:", firebase_admin.get_app().project_id)


# Namespace for authentication
auth_ns = Namespace("auth", description="Authentication API")
db = firestore_db


@auth_ns.route("/register")
class Register(Resource):
    @auth_ns.response(201, 'User registered successfully')
    @auth_ns.response(400, 'Bad request')
    @auth_ns.response(500, 'Internal server error')
    @cross_origin()
    def post(self):
        """Register a new user using Firebase Auth & save profile in Firestore"""
        data = request.get_json()
        print(f"📥 DEBUG: Received Registration Request Data: {data}")  # 🔍 See what frontend is sending

        # Check if all required fields are present
        if not all(key in data for key in ["email", "password", "name"]):
            print(f"⚠️ DEBUG: Missing fields in request: {data}")
            return {"error": "Missing required fields"}, 400

        email = data["email"]
        password = data["password"]
        name = data["name"]

        try:
            print(f"🔥 Attempting to create Firebase user for email: {email}")
            
            # Set a timeout context for Firebase operations
            import threading
            import time
            
            # Implement a timeout mechanism for Firebase
            user = None
            error = None
            
            def create_firebase_user():
                nonlocal user, error
                try:
                    # Create user in Firebase Authentication
                    user = auth.create_user(email=email, password=password)
                    print(f"✅ DEBUG: Firebase User Created: {user.uid}")
                except Exception as e:
                    error = e
                    print(f"❌ ERROR in thread: {str(e)}")
            
            # Start Firebase operation in a thread
            thread = threading.Thread(target=create_firebase_user)
            thread.daemon = True
            thread.start()
            
            # Wait for thread with timeout
            thread.join(timeout=20)  # 20 second timeout
            
            if thread.is_alive():
                print("❌ ERROR: Firebase user creation timed out after 20 seconds")
                return {"error": "Firebase authentication service timed out. Please try again later."}, 500
            
            if error:
                if isinstance(error, firebase_admin.auth.EmailAlreadyExistsError):
                    print(f"❌ ERROR: Email already exists: {email}")
                    return {"error": "Email already in use"}, 400
                else:
                    print(f"❌ ERROR: Firebase error: {str(error)}")
                    return {"error": str(error)}, 500
            
            if not user:
                print("❌ ERROR: Failed to create Firebase user - unknown reason")
                return {"error": "Failed to create user account. Please try again."}, 500
            
            print(f"🔥 Attempting to store user data in Firestore for: {user.uid}")
            
            # Store user in Firestore
            user_data = {
                "id": user.uid,
                "email": email,
                "name": name,
                "created_at": firestore.SERVER_TIMESTAMP
            }

            try:
                db.collection("users").document(user.uid).set(user_data, timeout=10)
                print(f"✅ DEBUG: User stored in Firestore: {user_data}")
            except Exception as firestore_error:
                print(f"⚠️ WARNING: Failed to store user in Firestore: {str(firestore_error)}")
                # Continue anyway since the Firebase Auth user was created
                
            return {"message": "User registered successfully", "user_id": user.uid}, 201
        
        except Exception as e:
            print(f"❌ CRITICAL ERROR in registration: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"error": f"Registration failed: {str(e)}"}, 500


FIREBASE_SIGNIN_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBjj4mOw5J86HHIMGPBu5qEvK973l_d5QA"


@auth_ns.route("/custom-login")
class CustomLogin(Resource):
    @cross_origin()
    def post(self):
        """Authenticate user by verifying email & password before generating a custom Firebase token"""
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return {"error": "Missing email or password"}, 400

        try:
            # 🔥 Verify email & password using Firebase REST API
            payload = {"email": email, "password": password, "returnSecureToken": True}
            response = requests.post(FIREBASE_SIGNIN_URL, json=payload)
            response_data = response.json()

            if "error" in response_data:
                print("❌ ERROR: Invalid credentials", response_data["error"]["message"])
                return {"error": "Invalid email or password"}, 401

            user_id = response_data["localId"]  # This is the Firebase UID

            # 🔥 Generate a custom token for the user
            custom_token = auth.create_custom_token(user_id)

            print("✅ Password verified, Custom Token Generated for:", email)
            return {"custom_token": custom_token.decode("utf-8")}, 200

        except firebase_admin.auth.UserNotFoundError:
            return {"error": "User not found"}, 404
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            return {"error": f"Authentication failed: {str(e)}"}, 500
        
@auth_ns.route("/login")
class Login(Resource):
    @cross_origin()
    def post(self):
        """Authenticate user using Firebase Token and return Flask JWT"""
        # Extract Firebase Token from headers
        firebase_token = request.headers.get("Authorization")
        if not firebase_token:
            print("❌ ERROR: Missing Firebase token in headers")
            return {"error": "Missing Firebase token"}, 401

        try:
            # Check and clean the token if it has Bearer prefix
            if firebase_token.startswith("Bearer "):
                firebase_token = firebase_token.replace("Bearer ", "")
            
            print(f"\n🔍 Attempting to verify token (first 10 chars): {firebase_token[:10]}...")
            
            # Verify Firebase Token with clock skew tolerance
            decoded_token = auth.verify_id_token(firebase_token, clock_skew_seconds=60)
            print(f"\n✅ Token verified successfully!")
            
            # Extract user information
            user_id = decoded_token.get("uid")
            email = decoded_token.get("email")
            aud = decoded_token.get("aud")
            iss = decoded_token.get("iss")
            exp = decoded_token.get("exp")

            print(f"\n🔹 User ID: {user_id}")
            print(f"🔹 Email: {email}")
            print(f"🔹 Audience (aud): {aud}")
            print(f"🔹 Issuer (iss): {iss}")
            print(f"🔹 Expiry Time (exp): {exp}\n")

            # Ensure `aud` matches Firebase project ID
            if aud != "easepm-e66c6":
                print(f"❌ ERROR: Invalid audience! Expected 'easepm-e66c6', but got '{aud}'")
                return {"error": "Invalid Firebase token (wrong audience)"}, 401

            # Ensure `iss` is correct
            expected_iss = "https://securetoken.google.com/easepm-e66c6"
            if iss != expected_iss:
                print(f"❌ ERROR: Invalid issuer! Expected '{expected_iss}', but got '{iss}'")
                return {"error": "Invalid Firebase token (wrong issuer)"}, 401

            # Create Flask JWT Token (HS256) with user_id as the identity
            access_token = create_access_token(identity=user_id)
            print("✅ Firebase token is valid. Authentication successful!")

            return {
                "message": "User authenticated",
                "token": access_token,
                "user_id": user_id,
                "email": email
            }, 200

        except firebase_admin.auth.ExpiredIdTokenError:
            print("❌ ERROR: Expired Firebase Token")
            return {"error": "Expired Firebase token"}, 401
        except firebase_admin.auth.InvalidIdTokenError as e:
            print(f"❌ ERROR: Invalid Firebase Token - {str(e)}")
            # Check for time synchronization errors
            error_str = str(e)
            if "Token used too early" in error_str:
                return {"error": "Authentication error: Token time validation failed. Check that your computer's clock is set correctly."}, 401
            return {"error": f"Invalid Firebase token: {str(e)}"}, 401
        except Exception as e:
            import traceback
            print("\n❌ FULL ERROR MESSAGE:")
            traceback.print_exc()
            return {"error": f"Authentication failed: {str(e)}"}, 401


@auth_ns.route("/test-auth")
class TestAuth(Resource):
    @cross_origin()
    def get(self):
        """Simple endpoint to test if authentication is working"""
        try:
            # Verify Firebase token directly
            decoded_token, error = verify_firebase_token()
            if error:
                return {
                    "success": False,
                    "error": f"Authentication error: {error}", 
                    "message": "Token verification failed"
                }, 401
                
            user_id = decoded_token.get('uid') or decoded_token.get('sub')
            email = decoded_token.get('email')
            
            return {
                "success": True,
                "message": "Authentication successful",
                "user_id": user_id,
                "email": email,
                "timestamp": str(datetime.now())
            }, 200
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e),
                "message": "Unexpected authentication error occurred"
            }, 500
