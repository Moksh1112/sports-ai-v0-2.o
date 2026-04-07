from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__)
    
    # Load configuration
    from api.config import config
    app.config.from_object(config[config_name])
    
    # Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5000"],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize database
    from api.db import init_db
    init_db(app.config['MONGO_URI'])
    
    # Register blueprints
    from api.routes_auth import auth_bp
    from api.routes_video import video_bp
    from api.routes_coach import coach_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(video_bp)
    app.register_blueprint(coach_bp)

    # ✅ ROOT ROUTE (FIXED POSITION)
    @app.route("/")
    def home():
        return {
            "message": "Football Analysis API is running 🚀",
            "status": "success"
        }

    # ✅ HEALTH CHECK
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'ok', 'message': 'API is running'}), 200
    
    # ✅ ERROR HANDLERS
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app


if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True, host='0.0.0.0', port=5000)