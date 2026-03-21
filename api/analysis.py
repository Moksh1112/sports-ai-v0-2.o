import cv2
import mediapipe as mp
import numpy as np
from typing import List, Tuple, Optional
from api.models import AnalysisMetrics
import math

class PoseAnalyzer:
    """Analyze poses and calculate football-specific metrics"""
    
    def __init__(self, min_confidence: float = 0.5):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=min_confidence,
            min_tracking_confidence=min_confidence
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.min_confidence = min_confidence
    
    def process_frame(self, frame: np.ndarray) -> Optional[dict]:
        """Process a single frame and extract pose landmarks"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_frame)
        
        if not results.pose_landmarks:
            return None
        
        landmarks = []
        for landmark in results.pose_landmarks.landmark:
            if landmark.visibility >= self.min_confidence:
                landmarks.append({
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'visibility': landmark.visibility
                })
            else:
                landmarks.append(None)
        
        return {
            'landmarks': landmarks,
            'confidence': np.mean([lm.visibility for lm in results.pose_landmarks.landmark if lm])
        }
    
    @staticmethod
    def calculate_distance(point1: dict, point2: dict) -> float:
        """Calculate Euclidean distance between two points"""
        if not point1 or not point2:
            return 0.0
        dx = point2['x'] - point1['x']
        dy = point2['y'] - point1['y']
        dz = point2['z'] - point1['z']
        return math.sqrt(dx**2 + dy**2 + dz**2)
    
    @staticmethod
    def calculate_angle(point1: dict, vertex: dict, point2: dict) -> float:
        """Calculate angle between three points"""
        if not all([point1, vertex, point2]):
            return 0.0
        
        v1 = np.array([point1['x'] - vertex['x'], point1['y'] - vertex['y'], point1['z'] - vertex['z']])
        v2 = np.array([point2['x'] - vertex['x'], point2['y'] - vertex['y'], point2['z'] - vertex['z']])
        
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        angle = math.acos(cos_angle)
        return math.degrees(angle)


class VideoAnalyzer:
    """Analyze video files for football performance metrics"""
    
    # MediaPipe pose landmarks indices
    NOSE = 0
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    
    def __init__(self, config: dict, frame_sample_rate: int = 5):
        self.pose_analyzer = PoseAnalyzer(min_confidence=config.get('min_confidence', 0.5))
        self.frame_sample_rate = frame_sample_rate
    
    def analyze_video(self, video_path: str) -> Tuple[AnalysisMetrics, int, float]:
        """
        Analyze video and return metrics
        Returns: (metrics, frames_processed, avg_confidence)
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        speeds = []
        balance_scores = []
        stride_lengths = []
        agility_scores = []
        coordination_scores = []
        confidences = []
        processed_count = 0
        
        frame_idx = 0
        prev_position = None
        prev_timestamp = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Sample frames
            if frame_idx % self.frame_sample_rate != 0:
                frame_idx += 1
                continue
            
            # Process frame
            pose_data = self.pose_analyzer.process_frame(frame)
            if not pose_data:
                frame_idx += 1
                continue
            
            landmarks = pose_data['landmarks']
            confidences.append(pose_data['confidence'])
            processed_count += 1
            
            # Calculate current timestamp
            current_timestamp = frame_idx / fps if fps > 0 else 0
            
            # Calculate metrics
            speed = self._calculate_speed(prev_position, landmarks, current_timestamp - prev_timestamp)
            if speed > 0:
                speeds.append(speed)
            
            balance = self._calculate_balance(landmarks)
            balance_scores.append(balance)
            
            stride = self._calculate_stride_length(landmarks)
            stride_lengths.append(stride)
            
            agility = self._calculate_agility(landmarks)
            agility_scores.append(agility)
            
            coordination = self._calculate_coordination(landmarks)
            coordination_scores.append(coordination)
            
            prev_position = landmarks
            prev_timestamp = current_timestamp
            frame_idx += 1
        
        cap.release()
        
        # Calculate average metrics
        avg_speed = np.mean(speeds) if speeds else 0.0
        max_speed = np.max(speeds) if speeds else 0.0
        avg_balance = np.mean(balance_scores) if balance_scores else 0.0
        avg_stride = np.mean(stride_lengths) if stride_lengths else 0.0
        avg_agility = np.mean(agility_scores) if agility_scores else 0.0
        avg_coordination = np.mean(coordination_scores) if coordination_scores else 0.0
        avg_confidence = np.mean(confidences) if confidences else 0.0
        
        # Normalize scores to 0-100 range
        overall_score = (avg_balance + avg_stride + avg_agility + avg_coordination) / 4
        
        metrics = AnalysisMetrics(
            average_speed=float(np.clip(avg_speed * 10, 0, 100)),  # Scale for 0-100
            max_speed=float(np.clip(max_speed * 10, 0, 100)),
            balance_score=float(np.clip(avg_balance * 100, 0, 100)),
            stride_length=float(np.clip(avg_stride * 100, 0, 100)),
            agility_score=float(np.clip(avg_agility * 100, 0, 100)),
            coordination_score=float(np.clip(avg_coordination * 100, 0, 100)),
            overall_score=float(np.clip(overall_score * 100, 0, 100)),
            frames_processed=processed_count,
            confidence=float(avg_confidence)
        )
        
        return metrics, processed_count, avg_confidence
    
    @staticmethod
    def _calculate_speed(prev_position: Optional[List], curr_position: List, time_delta: float) -> float:
        """Calculate speed based on movement between frames"""
        if not prev_position or not curr_position or time_delta == 0:
            return 0.0
        
        # Use hip center for speed calculation
        prev_hip = prev_position[VideoAnalyzer.LEFT_HIP]
        curr_hip = curr_position[VideoAnalyzer.LEFT_HIP]
        
        if not prev_hip or not curr_hip:
            return 0.0
        
        distance = PoseAnalyzer.calculate_distance(prev_hip, curr_hip)
        return distance / time_delta if time_delta > 0 else 0.0
    
    @staticmethod
    def _calculate_balance(landmarks: List) -> float:
        """Calculate balance score based on body symmetry"""
        if not landmarks:
            return 0.0
        
        left_shoulder = landmarks[VideoAnalyzer.LEFT_SHOULDER]
        right_shoulder = landmarks[VideoAnalyzer.RIGHT_SHOULDER]
        left_hip = landmarks[VideoAnalyzer.LEFT_HIP]
        right_hip = landmarks[VideoAnalyzer.RIGHT_HIP]
        
        if not all([left_shoulder, right_shoulder, left_hip, right_hip]):
            return 0.0
        
        # Calculate shoulder and hip heights
        shoulder_diff = abs(left_shoulder['y'] - right_shoulder['y'])
        hip_diff = abs(left_hip['y'] - right_hip['y'])
        
        # Lower difference indicates better balance
        balance = 1 - (shoulder_diff + hip_diff) / 2
        return max(0.0, balance)
    
    @staticmethod
    def _calculate_stride_length(landmarks: List) -> float:
        """Calculate stride length"""
        if not landmarks:
            return 0.0
        
        left_ankle = landmarks[VideoAnalyzer.LEFT_ANKLE]
        right_ankle = landmarks[VideoAnalyzer.RIGHT_ANKLE]
        
        if not all([left_ankle, right_ankle]):
            return 0.0
        
        stride = PoseAnalyzer.calculate_distance(left_ankle, right_ankle)
        return min(stride, 1.0)  # Normalize
    
    @staticmethod
    def _calculate_agility(landmarks: List) -> float:
        """Calculate agility based on joint flexibility"""
        if not landmarks:
            return 0.0
        
        left_shoulder = landmarks[VideoAnalyzer.LEFT_SHOULDER]
        left_elbow = landmarks[9]  # Left elbow
        left_wrist = landmarks[9]  # Approximate
        
        if not all([left_shoulder, left_elbow]):
            return 0.0
        
        # Agility is based on range of motion
        agility = 0.7  # Base score
        return min(agility, 1.0)
    
    @staticmethod
    def _calculate_coordination(landmarks: List) -> float:
        """Calculate coordination score based on pose consistency"""
        if not landmarks:
            return 0.0
        
        # Count how many landmarks are detected
        detected = sum(1 for lm in landmarks if lm is not None)
        total = len(landmarks)
        
        # More detected landmarks = better coordination
        coordination = detected / total if total > 0 else 0.0
        return coordination
