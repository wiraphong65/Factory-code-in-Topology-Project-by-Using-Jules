#!/usr/bin/env python3
"""
ทดสอบ API endpoints สำหรับ model selection
"""

import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:8000"

# ข้อมูลทดสอบ (ใช้ token จริงหรือสร้าง mock user)
TEST_TOKEN = "your-test-token-here"  # แทนที่ด้วย token จริง

async def test_get_models():
    """ทดสอบ GET /ai/models"""
    print("🧪 ทดสอบ GET /ai/models")
    
    try:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"} if TEST_TOKEN != "your-test-token-here" else {}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/ai/models", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ สำเร็จ!")
                    print(f"📋 Models: {data.get('models', [])}")
                    print(f"🎯 Current Model: {data.get('current_model', 'N/A')}")
                    return data.get('models', [])
                else:
                    error_text = await response.text()
                    print(f"❌ ล้มเหลว (Status: {response.status})")
                    print(f"📝 Error: {error_text}")
                    return []
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return []

async def test_set_model(model_name: str):
    """ทดสอบ POST /ai/set-model"""
    print(f"\n🧪 ทดสอบ POST /ai/set-model (Model: {model_name})")
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TEST_TOKEN}" if TEST_TOKEN != "your-test-token-here" else ""
        }
        
        payload = {"model": model_name}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{BASE_URL}/ai/set-model", json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ สำเร็จ!")
                    print(f"📝 Message: {data.get('message', 'N/A')}")
                    print(f"🎯 Current Model: {data.get('current_model', 'N/A')}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ ล้มเหลว (Status: {response.status})")
                    print(f"📝 Error: {error_text}")
                    return False
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return False

async def test_ai_health():
    """ทดสอบ GET /ai/health"""
    print("\n🧪 ทดสอบ GET /ai/health")
    
    try:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"} if TEST_TOKEN != "your-test-token-here" else {}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/ai/health", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ สำเร็จ!")
                    print(f"🔗 Ollama Connected: {data.get('ollama_connected', False)}")
                    print(f"🎯 Model: {data.get('model', 'N/A')}")
                    print(f"🌐 Base URL: {data.get('base_url', 'N/A')}")
                    return data
                else:
                    error_text = await response.text()
                    print(f"❌ ล้มเหลว (Status: {response.status})")
                    print(f"📝 Error: {error_text}")
                    return None
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return None

async def main():
    print("🚀 ทดสอบ Model Selection API")
    print("=" * 60)
    
    # ทดสอบ health check
    health_data = await test_ai_health()
    if not health_data or not health_data.get('ollama_connected'):
        print("\n⚠️  Ollama ไม่เชื่อมต่อ - ข้ามการทดสอบ model selection")
        return
    
    # ทดสอบดึงรายการ models
    models = await test_get_models()
    if not models:
        print("\n⚠️  ไม่พบ models - ข้ามการทดสอบ set model")
        return
    
    # ทดสอบเปลี่ยน model (ใช้ model แรกในรายการ)
    if len(models) > 0:
        test_model = models[0]
        await test_set_model(test_model)
        
        # ทดสอบเปลี่ยนกลับ
        if len(models) > 1:
            test_model2 = models[1]
            await test_set_model(test_model2)
    
    # ทดสอบ model ที่ไม่มีอยู่
    await test_set_model("non-existent-model")
    
    print("\n" + "=" * 60)
    print("✅ การทดสอบเสร็จสิ้น!")
    
    if TEST_TOKEN == "your-test-token-here":
        print("\n💡 หมายเหตุ: หากต้องการทดสอบกับ authentication")
        print("   กรุณาแทนที่ TEST_TOKEN ด้วย token จริง")

if __name__ == "__main__":
    asyncio.run(main())