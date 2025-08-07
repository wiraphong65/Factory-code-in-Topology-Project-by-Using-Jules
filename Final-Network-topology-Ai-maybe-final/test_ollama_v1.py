#!/usr/bin/env python3
"""
Test Ollama v1 API format (เหมือนโปรเจคเก่า)
"""

import requests
import json

BASE_URL = "http://localhost:8000"
OLLAMA_URL = "http://localhost:11434"

def test_ollama_health():
    """Test Ollama v1 health check"""
    print("🔍 Testing Ollama v1 Health Check...")
    
    try:
        response = requests.get(f"{OLLAMA_URL}/v1/models")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            print("✅ Ollama v1 API is working")
            return True
        else:
            print(f"❌ Ollama v1 API not working: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Ollama: {e}")
        return False

def test_ollama_chat():
    """Test Ollama v1 chat completions"""
    print("\n🔍 Testing Ollama v1 Chat Completions...")
    
    test_data = {
        "model": "llama3.2",
        "messages": [
            {
                "role": "user",
                "content": "วิเคราะห์ topology network นี้ให้หน่อย: {\"nodes\": [{\"id\": \"1\", \"type\": \"router\"}], \"edges\": []}"
            }
        ],
        "stream": False
    }
    
    try:
        response = requests.post(
            f"{OLLAMA_URL}/v1/chat/completions",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"✅ Ollama response: {content[:100]}...")
            return True
        else:
            print(f"❌ Ollama chat failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Ollama chat: {e}")
        return False

def test_backend_ai_with_ollama():
    """Test backend AI with Ollama v1"""
    print("\n🔍 Testing Backend AI with Ollama v1...")
    
    # First register and login to get token
    register_data = {
        "email": "test_v1@example.com",
        "username": "testv1user",
        "password": "testpassword123"
    }
    
    try:
        # Register
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json=register_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code not in [200, 400]:  # 400 means already exists
            print(f"❌ Registration failed: {response.status_code}")
            return
        
        # Login
        login_data = {
            "username": "test_v1@example.com",
            "password": "testpassword123"
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/token",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code}")
            return
        
        token = response.json()["access_token"]
        
        # Test AI health
        response = requests.get(
            f"{BASE_URL}/ai/health",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"AI Health Status: {response.status_code}")
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ AI Health: {health_data}")
            
            # Test AI analysis
            analysis_data = {
                "nodes": [
                    {
                        "id": "node_1",
                        "type": "router",
                        "data": {"label": "Router 1"},
                        "position": {"x": 100, "y": 100}
                    }
                ],
                "edges": [],
                "question": "วิเคราะห์แผนผังเครือข่ายนี้"
            }
            
            response = requests.post(
                f"{BASE_URL}/ai/analyze",
                json=analysis_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
            )
            
            print(f"AI Analysis Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"✅ AI Analysis: {result['analysis'][:200]}...")
            else:
                print(f"❌ AI Analysis failed: {response.text}")
        
    except Exception as e:
        print(f"❌ Error testing backend AI: {e}")

def main():
    """Main test function"""
    print("🚀 Testing Ollama v1 API Integration")
    print("=" * 60)
    
    # Test Ollama directly
    if test_ollama_health():
        test_ollama_chat()
    
    # Test backend integration
    test_backend_ai_with_ollama()
    
    print("\n" + "=" * 60)
    print("🎉 Ollama v1 testing completed!")
    print("\n📋 Next steps:")
    print("1. Install Ollama if not installed")
    print("2. Download model: ollama pull llama3.2")
    print("3. Test in frontend application")

if __name__ == "__main__":
    main() 