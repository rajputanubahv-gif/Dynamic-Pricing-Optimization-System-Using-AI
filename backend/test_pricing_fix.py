import pytest
from fastapi.testclient import TestClient
from main import app
import os

client = TestClient(app)

def get_token():
    # Helper to get a token for a test user
    test_user = {"username": "fix_test", "email": "fix@test.com", "password": "password123"}
    client.post("/register", json=test_user)
    
    # Auto-verify via DB
    from database import SessionLocal
    from models import User
    db = SessionLocal()
    user = db.query(User).filter(User.email == "fix@test.com").first()
    if user:
        user.is_verified = True
        db.commit()
    db.close()
    
    resp = client.post("/login", json={"email": "fix@test.com", "password": "password123"})
    return resp.json()["access_token"]

def test_pricing_overrides_and_multipliers():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Payload for 11km / 25min (approx)
    # We set baseFareRider and perKmRate explicitly
    payload = {
        "Number_of_Riders": 50,
        "Number_of_Drivers": 20,
        "Location_Category": 2,
        "Customer_Loyalty_Status": 1,
        "Number_of_Past_Rides": 10,
        "Average_Ratings": 4.5,
        "Time_of_Booking": 2,
        "Vehicle_Type": 0, # Economy
        "Expected_Ride_Duration": 25,
        "Origin": "Bandra",
        "Destination": "Andheri",
        "Demand_Supply_Ratio": 2.5,
        "Ride_Duration_Category": 1,
        "Demand_Level": 2,
        "Driver_Availability": 20,
        "Weather_Condition": "Clear",
        "City": "Mumbai",
        "baseFareRider": 100.0, # Override base fare to 100
        "perKmRate": 20.0,       # Override per-km to 20
        "surgeSensitivity": 1.5
    }
    
    resp = client.post("/predict", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    
    # Logic: 
    # TomTom might return ~11km.
    # Base Calc = (100 + 11 * 20) = 100 + 220 = 320.
    # Then Surge is applied.
    
    price = data["predicted_price"]
    dist = data["distance_km"]
    surge = data["surge_multiplier"]
    
    print(f"DEBUG: Dist={dist}, Surge={surge}, Price={price}")
    
    # Expected: Price should be roughly (100 + dist * 20) * surge
    expected_base = (100 + dist * 20)
    calculated_price = round(expected_base * surge, 2)
    
    # Check if the backend used our overrides
    # If it used global defaults (50 and 15), the price would be much lower.
    # (50 + 11 * 15) = 215.
    
    assert price >= 100, f"Price {price} is too low, base fare override failed!"
    assert abs(price - calculated_price) < 1.0, f"Price {price} does not match formula ({expected_base} * {surge} = {calculated_price})"

if __name__ == "__main__":
    pytest.main([__file__])
