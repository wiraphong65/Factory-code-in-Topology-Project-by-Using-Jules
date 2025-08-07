# 📊 AI Data Flow Summary

## ✅ **ข้อมูลที่ส่งไปให้ AI**

### 🎯 **เมื่อกดปุ่ม "วิเคราะห์" ระบบจะส่งข้อมูลต่อไปนี้:**

#### 1. **Nodes (อุปกรณ์)**
```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "router",
      "data": {
        "label": "Router 1",
        "type": "router",
        "maxThroughput": "1 Gbps",
        "throughputUnit": "Gbps"
      },
      "position": {"x": 100, "y": 100}
    },
    {
      "id": "node_2",
      "type": "switch",
      "data": {
        "label": "Switch 1", 
        "type": "switch",
        "bandwidth": "100 Mbps",
        "bandwidthUnit": "Mbps"
      },
      "position": {"x": 300, "y": 100}
    }
  ]
}
```

#### 2. **Edges (การเชื่อมต่อ)**
```json
{
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2", 
      "type": "default",
      "data": {
        "label": "Connection 1",
        "bandwidth": "1 Gbps"
      }
    }
  ]
}
```

#### 3. **Analysis (การวิเคราะห์เบื้องต้น)**
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
    "recommendations": [
      "ตรวจสอบให้แน่ใจว่าอุปกรณ์ทั้งหมดมีการตั้งค่าที่เหมาะสม",
      "ตรวจสอบ bandwidth และ latency ของการเชื่อมต่อ"
    ]
  }
}
```

#### 4. **User Question (คำถามเฉพาะ)**
```json
{
  "question": "วิเคราะห์แผนผังเครือข่ายนี้และให้คำแนะนำในการปรับปรุงประสิทธิภาพ"
}
```

## 🔄 **Flow การส่งข้อมูล**

### 1. **Frontend → Backend**
```typescript
// ใน AIPanel.tsx
const response = await aiAPI.analyze({
  nodes: nodes,        // ข้อมูล nodes จาก React Flow
  edges: edges,        // ข้อมูล edges จาก React Flow
  question: customQuestion || undefined
});
```

### 2. **Backend → AI Service**
```python
# ใน ai_service.py
context = {
    "analysis": analysis,  # การวิเคราะห์เบื้องต้น
    "nodes": nodes,        # ข้อมูล nodes
    "edges": edges         # ข้อมูล edges
}

full_prompt = f"{system_prompt}\n\nคำถาม: {prompt}\n\nข้อมูลแผนผังเครือข่าย: {json.dumps(context, ensure_ascii=False, indent=2)}"
```

### 3. **AI Service → Ollama**
```python
payload = {
    "model": "llama3.2",
    "messages": [
        {
            "role": "user",
            "content": full_prompt  # รวม system prompt + question + network data
        }
    ],
    "stream": False
}
```

## 📋 **ข้อมูลที่ AI ได้รับ**

### ✅ **ครบถ้วน:**
- **อุปกรณ์ทั้งหมด** (Router, Switch, PC, Firewall, Server)
- **การเชื่อมต่อทั้งหมด** (source, target, bandwidth)
- **คุณสมบัติอุปกรณ์** (throughput, bandwidth, device role)
- **ตำแหน่งอุปกรณ์** (x, y coordinates)
- **การวิเคราะห์เบื้องต้น** (จำนวน, ประเภท, ปัญหาที่อาจเกิดขึ้น)
- **คำถามเฉพาะ** (ถ้ามี)

### ✅ **Format:**
- **JSON** ที่อ่านง่าย
- **ภาษาไทย** ในคำถามและ system prompt
- **Structured data** สำหรับการวิเคราะห์

## 🎯 **ตัวอย่างการใช้งาน**

### 1. **การวิเคราะห์ทั่วไป**
```json
{
  "nodes": [...],
  "edges": [...],
  "question": "วิเคราะห์แผนผังเครือข่ายนี้และให้คำแนะนำในการปรับปรุง"
}
```

### 2. **คำแนะนำการปรับปรุง**
```json
{
  "nodes": [...],
  "edges": [...],
  "question": "ให้คำแนะนำในการปรับปรุงแผนผังเครือข่ายนี้ โดยพิจารณาจากประสิทธิภาพ ความปลอดภัย และความน่าเชื่อถือ"
}
```

### 3. **การวิเคราะห์ความปลอดภัย**
```json
{
  "nodes": [...],
  "edges": [...],
  "question": "วิเคราะห์ความปลอดภัยของแผนผังเครือข่ายนี้ และระบุจุดอ่อนที่อาจเกิดขึ้น พร้อมคำแนะนำในการแก้ไข"
}
```

## 🧪 **ผลการทดสอบ**

### ✅ **Test Results:**
```
Status Code: 200
✅ AI Response: การวิเคราะห์แผนผังเครือข่ายที่ให้มาแสดงถึงเครือข่ายคอมพิวเตอร์ที่มีจุดเชื่อมต่อระหว่างอุปกรณ์ต่างๆ ได้แก่ รูทเลอร์ (Router), สวิช (Switch) และคอมพิวเตอร์ (PC)...

1. **การตรวจสอบประสิทธิภาพ**: การออกแบบและปรับปรุงประสิทธิภาพของเครือข่าย...
2. ระดับความปลอดภัย: การเพิ่มการล็อกอุปกรณ์เชื่อมต่อ...
3. การจัดการการบริการ: สวิชสามารถปรับรูปแบบการให้บริการ...
4. การตรวจสอบต้นทุน: การเลือกใช้ก๊าสเพดาน...
```

## 🎉 **สรุป**

**ใช่ครับ!** ระบบจะส่งข้อมูล JSON ของ nodes และ edges ไปพร้อมกับ prompt ให้ AI แล้ว

✅ **ข้อมูลที่ส่ง:**
- Nodes ทั้งหมด (อุปกรณ์)
- Edges ทั้งหมด (การเชื่อมต่อ)  
- คุณสมบัติอุปกรณ์ (bandwidth, throughput, role)
- การวิเคราะห์เบื้องต้น
- คำถามเฉพาะ (ถ้ามี)

✅ **AI ได้รับข้อมูลครบถ้วน** สำหรับการวิเคราะห์และให้คำแนะนำที่แม่นยำ

**พร้อมใช้งานได้เลย!** 🚀 