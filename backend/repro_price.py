import requests
import json
import os

BASE_URL = "http://127.0.0.1:8000"

def get_token():
    # Attempt to log in to get a token
    try:
        res = requests.post(f"{BASE_URL}/login", json={"email": "test@example.com", "password": "password"})
        if res.status_code == 200:
            return res.json().get("access_token")
    except:
        pass
    
    # If login fails, maybe we need to register first?
    try:
        requests.post(f"{BASE_URL}/register", json={"username": "testuser", "email": "test@example.com", "password": "password"})
        res = requests.post(f"{BASE_URL}/login", json={"email": "test@example.com", "password": "password"})
        if res.status_code == 200:
            return res.json().get("access_token")
    except:
        pass
    return None

def test_pricing(riders, drivers, time):
    token = get_token()
    if not token:
        print("Failed to get token")
        return None
    headers = {"Authorization": f"Bearer {token}"}
    
    data = {
        "Number_of_Riders": riders,
        "Number_of_Drivers": drivers,
        "Location_Category": 2,
        "Customer_Loyalty_Status": 1,
        "Number_of_Past_Rides": 50,
        "Average_Ratings": 4.5,
        "Time_of_Booking": time,
        "Vehicle_Type": 0,
        "Expected_Ride_Duration": 20,
        "Origin": "Bandra",
        "Destination": "Andheri",
        "Demand_Supply_Ratio": riders/drivers if drivers > 0 else riders,
        "Ride_Duration_Category": 1,
        "Demand_Level": 2,
        "Driver_Availability": drivers,
        "Weather_Condition": "Auto",
        "City": "Mumbai"
    }
    
    try:
        res = requests.post(f"{BASE_URL}/predict", json=data, headers=headers)
        if res.status_code == 200:
            return res.json()
        else:
            print(f"Error {res.status_code}: {res.text}")
            return None
    except Exception as e:
        print(f"Request failed: {e}")
        return None

if __name__ == "__main__":
    print("Test 1: Normal (120 riders, 40 drivers, Time 2)")
    p1 = test_pricing(120, 40, 2)
    if p1: print(f"Price: {p1['predicted_price']}, Surge: {p1['surge_multiplier']}")
    
    print("\nTest 2: High Demand (500 riders, 10 drivers, Time 0)")
    p2 = test_pricing(500, 10, 0)
    if p2: print(f"Price: {p2['predicted_price']}, Surge: {p2['surge_multiplier']}")
    
    print("\nTest 3: Low Demand (20 riders, 100 drivers, Time 1)")
    p3 = test_pricing(20, 100, 1)
    if p3: print(f"Price: {p3['predicted_price']}, Surge: {p3['surge_multiplier']}")
