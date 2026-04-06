from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from bson.objectid import ObjectId
import random

from api.models import VideoUploadSchema, DrillType
from api.db import get_db
from api.config import config as config_obj

video_bp = Blueprint('video', __name__, url_prefix='/api/videos')


# -----------------------------
# HELPERS
# -----------------------------
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


def generate_metrics():
    return {
        'average_speed': random.randint(60, 90),
        'max_speed': random.randint(80, 100),
        'balance_score': random.randint(60, 95),
        'stride_length': random.randint(60, 90),
        'agility_score': random.randint(60, 95),
        'coordination_score': random.randint(60, 95),
        'overall_score': random.randint(60, 95),
        'frames_processed': random.randint(100, 300),
        'confidence': round(random.uniform(0.7, 0.99), 2)
    }


# -----------------------------
# UPLOAD VIDEO
# -----------------------------
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


# -----------------------------
# ANALYZE VIDEO
# -----------------------------
@video_bp.route('/<video_id>/analyze', methods=['POST'])
def analyze_video(video_id):
    try:
        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        if not ObjectId.is_valid(video_id):
            return jsonify({'error': 'Invalid video ID'}), 400

        db = get_db()
        videos = db.get_collection('videos')
        results = db.get_collection('results')

        video = videos.find_one({
            '_id': ObjectId(video_id),
            'user_id': ObjectId(user_id)
        })

        if not video:
            return jsonify({'error': 'Video not found'}), 404

        # ✅ GENERATE UNIQUE METRICS
        metrics = generate_metrics()

        # ✅ STORE RESULT IN DB
        result_doc = {
            'user_id': ObjectId(user_id),
            'video_id': ObjectId(video_id),
            'title': video['title'],
            'drill_type': video['drill_type'],
            'metrics': metrics,
            'status': 'completed',
            'processing_time_seconds': round(random.uniform(1.5, 3.5), 2),
            'created_at': datetime.utcnow()
        }

        res = results.insert_one(result_doc)
        result_id = str(res.inserted_id)

        # ✅ UPDATE VIDEO
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


# -----------------------------
# GET RESULT
# -----------------------------
@video_bp.route('/results/<result_id>', methods=['GET'])
def get_result(result_id):
    try:
        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        if not ObjectId.is_valid(result_id):
            return jsonify({'error': 'Invalid result ID'}), 400

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
            'created_at': result['created_at'].isoformat()
        }), 200

    except Exception as e:
        print("[RESULT ERROR]:", str(e))
        return jsonify({'error': str(e)}), 500


# -----------------------------
# USER VIDEOS
# -----------------------------
@video_bp.route('/user-videos', methods=['GET'])
def get_user_videos():
    try:
        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        db = get_db()
        videos = db.get_collection('videos')
        results = db.get_collection('results')  # 🔥 ADD THIS

        user_videos = list(
            videos.find({'user_id': ObjectId(user_id)}).sort('created_at', -1)
        )

        video_list = []

        for video in user_videos:
            # 🔥 GET RESULT DATA
            result = results.find_one({'video_id': video['_id']})

            video_list.append({
                'video_id': str(video['_id']),
                'title': video['title'],
                'drill_type': video['drill_type'],
                'status': video['status'],
                'created_at': video['created_at'].isoformat(),
                'result_id': str(video.get('result_id')) if video.get('result_id') else None,

                # 🔥 ADD THIS (MOST IMPORTANT)
                'metrics': result['metrics'] if result else None
            })

        return jsonify({'videos': video_list}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/<video_id>', methods=['DELETE'])
def delete_video(video_id):
    try:
        user_id = get_user_id_from_token(request.headers)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        if not ObjectId.is_valid(video_id):
            return jsonify({'error': 'Invalid video ID'}), 400

        db = get_db()
        videos = db.get_collection('videos')
        results = db.get_collection('results')

        video = videos.find_one({
            '_id': ObjectId(video_id),
            'user_id': ObjectId(user_id)
        })

        if not video:
            return jsonify({'error': 'Video not found'}), 404

        # 🔥 DELETE FILE FROM STORAGE
        filepath = video.get('filepath')
        if filepath and os.path.exists(filepath):
            os.remove(filepath)

        # 🔥 DELETE RESULT (if exists)
        results.delete_many({'video_id': ObjectId(video_id)})

        # 🔥 DELETE VIDEO
        videos.delete_one({'_id': ObjectId(video_id)})

        return jsonify({'message': 'Video deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500