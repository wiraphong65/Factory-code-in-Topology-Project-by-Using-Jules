from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from datetime import timezone

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
    total_analyses: int = 0
    created_at: datetime
    
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

class Project(ProjectBase):
    id: int
    diagram_data: Optional[str] = None
    analysis_count: int = 0
    last_analysis_at: Optional[datetime] = None
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')
        }

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
    project_name: Optional[str] = None 