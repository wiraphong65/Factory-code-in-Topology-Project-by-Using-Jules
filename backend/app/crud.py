from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional

# User CRUD
def create_user(db: Session, user: schemas.UserCreate):
    from .auth import get_password_hash
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def update_user_password(db: Session, user_id: int, new_password: str):
    from .auth import get_password_hash
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    db_user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(db_user)
    return db_user

# Project CRUD
def create_project(db: Session, project: schemas.ProjectCreate, owner_id: int):
    db_project = models.Project(
        **project.dict(),
        owner_id=owner_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def get_user_projects(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Project).filter(
        models.Project.owner_id == owner_id
    ).offset(skip).limit(limit).all()

def get_project(db: Session, project_id: int, owner_id: int):
    return db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.owner_id == owner_id
    ).first()

def update_project(db: Session, project_id: int, project_update: schemas.ProjectUpdate, owner_id: int):
    db_project = get_project(db, project_id, owner_id)
    if not db_project:
        return None
    
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int, owner_id: int):
    db_project = get_project(db, project_id, owner_id)
    if not db_project:
        return False
    
    db.delete(db_project)
    db.commit()
    return True 