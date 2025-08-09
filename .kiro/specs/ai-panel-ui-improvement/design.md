# Design Document

## Overview

การปรับปรุง UI/UX ของ AI Panel เพื่อให้มีการจัดวางองค์ประกอบที่ดีขึ้น โดยเน้นการจัดเรียงปุ่มและการเลือก LLM ให้อยู่ในตำแหน่งที่เหมาะสมและใช้งานง่าย การออกแบบจะคงความสวยงามและฟังก์ชันการทำงานเดิมไว้ แต่ปรับปรุงการจัดวางให้เป็นระเบียบมากขึ้น

## Architecture

### Current Structure Analysis
- AI Panel ประกอบด้วย main container และ AnalysisTab component
- ปัจจุบัน LLM selection อยู่ในคอลัมน์ขวาของ 2-column layout
- ปุ่ม Analyze อยู่ในคอลัมน์ซ้าย
- ไม่มีปุ่ม Clear ที่ชัดเจนในหน้า Analysis

### New Layout Structure
```
┌─────────────────────────────────────────┐
│              Header & Tabs              │
├─────────────────────────────────────────┤
│           Project Status Banner         │
├─────────────────────────────────────────┤
│            LLM Selection                │
│         (Top, Full Width)               │
├─────────────────────────────────────────┤
│                                         │
│           Main Content Area             │
│                                         │
├─────────────────────────────────────────┤
│  [Analyze Button]    [Clear Button]    │
│      (Left)             (Right)        │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### Modified Components

#### 1. AnalysisTab Component
- **LLM Selection Section**: จะถูกย้ายไปด้านบนของ content area
- **Action Buttons Section**: จะมีการจัดเรียงใหม่เป็น 2 คอลัมน์
- **Main Content**: จะถูกปรับให้เป็น single column layout

#### 2. New Button Layout Structure
```typescript
interface ButtonLayoutProps {
  onAnalyze: () => void;
  onClear: () => void;
  loading: boolean;
  disabled: boolean;
}
```

### Layout Sections

#### 1. LLM Selection Section (Top)
- ตำแหน่ง: ด้านบนของ content area
- ความกว้าง: Full width
- สไตล์: Card-based design with dropdown
- Features:
  - Model selection dropdown
  - Current model indicator
  - Loading states
  - Model availability status

#### 2. Main Content Section (Middle)
- ตำแหน่ง: กลางของ content area
- Layout: Single column แทน 2 columns
- เนื้อหา:
  - Network status indicators
  - Project information
  - Analysis results (when available)
  - Loading states

#### 3. Action Buttons Section (Bottom)
- ตำแหน่ง: ด้านล่างของ content area
- Layout: 2-column grid
- ปุ่มซ้าย: Analyze button
- ปุ่มขวา: Clear button (ใหม่)

## Data Models

### Button State Interface
```typescript
interface ButtonStates {
  analyze: {
    loading: boolean;
    disabled: boolean;
    text: string;
  };
  clear: {
    visible: boolean;
    disabled: boolean;
    confirmRequired: boolean;
  };
}
```

### Layout Configuration
```typescript
interface LayoutConfig {
  llmSelection: {
    position: 'top';
    width: 'full';
    spacing: 'mb-6';
  };
  actionButtons: {
    layout: 'grid';
    columns: 2;
    gap: 'gap-4';
    alignment: 'justify-between';
  };
}
```

## Error Handling

### Layout Responsiveness
- จัดการกรณีที่หน้าจอเล็ก: buttons จะ stack vertically
- จัดการ overflow ของ LLM dropdown
- จัดการ text truncation ในปุ่มต่างๆ

### State Management
- จัดการ loading states ของแต่ละปุ่ม
- จัดการ disabled states based on conditions
- จัดการ error states ของ LLM selection

### User Interaction
- Prevent double-clicks on action buttons
- Handle keyboard navigation
- Provide visual feedback for all interactions

## Testing Strategy

### Visual Testing
1. **Layout Verification**
   - ตรวจสอบตำแหน่งของ LLM selection ด้านบน
   - ตรวจสอบการจัดเรียงปุ่ม Analyze (ซ้าย) และ Clear (ขวา)
   - ตรวจสอบ spacing และ alignment

2. **Responsive Testing**
   - ทดสอบในหน้าจอขนาดต่างๆ
   - ตรวจสอบการ stack ของปุ่มในหน้าจอเล็ก
   - ทดสอบ dropdown behavior

### Functional Testing
1. **Button Functionality**
   - ทดสอบ Analyze button ทำงานตามเดิม
   - ทดสอบ Clear button (ฟังก์ชันใหม่)
   - ทดสอบ disabled states

2. **LLM Selection**
   - ทดสอบ dropdown functionality
   - ทดสอบ model selection
   - ทดสอบ loading states

### Integration Testing
1. **State Consistency**
   - ตรวจสอบว่า state ของ components ยังคงสอดคล้องกัน
   - ทดสอบการ sync ระหว่าง UI และ backend
   - ทดสอบ error handling

2. **User Flow**
   - ทดสอบ complete user journey
   - ตรวจสอบ accessibility
   - ทดสอบ keyboard navigation

## Implementation Notes

### CSS/Styling Approach
- ใช้ Tailwind CSS classes ที่มีอยู่
- เพิ่ม responsive utilities สำหรับ mobile
- ใช้ Flexbox และ Grid สำหรับ layout

### Animation Considerations
- คงไว้ซึ่ง existing animations
- เพิ่ม smooth transitions สำหรับ layout changes
- ใช้ Framer Motion สำหรับ complex animations

### Accessibility
- รักษา keyboard navigation
- เพิ่ม proper ARIA labels
- ตรวจสอบ color contrast
- รองรับ screen readers

### Performance
- ไม่เปลี่ยน component structure มากเกินไป
- ใช้ existing hooks และ state management
- หลีกเลี่ยง unnecessary re-renders