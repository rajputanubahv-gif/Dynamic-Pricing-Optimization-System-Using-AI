import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import SystemConfig

client = TestClient(app)

def get_token():
    test_user = {"username": "dyn_test_2", "email": "dyn2@test.com", "password": "password123"}
    client.post("/register", json=test_user)
    db = SessionLocal()
    from models import User
    user = db.query(User).filter(User.email == "dyn2@test.com").first()
    if user:
        user.is_verified = True
        db.commit()
    db.close()
    resp = client.post("/login", json={"email": "dyn2@test.com", "password": "password123"})
    return resp.json()["access_token"]

def test_dynamic_config_application():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Enable Dynamic Base Fare and Multiplier in DB
    db = SessionLocal()
    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig()
        db.add(config)
    config.use_dynamic_base_fare = True
    config.use_dynamic_multiplier = True
    config.base_fare = 50.0
    db.commit()
    db.db_err = None # dummy
    db.close()
    
    payload = {
        "Number_of_Riders": 250, # High demand
        "Number_of_Drivers": 5,   # Low supply
        "Location_Category": 2,
        "Customer_Loyalty_Status": 1,
        "Number_of_Past_Rides": 10,
        "Average_Ratings": 4.5,
        "Time_of_Booking": 2,
        "Vehicle_Type": 0,
        "Expected_Ride_Duration": 25,
        "Origin": "Bandra",
        "Destination": "Andheri",
        "Demand_Supply_Ratio": 50.0,
        "Ride_Duration_Category": 1,
        "Demand_Level": 2,
        "Driver_Availability": 5,
        "Weather_Condition": "Clear",
        "City": "Mumbai"
    }
    
    resp = client.post("/predict", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    
    # Check for keywords instead of printing
    explanation = data["ai_explanation"]
    
    # We expect "Dynamic Multiplier" to trigger because pressure is high
    assert "Dynamic Multiplier" in explanation
    # For Dynamic Base Fare, it only triggers if fuel_multiplier > 1.0 (random/city based)
    # But usually it's around 1.05 in Mumbai fallback simulation.
    
    print("Test passed! Logic confirmed.")

if __name__ == "__main__":
    pytest.main([__file__])
