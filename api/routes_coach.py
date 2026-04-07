from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from api.db import get_db
from api.auth import coach_required

coach_bp = Blueprint('coach', __name__, url_prefix='/api/coach')


# -----------------------------
# GET ALL USERS (Coach Only)
# -----------------------------
@coach_bp.route('/users', methods=['GET'])
@coach_required
def get_all_users():
    """Get all registered users with their stats"""
    try:
        db = get_db()
        users = db.get_collection('users')
        videos = db.get_collection('videos')
        results = db.get_collection('results')

        # Optional filters
        search = request.args.get('search', '').strip()
        performance_level = request.args.get('performance_level', '').strip()
        drill_type = request.args.get('drill_type', '').strip()

        # Build user query - only get regular users, not coaches
        user_query = {'role': {'$ne': 'coach'}}
        if search:
            user_query['$or'] = [
                {'username': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}},
                {'full_name': {'$regex': search, '$options': 'i'}}
            ]

        all_users = list(users.find(user_query))
        user_list = []

        for user in all_users:
            user_id = user['_id']

            # Count videos
            video_query = {'user_id': user_id}
            if drill_type:
                video_query['drill_type'] = drill_type
            total_videos = videos.count_documents(video_query)

            # Get average performance score
            user_results = list(results.find({'user_id': user_id}))
            avg_score = 0
            best_score = 0
            if user_results:
                scores = [r['metrics']['overall_score'] for r in user_results if r.get('metrics')]
                if scores:
                    avg_score = round(sum(scores) / len(scores), 1)
                    best_score = round(max(scores), 1)

            # Determine performance level
            level = _get_performance_level(avg_score)

            # Filter by performance level if specified
            if performance_level and level.lower() != performance_level.lower():
                continue

            # Check activity status
            last_video = videos.find_one(
                {'user_id': user_id},
                sort=[('created_at', -1)]
            )
            last_active = last_video['created_at'] if last_video else user.get('created_at')
            is_inactive = False
            if last_active:
                is_inactive = (datetime.utcnow() - last_active).days > 14

            # Determine trend
            trend = _calculate_trend(user_results)

            user_list.append({
                'user_id': str(user_id),
                'username': user.get('username'),
                'email': user.get('email'),
                'full_name': user.get('full_name'),
                'total_videos': total_videos,
                'avg_score': avg_score,
                'best_score': best_score,
                'performance_level': level,
                'is_inactive': is_inactive,
                'trend': trend,
                'last_active': last_active.isoformat() if last_active else None,
                'created_at': user.get('created_at').isoformat() if user.get('created_at') else None
            })

        return jsonify({'users': user_list, 'total': len(user_list)}), 200

    except Exception as e:
        print("[COACH USERS ERROR]:", str(e))
        return jsonify({'error': str(e)}), 500


