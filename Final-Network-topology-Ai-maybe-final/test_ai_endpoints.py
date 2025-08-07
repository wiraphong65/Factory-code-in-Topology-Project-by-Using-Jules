#!/usr/bin/env python3
"""
Test script for AI endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_ai_health():
    """Test AI health endpoint"""
    print("🔍 Testing AI Health Endpoint...")
    
    try:
        # Note: This endpoint requires authentication, so we'll get 401
        response = requests.get(f"{BASE_URL}/ai/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("✅ AI health endpoint exists (requires authentication)")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing AI health: {e}")

def test_ai_analyze():
    """Test AI analyze endpoint"""
    print("\n🔍 Testing AI Analyze Endpoint...")
    
    test_data = {
        "nodes": [
            {
                "id": "node_1",
                "type": "router",
                "data": {"label": "Router 1"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "node_2", 
                "type": "switch",
                "data": {"label": "Switch 1"},
                "position": {"x": 300, "y": 100}
            }
        ],
        "edges": [
            {
                "id": "edge_1",
                "source": "node_1",
                "target": "node_2",
                "type": "default"
            }
        ],
        "question": "วิเคราะห์แผนผังเครือข่ายนี้"
    }
    
    try:
        # Note: This endpoint requires authentication, so we'll get 401
        response = requests.post(
            f"{BASE_URL}/ai/analyze",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("✅ AI analyze endpoint exists (requires authentication)")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing AI analyze: {e}")

def test_api_documentation():
    """Test if API documentation is accessible"""
    print("\n🔍 Testing API Documentation...")
    
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ API documentation is accessible")
            print("📚 You can view it at: http://localhost:8000/docs")
        else:
            print(f"❌ API documentation not accessible: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing API documentation: {e}")

def main():
    """Main test function"""
    print("🚀 Testing Network Topology AI Backend")
    print("=" * 50)
    
    # Test basic API
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Backend is running")
            print(f"📡 API Response: {response.json()}")
        else:
            print(f"❌ Backend not responding: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return
    
    # Test AI endpoints
    test_ai_health()
    test_ai_analyze()
    test_api_documentation()
    
    print("\n" + "=" * 50)
    print("🎉 Testing completed!")
    print("\n📋 Next steps:")
    print("1. Install Ollama: https://ollama.ai/")
    print("2. Run: ollama serve")
    print("3. Download model: ollama pull llama2")
    print("4. Test with authentication token")
    print("5. Open frontend and test AI features")

if __name__ == "__main__":
    main() 