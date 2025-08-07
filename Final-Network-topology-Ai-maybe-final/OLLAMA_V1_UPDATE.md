# 🔄 อัพเดตเป็น Ollama v1 API Format

## 📋 การเปลี่ยนแปลง

### ✅ **อัพเดต AI Service ให้ใช้ Ollama v1 API**

**ไฟล์:** `backend/app/ai_service.py`

#### 1. เปลี่ยน API Endpoint
```python
# ก่อน: /api/generate
# หลัง: /v1/chat/completions
```

#### 2. เปลี่ยน Request Format
```python
# ก่อน: ใช้ "prompt" field
payload = {
    "model": self.model,
    "prompt": full_prompt,
    "stream": False,
    "options": {...}
}

# หลัง: ใช้ "messages" array (เหมือนโปรเจคเก่า)
payload = {
    "model": self.model,
    "messages": [
        {
            "role": "user",
            "content": full_prompt
        }
    ],
    "stream": False,
    "options": {...}
}
```

#### 3. เปลี่ยน Response Parsing
```python
# ก่อน: result.get("response", "ไม่สามารถสร้างคำตอบได้")
# หลัง: result.get("choices", [{}])[0].get("message", {}).get("content", "ไม่สามารถสร้างคำตอบได้")
```

#### 4. เปลี่ยน Health Check
```python
# ก่อน: /api/tags
# หลัง: /v1/models
```

### ✅ **อัพเดต Configuration**

**ไฟล์:** `backend/app/config.py`
```python
# เปลี่ยน model จาก llama2 เป็น llama3.2
OLLAMA_MODEL: str = "llama3.2"
```

### ✅ **อัพเดต Documentation**

- อัพเดต README.md
- อัพเดต AI_SETUP_GUIDE.md
- อัพเดต AI_SETUP_COMPLETE.md
- อัพเดต backend/setup.py

## 🧪 ผลการทดสอบ

### ✅ **Ollama v1 Health Check: SUCCESS**
```
Status Code: 200
✅ Ollama v1 API is working
```

### ✅ **Ollama v1 Chat Completions: SUCCESS**
```
Status Code: 200
✅ Ollama response: การวิเคราะห์ต็อปโอลอจีนเน็ต...
```

### ✅ **Backend AI Integration: SUCCESS**
```
AI Health Status: 200
✅ AI Health: {'status': 'healthy', 'ollama_connected': True, 'model': 'llama3.2', 'api_version': 'v1'}

AI Analysis Status: 200
✅ AI Analysis: ข้อมูลแผนผังเครือข่ายที่ให้มาเป็นแผนผังเครือข่ายขนาดเล็ก...
```

## 🎯 ความเข้ากันได้กับโปรเจคเก่า

### ✅ **Format เดียวกัน**
```javascript
// โปรเจคเก่า (Express.js)
const ollamaRes = await axios.post("http://localhost:11434/v1/chat/completions", {
  model: "llama3.2",
  messages: [
    {
      role: "user",
      content: `วิเคราะห์ topology network นี้ให้หน่อย: ${JSON.stringify(userJson)}`
    }
  ]
});

// โปรเจคใหม่ (FastAPI + Python)
payload = {
    "model": "llama3.2",
    "messages": [
        {
            "role": "user",
            "content": full_prompt
        }
    ],
    "stream": False
}
```

### ✅ **Model เดียวกัน**
- ใช้ `llama3.2` ในทั้งสองโปรเจค
- API endpoint เดียวกัน: `/v1/chat/completions`
- Response format เดียวกัน

## 🚀 การใช้งาน

### 1. ติดตั้ง Ollama
```bash
# Windows: ดาวน์โหลดจาก https://ollama.ai/
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. รัน Ollama
```bash
ollama serve
```

### 3. ดาวน์โหลด Model
```bash
ollama pull llama3.2
```

### 4. ทดสอบ
```bash
# ทดสอบ Ollama โดยตรง
ollama run llama3.2 "Hello, how are you?"

# ทดสอบ Backend AI
python test_ollama_v1.py
```

## 📁 ไฟล์ที่อัพเดต

### Backend:
- `backend/app/ai_service.py` - เปลี่ยนเป็น v1 API format
- `backend/app/config.py` - เปลี่ยน model เป็น llama3.2
- `backend/app/routers/ai.py` - เพิ่ม api_version info

### Documentation:
- `README.md` - อัพเดต model และ API version
- `AI_SETUP_GUIDE.md` - อัพเดต model
- `AI_SETUP_COMPLETE.md` - อัพเดต model
- `backend/setup.py` - อัพเดต .env template

### Testing:
- `test_ollama_v1.py` - ไฟล์ทดสอบใหม่

## 🎉 สรุป

**อัพเดตสำเร็จ!** ระบบ AI ตอนนี้ใช้ Ollama v1 API format ที่เข้ากันได้กับโปรเจคเก่าของคุณ:

✅ **API Format:** `/v1/chat/completions`  
✅ **Model:** `llama3.2`  
✅ **Request Format:** `messages` array  
✅ **Response Format:** `choices[0].message.content`  
✅ **Health Check:** `/v1/models`  

**พร้อมใช้งานได้เลย!** 🚀 