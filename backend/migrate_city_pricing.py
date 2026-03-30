from database import SessionLocal, engine
from models import Base, CityPricing, SystemConfig

def migrate():
    print("Starting CityPricing Migration...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Initialize Major Cities with specific rates
    cities = [
        {
            "city_name": "Mumbai",
            "base_fare": 50.0,
            "per_km_economy": 15.0,
            "per_km_premium": 25.0,
            "per_km_xl": 40.0
        },
        {
            "city_name": "Delhi",
            "base_fare": 60.0,
            "per_km_economy": 18.0,
            "per_km_premium": 30.0,
            "per_km_xl": 45.0
        },
        {
            "city_name": "Bangalore",
            "base_fare": 55.0,
            "per_km_economy": 17.0,
            "per_km_premium": 28.0,
            "per_km_xl": 42.0
        }
    ]
    
    for cdata in cities:
        existing = db.query(CityPricing).filter(CityPricing.city_name == cdata["city_name"]).first()
        if not existing:
            new_city = CityPricing(**cdata)
            db.add(new_city)
            print(f"Added city: {cdata['city_name']}")
    
    db.commit()
    db.close()
    print("Migration Complete.")

if __name__ == "__main__":
    migrate()
