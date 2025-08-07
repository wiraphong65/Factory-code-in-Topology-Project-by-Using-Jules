from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import crud, schemas, auth
from ..database import get_db
from ..config import settings

router = APIRouter()

@router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)


# รองรับทั้ง form-data (OAuth2PasswordRequestForm) และ JSON body
from fastapi import Request
from fastapi.responses import JSONResponse

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    request: Request,
    db: Session = Depends(get_db)
):
    # พยายามอ่านเป็น form-data ก่อน
    try:
        form = await request.form()
        username = form.get('username')
        password = form.get('password')
    except Exception:
        form = None
        username = None
        password = None

    # ถ้าไม่ใช่ form-data ให้ลองอ่านเป็น JSON
    if not username or not password:
        try:
            data = await request.json()
            username = data.get('username')
            password = data.get('password')
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password required"
        )

    user = auth.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(auth.get_current_active_user)):
    return current_user

@router.post("/reset-password")
async def reset_password(
    data: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    email = data.email
    current_password = data.current_password
    new_password = data.new_password
    
    # ตรวจสอบว่ามี user นี้หรือไม่
    user = auth.get_user(db, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="ไม่พบผู้ใช้นี้ในระบบ"
        )
    
    # ตรวจสอบรหัสผ่านปัจจุบัน
    if not auth.verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="รหัสผ่านปัจจุบันไม่ถูกต้อง"
        )
    
    # ตรวจสอบว่ารหัสผ่านใหม่ไม่เหมือนรหัสผ่านเก่า
    if auth.verify_password(new_password, user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านปัจจุบัน"
        )
    
    # อัปเดตรหัสผ่านใหม่
    try:
        crud.update_user_password(db, user.id, new_password)
        return {"message": "เปลี่ยนรหัสผ่านสำเร็จ"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน"
        ) 