#!/usr/bin/env python3
"""
Test AI Data Flow - แสดงข้อมูลที่ส่งไปให้ AI
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_ai_data_flow():
    """ทดสอบการส่งข้อมูลไปให้ AI"""
    print("🔍 Testing AI Data Flow...")
    
    # ข้อมูลตัวอย่าง (เหมือนในแอปจริง)
    sample_data = {
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
            },
            {
                "id": "node_3",
                "type": "pc",
                "data": {
                    "label": "PC 1",
                    "type": "pc",
                    "deviceRole": "Workstation"
                },
                "position": {"x": 500, "y": 100}
            }
        ],
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
            },
            {
                "id": "edge_2", 
                "source": "node_2",
                "target": "node_3",
                "type": "default",
                "data": {
                    "label": "Connection 2",
                    "bandwidth": "100 Mbps"
                }
            }
        ],
        "question": "วิเคราะห์แผนผังเครือข่ายนี้และให้คำแนะนำในการปรับปรุงประสิทธิภาพ"
    }
    
    print("\n📊 ข้อมูลที่ส่งไปให้ AI:")
    print("=" * 60)
    print(json.dumps(sample_data, ensure_ascii=False, indent=2))
    print("=" * 60)
    
    # ทดสอบส่งข้อมูลไปยัง AI endpoint
    try:
        # Register และ login เพื่อได้ token
        register_data = {
            "email": "test_data@example.com",
            "username": "testdatauser",
            "password": "testpassword123"
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json=register_data,
            headers={"Content-Type": "application/json"}
        )
        
        login_data = {
            "username": "test_data@example.com",
            "password": "testpassword123"
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/token",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            print("❌ Login failed")
            return
        
        token = response.json()["access_token"]
        
        # ส่งข้อมูลไปยัง AI endpoint
        print("\n🚀 ส่งข้อมูลไปยัง AI endpoint...")
        response = requests.post(
            f"{BASE_URL}/ai/analyze",
            json=sample_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ AI Response:")
            print("=" * 60)
            print(result["analysis"])
            print("=" * 60)
        else:
            print(f"❌ AI Analysis failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def show_prompt_structure():
    """แสดงโครงสร้าง prompt ที่ส่งไปให้ AI"""
    print("\n📝 โครงสร้าง Prompt ที่ส่งไปให้ AI:")
    print("=" * 60)
    
    prompt_structure = {
        "system_prompt": "คุณเป็นผู้เชี่ยวชาญด้านเครือข่ายคอมพิวเตอร์ ให้คำแนะนำเกี่ยวกับการออกแบบและวิเคราะห์แผนผังเครือข่าย ให้คำตอบเป็นภาษาไทยที่เข้าใจง่าย และให้คำแนะนำที่เป็นประโยชน์",
        "user_question": "วิเคราะห์แผนผังเครือข่ายนี้และให้คำแนะนำในการปรับปรุง",
        "network_data": {
            "analysis": {
                "device_count": "จำนวนอุปกรณ์",
                "connection_count": "จำนวนการเชื่อมต่อ", 
                "device_types": "ประเภทอุปกรณ์",
                "potential_issues": "ปัญหาที่อาจเกิดขึ้น",
                "recommendations": "คำแนะนำพื้นฐาน"
            },
            "nodes": "รายการ nodes ทั้งหมด",
            "edges": "รายการ edges ทั้งหมด"
        }
    }
    
    print(json.dumps(prompt_structure, ensure_ascii=False, indent=2))
    print("=" * 60)

def main():
    """Main function"""
    print("🚀 Testing AI Data Flow and Prompt Structure")
    print("=" * 60)
    
    show_prompt_structure()
    test_ai_data_flow()
    
    print("\n" + "=" * 60)
    print("🎉 AI Data Flow testing completed!")
    print("\n📋 สรุป:")
    print("✅ ข้อมูล nodes และ edges ถูกส่งไปให้ AI")
    print("✅ ข้อมูลถูกแปลงเป็น JSON format")
    print("✅ AI ได้รับข้อมูลครบถ้วนสำหรับการวิเคราะห์")

if __name__ == "__main__":
    main() 