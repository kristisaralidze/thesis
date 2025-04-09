# filepath: /c:/Users/Kristine/Downloads/EASEPM/easepm-backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from flask_restx import Api
from flask_jwt_extended import JWTManager
import firebase_admin
from firebase_admin import credentials
from config.settings import Config
from database.db import mongo_db, firestore_db
from api.auth import auth_ns
from api.users import users_ns
from api.projects import projects_ns
import os
import json
import logging

# Initialize Flask App
app = Flask(__name__)
app.config.from_object(Config)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use the simplest, most permissive CORS settings for development
CORS(app, 
     origins="*", 
     supports_credentials=True,
     allow_headers=["*"],
     expose_headers=["*"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])

# Set JWT Configuration (if applicable)
jwt = JWTManager(app)

# Configure RESTful API
api = Api(app, 
          version='1.0', 
          title='EASE PM API', 
          description='API for EASE PM application', 
          prefix='/api')

# Add namespaces to API
api.add_namespace(auth_ns, path='/auth')
api.add_namespace(projects_ns, path='/projects')
api.add_namespace(users_ns, path='/users')

# Override CORS headers for every response
@app.after_request
def add_cors_headers(response):
    # Set CORS headers to allow all origins
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Headers", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
    response.headers.set("Access-Control-Max-Age", "3600")
    
    # Handle preflight OPTIONS requests
    if request.method == 'OPTIONS':
        response.status_code = 200
        
    return response

# Special handler for OPTIONS requests
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 200

# Health Check Route
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"message": "EasePM API is running!"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)