import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000"

async def verify_radar_fix():
    print("NEXUS RADAR VERIFICATION: Starting...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Login
        login_data = {"email": "radar@test.com", "password": "Password123!"}
        resp = await client.post(f"{BASE_URL}/login", json=login_data)
        if resp.status_code != 200:
             # Register if login fails (DB was rebuilt)
             reg_data = {"username": "radar_test", "email": "radar@test.com", "password": "Password123!"}
             await client.post(f"{BASE_URL}/register", json=reg_data)
             resp = await client.post(f"{BASE_URL}/login", json=login_data)
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Test /predict
        print("Testing /predict...")
        predict_data = {
            "Number_of_Riders": 100,
            "Number_of_Drivers": 50,
            "Location_Category": 1,
            "Customer_Loyalty_Status": 1,
            "Number_of_Past_Rides": 10,
            "Average_Ratings": 4.5,
            "Time_of_Booking": 1,
            "Vehicle_Type": 0,
            "Expected_Ride_Duration": 30,
            "Demand_Supply_Ratio": 2.0,
            "Ride_Duration_Category": 1,
            "Demand_Level": 1,
            "Driver_Availability": 50,
            "Origin": "Bandra",
            "Destination": "Andheri",
            "City": "Mumbai"
        }
        resp = await client.post(f"{BASE_URL}/predict", json=predict_data, headers=headers)
        res_predict = resp.json()
        print(f"  Live Uber Radar: {res_predict.get('uber_radar')}")

        # 3. Test /predictions (History)
        print("Testing /predictions (History Mapping)...")
        resp = await client.get(f"{BASE_URL}/predictions", headers=headers)
        history = resp.json()
        if history:
            latest = history[-1]
            print(f"  History Uber Radar key: {'uber_radar' in latest}")
            print(f"  History Uber Radar value: {latest.get('uber_radar')}")
            
            if latest.get('uber_radar') is not None and latest.get('uber_radar') > 0:
                print("\nSUCCESS: Radar history mapping is working!")
            else:
                print("\nFAILURE: Radar history mapping failed.")
        else:
            print("FAILURE: No history found.")

if __name__ == "__main__":
    asyncio.run(verify_radar_fix())
