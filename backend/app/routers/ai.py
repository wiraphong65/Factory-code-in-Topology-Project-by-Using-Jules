from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, auth, models
from ..database import get_db
from ..ai_service import analyzer
import logging
import json
import time

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/analyze", response_model=schemas.AIAnalysisResponse)
async def analyze_network_topology(
    request: schemas.AIAnalysisRequest,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    วิเคราะห์แผนผังเครือข่ายด้วย AI และบันทึกประวัติ
    """
    start_time = time.time()
    
    try:
        logger.info(f"AI analysis requested by user {current_user.id}")
        
        # เรียกใช้ AI analysis
        analysis_result = await analyzer.get_ai_analysis(
            nodes=request.nodes,
            edges=request.edges,
            user_question=request.question
        )
        
        # คำนวณเวลาที่ใช้
        execution_time = int(time.time() - start_time)
        
        # สร้าง device types summary
        device_types = {}
        for node in request.nodes:
            device_type = node.get("type", "unknown")
            device_types[device_type] = device_types.get(device_type, 0) + 1
        
        # บันทึกประวัติการวิเคราะห์
        analysis_history = models.AIAnalysisHistory(
            user_id=current_user.id,
            project_id=request.project_id,
            model_used=analyzer.ollama_service.model,
            device_count=len(request.nodes),
            device_types=json.dumps(device_types, ensure_ascii=False),
            analysis_result=analysis_result,
            execution_time_seconds=execution_time
        )
        
        db.add(analysis_history)
        
        # อัปเดต user total_analyses
        db.query(models.User).filter(models.User.id == current_user.id).update({
            "total_analyses": models.User.total_analyses + 1
        })
        
        # อัปเดต project analysis_count และ last_analysis_at ถ้ามี project_id
        if request.project_id:
            project = db.query(models.Project).filter(
                models.Project.id == request.project_id,
                models.Project.owner_id == current_user.id
            ).first()
            
            if project:
                project.analysis_count += 1
                project.last_analysis_at = models.bangkok_now()
        
        db.commit()
        db.refresh(analysis_history)
        
        return schemas.AIAnalysisResponse(
            analysis=analysis_result,
            status="success",
            analysis_id=analysis_history.id
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"AI analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการวิเคราะห์: {str(e)}"
        )

@router.get("/health")
async def check_ai_health(
    current_user: schemas.User = Depends(auth.get_current_active_user)
):
    """
    ตรวจสอบสถานะการเชื่อมต่อกับ Ollama
    """
    try:
        is_healthy = await analyzer.ollama_service.check_ollama_health()
        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "ollama_connected": is_healthy,
            "model": analyzer.ollama_service.model,
            "base_url": analyzer.ollama_service.base_url,
            "api_version": "v1"  # ระบุว่าใช้ v1 API
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "error",
            "ollama_connected": False,
            "error": str(e),
            "api_version": "v1"
        }

@router.post("/suggest-improvements", response_model=schemas.AIAnalysisResponse)
async def suggest_network_improvements(
    topology_data: schemas.NetworkTopologyData,
    current_user: schemas.User = Depends(auth.get_current_active_user)
):
    """
    ขอคำแนะนำในการปรับปรุงแผนผังเครือข่าย
    """
    try:
        logger.info(f"Improvement suggestions requested by user {current_user.id}")
        
        # สร้าง prompt เฉพาะสำหรับการปรับปรุง
        improvement_prompt = "ให้คำแนะนำในการปรับปรุงแผนผังเครือข่ายนี้ โดยพิจารณาจากประสิทธิภาพ ความปลอดภัย และความน่าเชื่อถือ"
        
        analysis_result = await analyzer.get_ai_analysis(
            nodes=topology_data.nodes,
            edges=topology_data.edges,
            user_question=improvement_prompt
        )
        
        return schemas.AIAnalysisResponse(
            analysis=analysis_result,
            status="success"
        )
        
    except Exception as e:
        logger.error(f"Improvement suggestions failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการขอคำแนะนำ: {str(e)}"
        )

@router.post("/security-analysis", response_model=schemas.AIAnalysisResponse)
async def analyze_network_security(
    topology_data: schemas.NetworkTopologyData,
    current_user: schemas.User = Depends(auth.get_current_active_user)
):
    """
    วิเคราะห์ความปลอดภัยของแผนผังเครือข่าย
    """
    try:
        logger.info(f"Security analysis requested by user {current_user.id}")
        
        # สร้าง prompt เฉพาะสำหรับการวิเคราะห์ความปลอดภัย
        security_prompt = "วิเคราะห์ความปลอดภัยของแผนผังเครือข่ายนี้ และระบุจุดอ่อนที่อาจเกิดขึ้น พร้อมคำแนะนำในการแก้ไข"
        
        analysis_result = await analyzer.get_ai_analysis(
            nodes=topology_data.nodes,
            edges=topology_data.edges,
            user_question=security_prompt
        )
        
        return schemas.AIAnalysisResponse(
            analysis=analysis_result,
            status="success"
        )
        
    except Exception as e:
        logger.error(f"Security analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการวิเคราะห์ความปลอดภัย: {str(e)}"
        )

@router.get("/models")
async def get_available_models(
    current_user: schemas.User = Depends(auth.get_current_active_user)
):
    """
    ดึงรายการ models ที่มีใน Ollama
    """
    try:
        models = await analyzer.ollama_service.get_available_models()
        return {
            "models": models,
            "current_model": analyzer.ollama_service.model,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Failed to get models: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการดึงรายการ models: {str(e)}"
        )

@router.post("/set-model")
async def set_model(
    model_data: dict,
    current_user: schemas.User = Depends(auth.get_current_active_user)
):
    """
    เปลี่ยน model ที่ใช้
    """
    try:
        logger.info(f"Set model request: {model_data}")
        
        model_name = model_data.get("model")
        if not model_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="กรุณาระบุชื่อ model"
            )
        
        logger.info(f"Attempting to set model to: {model_name}")
        
        # ตรวจสอบว่า model มีอยู่จริงใน Ollama
        available_models = await analyzer.ollama_service.get_available_models()
        logger.info(f"Available models: {available_models}")
        
        if not await analyzer.ollama_service.validate_model(model_name):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Model '{model_name}' ไม่พบใน Ollama. Models ที่มีอยู่: {', '.join(available_models)}"
            )
        
        analyzer.ollama_service.set_model(model_name)
        logger.info(f"Model changed to {model_name} by user {current_user.id}")
        
        return {
            "message": f"เปลี่ยน model เป็น {model_name} เรียบร้อยแล้ว",
            "current_model": model_name,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to set model: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการเปลี่ยน model: {str(e)}"
        ) 