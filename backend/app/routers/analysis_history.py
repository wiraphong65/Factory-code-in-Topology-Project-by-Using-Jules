from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from .. import models, schemas_enhanced as schemas, auth
from ..database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.AIAnalysisHistory)
async def create_analysis_history(
    analysis: schemas.AIAnalysisHistoryCreate,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    บันทึกประวัติการวิเคราะห์ AI
    """
    try:
        # สร้าง analysis history record
        db_analysis = models.AIAnalysisHistory(
            user_id=current_user.id,
            project_id=analysis.project_id,
            model_used=analysis.model_used,
            device_count=analysis.device_count,
            device_types=analysis.device_types,
            analysis_result=analysis.analysis_result,
            execution_time_seconds=analysis.execution_time_seconds
        )
        
        db.add(db_analysis)
        
        # อัปเดต user total_analyses
        current_user.total_analyses += 1
        
        # อัปเดต project analysis_count และ last_analysis_at ถ้ามี project_id
        if analysis.project_id:
            project = db.query(models.Project).filter(
                models.Project.id == analysis.project_id,
                models.Project.owner_id == current_user.id
            ).first()
            
            if project:
                project.analysis_count += 1
                project.last_analysis_at = datetime.now()
        
        db.commit()
        db.refresh(db_analysis)
        
        return db_analysis
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการบันทึกประวัติ: {str(e)}"
        )

@router.get("/", response_model=List[schemas.AIAnalysisHistory])
async def get_analysis_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    project_id: Optional[int] = Query(None),
    model_filter: Optional[str] = Query(None),
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ดึงประวัติการวิเคราะห์ AI ของผู้ใช้
    """
    query = db.query(models.AIAnalysisHistory).filter(
        models.AIAnalysisHistory.user_id == current_user.id
    )
    
    # Filter by project
    if project_id:
        query = query.filter(models.AIAnalysisHistory.project_id == project_id)
    
    # Filter by model
    if model_filter:
        query = query.filter(models.AIAnalysisHistory.model_used.contains(model_filter))
    
    # Order by created_at desc and apply pagination
    analyses = query.order_by(models.AIAnalysisHistory.created_at.desc()).offset(skip).limit(limit).all()
    
    return analyses

@router.get("/{analysis_id}", response_model=schemas.AIAnalysisHistory)
async def get_analysis_by_id(
    analysis_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ดึงประวัติการวิเคราะห์ตาม ID
    """
    analysis = db.query(models.AIAnalysisHistory).filter(
        models.AIAnalysisHistory.id == analysis_id,
        models.AIAnalysisHistory.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบประวัติการวิเคราะห์"
        )
    
    return analysis

@router.delete("/{analysis_id}")
async def delete_analysis_history(
    analysis_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ลบประวัติการวิเคราะห์
    """
    analysis = db.query(models.AIAnalysisHistory).filter(
        models.AIAnalysisHistory.id == analysis_id,
        models.AIAnalysisHistory.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบประวัติการวิเคราะห์"
        )
    
    db.delete(analysis)
    db.commit()
    
    return {"message": "ลบประวัติการวิเคราะห์เรียบร้อยแล้ว"}

@router.delete("/")
async def clear_analysis_history(
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ล้างประวัติการวิเคราะห์ทั้งหมดของผู้ใช้
    """
    try:
        deleted_count = db.query(models.AIAnalysisHistory).filter(
            models.AIAnalysisHistory.user_id == current_user.id
        ).delete()
        
        db.commit()
        
        return {
            "message": f"ล้างประวัติการวิเคราะห์เรียบร้อยแล้ว ({deleted_count} รายการ)"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการล้างประวัติ: {str(e)}"
        )

@router.get("/stats/summary")
async def get_analysis_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ดึงสถิติการวิเคราะห์ของผู้ใช้
    """
    from_date = datetime.now() - timedelta(days=days)
    
    # Total analyses in period
    total_analyses = db.query(models.AIAnalysisHistory).filter(
        models.AIAnalysisHistory.user_id == current_user.id,
        models.AIAnalysisHistory.created_at >= from_date
    ).count()
    
    # Most used model
    most_used_model_result = db.query(
        models.AIAnalysisHistory.model_used,
        db.func.count(models.AIAnalysisHistory.model_used).label('count')
    ).filter(
        models.AIAnalysisHistory.user_id == current_user.id,
        models.AIAnalysisHistory.created_at >= from_date
    ).group_by(models.AIAnalysisHistory.model_used).order_by(db.text('count DESC')).first()
    
    most_used_model = most_used_model_result[0] if most_used_model_result else None
    
    # Average execution time
    avg_execution_time = db.query(
        db.func.avg(models.AIAnalysisHistory.execution_time_seconds)
    ).filter(
        models.AIAnalysisHistory.user_id == current_user.id,
        models.AIAnalysisHistory.created_at >= from_date,
        models.AIAnalysisHistory.execution_time_seconds.isnot(None)
    ).scalar()
    
    return {
        "period_days": days,
        "total_analyses": total_analyses,
        "most_used_model": most_used_model,
        "average_execution_time_seconds": int(avg_execution_time) if avg_execution_time else None,
        "total_lifetime_analyses": current_user.total_analyses
    }