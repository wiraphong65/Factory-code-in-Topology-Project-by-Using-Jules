# ฟีเจอร์เลือก Model LLM ใน AI Panel

## 📋 รายละเอียดฟีเจอร์

ฟีเจอร์นี้ช่วยให้ผู้ใช้สามารถเลือก Model LLM ที่ต้องการใช้จาก Ollama ที่เชื่อมต่อใน local ได้

## 🚀 ฟีเจอร์ที่เพิ่มเข้ามา

### Backend (Python/FastAPI)
1. **API Endpoint ใหม่:**
   - `GET /ai/models` - ดึงรายการ models ที่มีใน Ollama
   - `POST /ai/set-model` - เปลี่ยน model ที่ใช้

2. **OllamaService ใหม่:**
   - `get_available_models()` - ดึงรายการ models จาก Ollama v1 API
   - `set_model()` - เปลี่ยน model ที่ใช้

### Frontend (React/TypeScript)
1. **AI Panel UI ใหม่:**
   - Dropdown สำหรับเลือก model
   - แสดงสถานะ model ปัจจุบัน
   - Loading state เมื่อเปลี่ยน model

2. **API Integration:**
   - `aiAPI.getModels()` - ดึงรายการ models
   - `aiAPI.setModel()` - เปลี่ยน model

## 🛠️ การติดตั้งและใช้งาน

### 1. เตรียม Ollama
```bash
# ติดตั้ง Ollama (ถ้ายังไม่มี)
# ดาวน์โหลดจาก https://ollama.ai

# รัน Ollama
ollama serve

# ติดตั้ง models ที่ต้องการ
ollama pull llama3.2
ollama pull deepseek-r1:14b
ollama pull mistral:latest
```

### 2. รัน Backend
```bash
cd backend
python run.py
```

### 3. รัน Frontend
```bash
npm run dev
```

### 4. ทดสอบระบบ
```bash
python test_model_selection.py
```

## 📱 วิธีใช้งาน

1. **เปิด AI Panel** - คลิกที่ไอคอน AI ในแอปพลิเคชัน

2. **เลือก Model** - ใช้ dropdown "เลือก AI Model" เพื่อเลือก model ที่ต้องการ

3. **ตรวจสอบสถานะ** - ดูสถานะ "Model ปัจจุบัน" ด้านล่าง dropdown

4. **ใช้งาน AI** - เลือกประเภทการวิเคราะห์และกดปุ่ม "วิเคราะห์"

## 🔧 การกำหนดค่า

### Backend Configuration (config.py)
```python
# Ollama Configuration
OLLAMA_BASE_URL: str = "http://localhost:11434"
OLLAMA_MODEL: str = "deepseek-r1:14b"  # model เริ่มต้น
OLLAMA_TIMEOUT: int = 30000000
```

### Frontend API (api.ts)
```typescript
// AI API endpoints
getModels: () => api.get('/ai/models'),
setModel: (data: { model: string }) => api.post('/ai/set-model', data),
```

## 🎯 ประโยชน์

1. **ความยืดหยุน** - เปลี่ยน model ได้ตามความต้องการ
2. **ประสิทธิภาพ** - เลือก model ที่เหมาะสมกับงาน
3. **ง่ายต่อการใช้** - UI ที่เข้าใจง่าย
4. **Real-time** - เปลี่ยน model ได้ทันทีโดยไม่ต้อง restart

## 🐛 การแก้ไขปัญหา

### ปัญหาที่อาจเกิดขึ้น:

1. **Ollama ไม่เชื่อมต่อ**
   - ตรวจสอบว่า Ollama ทำงานที่ port 11434
   - รัน `ollama serve` ใน terminal

2. **ไม่มี Models**
   - ติดตั้ง models ด้วย `ollama pull <model-name>`
   - ตรวจสอบด้วย `ollama list`

3. **Backend Error**
   - ตรวจสอบ logs ใน terminal
   - ตรวจสอบการเชื่อมต่อ database

## 📝 ตัวอย่างการใช้งาน

```typescript
// ดึงรายการ models
const response = await aiAPI.getModels();
console.log(response.data.models); // ["llama3.2", "deepseek-r1:14b", ...]

// เปลี่ยน model
await aiAPI.setModel({ model: "llama3.2" });
```

## 🔮 การพัฒนาต่อ

1. **Model Information** - แสดงข้อมูลเพิ่มเติมของแต่ละ model
2. **Model Performance** - แสดงสถิติการใช้งาน
3. **Custom Models** - รองรับ custom models
4. **Model Presets** - บันทึกการตั้งค่า model สำหรับงานต่างๆ

---

✨ **ฟีเจอร์นี้ช่วยให้การใช้งาน AI ใน Network Topology มีความยืดหยุ่นและประสิทธิภาพมากขึ้น!**