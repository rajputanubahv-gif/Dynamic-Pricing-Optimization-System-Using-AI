from sqlalchemy import Column, Integer, String, Float, TIMESTAMP, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100))
    email = Column(String(100), unique=True)
    password = Column(String(255))
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(100), nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    reset_token = Column(String(100), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    predicted_price = Column(Float)
    surge_multiplier = Column(Float)
    distance_km = Column(Float, nullable=True)
    ride_duration = Column(Integer, nullable=True)
    demand_level = Column(String(50))
    uber_price = Column(Float, nullable=True)
    ola_price = Column(Float, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class UserFeedback(Base):
    """Stores user-submitted feedback on a past prediction for model retraining."""
    __tablename__ = "user_feedback"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    actual_price = Column(Float, nullable=False)
    rating = Column(Integer, nullable=True)   # 1–5 star rating
    category = Column(String(50), nullable=True) # e.g. 'Pricing', 'Map', 'App'
    sentiment = Column(String(20), nullable=True) # e.g. 'Happy', 'Frustrated'
    is_accurate = Column(Boolean, default=True)
    comment = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class TrainingRecord(Base):
    """Logs every manual retraining event triggered via POST /retrain."""
    __tablename__ = "training_records"

    id = Column(Integer, primary_key=True, index=True)
    triggered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    samples_used = Column(Integer, nullable=False)
    model_score = Column(Float, nullable=True)   # R² score after retraining
    created_at = Column(TIMESTAMP, server_default=func.now())


class SystemConfig(Base):
    """Global configuration for the Pricing Engine."""
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True, index=True)
    base_fare = Column(Float, default=50.0)
    per_km_economy = Column(Float, default=15.0)
    per_km_premium = Column(Float, default=25.0)
    per_km_xl = Column(Float, default=40.0)
    surge_sensitivity = Column(Float, default=1.2)
    ev_discount = Column(Float, default=20.0)
    carbon_surcharge = Column(Float, default=50.0)
    strategy = Column(String(50), default="Balanced")
    use_live_traffic = Column(Boolean, default=True)
    use_weather_impact = Column(Boolean, default=True)
    use_social_buzz = Column(Boolean, default=True)
    use_dynamic_base_fare = Column(Boolean, default=True)
    use_dynamic_multiplier = Column(Boolean, default=True)
    auto_retrain_threshold = Column(Integer, default=10)
    
    # Demand Forecasting Multipliers
    morning_multiplier = Column(Float, default=0.8)
    midday_multiplier = Column(Float, default=1.5)
    evening_multiplier = Column(Float, default=0.9)
    night_multiplier = Column(Float, default=0.5)

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class CityPricing(Base):
    """City-specific pricing overrides. If a city isn't here, it falls back to SystemConfig."""
    __tablename__ = "city_pricing"

    id = Column(Integer, primary_key=True, index=True)
    city_name = Column(String(100), unique=True, index=True)
    base_fare = Column(Float, default=50.0)
    per_km_economy = Column(Float, default=15.0)
    per_km_premium = Column(Float, default=25.0)
    per_km_xl = Column(Float, default=40.0)
    
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())