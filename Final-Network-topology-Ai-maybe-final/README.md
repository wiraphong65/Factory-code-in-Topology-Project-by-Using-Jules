# Network Topology AI

ระบบสร้างและจัดการแผนผังเครือข่ายด้วย AI

## 🚀 การติดตั้ง

### Frontend (React + TypeScript)

1. ติดตั้ง dependencies:
```bash
npm install
```

2. รัน development server:
```bash
npm run dev
```

Frontend จะรันที่: http://localhost:5173

### Backend (Python + FastAPI)

1. เข้าไปที่โฟลเดอร์ backend:
```bash
cd backend
```

2. รัน setup script:
```bash
python setup.py
```

3. อัพเดตไฟล์ `.env` ด้วยข้อมูลฐานข้อมูลของคุณ:
```env
DATABASE_URL=postgresql://username:password@localhost/network_topology_db
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OLLAMA_TIMEOUT=30
```

4. สร้างฐานข้อมูล PostgreSQL:
```bash
createdb network_topology_db
```

5. รัน database migrations:
```bash
alembic upgrade head
```

6. รัน backend server:
```bash
python run.py
```

Backend API จะรันที่: http://localhost:8000

### 🤖 Ollama Setup (สำหรับ AI Features)

1. ติดตั้ง Ollama:
   - **Windows**: ดาวน์โหลดจาก https://ollama.ai/
   - **macOS**: `brew install ollama`
   - **Linux**: `curl -fsSL https://ollama.ai/install.sh | sh`

2. รัน Ollama:
```bash
ollama serve
```

3. ดาวน์โหลด model:
```bash
ollama pull llama3.2
```

4. ตรวจสอบว่า Ollama ทำงาน:
```bash
curl http://localhost:11434/api/tags
```

## 📋 ฟีเจอร์

### 🔐 ระบบ Authentication
- สมัครสมาชิกและเข้าสู่ระบบ
- JWT token authentication
- ระบบ logout

### 📊 การจัดการโปรเจกต์
- สร้างโปรเจกต์ใหม่
- บันทึกแผนผังเครือข่าย
- โหลดโปรเจกต์ที่มีอยู่
- ลบโปรเจกต์
- แก้ไขชื่อโปรเจกต์

### 🎨 เครื่องมือสร้างแผนผัง
- เพิ่มอุปกรณ์เครือข่าย (Router, Switch, Firewall, Server, PC)
- เชื่อมต่ออุปกรณ์
- แก้ไขคุณสมบัติอุปกรณ์
- ลบอุปกรณ์และการเชื่อมต่อ

### 📤 การส่งออก
- ส่งออกเป็น JSON
- ส่งออกเป็น SVG
- ส่งออกเป็น PNG

### 🤖 AI Integration
- **การวิเคราะห์ทั่วไป** - วิเคราะห์แผนผังเครือข่ายและให้คำแนะนำ
- **คำแนะนำการปรับปรุง** - ให้คำแนะนำในการปรับปรุงประสิทธิภาพ
- **การวิเคราะห์ความปลอดภัย** - ตรวจสอบจุดอ่อนด้านความปลอดภัย
- **คำถามเฉพาะ** - ตั้งคำถามเฉพาะกับ AI
- **การเชื่อมต่อกับ Ollama Local** - ใช้ AI model ภายในเครื่อง

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Flow
- Radix UI
- Lucide Icons

### Backend
- Python 3.8+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT Authentication
- bcrypt
- aiohttp (สำหรับ Ollama integration)

### AI
- Ollama (Local LLM)
- Llama3.2 Model
- Custom Network Analysis Logic
- v1 Chat Completions API

## 📁 โครงสร้างโปรเจกต์

```
Final-Network-topology-Ai-master/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── AIPanel.tsx    # AI Analysis Panel
│   │   └── ui/            # UI components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── backend/               # Backend source code
│   ├── app/              # FastAPI application
│   │   ├── routers/      # API routes
│   │   │   └── ai.py     # AI endpoints
│   │   ├── ai_service.py # Ollama integration
│   │   ├── models.py     # Database models
│   │   ├── schemas.py    # Pydantic schemas
│   │   └── auth.py       # Authentication
│   ├── alembic/          # Database migrations
│   └── requirements.txt  # Python dependencies
└── README.md
```

## 🔧 การพัฒนา

### Frontend Development
```bash
npm run dev          # รัน development server
npm run build        # Build สำหรับ production
npm run lint         # ตรวจสอบ code quality
```

### Backend Development
```bash
cd backend
python run.py        # รัน development server
alembic revision --autogenerate -m "description"  # สร้าง migration
alembic upgrade head # รัน migrations
```

### AI Development
```bash
# ตรวจสอบ Ollama status
curl http://localhost:11434/api/tags

# ทดสอบ AI endpoint
curl -X POST http://localhost:8000/ai/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- SQL injection protection
- User authorization middleware
- Rate limiting (สามารถเพิ่มได้)

## 📚 API Documentation

เมื่อรัน backend แล้ว สามารถดู API documentation ได้ที่:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### AI Endpoints
- `POST /ai/analyze` - วิเคราะห์แผนผังเครือข่าย
- `GET /ai/health` - ตรวจสอบสถานะ Ollama
- `POST /ai/suggest-improvements` - ขอคำแนะนำการปรับปรุง
- `POST /ai/security-analysis` - วิเคราะห์ความปลอดภัย

## 🤝 การมีส่วนร่วม

1. Fork โปรเจกต์
2. สร้าง feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

## 📄 License

โปรเจกต์นี้อยู่ภายใต้ MIT License - ดูไฟล์ [LICENSE](LICENSE) สำหรับรายละเอียด

## 📞 ติดต่อ

หากมีคำถามหรือข้อเสนอแนะ กรุณาสร้าง Issue ใน GitHub repository
