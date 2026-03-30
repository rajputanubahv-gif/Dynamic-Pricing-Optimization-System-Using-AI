import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")

async def test_tomtom_search():
    if not TOMTOM_API_KEY:
        print("Error: TOMTOM_API_KEY missing from .env")
        return

    location = "Bandra, Mumbai, India"
    url = f"https://api.tomtom.com/search/2/geocode/{location}.json"
    params = {"key": TOMTOM_API_KEY, "limit": 1}

    print(f"Testing TomTom Search (Geocode) for {location}...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    pos = results[0]["position"]
                    print(f"SUCCESS: Latitude = {pos['lat']}, Longitude = {pos['lon']}")
                else:
                    print("FAILED: No results found.")
            else:
                print(f"FAILED: {resp.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_tomtom_search())
