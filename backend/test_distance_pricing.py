import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import SystemConfig

client = TestClient(app)

def get_token():
    test_user = {"username": "dist_test_final_2", "email": "dist_final2@test.com", "password": "password123"}
    client.post("/register", json=test_user)
    db = SessionLocal()
    from models import User
    user = db.query(User).filter(User.email == "dist_final2@test.com").first()
    if user:
        user.is_verified = True
        db.commit()
    db.close()
    resp = client.post("/login", json={"email": "dist_final2@test.com", "password": "password123"})
    return resp.json()["access_token"]

def test_distance_aware_pricing():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Short Trip (Forced < 5km via fallback)
    # Using dummy Origin/Dest to trigger fallback
    payload_short = {
        "Number_of_Riders": 10,
        "Number_of_Drivers": 30,
        "Location_Category": 1,
        "Customer_Loyalty_Status": 1,
        "Number_of_Past_Rides": 10,
        "Average_Ratings": 4.5,
        "Time_of_Booking": 1,
        "Vehicle_Type": 0,
        "Expected_Ride_Duration": 4, # 2.0km fallback
        "Origin": "SmallPlace",
        "Destination": "OtherSmallPlace",
        "Demand_Supply_Ratio": 1.0,
        "Ride_Duration_Category": 1,
        "Demand_Level": 1,
        "Driver_Availability": 30,
        "Weather_Condition": "Clear",
        "City": "Mumbai"
    }
    
    resp_short = client.post("/predict", json=payload_short, headers=headers)
    data_short = resp_short.json()
    dist_short = data_short["distance_km"]
    explanation_short = data_short["ai_explanation"]
    
    print(f"DEBUG SHORT: Dist={dist_short}")
    assert dist_short < 5.0
    assert "Short Trip Opt" in explanation_short

    # 2. Long Trip (Mumbai to Pune is ~150km)
    payload_long = {
        "Number_of_Riders": 300,
        "Number_of_Drivers": 2,
        "Location_Category": 2,
        "Customer_Loyalty_Status": 1,
        "Number_of_Past_Rides": 10,
        "Average_Ratings": 4.5,
        "Time_of_Booking": 2,
        "Vehicle_Type": 0,
        "Expected_Ride_Duration": 180,
        "Origin": "Mumbai",
        "Destination": "Pune",
        "Demand_Supply_Ratio": 150.0,
        "Ride_Duration_Category": 3,
        "Demand_Level": 3,
        "Driver_Availability": 2,
        "Weather_Condition": "Clear",
        "City": "Mumbai"
    }
    
    resp_long = client.post("/predict", json=payload_long, headers=headers)
    data_long = resp_long.json()
    dist_long = data_long["distance_km"]
    explanation_long = data_long["ai_explanation"]
    
    print(f"DEBUG LONG: Dist={dist_long}")
    assert dist_long > 20.0
    assert "Long Trip" in explanation_long
    assert data_long["surge_multiplier"] <= 2.001

if __name__ == "__main__":
    pytest.main([__file__])
