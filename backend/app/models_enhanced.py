from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

from datetime import datetime, timedelta, timezone

# Timezone for Bangkok (GMT+7)
bangkok_tz = timezone(timedelta(hours=7))
def bangkok_now():
    return datetime.now(bangkok_tz)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    total_analyses = Column(Integer, default=0)
    subscription_type = Column(String, default='free')
    created_at = Column(DateTime(timezone=True), default=bangkok_now)
    updated_at = Column(DateTime(timezone=True), default=bangkok_now, onupdate=bangkok_now)
    
    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysisHistory", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    diagram_data = Column(Text, nullable=True)  # JSON string ของ nodes และ edges
    last_analysis_at = Column(DateTime(timezone=True), nullable=True)
    analysis_count = Column(Integer, default=0)
    is_favorite = Column(Boolean, default=False)
    tags = Column(Text, nullable=True)  # JSON array
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=bangkok_now)
    updated_at = Column(DateTime(timezone=True), default=bangkok_now, onupdate=bangkok_now)
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    ai_analyses = relationship("AIAnalysisHistory", back_populates="project", cascade="all, delete-orphan")

class AIAnalysisHistory(Base):
    __tablename__ = "ai_analysis_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)  # อาจไม่มี project
    model_used = Column(String(100), nullable=False)
    device_count = Column(Integer, nullable=False)
    device_types = Column(Text, nullable=True)  # JSON string
    analysis_result = Column(Text, nullable=False)
    execution_time_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=bangkok_now)
    
    # Relationships
    user = relationship("User", back_populates="ai_analyses")
    project = relationship("Project", back_populates="ai_analyses")

class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    preferred_ai_model = Column(String(100), nullable=True)
    theme_preference = Column(String(20), default='system')  # 'light', 'dark', 'system'
    language = Column(String(10), default='th')
    auto_save_analysis = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=bangkok_now)
    updated_at = Column(DateTime(timezone=True), default=bangkok_now, onupdate=bangkok_now)
    
    # Relationships
    user = relationship("User", back_populates="preferences")

class SystemAnalytics(Base):
    __tablename__ = "system_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False)  # 'analysis', 'model_change', 'login'
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    metadata = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime(timezone=True), default=bangkok_now)
    
    # Relationships
    user = relationship("User")