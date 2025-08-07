from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
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
    total_analyses = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=bangkok_now)
    updated_at = Column(DateTime(timezone=True), default=bangkok_now, onupdate=bangkok_now)
    
    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysisHistory", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    diagram_data = Column(Text, nullable=True)  # JSON string ของ nodes และ edges
    analysis_count = Column(Integer, default=0)
    last_analysis_at = Column(DateTime(timezone=True), nullable=True)
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
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    model_used = Column(String(100), nullable=False)
    device_count = Column(Integer, nullable=False)
    device_types = Column(Text, nullable=True)  # JSON string
    analysis_result = Column(Text, nullable=False)
    execution_time_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=bangkok_now)
    
    # Relationships
    user = relationship("User", back_populates="ai_analyses")
    project = relationship("Project", back_populates="ai_analyses") 