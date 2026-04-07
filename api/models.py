from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles"""
    USER = "user"
    COACH = "coach"

class DrillType(str, Enum):
    """Football drill types"""
    SPRINT = "sprint"
    AGILITY = "agility"
    JUMP = "jump"
    BALANCE = "balance"
    COORDINATION = "coordination"

class UserSchema(BaseModel):
    """User schema"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    role: UserRole = UserRole.USER
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "player123",
                "email": "player@example.com",
                "password": "securepass123",
                "full_name": "John Doe"
            }
        }

class LoginSchema(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str

class VideoUploadSchema(BaseModel):
    """Video upload metadata schema"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    drill_type: DrillType
    duration_seconds: int = Field(..., gt=0)

class AnalysisMetrics(BaseModel):
    """Analysis metrics result"""
    average_speed: float = Field(..., ge=0, le=100)
    max_speed: float = Field(..., ge=0, le=100)
    balance_score: float = Field(..., ge=0, le=100)
    stride_length: float = Field(..., ge=0, le=100)
    agility_score: float = Field(..., ge=0, le=100)
    coordination_score: float = Field(..., ge=0, le=100)
    overall_score: float = Field(..., ge=0, le=100)
    frames_processed: int = Field(..., gt=0)
    confidence: float = Field(..., ge=0, le=1)

class VideoAnalysisResult(BaseModel):
    """Complete video analysis result"""
    video_id: str
    user_id: str
    title: str
    drill_type: DrillType
    metrics: AnalysisMetrics
    status: str = "completed"
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    processing_time_seconds: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "video_id": "vid_123",
                "user_id": "user_456",
                "title": "Sprint Test 1",
                "drill_type": "sprint",
                "metrics": {
                    "average_speed": 78.5,
                    "max_speed": 92.0,
                    "balance_score": 85.0,
                    "stride_length": 88.0,
                    "agility_score": 80.0,
                    "coordination_score": 87.0,
                    "overall_score": 85.2,
                    "frames_processed": 150,
                    "confidence": 0.92
                },
                "status": "completed",
                "processing_time_seconds": 45.3
            }
        }


class FeedbackSchema(BaseModel):
    """Coach feedback schema"""
    user_id: str
    video_id: Optional[str] = None
    result_id: Optional[str] = None
    feedback_text: str = Field(..., min_length=1, max_length=2000)
    rating: Optional[int] = Field(None, ge=1, le=5)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_456",
                "video_id": "vid_123",
                "feedback_text": "Great improvement on sprint speed!",
                "rating": 4
            }
        }
