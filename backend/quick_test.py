#!/usr/bin/env python3
"""
Quick test script to verify backend is working correctly
Run this before deploying to Hugging Face Spaces
"""

import json
import os

def test_sample_data():
    """Test that sample data file exists and is valid JSON"""
    print("🧪 Testing sample data file...")
    
    data_path = os.path.join(os.path.dirname(__file__), "data/sample_shipments.json")
    
    if not os.path.exists(data_path):
        print(f"❌ FAIL: Sample data file not found at {data_path}")
        return False
    
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            print("❌ FAIL: Sample data is not a list")
            return False
        
        if len(data) == 0:
            print("❌ FAIL: Sample data is empty")
            return False
        
        # Check first shipment has required fields
        required_fields = ["id", "origin", "destination", "distance", "traffic", 
                          "weather", "route_type", "vehicle_type", "historical_delay"]
        
        first_shipment = data[0]
        missing_fields = [f for f in required_fields if f not in first_shipment]
        
        if missing_fields:
            print(f"❌ FAIL: Missing required fields: {missing_fields}")
            return False
        
        print(f"✅ PASS: Sample data file is valid ({len(data)} shipments)")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ FAIL: Invalid JSON in sample data file: {e}")
        return False
    except Exception as e:
        print(f"❌ FAIL: Error reading sample data: {e}")
        return False


def test_imports():
    """Test that all required modules can be imported"""
    print("\n🧪 Testing Python imports...")
    
    try:
        import fastapi
        print("✅ fastapi imported")
    except ImportError:
        print("❌ FAIL: fastapi not installed. Run: pip install fastapi")
        return False
    
    try:
        import uvicorn
        print("✅ uvicorn imported")
    except ImportError:
        print("❌ FAIL: uvicorn not installed. Run: pip install uvicorn")
        return False
    
    try:
        import pydantic
        print("✅ pydantic imported")
    except ImportError:
        print("❌ FAIL: pydantic not installed. Run: pip install pydantic")
        return False
    
    print("✅ PASS: All required modules can be imported")
    return True


def test_routers():
    """Test that router files exist and can be imported"""
    print("\n🧪 Testing router files...")
    
    router_files = ["predict.py", "shipments.py", "analytics.py"]
    routers_dir = os.path.join(os.path.dirname(__file__), "routers")
    
    for router_file in router_files:
        router_path = os.path.join(routers_dir, router_file)
        if not os.path.exists(router_path):
            print(f"❌ FAIL: Router file not found: {router_file}")
            return False
        print(f"✅ {router_file} exists")
    
    # Try importing routers
    try:
        from routers import predict, shipments, analytics
        print("✅ PASS: All routers can be imported")
        return True
    except Exception as e:
        print(f"❌ FAIL: Error importing routers: {e}")
        return False


def test_main_file():
    """Test that main.py exists and is valid"""
    print("\n🧪 Testing main.py...")
    
    main_path = os.path.join(os.path.dirname(__file__), "main.py")
    
    if not os.path.exists(main_path):
        print("❌ FAIL: main.py not found")
        return False
    
    try:
        # Try to import main module
        import main
        print("✅ main.py can be imported")
        
        # Check if app exists
        if not hasattr(main, 'app'):
            print("❌ FAIL: 'app' not found in main.py")
            return False
        
        print("✅ PASS: main.py is valid")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error importing main.py: {e}")
        return False


def test_requirements():
    """Test that requirements.txt exists"""
    print("\n🧪 Testing requirements.txt...")
    
    req_path = os.path.join(os.path.dirname(__file__), "requirements.txt")
    
    if not os.path.exists(req_path):
        print("❌ FAIL: requirements.txt not found")
        return False
    
    try:
        with open(req_path, "r") as f:
            requirements = f.read()
        
        required_packages = ["fastapi", "uvicorn", "pydantic"]
        missing = [pkg for pkg in required_packages if pkg not in requirements.lower()]
        
        if missing:
            print(f"❌ FAIL: Missing required packages in requirements.txt: {missing}")
            return False
        
        print("✅ PASS: requirements.txt is valid")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error reading requirements.txt: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("🚀 ChainGuard AI Backend - Quick Test")
    print("=" * 60)
    
    results = {
        "Sample Data": test_sample_data(),
        "Python Imports": test_imports(),
        "Router Files": test_routers(),
        "Main File": test_main_file(),
        "Requirements": test_requirements(),
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
        print("\n🎉 All tests passed! Backend is ready to deploy!")
        print("\n📝 Next steps:")
        print("   1. Run: uvicorn main:app --reload")
        print("   2. Visit: http://localhost:8000/docs")
        print("   3. Test endpoints with: python test_api.py")
        print("   4. Deploy to Hugging Face Spaces")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
        print("\n💡 Common fixes:")
        print("   • Install dependencies: pip install -r requirements.txt")
        print("   • Verify all files are in correct locations")
        print("   • Check for syntax errors in Python files")
        return 1


if __name__ == "__main__":
    exit(main())
