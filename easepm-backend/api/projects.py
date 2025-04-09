from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import mongo_db
from bson.objectid import ObjectId
import firebase_admin
from firebase_admin import auth
from bson import json_util
from datetime import datetime
import functools
import logging
import json

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create handlers if they don't exist
if not logger.handlers:
    # Create console handler with a higher log level
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Create file handler which logs even debug messages
    file_handler = logging.FileHandler('api.log')
    file_handler.setLevel(logging.DEBUG)
    
    # Create formatters and add them to the handlers
    console_format = logging.Formatter('%(levelname)s - %(message)s')
    file_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(console_format)
    file_handler.setFormatter(file_format)
    
    # Add the handlers to the logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

# flask wtforms - create!!
# CSRF tockens
# mat plot lib

projects_ns = Namespace("projects", description="Project Management APIs")
db = mongo_db

def convert_objectids(doc):
    """
    Recursively convert any ObjectId in the document (or list) to a string.
    """
    if isinstance(doc, list):
        return [convert_objectids(item) for item in doc]
    elif isinstance(doc, dict):
        return {key: convert_objectids(value) for key, value in doc.items()}
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc

def mongodb_response(f):
    """Decorator to ensure MongoDB responses are properly JSON serialized"""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        logger.info(f"Calling {f.__name__} with args: {args} kwargs: {kwargs}")
        
        try:
            response = f(*args, **kwargs)
            
            # Handle tuple responses (data, status_code) and possibly (data, status_code, headers)
            if isinstance(response, tuple):
                data = response[0]
                rest = response[1:]
                
                # Only process dictionary or list data, not error responses
                if isinstance(data, (dict, list)):
                    # Convert MongoDB objects to JSON serializable format
                    try:
                        logger.info(f"Serializing response tuple data from {f.__name__}")
                        serialized_data = json_util.loads(json_util.dumps(data))
                        return (serialized_data,) + rest
                    except Exception as e:
                        logger.exception(f"Error serializing MongoDB tuple data: {e}")
                        # Convert ObjectIds manually as a fallback
                        logger.info("Falling back to manual conversion")
                        converted_data = convert_objectids(data)
                        return (converted_data,) + rest
                return response
            
            # Handle direct data responses
            if isinstance(response, (dict, list)):
                try:
                    logger.info(f"Serializing direct response data from {f.__name__}")
                    return json_util.loads(json_util.dumps(response))
                except Exception as e:
                    logger.exception(f"Error serializing MongoDB direct data: {e}")
                    # Convert ObjectIds manually as a fallback
                    logger.info("Falling back to manual conversion")
                    return convert_objectids(response)
            
            logger.info(f"Returning non-dict/list response from {f.__name__}")
            return response
            
        except Exception as e:
            logger.exception(f"Unhandled error in mongodb_response decorator: {str(e)}")
            return {"error": str(e)}, 500
            
    return decorated

def safe_convert_deliverables(project):
    """
    Ensure project["deliverables"] is a list.
    If it is a list, convert each deliverable's _id to a string.
    Otherwise, set it to an empty list.
    """
    if not project:
        return
        
    if "deliverables" not in project or not isinstance(project["deliverables"], list):
        project["deliverables"] = []
        return

    new_list = []
    for d in project["deliverables"]:
        if not isinstance(d, dict):
            continue
        d_copy = dict(d)
        if "_id" in d_copy:
            try:
                if isinstance(d_copy["_id"], ObjectId):
                    d_copy["_id"] = str(d_copy["_id"])
                elif not isinstance(d_copy["_id"], str):
                    # Try to convert whatever it is to string
                    d_copy["_id"] = str(d_copy["_id"])
            except Exception as conv_err:
                print("Error converting deliverable _id:", conv_err)
                d_copy["_id"] = str(ObjectId())  # Generate a new valid ID
        else:
            # If no ID exists, generate one
            d_copy["_id"] = str(ObjectId())
            
        # Ensure all fields exist
        if "name" not in d_copy or not d_copy["name"]:
            d_copy["name"] = "Unnamed Deliverable"
        if "status" not in d_copy or not d_copy["status"]:
            d_copy["status"] = "Not Started"
            
        new_list.append(d_copy)
    project["deliverables"] = new_list

# Helper function to verify Firebase token directly
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
        return None, str(e)

# Project model for documentation
project_model = projects_ns.model(
    "Project",
    {
        "name": fields.String(required=True, description="Project name"),
        "description": fields.String(required=True, description="Project description"),
        "start_date": fields.String(required=True, description="Project start date"),
        "end_date": fields.String(required=True, description="Project end date"),
        "status": fields.String(required=True, description="Project status"),
        "team": fields.List(fields.String, description="Team members"),
        "budget": fields.Float(description="Project budget"),
    },
)

@projects_ns.route("")
class ProjectsList(Resource):
    @cross_origin()
    @mongodb_response
    def get(self):
        """Get all projects for the authenticated user"""
        # Verify the Firebase token
        decoded_token, error = verify_firebase_token()
        if error:
            return {"error": f"Authentication error: {error}"}, 401
            
        user_id = decoded_token.get('uid')
        
        # Fetch projects for the authenticated user
        projects = list(mongo_db.projects.find({"user_id": user_id}))
        
        # Convert ObjectId to string and process deliverables
        for project in projects:
            project["_id"] = str(project["_id"])
            safe_convert_deliverables(project)
            
        return projects

    @cross_origin()
    @mongodb_response
    def post(self):
        """Create a new project"""
        # Verify the Firebase token
        decoded_token, error = verify_firebase_token()
        if error:
            return {"error": f"Authentication error: {error}"}, 401
            
        user_id = decoded_token.get('uid')
        
        data = request.get_json()
        
        # Add user_id to project data
        data["user_id"] = user_id
        
        # Insert into MongoDB
        result = mongo_db.projects.insert_one(data)
        
        return {"message": "Project created successfully", "id": str(result.inserted_id)}, 201

