import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")

async def test_tomtom():
    olat, olon = 19.0544, 72.8402 # Bandra
    dlat, dlon = 19.1136, 72.8697 # Andheri
    url = f"https://api.tomtom.com/routing/1/calculateRoute/{olat},{olon}:{dlat},{dlon}/json"
    params = {"key": TOMTOM_API_KEY, "traffic": "true"}
    
    print(f"Testing TomTom API with key: {TOMTOM_API_KEY[:5]}...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, params=params)
            print(f"Status Code: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                summary = data["routes"][0]["summary"]
                distance_km = summary["lengthInMeters"] / 1000
                duration_mins = summary["travelTimeInSeconds"] / 60
                print(f"Success! Distance: {distance_km:.2f} km, Duration: {duration_mins:.2f} mins")
            else:
                print(f"Error: {resp.text}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_tomtom())