# -----------------------------
# GET INDIVIDUAL USER DETAILS
# -----------------------------
@coach_bp.route('/user/<user_id>', methods=['GET'])
@coach_required
def get_user_details(user_id):
    """Get detailed info about a specific user"""
    try:
        if not ObjectId.is_valid(user_id):
            return jsonify({'error': 'Invalid user ID'}), 400

        db = get_db()
        users = db.get_collection('users')
        videos = db.get_collection('videos')
        results = db.get_collection('results')
        feedback_col = db.get_collection('feedback')

        user = users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get all videos
        user_videos = list(
            videos.find({'user_id': ObjectId(user_id)}).sort('created_at', -1)
        )

        video_list = []
        for video in user_videos:
            result = results.find_one({'video_id': video['_id']})
            video_feedback = list(feedback_col.find({'video_id': str(video['_id'])}))

            video_list.append({
                'video_id': str(video['_id']),
                'title': video.get('title'),
                'drill_type': video.get('drill_type'),
                'status': video.get('status'),
                'created_at': video['created_at'].isoformat() if video.get('created_at') else None,
                'result_id': str(video.get('result_id')) if video.get('result_id') else None,
                'metrics': result['metrics'] if result else None,
                'feedback_count': len(video_feedback)
            })

        # Get all results for trends
        user_results = list(
            results.find({'user_id': ObjectId(user_id)}).sort('created_at', 1)
        )

        performance_trends = []
        for r in user_results:
            performance_trends.append({
                'result_id': str(r['_id']),
                'title': r.get('title'),
                'drill_type': r.get('drill_type'),
                'overall_score': r['metrics']['overall_score'] if r.get('metrics') else 0,
                'average_speed': r['metrics']['average_speed'] if r.get('metrics') else 0,
                'agility_score': r['metrics']['agility_score'] if r.get('metrics') else 0,
                'balance_score': r['metrics']['balance_score'] if r.get('metrics') else 0,
                'coordination_score': r['metrics']['coordination_score'] if r.get('metrics') else 0,
                'created_at': r['created_at'].isoformat() if r.get('created_at') else None
            })

        # Calculate averages
        avg_metrics = _calculate_avg_metrics(user_results)

        # Get feedback for this user
        user_feedback = list(
            feedback_col.find({'user_id': user_id}).sort('created_at', -1)
        )
        feedback_list = []
        for fb in user_feedback:
            feedback_list.append({
                'feedback_id': str(fb['_id']),
                'video_id': fb.get('video_id'),
                'result_id': fb.get('result_id'),
                'feedback_text': fb.get('feedback_text'),
                'rating': fb.get('rating'),
                'coach_id': fb.get('coach_id'),
                'coach_name': fb.get('coach_name'),
                'created_at': fb['created_at'].isoformat() if fb.get('created_at') else None
            })

        return jsonify({
            'user': {
                'user_id': str(user['_id']),
                'username': user.get('username'),
                'email': user.get('email'),
                'full_name': user.get('full_name'),
                'created_at': user.get('created_at').isoformat() if user.get('created_at') else None,
                'performance_level': _get_performance_level(avg_metrics.get('overall_score', 0))
            },
            'videos': video_list,
            'performance_trends': performance_trends,
            'avg_metrics': avg_metrics,
            'feedback': feedback_list
        }), 200

    except Exception as e:
        print("[COACH USER DETAIL ERROR]:", str(e))
        return jsonify({'error': str(e)}), 500


# -----------------------------
# COACH ANALYTICS
# -----------------------------
@coach_bp.route('/analytics', methods=['GET'])
@coach_required
def get_analytics():
    """Get platform-wide analytics for coach"""
    try:
        db = get_db()
        users = db.get_collection('users')
        videos = db.get_collection('videos')
        results = db.get_collection('results')

        total_users = users.count_documents({'role': {'$ne': 'coach'}})
        total_videos = videos.count_documents({})
        total_analyzed = videos.count_documents({'status': 'analyzed'})

        # Get all results for aggregation
        all_results = list(results.find({}))
        all_scores = [r['metrics']['overall_score'] for r in all_results if r.get('metrics')]

        platform_avg = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0
        platform_best = round(max(all_scores), 1) if all_scores else 0

        # Drill type distribution
        drill_distribution = {}
        for r in all_results:
            dt = r.get('drill_type', 'unknown')
            if dt not in drill_distribution:
                drill_distribution[dt] = {'count': 0, 'total_score': 0}
            drill_distribution[dt]['count'] += 1
            if r.get('metrics'):
                drill_distribution[dt]['total_score'] += r['metrics']['overall_score']

        drill_stats = []
        for dt, stats in drill_distribution.items():
            drill_stats.append({
                'drill_type': dt,
                'count': stats['count'],
                'avg_score': round(stats['total_score'] / stats['count'], 1) if stats['count'] > 0 else 0
            })

        # Performance level distribution
        all_user_ids = users.distinct('_id', {'role': {'$ne': 'coach'}})
        level_counts = {'Beginner': 0, 'Intermediate': 0, 'Advanced': 0, 'Pro': 0, 'No Data': 0}

        for uid in all_user_ids:
            user_results = list(results.find({'user_id': uid}))
            if user_results:
                scores = [r['metrics']['overall_score'] for r in user_results if r.get('metrics')]
                avg = sum(scores) / len(scores) if scores else 0
                level = _get_performance_level(avg)
                level_counts[level] = level_counts.get(level, 0) + 1
            else:
                level_counts['No Data'] += 1

        # Recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_videos = videos.count_documents({'created_at': {'$gte': seven_days_ago}})
        recent_analyses = results.count_documents({'created_at': {'$gte': seven_days_ago}})

        return jsonify({
            'total_users': total_users,
            'total_videos': total_videos,
            'total_analyzed': total_analyzed,
            'platform_avg_score': platform_avg,
            'platform_best_score': platform_best,
            'drill_stats': drill_stats,
            'level_distribution': level_counts,
            'recent_videos_7d': recent_videos,
            'recent_analyses_7d': recent_analyses
        }), 200

    except Exception as e:
        print("[COACH ANALYTICS ERROR]:", str(e))
        return jsonify({'error': str(e)}), 500


