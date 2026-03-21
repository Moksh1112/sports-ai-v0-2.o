from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from pydantic import ValidationError
from bson.objectid import ObjectId
from api.models import VideoUploadSchema, DrillType
from api.db import get_db
from api.config import config as config_obj

video_bp = Blueprint('video', __name__, url_prefix='/api/videos')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in config_obj['default'].ALLOWED_VIDEO_EXTENSIONS


def get_user_id_from_token(headers):
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


# ✅ UPLOAD VIDEO
@video_bp.route('/upload', methods=['POST'])
def upload_video():
    try:
        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        file = request.files['video']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file format'}), 400

        metadata = VideoUploadSchema(
            title=request.form.get('title'),
            description=request.form.get('description'),
            drill_type=DrillType(request.form.get('drill_type')),
            duration_seconds=int(request.form.get('duration_seconds', 0))
        )

        upload_dir = config_obj['default'].UPLOAD_FOLDER
        os.makedirs(upload_dir, exist_ok=True)

        filename = secure_filename(f"{ObjectId()}_{file.filename}")
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)

        file_size = os.path.getsize(filepath)

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

        return jsonify({
            'video_id': str(result.inserted_id),
            'status': 'uploaded'
        }), 201

    except Exception as e:
        print("[UPLOAD ERROR]:", str(e))
        return jsonify({'error': str(e)}), 500


# ✅ ANALYZE VIDEO (FIXED + SAFE)
@video_bp.route('/<video_id>/analyze', methods=['POST'])
def analyze_video(video_id):
    try:
        print("Received video_id:", video_id)

        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        if not ObjectId.is_valid(video_id):
            return jsonify({'error': 'Invalid video ID'}), 400

        db = get_db()
        videos = db.get_collection('videos')

        video = videos.find_one({
            '_id': ObjectId(video_id),
            'user_id': ObjectId(user_id)
        })

        if not video:
            return jsonify({'error': 'Video not found'}), 404

        # ✅ TEMP RESULT (no ML for now)
        result_id = str(ObjectId())

        videos.update_one(
            {'_id': ObjectId(video_id)},
            {'$set': {'status': 'analyzed', 'result_id': ObjectId(result_id)}}
        )

        return jsonify({
            'message': 'Analysis completed',
            'result_id': result_id,
            'video_id': video_id
        }), 200

    except Exception as e:
        print("[ANALYZE ERROR]:", str(e))
        return jsonify({'error': str(e)}), 500


@video_bp.route('/results/<result_id>', methods=['GET'])
def get_result(result_id):
    try:
        print("Fetching result:", result_id)

        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        # ✅ ALWAYS RETURN (NO DB FOR NOW — STABLE VERSION)
        return jsonify({
            'result_id': result_id,
            'video_id': "demo",
            'title': "Demo Video",
            'drill_type': "dribble",
            'metrics': {
                'average_speed': 70,
                'max_speed': 90,
                'balance_score': 80,
                'stride_length': 75,
                'agility_score': 85,
                'coordination_score': 88,
                'overall_score': 85,
                'frames_processed': 120,
                'confidence': 0.92
            },
            'status': 'completed',
            'processing_time_seconds': 2.5,
            'created_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        print("Result error:", str(e))
        return jsonify({'error': str(e)}), 500

# ✅ USER VIDEOS
@video_bp.route('/user-videos', methods=['GET'])
def get_user_videos():
    try:
        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        db = get_db()
        videos = db.get_collection('videos')

        user_videos = list(videos.find({'user_id': ObjectId(user_id)}).sort('created_at', -1))

        video_list = []
        for video in user_videos:
            video_list.append({
                'video_id': str(video['_id']),
                'title': video['title'],
                'drill_type': video['drill_type'],
                'status': video['status'],
                'created_at': video['created_at'].isoformat(),
                'result_id': str(video.get('result_id')) if video.get('result_id') else None
            })

        return jsonify({'videos': video_list}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500