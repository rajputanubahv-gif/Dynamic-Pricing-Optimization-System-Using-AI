import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

async def test_weather():
    if not WEATHER_API_KEY:
        print("Error: WEATHER_API_KEY missing from .env")
        return

    city = "Mathura"
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": WEATHER_API_KEY, "units": "metric"}

    print(f"Testing Weather API for {city}...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                temp = data["main"]["temp"]
                cond = data["weather"][0]["main"]
                print(f"SUCCESS: Temp = {temp}°C, Condition = {cond}")
            else:
                print(f"FAILED: {resp.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_weather())
