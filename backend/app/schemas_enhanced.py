from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    is_active: bool
    last_login_at: Optional[datetime] = None
    total_analyses: int = 0
    subscription_type: str = 'free'
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    diagram_data: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    diagram_data: Optional[str] = None
    is_favorite: Optional[bool] = None
    tags: Optional[str] = None  # JSON string

class Project(ProjectBase):
    id: int
    diagram_data: Optional[str] = None
    last_analysis_at: Optional[datetime] = None
    analysis_count: int = 0
    is_favorite: bool = False
    tags: Optional[str] = None
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# AI Analysis History Schemas
class AIAnalysisHistoryBase(BaseModel):
    model_used: str
    device_count: int
    device_types: Optional[str] = None  # JSON string
    analysis_result: str
    execution_time_seconds: Optional[int] = None

class AIAnalysisHistoryCreate(AIAnalysisHistoryBase):
    project_id: Optional[int] = None

class AIAnalysisHistory(AIAnalysisHistoryBase):
    id: int
    user_id: int
    project_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# User Preferences Schemas
class UserPreferencesBase(BaseModel):
    preferred_ai_model: Optional[str] = None
    theme_preference: str = 'system'
    language: str = 'th'
    auto_save_analysis: bool = True

class UserPreferencesCreate(UserPreferencesBase):
    pass

class UserPreferencesUpdate(BaseModel):
    preferred_ai_model: Optional[str] = None
    theme_preference: Optional[str] = None
    language: Optional[str] = None
    auto_save_analysis: Optional[bool] = None

class UserPreferences(UserPreferencesBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# System Analytics Schemas
class SystemAnalyticsCreate(BaseModel):
    event_type: str
    metadata: Optional[str] = None  # JSON string

class SystemAnalytics(BaseModel):
    id: int
    event_type: str
    user_id: Optional[int] = None
    metadata: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str 

# AI API Schemas
class AIAnalysisRequest(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    question: Optional[str] = ""
    project_id: Optional[int] = None  # เพิ่มเพื่อเชื่อมโยงกับ project

class AIAnalysisResponse(BaseModel):
    analysis: str
    status: str
    analysis_id: Optional[int] = None  # ID ของ analysis ที่เก็บใน database
    timestamp: datetime = datetime.now()

class NetworkTopologyData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

# Dashboard/Analytics Schemas
class UserAnalyticsResponse(BaseModel):
    total_analyses: int
    total_projects: int
    most_used_model: Optional[str] = None
    recent_analyses: List[AIAnalysisHistory]
    favorite_projects: List[Project]

class SystemStatsResponse(BaseModel):
    total_users: int
    total_analyses: int
    total_projects: int
    popular_models: List[Dict[str, Any]]