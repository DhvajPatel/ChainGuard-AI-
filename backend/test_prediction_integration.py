"""
Integration test for prediction API endpoint.
Tests the complete prediction workflow including:
- API request/response structure
- Error handling
- Loading states
- Route optimization
- Disruption detection
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api"


def test_prediction_basic():
    """Test basic prediction with valid inputs."""
    print("\n=== Test 1: Basic Prediction ===")
    
    payload = {
        "distance": 500,
        "traffic": "medium",
        "weather": "clear",
        "route_type": "highway",
        "vehicle_type": "truck",
        "historical_delay": 30
    }
    
    response = requests.post(f"{BASE_URL}/predict/", json=payload)
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    data = response.json()
    
    # Verify response structure
    assert "delay_probability" in data, "Missing delay_probability"
    assert "expected_delay_minutes" in data, "Missing expected_delay_minutes"
    assert "risk_level" in data, "Missing risk_level"
    assert "disruption_factors" in data, "Missing disruption_factors"
    assert "route_options" in data, "Missing route_options"
    assert "recommended_route" in data, "Missing recommended_route"
    
    # Verify data types and bounds
    assert 0 <= data["delay_probability"] <= 100, "delay_probability out of bounds"
    assert data["expected_delay_minutes"] >= 0, "expected_delay_minutes negative"
    assert data["risk_level"] in ["Low", "Medium", "High", "Critical"], "Invalid risk_level"
    assert isinstance(data["disruption_factors"], list), "disruption_factors not a list"
    assert isinstance(data["route_options"], list), "route_options not a list"
    assert len(data["route_options"]) >= 3, "Less than 3 route options"
    
    # Verify route options structure
    for route in data["route_options"]:
        assert "route" in route, "Route missing 'route' field"
        assert "estimated_delay_minutes" in route, "Route missing 'estimated_delay_minutes'"
        assert "delay_probability" in route, "Route missing 'delay_probability'"
        assert "risk_level" in route, "Route missing 'risk_level'"
        assert "recommended" in route, "Route missing 'recommended'"
        assert route["estimated_delay_minutes"] >= 0, "Route delay negative"
        assert 0 <= route["delay_probability"] <= 100, "Route probability out of bounds"
    
    # Verify exactly one recommended route
    recommended_count = sum(1 for r in data["route_options"] if r["recommended"])
    assert recommended_count == 1, f"Expected 1 recommended route, got {recommended_count}"
    
    # Verify recommended route matches
    recommended = next(r for r in data["route_options"] if r["recommended"])
    assert data["recommended_route"] == recommended["route"], "Recommended route mismatch"
    
    print(f"✓ Delay Probability: {data['delay_probability']}%")
    print(f"✓ Expected Delay: {data['expected_delay_minutes']} minutes")
    print(f"✓ Risk Level: {data['risk_level']}")
    print(f"✓ Disruption Factors: {', '.join(data['disruption_factors'])}")
    print(f"✓ Recommended Route: {data['recommended_route']}")
    print("✓ Test passed!")


def test_high_risk_scenario():
    """Test high-risk scenario with heavy traffic and storm."""
    print("\n=== Test 2: High-Risk Scenario ===")
    
    payload = {
        "distance": 1000,
        "traffic": "high",
        "weather": "storm",
        "route_type": "urban",
        "vehicle_type": "truck",
        "historical_delay": 120
    }
    
    response = requests.post(f"{BASE_URL}/predict/", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    
    # Verify high risk detection
    assert data["risk_level"] in ["High", "Critical"], f"Expected High/Critical risk, got {data['risk_level']}"
    
    # Verify disruption factors are detected
    factors = data["disruption_factors"]
    assert any("traffic" in f.lower() for f in factors), "Traffic disruption not detected"
    assert any("weather" in f.lower() or "storm" in f.lower() for f in factors), "Weather disruption not detected"
    assert any("urban" in f.lower() for f in factors), "Urban route disruption not detected"
    assert any("historical" in f.lower() for f in factors), "Historical delay not detected"
    assert any("long-haul" in f.lower() or "distance" in f.lower() for f in factors), "Distance disruption not detected"
    
    print(f"✓ Risk Level: {data['risk_level']}")
    print(f"✓ Disruption Factors ({len(factors)}):")
    for factor in factors:
        print(f"  - {factor}")
    print("✓ Test passed!")


def test_low_risk_scenario():
    """Test low-risk scenario with optimal conditions."""
    print("\n=== Test 3: Low-Risk Scenario ===")
    
    payload = {
        "distance": 200,
        "traffic": "low",
        "weather": "clear",
        "route_type": "highway",
        "vehicle_type": "van",
        "historical_delay": 10
    }
    
    response = requests.post(f"{BASE_URL}/predict/", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    
    # Verify low risk
    assert data["risk_level"] == "Low", f"Expected Low risk, got {data['risk_level']}"
    assert data["delay_probability"] < 35, f"Expected low probability, got {data['delay_probability']}%"
    
    # Verify minimal disruption factors
    factors = data["disruption_factors"]
    if len(factors) == 1:
        assert "no significant" in factors[0].lower(), "Expected 'no significant disruption' message"
    
    print(f"✓ Risk Level: {data['risk_level']}")
    print(f"✓ Delay Probability: {data['delay_probability']}%")
    print(f"✓ Disruption Factors: {', '.join(factors)}")
    print("✓ Test passed!")


def test_route_optimization():
    """Test route optimization logic."""
    print("\n=== Test 4: Route Optimization ===")
    
    payload = {
        "distance": 600,
        "traffic": "high",
        "weather": "rain",
        "route_type": "mixed",
        "vehicle_type": "truck",
        "historical_delay": 45
    }
    
    response = requests.post(f"{BASE_URL}/predict/", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    routes = data["route_options"]
    
    # Verify route names
    route_names = [r["route"] for r in routes]
    assert any("current" in name.lower() or "direct" in name.lower() for name in route_names), "Missing current route"
    assert any("highway" in name.lower() or "bypass" in name.lower() for name in route_names), "Missing highway bypass"
    assert any("alternate" in name.lower() or "city" in name.lower() for name in route_names), "Missing alternate route"
    
    # Verify recommended route has lowest delay
    recommended = next(r for r in routes if r["recommended"])
    min_delay = min(r["estimated_delay_minutes"] for r in routes)
    assert recommended["estimated_delay_minutes"] == min_delay, "Recommended route doesn't have minimum delay"
    
    print(f"✓ Route Options:")
    for route in routes:
        marker = "★" if route["recommended"] else " "
        print(f"  {marker} {route['route']}")
        print(f"    Delay: {route['estimated_delay_minutes']} min, Probability: {route['delay_probability']}%, Risk: {route['risk_level']}")
    print("✓ Test passed!")


def test_prediction_idempotence():
    """Test that identical requests produce identical results."""
    print("\n=== Test 5: Prediction Idempotence ===")
    
    payload = {
        "distance": 400,
        "traffic": "medium",
        "weather": "cloudy",
        "route_type": "highway",
        "vehicle_type": "van",
        "historical_delay": 25
    }
    
    # Make two identical requests
    response1 = requests.post(f"{BASE_URL}/predict/", json=payload)
    response2 = requests.post(f"{BASE_URL}/predict/", json=payload)
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    
    data1 = response1.json()
    data2 = response2.json()
    
    # Verify identical results
    assert data1["delay_probability"] == data2["delay_probability"], "Delay probability mismatch"
    assert data1["expected_delay_minutes"] == data2["expected_delay_minutes"], "Expected delay mismatch"
    assert data1["risk_level"] == data2["risk_level"], "Risk level mismatch"
    assert data1["disruption_factors"] == data2["disruption_factors"], "Disruption factors mismatch"
    assert data1["recommended_route"] == data2["recommended_route"], "Recommended route mismatch"
    
    print(f"✓ Request 1: {data1['delay_probability']}% probability, {data1['expected_delay_minutes']} min delay")
    print(f"✓ Request 2: {data2['delay_probability']}% probability, {data2['expected_delay_minutes']} min delay")
    print("✓ Results are identical!")
    print("✓ Test passed!")


def test_invalid_inputs():
    """Test error handling for invalid inputs."""
    print("\n=== Test 6: Invalid Input Handling ===")
    
    # Test missing required field
    payload = {
        "distance": 500,
        "traffic": "medium",
        # Missing weather, route_type, vehicle_type
    }
    
    response = requests.post(f"{BASE_URL}/predict/", json=payload)
    assert response.status_code == 422, f"Expected 422 for missing fields, got {response.status_code}"
    print("✓ Missing fields rejected with 422")
    
    # Test invalid traffic value
    payload = {
        "distance": 500,
        "traffic": "invalid",
        "weather": "clear",
        "route_type": "highway",
        "vehicle_type": "truck",
        "historical_delay": 30
    }
    
    response = requests.post(f"{BASE_URL}/predict/", json=payload)
    assert response.status_code == 422, f"Expected 422 for invalid traffic, got {response.status_code}"
    print("✓ Invalid traffic value rejected with 422")
    
    # Test invalid weather value
    payload = {
        "distance": 500,
        "traffic": "medium",
        "weather": "invalid",
        "route_type": "highway",
        "vehicle_type": "truck",
        "historical_delay": 30
    }
    
    response = requests.post(f"{BASE_URL}/predict/", json=payload)
    assert response.status_code == 422, f"Expected 422 for invalid weather, got {response.status_code}"
    print("✓ Invalid weather value rejected with 422")
    
    print("✓ Test passed!")


def test_edge_cases():
    """Test edge cases and boundary conditions."""
    print("\n=== Test 7: Edge Cases ===")
    
    # Test with zero historical delay
    payload = {
        "distance": 300,
        "traffic": "low",
        "weather": "clear",
        "route_type": "highway",
        "vehicle_type": "bike",
        "historical_delay": 0
    }
    
    response = requests.post(f"{BASE_URL}/predict/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["expected_delay_minutes"] >= 0, "Negative delay with zero historical delay"
    print(f"✓ Zero historical delay: {data['delay_probability']}% probability")
    
    # Test with very large distance
    payload["distance"] = 2000
    response = requests.post(f"{BASE_URL}/predict/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert any("long-haul" in f.lower() or "distance" in f.lower() for f in data["disruption_factors"]), "Long-haul disruption not detected"
    print(f"✓ Large distance (2000 km): {data['delay_probability']}% probability")
    
    # Test with very high historical delay
    payload["distance"] = 500
    payload["historical_delay"] = 180
    response = requests.post(f"{BASE_URL}/predict/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert any("historical" in f.lower() for f in data["disruption_factors"]), "High historical delay not detected"
    print(f"✓ High historical delay (180 min): {data['delay_probability']}% probability")
    
    print("✓ Test passed!")


def run_all_tests():
    """Run all integration tests."""
    print("=" * 60)
    print("ChainGuard AI - Prediction API Integration Tests")
    print("=" * 60)
    
    try:
        test_prediction_basic()
        test_high_risk_scenario()
        test_low_risk_scenario()
        test_route_optimization()
        test_prediction_idempotence()
        test_invalid_inputs()
        test_edge_cases()
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nSummary:")
        print("  ✓ Basic prediction workflow")
        print("  ✓ High-risk scenario detection")
        print("  ✓ Low-risk scenario detection")
        print("  ✓ Route optimization logic")
        print("  ✓ Prediction idempotence")
        print("  ✓ Invalid input handling")
        print("  ✓ Edge case handling")
        print("\nThe prediction form integration is working correctly!")
        
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        return False
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Cannot connect to backend server.")
        print("Please ensure the backend is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"\n✗ UNEXPECTED ERROR: {e}")
        return False
    
    return True


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