@projects_ns.route("/<project_id>")
class ProjectDetail(Resource):
    @cross_origin()
    @mongodb_response
    def get(self, project_id):
        """Get a specific project"""
        try:
            logger.info(f"Fetching project with ID: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"Authenticated user: {user_id}")
        
            # Find the project by ID and ensure it belongs to this user
            try:
                project_obj_id = ObjectId(project_id)
                project = mongo_db.projects.find_one({"_id": project_obj_id, "user_id": user_id})
            except Exception as e:
                logger.error(f"Error finding project: {str(e)}")
                return {"error": f"Invalid project ID format: {str(e)}"}, 400
            
            if not project:
                logger.warning(f"Project not found or unauthorized: {project_id}")
                return {"error": "Project not found or unauthorized"}, 404
                
            # Process deliverables if needed
            safe_convert_deliverables(project)
            
            # Manual conversion to ensure all ObjectIds are properly converted
            project = convert_objectids(project)
            
            # Use bson json_util for complete serialization
            serialized_project = json_util.loads(json_util.dumps(project))
            
            logger.info(f"Successfully fetched project: {project_id}")
            return serialized_project
            
        except Exception as e:
            logger.exception(f"Error in ProjectDetail.get: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def put(self, project_id):
        """Update a specific project"""
        # Verify the Firebase token
        decoded_token, error = verify_firebase_token()
        if error:
            return {"error": f"Authentication error: {error}"}, 401
            
        user_id = decoded_token.get('uid')
        
        try:
            data = request.get_json()
            
            # Ensure the project belongs to this user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found or unauthorized"}, 404
                
            # Update the project
            result = mongo_db.projects.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$set": data}
            )
            
            if result.modified_count == 0:
                return {"message": "No changes made"}, 200
                
            return {"message": "Project updated successfully"}, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def delete(self, project_id):
        """Delete a specific project"""
        # Verify the Firebase token
        decoded_token, error = verify_firebase_token()
        if error:
            return {"error": f"Authentication error: {error}"}, 401
            
        user_id = decoded_token.get('uid')
        
        try:
            # Ensure the project belongs to this user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found or unauthorized"}, 404
                
            # Delete the project
            mongo_db.projects.delete_one({"_id": ObjectId(project_id), "user_id": user_id})
            
            return {"message": "Project deleted successfully"}, 200
        except Exception as e:
            return {"error": str(e)}, 500

@projects_ns.route("/<project_id>/documents/lean-canvas")
class ProjectLeanCanvas(Resource):
    @cross_origin()
    @mongodb_response
    def get(self, project_id):
        """
        Retrieve the Lean Canvas document from a project's documents array.
        Returns 404 if not found.
        """
        try:
            logger.info(f"Getting Lean Canvas for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in ProjectLeanCanvas.get: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Only access the project if it belongs to the current user
            project = db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404

            # Find the Lean Canvas doc
            lean_canvas_doc = None
            for doc in project.get("documents", []):
                if doc.get("type") == "LeanCanvas":
                    lean_canvas_doc = doc
                    break

            if not lean_canvas_doc:
                logger.warning(f"Lean Canvas not found for project: {project_id}")
                return {"error": "Lean Canvas not found"}, 404

            # Convert any nested ObjectIds to strings
            lean_canvas_doc = convert_objectids(lean_canvas_doc)

            # Check if this is a nested content structure or direct data
            if 'content' in lean_canvas_doc and isinstance(lean_canvas_doc['content'], dict):
                # If there's a content field with expected data, this is nested
                if any(key in lean_canvas_doc['content'] for key in ['problem', 'customerSegments', 'solution']):
                    # Keep the structure but ensure needed fields
                    if 'type' not in lean_canvas_doc['content']:
                        lean_canvas_doc['content']['type'] = lean_canvas_doc.get('type', 'LeanCanvas')
                    if 'version' not in lean_canvas_doc['content']:
                        lean_canvas_doc['content']['version'] = lean_canvas_doc.get('version', 1)
                else:
                    # This is unexpected - copy key fields to content
                    lean_canvas_doc['content'].update({
                        'type': lean_canvas_doc.get('type', 'LeanCanvas'),
                        'version': lean_canvas_doc.get('version', 1)
                    })
            else:
                # Handle case where data is directly in the document or in data field
                data_source = lean_canvas_doc.get('data', lean_canvas_doc)
                
                # Create a properly structured content field
                lean_canvas_doc['content'] = {
                    'type': lean_canvas_doc.get('type', 'LeanCanvas'),
                    'version': lean_canvas_doc.get('version', 1),
                    'problem': data_source.get('problem', []),
                    'customerSegments': data_source.get('customerSegments', []),
                    'uniqueValueProposition': data_source.get('uniqueValueProposition', ''),
                    'solution': data_source.get('solution', []),
                    'channels': data_source.get('channels', []),
                    'revenueStreams': data_source.get('revenueStreams', []),
                    'costStructure': data_source.get('costStructure', []),
                    'keyMetrics': data_source.get('keyMetrics', []),
                    'unfairAdvantage': data_source.get('unfairAdvantage', '')
                }
            
            logger.info(f"Successfully retrieved Lean Canvas for project: {project_id}")
            return lean_canvas_doc, 200

        except Exception as e:
            logger.exception(f"Error in ProjectLeanCanvas.get: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def put(self, project_id):
        """
        Create or update the Lean Canvas doc in the project's documents array.
        """
        try:
            logger.info(f"Updating Lean Canvas for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in ProjectLeanCanvas.put: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Get the JSON data from the request
            data = request.get_json()
            if not data:
                logger.warning("No data provided for Lean Canvas update")
                return {"error": "No data provided"}, 400
                
            # Log received data structure
            logger.debug(f"Received Lean Canvas data: {json.dumps(data, default=str)}")
            
            # Only update the project if it belongs to the current user
            project = db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404

            # Find the Lean Canvas document index
            canvas_index = None
            documents = project.get("documents", [])
            for i, doc in enumerate(documents):
                if doc.get("type") == "LeanCanvas":
                    canvas_index = i
                    break

            # Ensure documents array exists
            if "documents" not in project:
                project["documents"] = []

            # If the Lean Canvas doesn't exist, create it
            if canvas_index is None:
                if "created_at" not in data:
                    data["created_at"] = datetime.now().isoformat()
                if "version" not in data:
                    data["version"] = 1
                
                # Make sure type is correct
                data["type"] = "LeanCanvas"
                data["updated_at"] = datetime.now().isoformat()
                
                # Add the document
                project["documents"].append(data)
            else:
                # Update the existing document
                # Preserve created_at if it exists
                if "created_at" not in data and "created_at" in project["documents"][canvas_index]:
                    data["created_at"] = project["documents"][canvas_index]["created_at"]
                else:
                    data["created_at"] = datetime.now().isoformat()
                    
                # Set or increment version
                if "version" not in data:
                    current_version = project["documents"][canvas_index].get("version", 0)
                    data["version"] = current_version + 1
                
                # Ensure type and updated_at
                data["type"] = "LeanCanvas"
                data["updated_at"] = datetime.now().isoformat()
                
                # Replace the old document with the new one
                project["documents"][canvas_index] = data

            # Update the project in the database
            try:
                result = mongo_db.projects.update_one(
                    {"_id": ObjectId(project_id)},
                    {"$set": {
                        "documents": project["documents"],
                        "updated_at": datetime.now().isoformat()
                    }}
                )
                
                if result.modified_count == 0:
                    logger.warning(f"No changes made to Lean Canvas for project: {project_id}")
                    # Check if this is because the document truly wasn't modified
                    current = mongo_db.projects.find_one({"_id": ObjectId(project_id)})
                    if current and current.get("documents") == project["documents"]:
                        return {"message": "No changes were necessary", "data": data}, 200
                    else:
                        return {"error": "Failed to update Lean Canvas"}, 500
                    
                logger.info(f"Lean Canvas successfully updated for project: {project_id}")
                return {"message": "Lean Canvas updated successfully", "data": data}, 200
            except Exception as db_error:
                logger.exception(f"Database error while updating Lean Canvas: {str(db_error)}")
                return {"error": f"Database error: {str(db_error)}"}, 500

        except Exception as e:
            logger.exception(f"Error in ProjectLeanCanvas.put: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def delete(self, project_id):
        """
        Delete the Lean Canvas doc from this project's documents array.
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Only delete from the project if it belongs to the current user
            project = db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            # Remove any document where type == "LeanCanvas"
            db.projects.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$pull": {"documents": {"type": "LeanCanvas"}}}
            )
            return {"message": "Lean Canvas deleted successfully"}, 200

        except Exception as e:
            return {"error": str(e)}, 500
        
@projects_ns.route("/<project_id>/documents/project-charter")
class ProjectCharter(Resource):
    @cross_origin()
    @mongodb_response
    def get(self, project_id):
        """
        Retrieve the Project Charter document from a project's documents array.
        Returns 404 if not found.
        """
        try:
            logger.info(f"Getting Project Charter for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in ProjectCharter.get: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Only access the project if it belongs to the current user
            project = db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404

            # Find the Project Charter document
            charter_doc = None
            for doc in project.get("documents", []):
                if doc.get("type") in ["ProjectCharter", "PROJECT_CHARTER"]:
                    charter_doc = doc
                    break

            if not charter_doc:
                logger.warning(f"Project Charter not found for project: {project_id}")
                return {"error": "Project Charter not found"}, 404

            # Convert any nested ObjectIds to strings
            charter_doc = convert_objectids(charter_doc)
            
            # Check if this is a nested content structure or direct data
            if 'content' in charter_doc and isinstance(charter_doc['content'], dict):
                # If there's a content field with projectTitle, this is nested
                if 'projectTitle' in charter_doc['content'] or 'milestones' in charter_doc['content']:
                    # Keep the structure but ensure needed fields
                    if 'type' not in charter_doc['content']:
                        charter_doc['content']['type'] = charter_doc.get('type', 'PROJECT_CHARTER')
                    if 'version' not in charter_doc['content']:
                        charter_doc['content']['version'] = charter_doc.get('version', 1)
                else:
                    # This is unexpected - copy key fields to content
                    charter_doc['content'].update({
                        'type': charter_doc.get('type', 'PROJECT_CHARTER'),
                        'version': charter_doc.get('version', 1)
                    })
            else:
                # No content field - add it
                charter_doc['content'] = {
                    'type': charter_doc.get('type', 'PROJECT_CHARTER'),
                    'version': charter_doc.get('version', 1),
                    'projectTitle': charter_doc.get('projectTitle', ''),
                    'projectSummary': charter_doc.get('projectSummary', ''),
                    'objectives': charter_doc.get('objectives', ['']),
                    'scopeStatement': charter_doc.get('scopeStatement', ''),
                    'majorDeliverables': charter_doc.get('majorDeliverables', ['']),
                    'stakeholders': charter_doc.get('stakeholders', [{'name': '', 'role': '', 'contact': ''}]),
                    'assumptions': charter_doc.get('assumptions', ''),
                    'constraints': charter_doc.get('constraints', ''),
                    'milestones': charter_doc.get('milestones', [{'name': '', 'date': '', 'description': ''}])
                }
            
            logger.info(f"Successfully retrieved Project Charter for project: {project_id}")
            return charter_doc, 200

        except Exception as e:
            logger.exception(f"Error in ProjectCharter.get: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def put(self, project_id):
        """
        Update or create the Project Charter document in a project's documents array.
        Creates it if it doesn't exist.
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Updating Project Charter for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in ProjectCharter.put: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")

            # Get the JSON data from the request
            data = request.get_json()
            if not data:
                logger.warning("No data provided for Project Charter update")
                return {"error": "No data provided"}, 400
                
            # Log received data structure
            logger.debug(f"Received Project Charter data: {json.dumps(data, default=str)}")

            # Only access the project if it belongs to the current user
            project = db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404

            # Find the Project Charter document index
            charter_index = None
            documents = project.get("documents", [])
            for i, doc in enumerate(documents):
                if doc.get("type") in ["ProjectCharter", "PROJECT_CHARTER"]:
                    charter_index = i
                    break

            # If the charter doesn't exist, create it
            if charter_index is None:
                if "documents" not in project:
                    project["documents"] = []
                
                data["type"] = "PROJECT_CHARTER"
                data["created_at"] = datetime.now().isoformat()
                data["updated_at"] = datetime.now().isoformat()
                data["version"] = 1
                
                project["documents"].append(data)
            else:
                # Update the existing charter
                data["type"] = "PROJECT_CHARTER"  # Ensure type remains
                data["updated_at"] = datetime.now().isoformat()
                
                # Preserve created_at if it exists
                if "created_at" in project["documents"][charter_index]:
                    data["created_at"] = project["documents"][charter_index]["created_at"]
                else:
                    data["created_at"] = datetime.now().isoformat()
                    
                # Increment version
                current_version = project["documents"][charter_index].get("version", 0)
                data["version"] = current_version + 1
                    
                project["documents"][charter_index] = data

            # Update the project in the database
            try:
                result = mongo_db.projects.update_one(
                    {"_id": ObjectId(project_id)},
                    {"$set": {
                        "documents": project["documents"],
                        "updated_at": datetime.now().isoformat()
                    }}
                )
                
                if result.modified_count == 0:
                    logger.warning(f"No changes made to Project Charter for project: {project_id}")
                    # Check if this is because the document truly wasn't modified
                    current = mongo_db.projects.find_one({"_id": ObjectId(project_id)})
                    if current and current.get("documents") == project["documents"]:
                        return {"message": "No changes were necessary", "data": data}, 200
                    else:
                        return {"error": "Failed to update Project Charter"}, 500
                    
                logger.info(f"Project Charter successfully updated for project: {project_id}")
                return {"message": "Project Charter updated successfully", "data": data}, 200
            except Exception as db_error:
                logger.exception(f"Database error while updating Project Charter: {str(db_error)}")
                return {"error": f"Database error: {str(db_error)}"}, 500

        except Exception as e:
            logger.exception(f"Error in ProjectCharter.put: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def delete(self, project_id):
        """
        Delete the Project Charter document from this project's documents array.
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Only delete from the project if it belongs to the current user
            project = db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            db.projects.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$pull": {"documents": {"type": {"$in": ["ProjectCharter", "PROJECT_CHARTER"]}}}}
            )
            return {"message": "Project Charter deleted successfully"}, 200

        except Exception as e:
            return {"error": str(e)}, 500

@projects_ns.route("/<project_id>/documents/risk-register")
class RiskRegister(Resource):
    @cross_origin()
    @mongodb_response
    def get(self, project_id):
        """
        Retrieve the Risk Register document from a project's documents array.
        Returns 404 if not found.
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Getting Risk Register for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in RiskRegister.get: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Only access the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404

            risk_doc = None
            for doc in project.get("documents", []):
                if doc.get("type") == "RiskRegister":
                    risk_doc = doc
                    break

            if not risk_doc:
                logger.warning(f"Risk Register not found for project: {project_id}")
                return {"error": "Risk Register not found"}, 404

            # Convert any nested ObjectIds to strings
            risk_doc = convert_objectids(risk_doc)
            
            # Check if this is a nested content structure or direct data
            if 'content' in risk_doc and isinstance(risk_doc['content'], dict):
                # If there's a content field with risks, this is nested
                if 'risks' in risk_doc['content']:
                    # Keep the structure but ensure needed fields
                    if 'type' not in risk_doc['content']:
                        risk_doc['content']['type'] = risk_doc.get('type', 'RiskRegister')
                    if 'version' not in risk_doc['content']:
                        risk_doc['content']['version'] = risk_doc.get('version', 1)
                else:
                    # This is unexpected - copy key fields to content
                    risk_doc['content'].update({
                        'type': risk_doc.get('type', 'RiskRegister'),
                        'version': risk_doc.get('version', 1)
                    })
            else:
                # No content field - add it
                risk_doc['content'] = {
                    'type': risk_doc.get('type', 'RiskRegister'),
                    'version': risk_doc.get('version', 1),
                    'risks': risk_doc.get('risks', [])
                }
                
                # If there are additional fields directly in the doc, copy them to content
                for key in risk_doc:
                    if key not in ['_id', 'type', 'title', 'created_at', 'updated_at', 'content']:
                        risk_doc['content'][key] = risk_doc[key]
            
            logger.info(f"Successfully retrieved Risk Register for project: {project_id}")
            return risk_doc, 200

        except Exception as e:
            logger.exception(f"Error in RiskRegister.get: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def put(self, project_id):
        """
        Create or update the Risk Register document in the project's documents array.
        The payload should be an object containing a "risks" field (an array of risk entries).
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Updating Risk Register for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in RiskRegister.put: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Get the JSON data from the request
            data = request.get_json()
            if not data:
                logger.warning("No data provided for Risk Register update")
                return {"error": "No data provided"}, 400
                
            # Log received data structure
            logger.debug(f"Received Risk Register data: {json.dumps(data, default=str)}")
                
            # Only update the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404

            # Find the Risk Register document index
            risk_index = None
            documents = project.get("documents", [])
            for i, doc in enumerate(documents):
                if doc.get("type") == "RiskRegister":
                    risk_index = i
                    break

            # Ensure documents array exists
            if "documents" not in project:
                project["documents"] = []
                
            # Create a properly structured document
            risk_document = {
                "type": "RiskRegister",
                "title": "Risk Register",
                "updated_at": datetime.now().isoformat(),
                "content": data
            }
            
            # If the Risk Register doesn't exist, create it
            if risk_index is None:
                risk_document["created_at"] = datetime.now().isoformat()
                risk_document["version"] = 1
                project["documents"].append(risk_document)
            else:
                # Update the existing document
                # Preserve created_at if it exists
                if "created_at" in project["documents"][risk_index]:
                    risk_document["created_at"] = project["documents"][risk_index]["created_at"]
                else:
                    risk_document["created_at"] = datetime.now().isoformat()
                    
                # Increment version
                current_version = project["documents"][risk_index].get("version", 0)
                risk_document["version"] = current_version + 1
                
                # Replace the old document with the new one
                project["documents"][risk_index] = risk_document

            # Update the project in the database
            try:
                result = mongo_db.projects.update_one(
                    {"_id": ObjectId(project_id)},
                    {"$set": {
                        "documents": project["documents"],
                        "updated_at": datetime.now().isoformat()
                    }}
                )
            
                if result.modified_count == 0:
                    logger.warning(f"No changes made to Risk Register for project: {project_id}")
                    # Check if this is because the document truly wasn't modified
                    current = mongo_db.projects.find_one({"_id": ObjectId(project_id)})
                    if current and current.get("documents") == project["documents"]:
                        return {"message": "No changes were necessary", "data": data}, 200
                    else:
                        return {"error": "Failed to update Risk Register"}, 500
                
                logger.info(f"Risk Register successfully updated for project: {project_id}")
                return {"message": "Risk Register updated successfully", "data": data}, 200
            except Exception as db_error:
                logger.exception(f"Database error while updating Risk Register: {str(db_error)}")
                return {"error": f"Database error: {str(db_error)}"}, 500

        except Exception as e:
            logger.exception(f"Error in RiskRegister.put: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def delete(self, project_id):
        """
        Delete the Risk Register document from this project's documents array.
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Only delete from the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            mongo_db.projects.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$pull": {"documents": {"type": "RiskRegister"}}}
            )
            return {"message": "Risk Register deleted successfully"}, 200

        except Exception as e:
            return {"error": str(e)}, 500

@projects_ns.route("/<project_id>/documents/stakeholder-register")
class StakeholderRegister(Resource):
    @cross_origin()
    @mongodb_response
    def get(self, project_id):
        """
        Retrieve the Stakeholder Register document from a project's documents array.
        Returns 404 if not found.
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Getting Stakeholder Register for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in StakeholderRegister.get: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Only access the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404

            stakeholder_doc = None
            for doc in project.get("documents", []):
                if doc.get("type") == "StakeholderRegister" or doc.get("type") == "STAKEHOLDER_REGISTER":
                    stakeholder_doc = doc
                    break

            if not stakeholder_doc:
                logger.warning(f"Stakeholder Register not found for project: {project_id}")
                return {"error": "Stakeholder Register not found"}, 404

            # Convert any nested ObjectIds to strings
            stakeholder_doc = convert_objectids(stakeholder_doc)
            
            # Check if this is a nested content structure or direct data
            if 'content' in stakeholder_doc and isinstance(stakeholder_doc['content'], dict):
                # If there's a content field with stakeholders, this is nested
                if 'stakeholders' in stakeholder_doc['content']:
                    # Keep the structure but ensure needed fields
                    if 'type' not in stakeholder_doc['content']:
                        stakeholder_doc['content']['type'] = stakeholder_doc.get('type', 'StakeholderRegister')
                    if 'version' not in stakeholder_doc['content']:
                        stakeholder_doc['content']['version'] = stakeholder_doc.get('version', 1)
                else:
                    # This is unexpected - copy key fields to content
                    stakeholder_doc['content'].update({
                        'type': stakeholder_doc.get('type', 'StakeholderRegister'),
                        'version': stakeholder_doc.get('version', 1)
                    })
            else:
                # No content field - add it for backwards compatibility with older clients
                # but keep the primary data directly in the document
                stakeholder_doc.update({
                    'type': stakeholder_doc.get('type', 'StakeholderRegister'),
                    'version': stakeholder_doc.get('version', 1)
                })
                
                # Add content field with the same data for backwards compatibility
                if 'content' not in stakeholder_doc:
                    stakeholder_doc['content'] = {
                        'stakeholders': stakeholder_doc.get('stakeholders', []),
                        'communicationPlan': stakeholder_doc.get('communicationPlan', {})
                    }
            
            logger.info(f"Successfully retrieved Stakeholder Register for project: {project_id}")
            return stakeholder_doc, 200

        except Exception as e:
            logger.exception(f"Error in StakeholderRegister.get: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def put(self, project_id):
        """
        Update or create the Stakeholder Register for a project
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Updating Stakeholder Register for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in StakeholderRegister.put: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Get request data
            data = request.get_json()
            if not data:
                logger.warning("No data provided for Stakeholder Register update")
                return {"error": "No data provided"}, 400
            
            logger.debug(f"Received data: {data}")
                
            # Only update the project if it belongs to the current user
            try:
                logger.info(f"Looking for project {project_id} in MongoDB")
                project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
                if not project:
                    logger.warning(f"Project {project_id} not found for user {user_id}")
                    return {"error": "Project not found"}, 404
                
                logger.info(f"Found project: {project.get('name', 'Unknown')}")
            except Exception as e:
                logger.exception(f"Error finding project: {str(e)}")
                return {"error": f"Error finding project: {str(e)}"}, 500

            # Find the StakeholderRegister document index
            stakeholder_index = -1
            documents = project.get("documents", [])
            
            for i, doc in enumerate(documents):
                if doc.get("type") == "StakeholderRegister" or doc.get("type") == "STAKEHOLDER_REGISTER":
                    stakeholder_index = i
                    break
                    
            # If the document doesn't exist, create it
            if stakeholder_index == -1:
                if "documents" not in project:
                    project["documents"] = []
                
                data["type"] = "StakeholderRegister"
                if "created_at" not in data:
                    data["created_at"] = datetime.now().isoformat()
                if "updated_at" not in data:
                    data["updated_at"] = datetime.now().isoformat()
                if "version" not in data:
                    data["version"] = 1
                
                project["documents"].append(data)
                logger.info("Creating new Stakeholder Register document")
            else:
                # Update the existing document
                # Preserve created_at if it exists
                if "created_at" in project["documents"][stakeholder_index]:
                    data["created_at"] = project["documents"][stakeholder_index]["created_at"]
                else:
                    data["created_at"] = datetime.now().isoformat()
                    
                # Increment version
                current_version = project["documents"][stakeholder_index].get("version", 0)
                if "version" not in data:
                    data["version"] = current_version + 1
                
                # Ensure type is set
                data["type"] = "StakeholderRegister"
                if "updated_at" not in data:
                    data["updated_at"] = datetime.now().isoformat()
                
                # Replace the old document with the new one
                project["documents"][stakeholder_index] = data
                logger.info("Updating existing Stakeholder Register document")
                
            # Update the project with the modified documents array
            try:
                logger.info(f"Updating project {project_id} with updated documents array")
                result = mongo_db.projects.update_one(
                    {"_id": ObjectId(project_id), "user_id": user_id},
                    {"$set": {"documents": documents, "updated_at": datetime.now().isoformat()}}
                )
                
                logger.debug(f"Update result: {result.modified_count} documents modified")
                
                if result.modified_count == 0:
                    logger.warning("Failed to update stakeholder register - no documents modified")
                    # Check if this is because the document truly wasn't modified
                    current = mongo_db.projects.find_one({"_id": ObjectId(project_id)})
                    if current and current.get("documents") == project["documents"]:
                        return {"message": "No changes were necessary", "data": data}, 200
                    else:
                        return {"error": "Failed to update Stakeholder Register"}, 500
                    
                logger.info("Successfully updated stakeholder register")
                return {"message": "Stakeholder Register updated successfully", "data": data}, 200
            except Exception as e:
                logger.exception(f"Error updating project in MongoDB: {str(e)}")
                return {"error": f"Error updating project: {str(e)}"}, 500

        except Exception as e:
            logger.exception(f"Unexpected error in stakeholder register update: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def delete(self, project_id):
        """
        Delete the Stakeholder Register document from this project's documents array.
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Deleting Stakeholder Register for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in StakeholderRegister.delete: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Only delete from the project if it belongs to the current user
            try:
                logger.info(f"Looking for project {project_id} in MongoDB")
                project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
                if not project:
                    logger.warning(f"Project {project_id} not found for user {user_id}")
                    return {"error": "Project not found"}, 404
                
                logger.info(f"Found project: {project.get('name', 'Unknown')}")
            except Exception as e:
                logger.exception(f"Error finding project: {str(e)}")
                return {"error": f"Error finding project: {str(e)}"}, 500

            # First try to remove documents with type "StakeholderRegister"
            try:
                logger.info("Attempting to remove StakeholderRegister documents")
                result1 = mongo_db.projects.update_one(
                    {"_id": ObjectId(project_id), "user_id": user_id},
                    {"$pull": {"documents": {"type": "StakeholderRegister"}}}
                )
                
                logger.debug(f"First removal result: {result1.modified_count} documents modified")
                
                # Then try to remove documents with type "STAKEHOLDER_REGISTER"
                result2 = mongo_db.projects.update_one(
                    {"_id": ObjectId(project_id), "user_id": user_id},
                    {"$pull": {"documents": {"type": "STAKEHOLDER_REGISTER"}}}
                )
                
                logger.debug(f"Second removal result: {result2.modified_count} documents modified")
                
                # If either update modified a document, consider it successful
                if result1.modified_count > 0 or result2.modified_count > 0:
                    logger.info("Successfully deleted stakeholder register")
                    return {"message": "Stakeholder Register deleted successfully"}, 200
                else:
                    logger.info("No stakeholder register document found to delete")
                    return {"message": "No Stakeholder Register found to delete"}, 200
                
            except Exception as e:
                logger.exception(f"Error deleting stakeholder register: {str(e)}")
                return {"error": f"Error deleting stakeholder register: {str(e)}"}, 500

        except Exception as e:
            logger.exception(f"Unexpected error in stakeholder register deletion: {str(e)}")
            return {"error": str(e)}, 500

@projects_ns.route("/<project_id>/documents/wbs")
class WBS(Resource):
    @cross_origin()
    @mongodb_response
    def get(self, project_id):
        """
        Retrieve the WBS document from a project's documents array.
        Returns 404 if not found.
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Only access the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            wbs_doc = None
            for doc in project.get("documents", []):
                if doc.get("type") == "WBS":
                    wbs_doc = doc
                    break

            if not wbs_doc:
                return {"error": "WBS not found"}, 404

            # Convert any nested ObjectIds to strings
            wbs_doc = json_util.loads(json_util.dumps(wbs_doc))
            return wbs_doc, 200

        except Exception as e:
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def put(self, project_id):
        """
        Update or create the WBS for a project
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Get request data
            data = request.get_json()
            if not data:
                return {"error": "No data provided"}, 400
                
            # Only update the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            # Create WBS document structure
            wbs_document = {
                "type": "WBS",
                "title": "Work Breakdown Structure",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "content": data
            }
            
            # Check if the documents array exists and if the WBS document exists
            documents = project.get("documents", [])
            wbs_index = -1
            
            for i, doc in enumerate(documents):
                if doc.get("type") == "WBS":
                    wbs_index = i
                    break

            if wbs_index >= 0:
                # Update existing document
                documents[wbs_index] = wbs_document
            else:
                # Add new document
                documents.append(wbs_document)
                
            # Update the project with the modified documents array
            result = mongo_db.projects.update_one(
                    {"_id": ObjectId(project_id)},
                {"$set": {"documents": documents}}
                )
            
            if result.modified_count == 0:
                return {"error": "Failed to update WBS"}, 500
                
            return {"message": "WBS updated successfully"}, 200

        except Exception as e:
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def delete(self, project_id):
        """
        Delete the WBS document from this project's documents array.
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Only delete from the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            result = mongo_db.projects.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$pull": {"documents": {"type": "WBS"}}}
            )
            
            if result.modified_count == 0:
                return {"error": "Failed to delete WBS"}, 500
                
            return {"message": "WBS deleted successfully"}, 200

        except Exception as e:
            return {"error": str(e)}, 500

@projects_ns.route("/<project_id>/documents/project-plan")
class ProjectPlan(Resource):
    @cross_origin()
    @mongodb_response
    def get(self, project_id):
        """
        Retrieve the Project Plan document from a project's documents array.
        Returns 404 if not found.
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Getting Project Plan for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in ProjectPlan.get: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Only access the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404

            project_plan_doc = None
            for doc in project.get("documents", []):
                if doc.get("type") == "ProjectPlan":
                    project_plan_doc = doc
                    break

            if not project_plan_doc:
                logger.warning(f"Project Plan not found for project: {project_id}")
                return {"error": "Project Plan not found"}, 404

            # Convert any nested ObjectIds to strings
            project_plan_doc = convert_objectids(project_plan_doc)
            
            # Check if this is a nested content structure or direct data
            if 'content' in project_plan_doc and isinstance(project_plan_doc['content'], dict):
                # If there's a content field with plan data, this is nested
                if any(k in project_plan_doc['content'] for k in ['phases', 'milestones', 'resources']):
                    # Keep the structure but ensure needed fields
                    if 'type' not in project_plan_doc['content']:
                        project_plan_doc['content']['type'] = project_plan_doc.get('type', 'ProjectPlan')
                    if 'version' not in project_plan_doc['content']:
                        project_plan_doc['content']['version'] = project_plan_doc.get('version', 1)
                else:
                    # This is unexpected - copy key fields to content
                    project_plan_doc['content'].update({
                        'type': project_plan_doc.get('type', 'ProjectPlan'),
                        'version': project_plan_doc.get('version', 1)
                    })
            else:
                # No content field - add it for backwards compatibility with older clients
                # but keep the primary data directly in the document
                project_plan_doc.update({
                    'type': project_plan_doc.get('type', 'ProjectPlan'),
                    'version': project_plan_doc.get('version', 1)
                })
                
                # Add content field with the same data for backwards compatibility
                if 'content' not in project_plan_doc:
                    content_data = {
                        'phases': project_plan_doc.get('phases', []),
                        'milestones': project_plan_doc.get('milestones', []),
                        'resources': project_plan_doc.get('resources', []),
                        'dependencies': project_plan_doc.get('dependencies', []),
                        'projectDuration': project_plan_doc.get('projectDuration', {})
                    }
                    project_plan_doc['content'] = content_data
            
            logger.info(f"Successfully retrieved Project Plan for project: {project_id}")
            return project_plan_doc, 200

        except Exception as e:
            logger.exception(f"Error in ProjectPlan.get: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def put(self, project_id):
        """
        Update or create the Project Plan for a project
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Get request data
            data = request.get_json()
            if not data:
                return {"error": "No data provided"}, 400
                
            # Only update the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            # Find the ProjectPlan document index
            plan_index = -1
            documents = project.get("documents", [])
            
            for i, doc in enumerate(documents):
                if doc.get("type") == "ProjectPlan":
                    plan_index = i
                    break
                    
            # If the document doesn't exist, create it
            if plan_index == -1:
                if "documents" not in project:
                    project["documents"] = []
                
                # Make sure type is set correctly
                data["type"] = "ProjectPlan"
                
                # Add created_at and updated_at if not provided
                if "created_at" not in data:
                    data["created_at"] = datetime.now().isoformat()
                if "updated_at" not in data:
                    data["updated_at"] = datetime.now().isoformat()
                if "version" not in data:
                    data["version"] = 1
                
                project["documents"].append(data)
            else:
                # Update the existing document
                # Preserve created_at if it exists
                if "created_at" in project["documents"][plan_index]:
                    data["created_at"] = project["documents"][plan_index]["created_at"]
                else:
                    data["created_at"] = datetime.now().isoformat()
                    
                # Increment version
                current_version = project["documents"][plan_index].get("version", 0)
                if "version" not in data:
                    data["version"] = current_version + 1
                
                # Ensure type is set
                data["type"] = "ProjectPlan"
                if "updated_at" not in data:
                    data["updated_at"] = datetime.now().isoformat()
                
                # Replace the old document with the new one
                project["documents"][plan_index] = data
                
            # Update the project with the modified documents array
            try:
                result = mongo_db.projects.update_one(
                    {"_id": ObjectId(project_id)},
                    {"$set": {"documents": project["documents"]}}
                )
                
                if result.modified_count == 0:
                    # Check if this is because the document truly wasn't modified
                    current = mongo_db.projects.find_one({"_id": ObjectId(project_id)})
                    if current and current.get("documents") == project["documents"]:
                        return {"message": "No changes were necessary", "data": data}, 200
                    else:
                        return {"error": "Failed to update Project Plan"}, 500
                    
                return {"message": "Project Plan updated successfully", "data": data}, 200
            except Exception as e:
                return {"error": f"Error updating project: {str(e)}"}, 500

        except Exception as e:
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def delete(self, project_id):
        """
        Delete the Project Plan document from this project's documents array.
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Only delete from the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            result = mongo_db.projects.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$pull": {"documents": {"type": "ProjectPlan"}}}
            )
            
            if result.modified_count == 0:
                return {"error": "Failed to delete Project Plan"}, 500
                
            return {"message": "Project Plan deleted successfully"}, 200

        except Exception as e:
            return {"error": str(e)}, 500

@projects_ns.route("/<project_id>/deliverables")
class ProjectDeliverables(Resource):
    @cross_origin()
    @mongodb_response
    def get(self, project_id):
        """Get all deliverables for a specific project"""
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Getting deliverables for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in ProjectDeliverables.get: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Check if project exists and belongs to the user
            project = db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404
            
            # Process deliverables if needed
            safe_convert_deliverables(project)
            
            logger.info(f"Successfully retrieved deliverables for project: {project_id}")
            return project["deliverables"]
                
        except Exception as e:
            logger.exception(f"Error in ProjectDeliverables.get: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def post(self, project_id):
        """
        Add a new deliverable to a project.
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Adding deliverable to project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in ProjectDeliverables.post: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Check if project exists and belongs to the user
            project = db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404
            
            # Get deliverable data
            data = request.get_json()
            
            # Validate required fields
            if 'name' not in data:
                logger.warning("Missing required field: name")
                return {"error": "Missing required field: name"}, 400
            
            # Generate a unique ID for the deliverable
            deliverable_id = ObjectId()
            
            # Prepare the deliverable object
            deliverable = {
                "_id": deliverable_id,
                "name": data.get("name"),
                "status": data.get("status", "Not Started"),
                "end_date": data.get("end_date")
            }
            
            # Add deliverable to the project
            result = db.projects.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$push": {"deliverables": deliverable}}
            )
            
            if result.modified_count > 0:
                logger.info(f"Successfully added deliverable to project: {project_id}")
                return {
                    "message": "Deliverable added successfully",
                    "deliverable_id": str(deliverable_id)
                }, 201
            else:
                logger.error(f"Failed to add deliverable to project: {project_id}")
                return {"error": "Failed to add deliverable"}, 500

        except Exception as e:
            logger.exception(f"Error in ProjectDeliverables.post: {str(e)}")
            return {"error": str(e)}, 500

@projects_ns.route("/<project_id>/deliverables/<deliverable_id>")
class ProjectDeliverable(Resource):
    @cross_origin()
    @mongodb_response
    def delete(self, project_id, deliverable_id):
        """
        Delete a specific deliverable from a project.
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Deleting deliverable {deliverable_id} from project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in ProjectDeliverable.delete: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Check if project exists
            project = db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found"}, 404

            # Check if the project has deliverables
            if "deliverables" not in project or not isinstance(project["deliverables"], list):
                logger.warning(f"No deliverables found in project: {project_id}")
                return {"error": "No deliverables in this project"}, 404
                
            # Find the deliverable by ID
            found = False
            for d in project["deliverables"]:
                if "_id" in d and str(d["_id"]) == deliverable_id:
                    found = True
                    break

            if not found:
                logger.warning(f"Deliverable {deliverable_id} not found in project: {project_id}")
                return {"error": "Deliverable not found"}, 404
                
            # Remove the deliverable using MongoDB's $pull operator
            result = db.projects.update_one(
                    {"_id": ObjectId(project_id), "user_id": user_id},
                {"$pull": {"deliverables": {"_id": ObjectId(deliverable_id)}}}
                )
            
            if result.modified_count > 0:
                logger.info(f"Successfully deleted deliverable {deliverable_id} from project: {project_id}")
                return {"message": "Deliverable deleted successfully"}, 200
            else:
                logger.error(f"Failed to delete deliverable {deliverable_id} from project: {project_id}")
                return {"error": "Failed to delete deliverable"}, 500

        except Exception as e:
            logger.exception(f"Error in ProjectDeliverable.delete: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def put(self, project_id, deliverable_id):
        """
        Update a specific deliverable in a project.
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Updating deliverable {deliverable_id} in project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in ProjectDeliverable.put: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            data = request.get_json()
            if not data:
                logger.warning("No data provided for deliverable update")
                return {"error": "No data provided"}, 400
                
            # Only update the project if it belongs to the current user
            project = db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found"}, 404

            # Find the deliverable index
            deliverable_index = None
            for idx, d in enumerate(project.get("deliverables", [])):
                if "_id" in d and str(d["_id"]) == deliverable_id:
                    deliverable_index = idx
                    break
                    
            if deliverable_index is None:
                logger.warning(f"Deliverable {deliverable_id} not found in project: {project_id}")
                return {"error": "Deliverable not found"}, 404
                
            # Update the deliverable
            update_field = f"deliverables.{deliverable_index}"
            update_data = {
                f"{update_field}.name": data.get("name"),
                f"{update_field}.status": data.get("status"),
                f"{update_field}.end_date": data.get("end_date")
            }
            
            # Filter out None values
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            if not update_data:
                logger.warning("No valid fields to update")
                return {"error": "No valid fields to update"}, 400
                
            result = db.projects.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Successfully updated deliverable {deliverable_id} in project: {project_id}")
                return {"message": "Deliverable updated successfully"}, 200
            else:
                logger.info(f"No changes made to deliverable {deliverable_id} in project: {project_id}")
                return {"message": "No changes were made to the deliverable"}, 200

        except Exception as e:
            logger.exception(f"Error in ProjectDeliverable.put: {str(e)}")
            return {"error": str(e)}, 500

@projects_ns.route("/<project_id>/documents/project-budget-report")
class ProjectBudgetReport(Resource):
    @cross_origin()
    @mongodb_response
    def get(self, project_id):
        """
        Retrieve the Project Budget Report document from a project's documents array.
        Returns 404 if not found.
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Getting Project Budget Report for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in ProjectBudgetReport.get: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Only access the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found"}, 404

            budget_report_doc = None
            for doc in project.get("documents", []):
                if doc.get("type") == "ProjectBudgetReport":
                    budget_report_doc = doc
                    break

            if not budget_report_doc:
                logger.warning(f"Project Budget Report not found for project: {project_id}")
                return {"error": "Project Budget Report not found"}, 404

            # Convert any nested ObjectIds to strings
            budget_report_doc = json_util.loads(json_util.dumps(budget_report_doc))
            logger.info(f"Successfully retrieved Project Budget Report for project: {project_id}")
            return budget_report_doc, 200

        except Exception as e:
            logger.exception(f"Error in ProjectBudgetReport.get: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def put(self, project_id):
        """
        Update or create the Project Budget Report for a project
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Get request data
            data = request.get_json()
            if not data:
                return {"error": "No data provided"}, 400
                
            # Only update the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            # Find the Project Budget Report document index
            report_index = -1
            documents = project.get("documents", [])
            
            for i, doc in enumerate(documents):
                if doc.get("type") == "ProjectBudgetReport":
                    report_index = i
                    break
                    
            # If the document doesn't exist, create it
            if report_index == -1:
                if "documents" not in project:
                    project["documents"] = []
                
                # Make sure type is set correctly
                data["type"] = "ProjectBudgetReport"
                
                # Add created_at and updated_at if not provided
                if "created_at" not in data:
                    data["created_at"] = datetime.now().isoformat()
                if "updated_at" not in data:
                    data["updated_at"] = datetime.now().isoformat()
                if "version" not in data:
                    data["version"] = 1
                
                project["documents"].append(data)
            else:
                # Update the existing document
                # Preserve created_at if it exists
                if "created_at" in project["documents"][report_index]:
                    data["created_at"] = project["documents"][report_index]["created_at"]
                else:
                    data["created_at"] = datetime.now().isoformat()
                    
                # Increment version
                current_version = project["documents"][report_index].get("version", 0)
                if "version" not in data:
                    data["version"] = current_version + 1
                
                # Ensure type is set
                data["type"] = "ProjectBudgetReport"
                if "updated_at" not in data:
                    data["updated_at"] = datetime.now().isoformat()
                
                # Replace the old document with the new one
                project["documents"][report_index] = data

            # Update the project in the database
            try:
                result = mongo_db.projects.update_one(
                    {"_id": ObjectId(project_id)},
                    {"$set": {
                        "documents": project["documents"],
                        "updated_at": datetime.now().isoformat()
                    }}
                )
                
                if result.modified_count == 0:
                    logger.warning(f"No changes made to Project Budget Report for project: {project_id}")
                    # Check if this is because the document truly wasn't modified
                    current = mongo_db.projects.find_one({"_id": ObjectId(project_id)})
                    if current and current.get("documents") == project["documents"]:
                        return {"message": "No changes were necessary", "data": data}, 200
                    else:
                        return {"error": "Failed to update Project Budget Report"}, 500
                    
                logger.info(f"Project Budget Report successfully updated for project: {project_id}")
                return {"message": "Project Budget Report updated successfully", "data": data}, 200
            except Exception as db_error:
                logger.exception(f"Database error while updating Project Budget Report: {str(db_error)}")
                return {"error": f"Database error: {str(db_error)}"}, 500

        except Exception as e:
            logger.exception(f"Error in ProjectBudgetReport.put: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def delete(self, project_id):
        """
        Delete the Project Budget Report document from this project's documents array.
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Only delete from the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            result = mongo_db.projects.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$pull": {"documents": {"type": "ProjectBudgetReport"}}}
            )
            
            if result.modified_count == 0:
                return {"error": "Failed to delete Project Budget Report"}, 500
                
            return {"message": "Project Budget Report deleted successfully"}, 200
                
        except Exception as e:
            return {"error": str(e)}, 500

@projects_ns.route("/<project_id>/documents/close-out-report")
class CloseOutReport(Resource):
    @cross_origin()
    @mongodb_response
    def get(self, project_id):
        """
        Retrieve the Close Out Report document from a project's documents array.
        Returns 404 if not found.
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Getting Close Out Report for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in CloseOutReport.get: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Only access the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404
                
            report_doc = None
            for doc in project.get("documents", []):
                if doc.get("type") == "CloseOutReport":
                    report_doc = doc
                    break
                    
            if not report_doc:
                logger.warning(f"Close Out Report not found for project: {project_id}")
                return {"error": "Close Out Report not found"}, 404

            # Convert any nested ObjectIds to strings
            report_doc = convert_objectids(report_doc)
            
            # Check if this is a nested content structure or direct data
            if 'content' in report_doc and isinstance(report_doc['content'], dict):
                # If there's a content field with report data, this is nested (old format)
                if any(key in report_doc['content'] for key in ['projectOverview', 'finalStatus', 'plannedVsActual']):
                    # Keep the structure but ensure needed fields
                    if 'type' not in report_doc['content']:
                        report_doc['content']['type'] = report_doc.get('type', 'CloseOutReport')
                    if 'version' not in report_doc['content']:
                        report_doc['content']['version'] = report_doc.get('version', 1)
                else:
                    # This is unexpected - copy key fields to content
                    report_doc['content'].update({
                        'type': report_doc.get('type', 'CloseOutReport'),
                        'version': report_doc.get('version', 1)
                    })
            else:
                # No content field - add it for backwards compatibility with older clients
                # but keep the primary data directly in the document
                report_doc.update({
                    'type': report_doc.get('type', 'CloseOutReport'),
                    'version': report_doc.get('version', 1)
                })
                
                # Add content field with the same data for backwards compatibility
                if 'content' not in report_doc:
                    content_data = {
                        'projectOverview': report_doc.get('projectOverview', ''),
                        'finalStatus': report_doc.get('finalStatus', ''),
                        'plannedVsActual': report_doc.get('plannedVsActual', {}),
                        'lessonsLearned': report_doc.get('lessonsLearned', ''),
                        'recommendations': report_doc.get('recommendations', ''),
                        'finalDeliverables': report_doc.get('finalDeliverables', []),
                        'stakeholderAcceptance': report_doc.get('stakeholderAcceptance', []),
                        'teamFeedback': report_doc.get('teamFeedback', ''),
                        'clientFeedback': report_doc.get('clientFeedback', ''),
                        'futureActionItems': report_doc.get('futureActionItems', [])
                    }
                    report_doc['content'] = content_data
            
            logger.info(f"Successfully retrieved Close Out Report for project: {project_id}")
            return report_doc, 200
                
        except Exception as e:
            logger.exception(f"Error in CloseOutReport.get: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def put(self, project_id):
        """
        Update or create the Close Out Report for a project
        """
        try:
            logger = logging.getLogger(__name__)
            logger.info(f"Updating Close Out Report for project: {project_id}")
            
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                logger.error(f"Authentication error in CloseOutReport.put: {error}")
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            logger.info(f"User authenticated: {user_id}")
            
            # Get request data
            data = request.get_json()
            if not data:
                logger.warning("No data provided for Close Out Report update")
                return {"error": "No data provided"}, 400
                
            # Log received data structure
            logger.debug(f"Received Close Out Report data: {json.dumps(data, default=str)}")
                
            # Only update the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                logger.warning(f"Project not found or unauthorized for user: {user_id}")
                return {"error": "Project not found or unauthorized"}, 404

            # Find the Close Out Report document index
            report_index = -1
            documents = project.get("documents", [])
            
            for i, doc in enumerate(documents):
                if doc.get("type") == "CloseOutReport":
                    report_index = i
                    break
                    
            # If the document doesn't exist, create it
            if report_index == -1:
                if "documents" not in project:
                    project["documents"] = []
                
                # Make sure type is set correctly
                data["type"] = "CloseOutReport"
                
                # Add created_at and updated_at if not provided
                if "created_at" not in data:
                    data["created_at"] = datetime.now().isoformat()
                if "updated_at" not in data:
                    data["updated_at"] = datetime.now().isoformat()
                if "version" not in data:
                    data["version"] = 1
                
                project["documents"].append(data)
                logger.info(f"Creating new Close Out Report document for project: {project_id}")
            else:
                # Update the existing document
                # Preserve created_at if it exists
                if "created_at" in project["documents"][report_index]:
                    data["created_at"] = project["documents"][report_index]["created_at"]
                else:
                    data["created_at"] = datetime.now().isoformat()
                    
                # Increment version
                current_version = project["documents"][report_index].get("version", 0)
                if "version" not in data:
                    data["version"] = current_version + 1
                
                # Ensure type is set
                data["type"] = "CloseOutReport"
                if "updated_at" not in data:
                    data["updated_at"] = datetime.now().isoformat()
                
                # Replace the old document with the new one
                project["documents"][report_index] = data
                logger.info(f"Updating existing Close Out Report document for project: {project_id}")
                
            # Update the project with the modified documents array
            try:
                result = mongo_db.projects.update_one(
                    {"_id": ObjectId(project_id), "user_id": user_id},
                    {"$set": {"documents": project["documents"]}}
                )
                
                if result.modified_count == 0:
                    logger.warning(f"No changes made to Close Out Report for project: {project_id}")
                    # Check if this is because the document truly wasn't modified
                    current = mongo_db.projects.find_one({"_id": ObjectId(project_id)})
                    if current and current.get("documents") == project["documents"]:
                        return {"message": "No changes were necessary", "data": data}, 200
                    else:
                        return {"error": "Failed to update Close Out Report"}, 500
                    
                logger.info(f"Close Out Report successfully updated for project: {project_id}")
                return {"message": "Close Out Report updated successfully", "data": data}, 200
            except Exception as db_error:
                logger.exception(f"Database error while updating Close Out Report: {str(db_error)}")
                return {"error": f"Error updating project: {str(db_error)}"}, 500
            
        except Exception as e:
            logger.exception(f"Error in CloseOutReport.put: {str(e)}")
            return {"error": str(e)}, 500

    @cross_origin()
    @mongodb_response
    def delete(self, project_id):
        """
        Delete the Close Out Report document from this project's documents array.
        """
        try:
            # Verify the Firebase token
            decoded_token, error = verify_firebase_token()
            if error:
                return {"error": f"Authentication error: {error}"}, 401
                
            user_id = decoded_token.get('uid')
            
            # Only delete from the project if it belongs to the current user
            project = mongo_db.projects.find_one({"_id": ObjectId(project_id), "user_id": user_id})
            if not project:
                return {"error": "Project not found"}, 404

            result = mongo_db.projects.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$pull": {"documents": {"type": "CloseOutReport"}}}
            )
            
            if result.modified_count == 0:
                return {"error": "Failed to delete Close Out Report"}, 500
                
            return {"message": "Close Out Report deleted successfully"}, 200
                
        except Exception as e:
            return {"error": str(e)}, 500

