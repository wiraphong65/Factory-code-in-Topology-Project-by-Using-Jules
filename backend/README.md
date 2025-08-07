# Network Topology Backend

Backend API สำหรับระบบ Network Topology AI

## การติดตั้ง

1. สร้าง virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# หรือ
venv\Scripts\activate  # Windows
```

2. ติดตั้ง dependencies:
```bash
pip install -r requirements.txt
```

3. ตั้งค่าฐานข้อมูล PostgreSQL และอัพเดต `.env` file

4. รัน migration:
```bash
alembic upgrade head
```

5. รัน server:
```bash
python run.py
```

## API Endpoints

### Authentication
- `POST /auth/register` - สมัครสมาชิก
- `POST /auth/token` - เข้าสู่ระบบ
- `GET /auth/me` - ดูข้อมูลผู้ใช้

### Projects
- `GET /projects/` - ดึงรายการโปรเจกต์
- `POST /projects/` - สร้างโปรเจกต์ใหม่
- `GET /projects/{id}` - ดูรายละเอียดโปรเจกต์
- `PUT /projects/{id}` - อัพเดตโปรเจกต์
- `DELETE /projects/{id}` - ลบโปรเจกต์

## Security Features

- JWT Authentication
- Password hashing with bcrypt
- CORS protection
- SQL injection protection
- User authorization middleware 