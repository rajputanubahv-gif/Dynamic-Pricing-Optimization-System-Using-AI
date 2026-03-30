import httpx
import asyncio

BASE_URL = "http://localhost:8000"

async def verify_fix():
    print("NEXUS VERIFICATION: Starting Session...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Register a test user
        print("Registering test user...")
        reg_data = {
            "username": "testuser_unique",
            "email": "test_unique@example.com",
            "password": "Password123!"
        }
        await client.post(f"{BASE_URL}/register", json=reg_data)

        # 2. Login
        print("Logging in...")
        login_data = {"email": "test_unique@example.com", "password": "Password123!"}
        resp = await client.post(f"{BASE_URL}/login", json=login_data)
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Predict with specific Origin/Destination
        print("Testing /predict with Bandra -> Andheri...")
        predict_data = {
            "Number_of_Riders": 100,
            "Number_of_Drivers": 50,
            "Location_Category": 1,
            "Customer_Loyalty_Status": 1,
            "Number_of_Past_Rides": 10,
            "Average_Ratings": 4.5,
            "Time_of_Booking": 1,
            "Vehicle_Type": 0,
            "Expected_Ride_Duration": 0,
            "Demand_Supply_Ratio": 2.0,
            "Ride_Duration_Category": 1,
            "Demand_Level": 1,
            "Driver_Availability": 50,
            "Origin": "Bandra",
            "Destination": "Andheri",
            "City": "Mumbai"
        }
        
        resp = await client.post(f"{BASE_URL}/predict", json=predict_data, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            print("\n--- NEXUS ENGINE REPORT ---")
            print(f"Prediction ID : {data.get('prediction_id')}")
            print(f"Calculated KM  : {data.get('distance_km')} km")
            print(f"Ride Duration  : {data.get('ride_duration')} min")
            print(f"Final Price    : ₹{data.get('predicted_price')}")
            print("---------------------------\n")
            
            if data.get('ride_duration') > 0 and data.get('distance_km') > 0:
                print("SUCCESS: Duration and Distance are both non-zero and verified via TomTom!")
            else:
                print("FAILURE: Duration or Distance is zero.")
        else:
            print(f"Error: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    asyncio.run(verify_fix())
