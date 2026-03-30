import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")

async def test_tomtom():
    if not TOMTOM_API_KEY:
        print("Error: TOMTOM_API_KEY missing from .env")
        return

    # Bandra and Andheri coordinates
    # Bandra: 19.0544, 72.8402
    # Andheri: 19.1136, 72.8697
    olat, olon = 19.0544, 72.8402
    dlat, dlon = 19.1136, 72.8697

    url = f"https://api.tomtom.com/routing/1/calculateRoute/{olat},{olon}:{dlat},{dlon}/json"
    params = {"key": TOMTOM_API_KEY, "traffic": "true"}

    print(f"Testing TomTom Routing for Bandra -> Andheri...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                summary = data["routes"][0]["summary"]
                dist = summary["lengthInMeters"] / 1000
                time = summary["travelTimeInSeconds"] / 60
                print(f"SUCCESS: Distance = {dist} km, Time = {time} mins")
            else:
                print(f"FAILED: {resp.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_tomtom())
