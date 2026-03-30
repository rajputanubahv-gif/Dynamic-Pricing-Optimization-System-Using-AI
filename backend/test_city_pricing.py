import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import CityPricing, User

client = TestClient(app)

def get_token():
    test_user = {"username": "city_test", "email": "city@test.com", "password": "password123"}
    client.post("/register", json=test_user)
    db = SessionLocal()
    user = db.query(User).filter(User.email == "city@test.com").first()
    if user:
        user.is_verified = True
        db.commit()
    db.close()
    resp = client.post("/login", json={"email": "city@test.com", "password": "password123"})
    return resp.json()["access_token"]

def test_city_specific_pricing():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Common payload
    payload = {
        "Number_of_Riders": 50,
        "Number_of_Drivers": 25,
        "Location_Category": 1,
        "Customer_Loyalty_Status": 1,
        "Number_of_Past_Rides": 10,
        "Average_Ratings": 4.5,
        "Time_of_Booking": 1,
        "Vehicle_Type": 0, # Economy
        "Expected_Ride_Duration": 20,
        "Origin": "Center",
        "Destination": "Edge",
        "Demand_Supply_Ratio": 1.0,
        "Ride_Duration_Category": 1,
        "Demand_Level": 1,
        "Driver_Availability": 25,
        "Weather_Condition": "Clear",
        "City": "Mumbai"
    }

    # Mock consistent signals for both cities
    mock_signals = {
        "city": "Unknown",
        "weather": {"condition": "Clear", "temp_c": 25.0, "source": "mock"},
        "traffic": {"congestion_level": 0.0, "source": "mock"},
        "events": {"active_events": 0, "max_rank": "none", "source": "mock"},
        "holiday": {"is_holiday": False, "holiday_name": None},
        "transit": {"status": "Normal ✅"},
        "fuel": {"petrol": 96.0, "cng": 75.0, "trend": "Steady ➡️", "index_factor": 1.0},
        "ripple": {"has_ripple": False, "intensity": 1.0},
        "buzz": {"has_buzz": False, "multiplier": 1.0},
        "arrival": {"is_blast": False, "multiplier": 1.0},
        "frozen": {"is_frozen": False, "reason": "Clear", "surcharge": 0},
        "intelligence": {"demand_factor": 1.0, "supply_index": 1.0, "market_pressure": "Stable"}
    }

    import unittest.mock as mock
    with mock.patch("main.get_all_realtime_signals", return_value=mock_signals):
        # 1. Test Mumbai (Rate: 15.0, Base: 50)
        payload["City"] = "Mumbai"
        resp_mumbai = client.post("/predict", json=payload, headers=headers)
        assert resp_mumbai.status_code == 200
        price_mumbai = resp_mumbai.json()["predicted_price"]
        
        # 2. Test Delhi (Rate: 18.0, Base: 60)
        payload["City"] = "Delhi"
        resp_delhi = client.post("/predict", json=payload, headers=headers)
        assert resp_delhi.status_code == 200
        price_delhi = resp_delhi.json()["predicted_price"]

    print(f"\nDEBUG: Mumbai Price = {price_mumbai}")
    print(f"DEBUG: Delhi Price = {price_delhi}")
    assert price_delhi > price_mumbai, f"Delhi ({price_delhi}) should be more expensive than Mumbai ({price_mumbai})"

def test_city_auto_discovery():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    city_name = "NewYork_Custom_Test"
    
    # Ensure city doesn't exist yet
    db = SessionLocal()
    db.query(CityPricing).filter(CityPricing.city_name == city_name).delete()
    db.commit()
    
    payload = {
        "Number_of_Riders": 10,
        "Number_of_Drivers": 10,
        "Location_Category": 1,
        "Customer_Loyalty_Status": 1,
        "Number_of_Past_Rides": 10,
        "Average_Ratings": 4.5,
        "Time_of_Booking": 1,
        "Vehicle_Type": 0,
        "Expected_Ride_Duration": 20,
        "Demand_Supply_Ratio": 1.0,
        "Ride_Duration_Category": 1,
        "Demand_Level": 1,
        "Driver_Availability": 10,
        "City": city_name
    }
    
    resp = client.post("/predict", json=payload, headers=headers)
    assert resp.status_code == 200
    
    # Check if city was discovered and added to DB
    city_entry = db.query(CityPricing).filter(CityPricing.city_name == city_name).first()
    assert city_entry is not None
    assert city_entry.city_name == city_name
    print(f"Auto-Discovered City: {city_entry.city_name} with Base Fare: {city_entry.base_fare}")
    
    db.close()

if __name__ == "__main__":
    pytest.main([__file__, "-s"])