# -----------------------------
# SUBMIT FEEDBACK
# -----------------------------
@coach_bp.route('/feedback', methods=['POST'])
@coach_required
def submit_feedback():
    """Coach submits feedback for a user"""
    try:
        data = request.get_json()

        if not data.get('user_id') or not data.get('feedback_text'):
            return jsonify({'error': 'user_id and feedback_text are required'}), 400

        db = get_db()
        users = db.get_collection('users')
        feedback_col = db.get_collection('feedback')

        # Verify user exists
        target_user = users.find_one({'_id': ObjectId(data['user_id'])})
        if not target_user:
            return jsonify({'error': 'Target user not found'}), 404

        # Get coach info
        coach = users.find_one({'_id': ObjectId(request.user_id)})

        feedback_doc = {
            'user_id': data['user_id'],
            'video_id': data.get('video_id'),
            'result_id': data.get('result_id'),
            'feedback_text': data['feedback_text'],
            'rating': data.get('rating'),
            'coach_id': request.user_id,
            'coach_name': coach.get('full_name') or coach.get('username', 'Coach'),
            'created_at': datetime.utcnow()
        }

        result = feedback_col.insert_one(feedback_doc)

        return jsonify({
            'message': 'Feedback submitted successfully',
            'feedback_id': str(result.inserted_id)
        }), 201

    except Exception as e:
        print("[COACH FEEDBACK ERROR]:", str(e))
        return jsonify({'error': str(e)}), 500


