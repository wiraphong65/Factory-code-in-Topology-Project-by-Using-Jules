# 🖥️ การปรับปรุง PC Node Panel

## 📋 **การเปลี่ยนแปลง**

### ✅ **ลบ Device Role และ Throughput ออกจาก PC Node**

**ไฟล์:** `src/components/PropertiesPanel.tsx`

#### 1. **ซ่อน UI Elements สำหรับ PC**
```typescript
{/* ซ่อน Device Role และ Throughput สำหรับ PC */}
{selectedNode.type.toLowerCase() !== 'pc' && (
  <>
    {/* Device Role Select */}
    <div>
      <Label htmlFor="deviceRole">Device Role</Label>
      <Select>...</Select>
    </div>

    {/* Throughput Input */}
    <div className="flex gap-2 items-baseline">
      <div className="flex-1">
        <Label htmlFor="maxThroughput">Throughput</Label>
        <Input>...</Input>
      </div>
      <div className="w-28">
        <Label htmlFor="throughputUnit">หน่วย</Label>
        <Select>...</Select>
      </div>
    </div>
  </>
)}
```

#### 2. **ปรับ Validation Logic**
```typescript
const validate = (): boolean => {
  const newErrors: Errors = {};

  // Validate device role (ไม่บังคับสำหรับ PC)
  if (selectedNode && selectedNode.type.toLowerCase() !== 'pc' && !formData.deviceRole) {
    newErrors.deviceRole = "กรุณาเลือก Device Role";
  }

  // Validate throughput (ไม่บังคับสำหรับ PC)
  if (selectedNode && selectedNode.type.toLowerCase() !== 'pc') {
    if (formData.maxThroughput === '') {
      newErrors.maxThroughput = "กรุณากรอก Throughput";
    } else if (isNaN(Number(formData.maxThroughput)) || Number(formData.maxThroughput) < 0) {
      newErrors.maxThroughput = "Throughput ต้องเป็นตัวเลขบวก";
    }
  }

  // Validate user capacity for PC (ยังคงบังคับ)
  if (selectedNode && selectedNode.type.toLowerCase() === 'pc') {
    if (formData.userCapacity === '') {
      newErrors.userCapacity = "กรุณากรอกจำนวนผู้ใช้งาน";
    } else if (!Number.isInteger(Number(formData.userCapacity)) || Number(formData.userCapacity) < 0) {
      newErrors.userCapacity = "จำนวนผู้ใช้งานต้องเป็นจำนวนเต็มบวก";
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

#### 3. **ปรับ Submit Logic**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  if (selectedNode) {
    const updateData: any = {
      label: formData.label,
    };
    
    // เพิ่ม deviceRole และ throughput เฉพาะสำหรับอุปกรณ์ที่ไม่ใช่ PC
    if (selectedNode.type.toLowerCase() !== 'pc') {
      updateData.deviceRole = formData.deviceRole;
      updateData.maxThroughput = formData.maxThroughput;
      updateData.throughputUnit = formData.throughputUnit;
    }
    
    // เพิ่ม userCapacity เฉพาะสำหรับ PC
    if (selectedNode.type.toLowerCase() === 'pc') {
      updateData.userCapacity = formData.userCapacity;
    }
    
    onUpdateNode(selectedNode.id, updateData);
    onClose();
  }
};
```

## 🎯 **ผลลัพธ์**

### ✅ **สำหรับ PC Node:**
- ❌ **ไม่มี Device Role field**
- ❌ **ไม่มี Throughput field**
- ✅ **มีเฉพาะ User Capacity field**

### ✅ **สำหรับอุปกรณ์อื่นๆ (Router, Switch, Firewall, Server):**
- ✅ **ยังคงมี Device Role field**
- ✅ **ยังคงมี Throughput field**
- ✅ **ยังคงมี User Capacity field (ถ้าเป็น PC)**

## 📊 **ตัวอย่าง UI**

### **PC Node Panel:**
```
┌─────────────────────────┐
│ ตั้งค่าคุณสมบัติของอุปกรณ์ │
├─────────────────────────┤
│ 📋 ข้อมูลพื้นฐาน          │
│ ชื่ออุปกรณ์: PC 1        │
├─────────────────────────┤
│ ⚙️ คุณสมบัติอุปกรณ์       │
│ จำนวนผู้ใช้งาน (Users)    │
│ [50]                    │
├─────────────────────────┤
│ [บันทึก] [ยกเลิก]        │
└─────────────────────────┘
```

### **Router Node Panel:**
```
┌─────────────────────────┐
│ ตั้งค่าคุณสมบัติของอุปกรณ์ │
├─────────────────────────┤
│ 📋 ข้อมูลพื้นฐาน          │
│ ชื่ออุปกรณ์: Router 1    │
├─────────────────────────┤
│ ⚙️ คุณสมบัติอุปกรณ์       │
│ Device Role: [Gateway]   │
│ Throughput: [1000] [Gbps]│
│ จำนวนผู้ใช้งาน (Users)    │
│ [50]                    │
├─────────────────────────┤
│ [บันทึก] [ยกเลิก]        │
└─────────────────────────┘
```

## 🎉 **สรุป**

**การเปลี่ยนแปลงสำเร็จ!** 

✅ **PC Node** ตอนนี้มี UI ที่เรียบง่ายขึ้น:
- ไม่ต้องกรอก Device Role
- ไม่ต้องกรอก Throughput
- มีเฉพาะ User Capacity ที่จำเป็น

✅ **อุปกรณ์อื่นๆ** ยังคงมีฟิลด์ครบถ้วนตามเดิม

**UI ใช้งานง่ายขึ้นและเหมาะสมกับประเภทอุปกรณ์!** 🚀 