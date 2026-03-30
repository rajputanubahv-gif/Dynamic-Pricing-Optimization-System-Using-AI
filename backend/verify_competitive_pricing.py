import httpx
import asyncio

BASE_URL = "http://localhost:8000"

async def verify_competitive_pricing():
    print("NEXUS COMPETITIVE PRICING VERIFICATION: Starting...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Login
        login_data = {"email": "radar@test.com", "password": "Password123!"}
        resp = await client.post(f"{BASE_URL}/login", json=login_data)
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Test Simulation with high demand
        print("\nRequesting Market Simulation (High Demand/Low Supply)...")
        predict_data = {
            "Number_of_Riders": 250,
            "Number_of_Drivers": 10,
            "Location_Category": 2,
            "Customer_Loyalty_Status": 1,
            "Number_of_Past_Rides": 10,
            "Average_Ratings": 4.5,
            "Time_of_Booking": 1,
            "Vehicle_Type": 0,
            "Expected_Ride_Duration": 30,
            "Demand_Supply_Ratio": 25.0, # 250/10
            "Ride_Duration_Category": 2,
            "Demand_Level": 3,
            "Driver_Availability": 10,
            "Origin": "Bandra",
            "Destination": "Andheri",
            "City": "Mumbai"
        }
        
        resp = await client.post(f"{BASE_URL}/simulate", json=predict_data, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            outcomes = data["outcomes"]
            
            for strategy in ["Volume Push", "Balanced", "Revenue Max"]:
                outcome = outcomes[strategy]
                market_avg = (outcome['uber_radar'] + outcome['ola_radar']) / 2
                nexus_price = outcome['projected_revenue'] / outcome['expected_bookings'] if outcome['expected_bookings'] > 0 else 0
                markup = ((nexus_price / market_avg) - 1) * 100
                
                print(f"\n--- Strategy: {strategy} ---")
                print(f"  Market Avg : ₹{market_avg:.2f}")
                print(f"  Nexus Price: ₹{nexus_price:.2f}")
                print(f"  Markup     : {markup:.1f}%")
                
                # Validation based on main.py caps
                if strategy == "Volume Push" and markup > 10: 
                    print("  FAILURE: Volume Push cap not effective.")
                elif strategy == "Balanced" and markup > 15:
                    print("  FAILURE: Balanced cap not effective.")
                elif strategy == "Revenue Max" and markup > 25:
                    print("  FAILURE: Revenue Max cap not effective.")
                else:
                    print(f"  SUCCESS: {strategy} meets competitive requirements.")
        else:
            print(f"Error: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    asyncio.run(verify_competitive_pricing())
