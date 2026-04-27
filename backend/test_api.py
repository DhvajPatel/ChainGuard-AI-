#!/usr/bin/env python3
"""
Test script for ChainGuard AI API endpoints
Run this to verify all endpoints are working correctly
"""

import requests
import json

# Change this to your deployed URL or use localhost
BASE_URL = "http://localhost:8000"
# For Hugging Face Spaces: BASE_URL = "https://your-space-name.hf.space"

def test_root():
    """Test root endpoint"""
    print("\n🧪 Testing GET /")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_health():
    """Test health check endpoint"""
    print("\n🧪 Testing GET /health")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_api_test():
    """Test API test endpoint"""
    print("\n🧪 Testing GET /api/test")
    try:
        response = requests.get(f"{BASE_URL}/api/test")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_predict():
    """Test prediction endpoint"""
    print("\n🧪 Testing POST /api/predict/")
    
    payload = {
        "distance": 500,
        "traffic": "medium",
        "weather": "clear",
        "route_type": "highway",
        "vehicle_type": "truck",
        "historical_delay": 30
    }
    
    print(f"📤 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/predict/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📄 Response:")
            print(f"   Delay Probability: {data.get('delay_probability')}%")
            print(f"   Expected Delay: {data.get('expected_delay_minutes')} minutes")
            print(f"   Risk Level: {data.get('risk_level')}")
            print(f"   Disruption Factors: {len(data.get('disruption_factors', []))} factors")
            print(f"   Route Options: {len(data.get('route_options', []))} options")
            print(f"   Recommended Route: {data.get('recommended_route')}")
            return True
        else:
            print(f"❌ Error Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_shipments():
    """Test shipments endpoint"""
    print("\n🧪 Testing GET /api/shipments/")
    try:
        response = requests.get(f"{BASE_URL}/api/shipments/")
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📄 Response: {len(data)} shipments")
            if data:
                print(f"   First shipment ID: {data[0].get('id')}")
            return True
        else:
            print(f"❌ Error Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_stats():
    """Test stats endpoint"""
    print("\n🧪 Testing GET /api/shipments/summary/stats")
    try:
        response = requests.get(f"{BASE_URL}/api/shipments/summary/stats")
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📄 Response:")
            print(f"   Total: {data.get('total')}")
            print(f"   On Time: {data.get('on_time')}")
            print(f"   At Risk: {data.get('at_risk')}")
            print(f"   Delayed: {data.get('delayed')}")
            return True
        else:
            print(f"❌ Error Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("🚀 ChainGuard AI API Test Suite")
    print("=" * 60)
    print(f"📍 Testing: {BASE_URL}")
    
    results = {
        "Root": test_root(),
        "Health": test_health(),
        "API Test": test_api_test(),
        "Predict": test_predict(),
        "Shipments": test_shipments(),
        "Stats": test_stats(),
    }
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:20} {status}")
    
    total = len(results)
    passed = sum(results.values())
    print(f"\n🎯 Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return 1


if __name__ == "__main__":
    exit(main())
