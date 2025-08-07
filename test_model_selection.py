#!/usr/bin/env python3
"""
ทดสอบฟีเจอร์เลือก model ใน AI Panel
"""

import asyncio
import aiohttp
import json

async def test_ollama_connection():
    """ทดสอบการเชื่อมต่อกับ Ollama"""
    try:
        async with aiohttp.ClientSession() as session:
            # ทดสอบ health check
            async with session.get("http://localhost:11434/v1/models") as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Ollama เชื่อมต่อสำเร็จ")
                    print(f"📋 Models ที่มีอยู่:")
                    for model in data.get("data", []):
                        print(f"  - {model.get('id', 'Unknown')}")
                    return True
                else:
                    print(f"❌ Ollama ไม่เชื่อมต่อ (Status: {response.status})")
                    return False
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Ollama: {e}")
        return False

async def test_backend_api():
    """ทดสอบ Backend API"""
    try:
        async with aiohttp.ClientSession() as session:
            # ทดสอบ health endpoint
            async with session.get("http://localhost:8000/") as response:
                if response.status == 200:
                    print("✅ Backend API เชื่อมต่อสำเร็จ")
                    return True
                else:
                    print(f"❌ Backend API ไม่เชื่อมต่อ (Status: {response.status})")
                    return False
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Backend: {e}")
        return False

async def main():
    print("🧪 ทดสอบฟีเจอร์เลือก Model LLM")
    print("=" * 50)
    
    # ทดสอบ Ollama
    print("\n1. ทดสอบการเชื่อมต่อ Ollama...")
    ollama_ok = await test_ollama_connection()
    
    # ทดสอบ Backend
    print("\n2. ทดสอบการเชื่อมต่อ Backend...")
    backend_ok = await test_backend_api()
    
    print("\n" + "=" * 50)
    if ollama_ok and backend_ok:
        print("✅ ระบบพร้อมใช้งาน!")
        print("\n📝 วิธีใช้งาน:")
        print("1. เปิด AI Panel")
        print("2. เลือก Model จาก dropdown")
        print("3. กดปุ่ม 'วิเคราะห์' เพื่อทดสอบ")
    else:
        print("❌ ระบบยังไม่พร้อมใช้งาน")
        if not ollama_ok:
            print("  - กรุณาเปิด Ollama ที่ http://localhost:11434")
        if not backend_ok:
            print("  - กรุณาเปิด Backend ที่ http://localhost:8000")

if __name__ == "__main__":
    asyncio.run(main())