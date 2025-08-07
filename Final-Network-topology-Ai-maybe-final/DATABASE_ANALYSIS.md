# Database Analysis - Network Topology AI System

## ปัจจุบันมีอะไรใน Database

### 1. Users Table
- id, email, username, hashed_password
- is_active, created_at, updated_at
- ✅ **ครบถ้วน** - เก็บข้อมูลผู้ใช้พื้นฐาน

### 2. Projects Table  
- id, name, description, diagram_data (JSON)
- owner_id, created_at, updated_at
- ✅ **ครบถ้วน** - เก็บโปรเจคและ network topology

## ข้อมูลที่ควรเพิ่มใน Database

### 3. AI Analysis History Table (ใหม่)
**ปัญหา**: ตอนนี้ประวัติการวิเคราะห์เก็บใน localStorage เท่านั้น
**แก้ไข**: ควรเก็บใน database เพื่อ:
- Sync ข้ามอุปกรณ์
- Backup ข้อมูล
- Analytics และ reporting

```sql
CREATE TABLE ai_analysis_history (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    model_used VARCHAR(100),
    device_count INTEGER,
    device_types TEXT, -- JSON
    analysis_result TEXT,
    execution_time_seconds INTEGER,
    created_at TIMESTAMP
);
```

### 4. User Preferences Table (ใหม่)
**ปัญหา**: การตั้งค่าผู้ใช้ไม่ถูกเก็บ
**แก้ไข**: เก็บการตั้งค่าส่วนตัว

```sql
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    preferred_ai_model VARCHAR(100),
    theme_preference VARCHAR(20),
    language VARCHAR(10),
    auto_save_analysis BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 5. System Analytics Table (ใหม่)
**เหตุผล**: เพื่อ monitoring และ optimization
```sql
CREATE TABLE system_analytics (
    id INTEGER PRIMARY KEY,
    event_type VARCHAR(50), -- 'analysis', 'model_change', 'login'
    user_id INTEGER REFERENCES users(id),
    metadata TEXT, -- JSON
    created_at TIMESTAMP
);
```

## ข้อมูลที่ควรปรับปรุงใน Table เดิม

### Projects Table - เพิ่ม fields
```sql
ALTER TABLE projects ADD COLUMN last_analysis_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN analysis_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN is_favorite BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN tags TEXT; -- JSON array
```

### Users Table - เพิ่ม fields  
```sql
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN total_analyses INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN subscription_type VARCHAR(20) DEFAULT 'free';
```

## Priority Implementation

### 🔥 High Priority
1. **AI Analysis History Table** - สำคัญที่สุดเพื่อ sync ประวัติ
2. **User Preferences Table** - เพิ่ม UX ที่ดีขึ้น

### 🟡 Medium Priority  
3. **Projects Table enhancements** - เพิ่มข้อมูล metadata
4. **Users Table enhancements** - เพิ่มข้อมูล usage stats

### 🟢 Low Priority
5. **System Analytics Table** - สำหรับ monitoring ระยะยาว

## Implementation Steps

1. สร้าง migration scripts
2. อัปเดต models.py
3. อัปเดต schemas.py  
4. สร้าง API endpoints ใหม่
5. อัปเดต frontend เพื่อใช้ database แทน localStorage