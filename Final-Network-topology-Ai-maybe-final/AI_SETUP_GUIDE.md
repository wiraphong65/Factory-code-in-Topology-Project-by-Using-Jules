# 🤖 คู่มือการตั้งค่า AI และ Ollama

## 📋 ภาพรวม

ระบบ AI ในโปรเจกต์นี้ใช้ **Ollama** เป็น Local Large Language Model (LLM) เพื่อวิเคราะห์แผนผังเครือข่ายและให้คำแนะนำ

## 🚀 การติดตั้ง Ollama

### 1. ติดตั้ง Ollama

#### Windows
1. ไปที่ https://ollama.ai/
2. ดาวน์โหลด Ollama for Windows
3. ติดตั้งและรัน

#### macOS
```bash
brew install ollama
```

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. รัน Ollama
```bash
ollama serve
```

### 3. ดาวน์โหลด Model
```bash
# ดาวน์โหลด Llama2 (แนะนำ)
ollama pull llama2

# หรือใช้ model อื่นๆ
ollama pull mistral
ollama pull codellama
```

### 4. ตรวจสอบการติดตั้ง
```bash
# ตรวจสอบว่า Ollama ทำงาน
curl http://localhost:11434/api/tags

# ทดสอบการใช้งาน
ollama run llama3.2 "Hello, how are you?"
```

## ⚙️ การตั้งค่า Backend

### 1. อัพเดต .env file
```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OLLAMA_TIMEOUT=30
```

### 2. ติดตั้ง Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. รัน Backend
```bash
python run.py
```

## 🔧 การใช้งาน AI Features

### 1. การวิเคราะห์ทั่วไป
- เปิด AI Panel
- เลือก "การวิเคราะห์ทั่วไป"
- ใส่คำถามเฉพาะ (ไม่บังคับ)
- กด "วิเคราะห์"

### 2. คำแนะนำการปรับปรุง
- เลือก "คำแนะนำการปรับปรุง"
- AI จะวิเคราะห์และให้คำแนะนำในการปรับปรุงประสิทธิภาพ

### 3. การวิเคราะห์ความปลอดภัย
- เลือก "การวิเคราะห์ความปลอดภัย"
- AI จะตรวจสอบจุดอ่อนด้านความปลอดภัย

## 🛠️ การแก้ไขปัญหา

### ปัญหา: ไม่สามารถเชื่อมต่อกับ Ollama ได้

**สาเหตุที่เป็นไปได้:**
1. Ollama ไม่ได้รัน
2. Port 11434 ถูกบล็อก
3. Firewall ป้องกัน

**วิธีแก้ไข:**
```bash
# ตรวจสอบว่า Ollama รันอยู่
ps aux | grep ollama

# รีสตาร์ท Ollama
ollama serve

# ตรวจสอบ port
netstat -tulpn | grep 11434
```

### ปัญหา: Model ไม่พบ

**วิธีแก้ไข:**
```bash
# ดูรายการ models ที่มี
ollama list

# ดาวน์โหลด model ใหม่
ollama pull llama2

# ลบ model ที่เสียหาย
ollama rm llama2
ollama pull llama2
```

### ปัญหา: การตอบสนองช้า

**วิธีแก้ไข:**
1. ใช้ model ที่เล็กลง
2. ปรับ timeout ใน .env
3. ตรวจสอบ RAM และ CPU

## 📊 การปรับแต่ง AI

### 1. เปลี่ยน Model
```env
OLLAMA_MODEL=mistral  # หรือ model อื่นๆ
```

### 2. ปรับแต่ง Prompt
แก้ไขใน `backend/app/ai_service.py`:
```python
system_prompt = """คุณเป็นผู้เชี่ยวชาญด้านเครือข่ายคอมพิวเตอร์..."""
```

### 3. ปรับแต่ง Parameters
```python
payload = {
    "model": self.model,
    "prompt": full_prompt,
    "stream": False,
    "options": {
        "temperature": 0.7,  # ความสร้างสรรค์ (0.0-1.0)
        "top_p": 0.9,       # ความหลากหลาย
        "max_tokens": 1000  # ความยาวคำตอบสูงสุด
    }
}
```

## 🔍 การทดสอบ

### 1. ทดสอบ Health Check
```bash
curl http://localhost:8000/ai/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. ทดสอบ Analysis
```bash
curl -X POST http://localhost:8000/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nodes": [{"id": "1", "type": "router"}],
    "edges": [],
    "question": "วิเคราะห์แผนผังเครือข่ายนี้"
  }'
```

## 📈 การ Monitor

### 1. ดู Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Ollama logs
ollama logs
```

### 2. ตรวจสอบ Performance
```bash
# ดูการใช้ RAM
htop

# ดูการใช้ GPU (ถ้ามี)
nvidia-smi
```

## 🎯 Best Practices

### 1. การใช้งาน Model
- ใช้ model ที่เหมาะสมกับงาน
- หมั่นอัพเดต model
- เก็บ backup ของ model ที่ใช้งาน

### 2. การตั้งค่า
- ตั้งค่า timeout ที่เหมาะสม
- ใช้ environment variables
- เก็บ logs ไว้ตรวจสอบ

### 3. การพัฒนา
- ทดสอบ AI features ก่อน deploy
- ใช้ staging environment
- Monitor performance

## 📚 ข้อมูลเพิ่มเติม

- [Ollama Documentation](https://ollama.ai/docs)
- [Llama2 Model](https://huggingface.co/meta-llama/Llama-2-7b-chat-hf)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [aiohttp Documentation](https://docs.aiohttp.org/)

## 🆘 การขอความช่วยเหลือ

หากพบปัญหา:
1. ตรวจสอบ logs
2. ดู error messages
3. ตรวจสอบการตั้งค่า
4. สร้าง issue ใน GitHub repository 