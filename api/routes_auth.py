from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from api.models import UserSchema, LoginSchema
from api.auth import AuthHandler
from api.db import get_db
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate request data
        user_data = UserSchema(**data)
        
        db = get_db()
        users = db.get_collection('users')
        
        # Check if user already exists
        if users.find_one({'email': user_data.email}):
            return jsonify({'error': 'Email already registered'}), 409
        
        if users.find_one({'username': user_data.username}):
            return jsonify({'error': 'Username already taken'}), 409
        
        # Hash password
        from api.config import config
        auth = AuthHandler(secret=config['default'].JWT_SECRET)
        hashed_password = auth.hash_password(user_data.password)
        
        # Insert user
        user_doc = {
            'username': user_data.username,
            'email': user_data.email,
            'password': hashed_password,
            'full_name': user_data.full_name,
            'created_at': user_data.created_at
        }
        
        result = users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create token
        token = auth.create_token(user_id, user_data.email)
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id,
            'token': token,
            'username': user_data.username,
            'email': user_data.email
        }), 201
    
    except ValidationError as e:
        return jsonify({'error': 'Invalid request data', 'details': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        # Validate request data
        login_data = LoginSchema(**data)
        
        db = get_db()
        users = db.get_collection('users')
        
        # Find user
        user = users.find_one({'email': login_data.email})
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Verify password
        from api.config import config
        auth = AuthHandler(secret=config['default'].JWT_SECRET)
        
        if not auth.verify_password(login_data.password, user['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create token
        user_id = str(user['_id'])
        token = auth.create_token(user_id, user['email'])
        
        return jsonify({
            'message': 'Login successful',
            'user_id': user_id,
            'token': token,
            'username': user.get('username'),
            'email': user['email'],
            'full_name': user.get('full_name')
        }), 200
    
    except ValidationError as e:
        return jsonify({'error': 'Invalid request data', 'details': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get current user profile"""
    try:
        from api.auth import token_required
        
        # This route will be protected via middleware
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        from api.config import config
        auth = AuthHandler(secret=config['default'].JWT_SECRET)
        payload = auth.verify_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = payload['user_id']
        db = get_db()
        users = db.get_collection('users')
        
        user = users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user_id': str(user['_id']),
            'username': user.get('username'),
            'email': user.get('email'),
            'full_name': user.get('full_name'),
            'created_at': user.get('created_at').isoformat() if user.get('created_at') else None
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    
@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Unauthorized'}), 401

        from api.config import config
        auth = AuthHandler(secret=config['default'].JWT_SECRET)
        payload = auth.verify_token(token)

        if not payload:
            return jsonify({'error': 'Invalid token'}), 401

        user_id = payload['user_id']

        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_password or not new_password:
            return jsonify({'error': 'Missing fields'}), 400

        db = get_db()
        users = db.get_collection('users')

        user = users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # ✅ VERIFY OLD PASSWORD
        if not auth.verify_password(current_password, user['password']):
            return jsonify({'error': 'Incorrect current password'}), 400

        # ✅ HASH NEW PASSWORD
        hashed_password = auth.hash_password(new_password)

        users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'password': hashed_password}}
        )

        return jsonify({'message': 'Password updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500