# -----------------------------
# GET FEEDBACK (for user)
# -----------------------------
@coach_bp.route('/feedback/<user_id>', methods=['GET'])
@coach_required
def get_feedback_for_user(user_id):
    """Get all feedback for a specific user"""
    try:
        db = get_db()
        feedback_col = db.get_collection('feedback')

        feedback_list = list(
            feedback_col.find({'user_id': user_id}).sort('created_at', -1)
        )

        result = []
        for fb in feedback_list:
            result.append({
                'feedback_id': str(fb['_id']),
                'video_id': fb.get('video_id'),
                'result_id': fb.get('result_id'),
                'feedback_text': fb.get('feedback_text'),
                'rating': fb.get('rating'),
                'coach_id': fb.get('coach_id'),
                'coach_name': fb.get('coach_name'),
                'created_at': fb['created_at'].isoformat() if fb.get('created_at') else None
            })

        return jsonify({'feedback': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# -----------------------------
# COMPARE USERS
# -----------------------------
@coach_bp.route('/compare', methods=['POST'])
@coach_required
def compare_users():
    """Compare multiple users side by side"""
    try:
        data = request.get_json()
        user_ids = data.get('user_ids', [])

        if len(user_ids) < 2:
            return jsonify({'error': 'At least 2 user IDs are required'}), 400

        db = get_db()
        users = db.get_collection('users')
        results = db.get_collection('results')

        comparison = []
        for uid in user_ids:
            if not ObjectId.is_valid(uid):
                continue

            user = users.find_one({'_id': ObjectId(uid)})
            if not user:
                continue

            user_results = list(results.find({'user_id': ObjectId(uid)}))
            avg_metrics = _calculate_avg_metrics(user_results)

            comparison.append({
                'user_id': str(user['_id']),
                'username': user.get('username'),
                'full_name': user.get('full_name'),
                'total_videos': len(user_results),
                'avg_metrics': avg_metrics,
                'performance_level': _get_performance_level(avg_metrics.get('overall_score', 0))
            })

        # Sort by overall score descending for ranking
        comparison.sort(key=lambda x: x['avg_metrics'].get('overall_score', 0), reverse=True)

        # Add rank
        for i, c in enumerate(comparison):
            c['rank'] = i + 1

        return jsonify({'comparison': comparison}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# -----------------------------
# LEADERBOARD
# -----------------------------
@coach_bp.route('/leaderboard', methods=['GET'])
@coach_required
def get_leaderboard():
    """Get leaderboard of all users ranked by performance"""
    try:
        db = get_db()
        users = db.get_collection('users')
        results = db.get_collection('results')

        all_users = list(users.find({'role': {'$ne': 'coach'}}))
        leaderboard = []

        for user in all_users:
            user_results = list(results.find({'user_id': user['_id']}))
            if not user_results:
                continue

            avg_metrics = _calculate_avg_metrics(user_results)

            leaderboard.append({
                'user_id': str(user['_id']),
                'username': user.get('username'),
                'full_name': user.get('full_name'),
                'total_analyses': len(user_results),
                'avg_score': avg_metrics.get('overall_score', 0),
                'best_score': avg_metrics.get('best_score', 0),
                'performance_level': _get_performance_level(avg_metrics.get('overall_score', 0))
            })

        leaderboard.sort(key=lambda x: x['avg_score'], reverse=True)

        for i, entry in enumerate(leaderboard):
            entry['rank'] = i + 1

        return jsonify({'leaderboard': leaderboard}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# -----------------------------
# USER FEEDBACK ENDPOINT (for regular users to view their feedback)
# This is a non-coach endpoint
# -----------------------------
@coach_bp.route('/my-feedback', methods=['GET'])
def get_my_feedback():
    """Get feedback for the currently authenticated user"""
    try:
        from api.auth import AuthHandler
        from api.config import config

        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        auth = AuthHandler(secret=config['default'].JWT_SECRET)
        payload = auth.verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401

        user_id = payload['user_id']

        db = get_db()
        feedback_col = db.get_collection('feedback')

        feedback_list = list(
            feedback_col.find({'user_id': user_id}).sort('created_at', -1)
        )

        result = []
        for fb in feedback_list:
            result.append({
                'feedback_id': str(fb['_id']),
                'video_id': fb.get('video_id'),
                'result_id': fb.get('result_id'),
                'feedback_text': fb.get('feedback_text'),
                'rating': fb.get('rating'),
                'coach_name': fb.get('coach_name'),
                'created_at': fb['created_at'].isoformat() if fb.get('created_at') else None
            })

        return jsonify({'feedback': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# -----------------------------
# HELPER FUNCTIONS
# -----------------------------
def _get_performance_level(avg_score: float) -> str:
    """Determine performance level based on average score"""
    if avg_score >= 85:
        return 'Pro'
    elif avg_score >= 70:
        return 'Advanced'
    elif avg_score >= 50:
        return 'Intermediate'
    else:
        return 'Beginner'


def _calculate_avg_metrics(user_results: list) -> dict:
    """Calculate average metrics from a list of results"""
    if not user_results:
        return {
            'overall_score': 0,
            'average_speed': 0,
            'max_speed': 0,
            'balance_score': 0,
            'stride_length': 0,
            'agility_score': 0,
            'coordination_score': 0,
            'best_score': 0
        }

    metrics_keys = ['overall_score', 'average_speed', 'max_speed', 'balance_score',
                    'stride_length', 'agility_score', 'coordination_score']

    totals = {k: 0 for k in metrics_keys}
    count = 0
    best = 0

    for r in user_results:
        if r.get('metrics'):
            count += 1
            for k in metrics_keys:
                totals[k] += r['metrics'].get(k, 0)
            overall = r['metrics'].get('overall_score', 0)
            if overall > best:
                best = overall

    if count == 0:
        return {k: 0 for k in metrics_keys}

    avg = {k: round(v / count, 1) for k, v in totals.items()}
    avg['best_score'] = round(best, 1)
    return avg


def _calculate_trend(user_results: list) -> str:
    """Calculate performance trend (improving, declining, stable)"""
    if len(user_results) < 2:
        return 'stable'

    # Sort by date
    sorted_results = sorted(user_results, key=lambda x: x.get('created_at', datetime.min))

    # Compare last 2 results
    recent_scores = [r['metrics']['overall_score'] for r in sorted_results[-3:] if r.get('metrics')]
    if len(recent_scores) < 2:
        return 'stable'

    diff = recent_scores[-1] - recent_scores[0]
    if diff > 5:
        return 'improving'
    elif diff < -5:
        return 'declining'
    return 'stable'
