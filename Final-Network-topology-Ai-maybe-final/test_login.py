#!/usr/bin/env python3
"""
Test login functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_register():
    """Test user registration"""
    print("🔍 Testing User Registration...")
    
    register_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json=register_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ User registered successfully")
            return True
        elif response.status_code == 400 and "already registered" in response.text:
            print("✅ User already exists (can proceed to login)")
            return True
        else:
            print(f"❌ Registration failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing registration: {e}")
        return False

def test_login():
    """Test user login"""
    print("\n🔍 Testing User Login...")
    
    login_data = {
        "username": "test@example.com",  # Using email as username
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/token",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login successful")
            data = response.json()
            if "access_token" in data:
                print(f"✅ Token received: {data['access_token'][:20]}...")
                return data["access_token"]
            else:
                print("❌ No access token in response")
                return None
        else:
            print(f"❌ Login failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error testing login: {e}")
        return None

def test_me_endpoint(token):
    """Test /me endpoint with token"""
    if not token:
        print("❌ No token available for /me test")
        return
    
    print("\n🔍 Testing /me Endpoint...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ /me endpoint working correctly")
        else:
            print(f"❌ /me endpoint failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing /me endpoint: {e}")

def test_ai_with_token(token):
    """Test AI endpoint with token"""
    if not token:
        print("❌ No token available for AI test")
        return
    
    print("\n🔍 Testing AI Health Endpoint...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/ai/health",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ AI health endpoint working correctly")
        else:
            print(f"❌ AI health endpoint failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing AI health: {e}")

def main():
    """Main test function"""
    print("🚀 Testing Authentication and AI Endpoints")
    print("=" * 60)
    
    # Test registration
    if test_register():
        # Test login
        token = test_login()
        
        if token:
            # Test /me endpoint
            test_me_endpoint(token)
            
            # Test AI endpoint
            test_ai_with_token(token)
    
    print("\n" + "=" * 60)
    print("🎉 Authentication testing completed!")
    print("\n📋 Next steps:")
    print("1. Test login in frontend")
    print("2. Install Ollama for AI features")
    print("3. Test AI analysis in the app")

if __name__ == "__main__":
    main() 