import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000"

async def test_radar():
    print("NEXUS RADAR TEST: Initializing...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Login (re-using credentials from previous fix or creating new)
        reg_data = {"username": "radar_test", "email": "radar@test.com", "password": "Password123!"}
        await client.post(f"{BASE_URL}/register", json=reg_data)
        
        login_data = {"email": "radar@test.com", "password": "Password123!"}
        resp = await client.post(f"{BASE_URL}/login", json=login_data)
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

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
        
        print("Requesting prediction with radar scan...")
        resp = await client.post(f"{BASE_URL}/predict", json=predict_data, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            print(f"Uber Radar: {data.get('uber_radar')}")
            print(f"Ola Radar: {data.get('ola_radar')}")
            
            if data.get('uber_radar') > 0 and data.get('ola_radar') > 0:
                print("\nSUCCESS: Radar prices are being returned correctly!")
            else:
                print("\nFAILURE: Radar prices are zero or missing.")
        else:
            print(f"Error: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_radar())
