from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import time
from pydantic import ValidationError
from bson.objectid import ObjectId
from api.models import VideoUploadSchema, DrillType
from api.auth import token_required
from api.db import get_db
from api.analysis import VideoAnalyzer
from api.config import config as config_obj

video_bp = Blueprint('video', __name__, url_prefix='/api/videos')

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in config_obj['default'].ALLOWED_VIDEO_EXTENSIONS

def get_user_id_from_token(headers) -> str:
    """Extract and verify user ID from token"""
    from api.config import config
    from api.auth import AuthHandler
    
    token = headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    
    auth = AuthHandler(secret=config['default'].JWT_SECRET)
    payload = auth.verify_token(token)
    
    if not payload:
        return None
    
    return payload['user_id']

@video_bp.route('/upload', methods=['POST'])
def upload_video():
    """Upload a video for analysis"""
    try:
        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Check if file is present
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file format'}), 400
        
        # Get metadata from form
        try:
            metadata = VideoUploadSchema(
                title=request.form.get('title'),
                description=request.form.get('description'),
                drill_type=DrillType(request.form.get('drill_type')),
                duration_seconds=int(request.form.get('duration_seconds', 0))
            )
        except ValidationError as e:
            return jsonify({'error': 'Invalid metadata', 'details': str(e)}), 400
        
        # Create uploads directory if needed
        upload_dir = config_obj['default'].UPLOAD_FOLDER
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        filename = secure_filename(f"{ObjectId()}_{file.filename}")
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        
        # Verify file size
        file_size = os.path.getsize(filepath)
        if file_size > config_obj['default'].MAX_VIDEO_SIZE:
            os.remove(filepath)
            return jsonify({'error': 'File too large'}), 413
        
        # Store video metadata in database
        db = get_db()
        videos = db.get_collection('videos')
        
        video_doc = {
            'user_id': ObjectId(user_id),
            'title': metadata.title,
            'description': metadata.description,
            'drill_type': metadata.drill_type.value,
            'duration_seconds': metadata.duration_seconds,
            'filename': filename,
            'filepath': filepath,
            'file_size': file_size,
            'status': 'uploaded',
            'created_at': datetime.utcnow()
        }
        
        result = videos.insert_one(video_doc)
        video_id = str(result.inserted_id)
        
        return jsonify({
            'message': 'Video uploaded successfully',
            'video_id': video_id,
            'status': 'uploaded',
            'title': metadata.title,
            'drill_type': metadata.drill_type.value
        }), 201
    
    except Exception as e:
        print(f"[v0] Upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@video_bp.route('/<video_id>/analyze', methods=['POST'])
def analyze_video(video_id):
    """Analyze uploaded video"""
    try:
        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        db = get_db()
        videos = db.get_collection('videos')
        
        # Get video
        video = videos.find_one({'_id': ObjectId(video_id), 'user_id': ObjectId(user_id)})
        if not video:
            return jsonify({'error': 'Video not found'}), 404
        
        filepath = video['filepath']
        if not os.path.exists(filepath):
            return jsonify({'error': 'Video file not found'}), 404
        
        # Update status
        videos.update_one(
            {'_id': ObjectId(video_id)},
            {'$set': {'status': 'processing'}}
        )
        
        # Run analysis
        start_time = time.time()
        try:
            analyzer = VideoAnalyzer(
                config=config_obj['default'].__dict__,
                frame_sample_rate=config_obj['default'].FRAME_SAMPLE_RATE
            )
            metrics, frames_processed, confidence = analyzer.analyze_video(filepath)
            processing_time = time.time() - start_time
        except Exception as e:
            videos.update_one(
                {'_id': ObjectId(video_id)},
                {'$set': {'status': 'failed', 'error': str(e)}}
            )
            return jsonify({'error': f'Analysis failed: {str(e)}'}), 500
        
        # Store results
        results = db.get_collection('results')
        result_doc = {
            'user_id': ObjectId(user_id),
            'video_id': ObjectId(video_id),
            'title': video['title'],
            'drill_type': video['drill_type'],
            'metrics': metrics.model_dump(),
            'status': 'completed',
            'processing_time_seconds': processing_time,
            'created_at': datetime.utcnow()
        }
        
        result = results.insert_one(result_doc)
        result_id = str(result.inserted_id)
        
        # Update video status
        videos.update_one(
            {'_id': ObjectId(video_id)},
            {'$set': {'status': 'analyzed', 'result_id': ObjectId(result_id)}}
        )
        
        return jsonify({
            'message': 'Analysis completed',
            'result_id': result_id,
            'video_id': video_id,
            'metrics': metrics.model_dump(),
            'processing_time_seconds': processing_time,
            'frames_processed': frames_processed,
            'confidence': confidence
        }), 200
    
    except Exception as e:
        print(f"[v0] Analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@video_bp.route('/results/<result_id>', methods=['GET'])
def get_result(result_id):
    """Get analysis result"""
    try:
        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        db = get_db()
        results = db.get_collection('results')
        
        result = results.find_one({
            '_id': ObjectId(result_id),
            'user_id': ObjectId(user_id)
        })
        
        if not result:
            return jsonify({'error': 'Result not found'}), 404
        
        return jsonify({
            'result_id': str(result['_id']),
            'video_id': str(result['video_id']),
            'title': result['title'],
            'drill_type': result['drill_type'],
            'metrics': result['metrics'],
            'status': result['status'],
            'processing_time_seconds': result['processing_time_seconds'],
            'created_at': result['created_at'].isoformat() if result.get('created_at') else None
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/user-videos', methods=['GET'])
def get_user_videos():
    """Get all videos for current user"""
    try:
        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        db = get_db()
        videos = db.get_collection('videos')
        results = db.get_collection('results')
        
        user_videos = list(videos.find({'user_id': ObjectId(user_id)}).sort('created_at', -1))
        
        video_list = []
        for video in user_videos:
            # Get associated result if exists
            result = results.find_one({'video_id': video['_id']})
            
            video_list.append({
                'video_id': str(video['_id']),
                'title': video['title'],
                'drill_type': video['drill_type'],
                'status': video['status'],
                'created_at': video['created_at'].isoformat() if video.get('created_at') else None,
                'result_id': str(result['_id']) if result else None
            })
        
        return jsonify({'videos': video_list}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
