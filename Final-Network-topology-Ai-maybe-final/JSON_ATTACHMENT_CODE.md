# 📋 โค้ดส่วนที่แนบ JSON ของ Nodes และ Edges

## 🔄 **Flow การส่งข้อมูล**

### 1. **Frontend → Backend (API Call)**

**ไฟล์:** `src/services/api.ts`
```typescript
// AI API
export const aiAPI = {
  analyze: (data: { nodes: any[]; edges: any[]; question?: string }) =>
    api.post('/ai/analyze', data),  // ← ส่ง nodes, edges ไปที่ /ai/analyze
};
```

**ไฟล์:** `src/components/AIPanel.tsx`
```typescript
// เมื่อกดปุ่มวิเคราะห์
const handleAnalyze = async () => {
  const response = await aiAPI.analyze({
    nodes,        // ← ข้อมูล nodes จาก React Flow
    edges,        // ← ข้อมูล edges จาก React Flow
    question: customQuestion || undefined
  });
};
```

### 2. **Backend API Endpoint**

**ไฟล์:** `backend/app/routers/ai.py`
```python
@router.post("/analyze", response_model=schemas.AIAnalysisRequest)
async def analyze_network_topology(
    request: schemas.AIAnalysisRequest,  # ← รับ nodes, edges จาก frontend
    current_user: schemas.User = Depends(auth.get_current_active_user)
):
    # เรียกใช้ AI analysis
    analysis_result = await analyzer.get_ai_analysis(
        nodes=request.nodes,      # ← ส่ง nodes ไปให้ AI service
        edges=request.edges,      # ← ส่ง edges ไปให้ AI service
        user_question=request.question
    )
```

### 3. **Schema Definition**

**ไฟล์:** `backend/app/schemas.py`
```python
class AIAnalysisRequest(BaseModel):
    nodes: List[Dict[str, Any]]    # ← รับ nodes เป็น List[Dict]
    edges: List[Dict[str, Any]]    # ← รับ edges เป็น List[Dict]
    question: Optional[str] = ""    # ← รับคำถาม (ไม่บังคับ)
```

### 4. **AI Service - สร้าง Context**

**ไฟล์:** `backend/app/ai_service.py`
```python
async def get_ai_analysis(self, nodes: List[Dict], edges: List[Dict], user_question: str = "") -> str:
    # วิเคราะห์แผนผังเครือข่าย
    analysis = self.analyze_network_topology(nodes, edges)
    
    # สร้าง context สำหรับ AI ← นี่คือส่วนที่สำคัญ!
    context = {
        "analysis": analysis,  # การวิเคราะห์เบื้องต้น
        "nodes": nodes,        # ← ข้อมูล nodes ทั้งหมด
        "edges": edges         # ← ข้อมูล edges ทั้งหมด
    }
    
    # สร้าง prompt
    if user_question:
        prompt = f"วิเคราะห์แผนผังเครือข่ายนี้และตอบคำถาม: {user_question}"
    else:
        prompt = "วิเคราะห์แผนผังเครือข่ายนี้และให้คำแนะนำในการปรับปรุง"
    
    # เรียกใช้ Ollama
    response = await self.ollama_service.generate_response(prompt, context)
    return response
```

### 5. **AI Service - แนบ JSON ใน Prompt**

**ไฟล์:** `backend/app/ai_service.py`
```python
async def generate_response(self, prompt: str, context: Optional[Dict] = None) -> str:
    # สร้าง system prompt
    system_prompt = """คุณเป็นผู้เชี่ยวชาญด้านเครือข่ายคอมพิวเตอร์..."""

    # สร้าง full prompt
    full_prompt = f"{system_prompt}\n\nคำถาม: {prompt}"
    
    # ← นี่คือส่วนที่แนบ JSON!
    if context:
        full_prompt += f"\n\nข้อมูลแผนผังเครือข่าย: {json.dumps(context, ensure_ascii=False, indent=2)}"

    # ส่งไปให้ Ollama
    payload = {
        "model": self.model,
        "messages": [
            {
                "role": "user",
                "content": full_prompt  # ← รวม JSON ไว้ใน content
            }
        ],
        "stream": False
    }
```

## 📊 **ตัวอย่างข้อมูลที่ส่ง**

### **Context ที่สร้าง:**
```json
{
  "analysis": {
    "device_count": 3,
    "connection_count": 2,
    "device_types": {
      "router": 1,
      "switch": 1,
      "pc": 1
    },
    "potential_issues": [],
    "recommendations": [...]
  },
  "nodes": [
    {
      "id": "node_1",
      "type": "router",
      "data": {
        "label": "Router 1",
        "maxThroughput": "1 Gbps"
      },
      "position": {"x": 100, "y": 100}
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "data": {
        "label": "Connection 1",
        "bandwidth": "1 Gbps"
      }
    }
  ]
}
```

### **Prompt ที่ส่งไปให้ AI:**
```
คุณเป็นผู้เชี่ยวชาญด้านเครือข่ายคอมพิวเตอร์...

คำถาม: วิเคราะห์แผนผังเครือข่ายนี้และให้คำแนะนำในการปรับปรุง

ข้อมูลแผนผังเครือข่าย: {
  "analysis": {...},
  "nodes": [...],
  "edges": [...]
}
```

## 🎯 **สรุปโค้ดสำคัญ**

### **1. Frontend ส่งข้อมูล:**
```typescript
// AIPanel.tsx
await aiAPI.analyze({
  nodes,    // ← ข้อมูล nodes จาก React Flow
  edges,    // ← ข้อมูล edges จาก React Flow
  question: customQuestion
});
```

### **2. Backend รับข้อมูล:**
```python
# ai.py
analysis_result = await analyzer.get_ai_analysis(
    nodes=request.nodes,      # ← รับ nodes
    edges=request.edges,      # ← รับ edges
    user_question=request.question
)
```

### **3. สร้าง Context:**
```python
# ai_service.py
context = {
    "analysis": analysis,
    "nodes": nodes,        # ← แนบ nodes
    "edges": edges         # ← แนบ edges
}
```

### **4. แนบใน Prompt:**
```python
# ai_service.py
full_prompt += f"\n\nข้อมูลแผนผังเครือข่าย: {json.dumps(context, ensure_ascii=False, indent=2)}"
```

## ✅ **ผลลัพธ์**

**AI ได้รับข้อมูลครบถ้วน:**
- ✅ Nodes ทั้งหมด (อุปกรณ์)
- ✅ Edges ทั้งหมด (การเชื่อมต่อ)
- ✅ คุณสมบัติอุปกรณ์ (bandwidth, throughput, role)
- ✅ ตำแหน่งอุปกรณ์ (x, y coordinates)
- ✅ การวิเคราะห์เบื้องต้น
- ✅ คำถามเฉพาะ (ถ้ามี)

**พร้อมให้คำแนะนำที่แม่นยำ!** 🎯 