import jwt
import bcrypt
from functools import wraps
from flask import request, jsonify
from datetime import datetime, timedelta
import os

class AuthHandler:
    """Handle authentication and authorization"""
    
    def __init__(self, secret: str, algorithm: str = 'HS256'):
        self.secret = secret
        self.algorithm = algorithm
        self.expiration = timedelta(days=7)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password with bcrypt"""
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def create_token(self, user_id: str, email: str) -> str:
        """Create JWT token"""
        payload = {
            'user_id': user_id,
            'email': email,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + self.expiration
        }
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> dict:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def extract_token_from_header(self, headers) -> str:
        """Extract token from Authorization header"""
        auth_header = headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:]
        return None

# Decorator for protected routes
def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Verify token
        from api.config import config
        from api.auth import AuthHandler
        
        auth = AuthHandler(
            secret=config['default'].JWT_SECRET,
            algorithm=config['default'].JWT_ALGORITHM
        )
        
        payload = auth.verify_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        request.user_id = payload['user_id']
        request.user_email = payload['email']
        
        return f(*args, **kwargs)
    
    return decorated
