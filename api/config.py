import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/football_analysis')
    JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION = timedelta(days=7)
    
    # Upload settings
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB
    ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}
    
    # Video processing
    FRAME_SAMPLE_RATE = 5  # Process every 5th frame
    MIN_CONFIDENCE = 0.5  # MediaPipe confidence threshold

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    MONGO_URI = 'mongodb://localhost:27017/football_analysis_test'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
