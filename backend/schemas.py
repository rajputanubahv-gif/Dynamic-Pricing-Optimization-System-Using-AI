from pydantic import BaseModel
from typing import Optional


class UserRegister(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class PredictRequest(BaseModel):
    Number_of_Riders: int
    Number_of_Drivers: int
    Location_Category: int
    Customer_Loyalty_Status: int
    Number_of_Past_Rides: int
    Average_Ratings: float
    Time_of_Booking: int
    Vehicle_Type: int
    Expected_Ride_Duration: int
    Demand_Supply_Ratio: float
    Ride_Duration_Category: int
    Demand_Level: int
    Driver_Availability: int
    
    # ── Real-time routing & weather params ──
    Origin: Optional[str] = "Bandra"
    Destination: Optional[str] = "Andheri"
    Weather_Condition: str = "Auto"
    City: str = "Mumbai"
    
    baseFareRider: float = 50.0
    perKmRate: float = 15.0
    surgeSensitivity: float = 1.2
    evDiscount: float = 20.0
    carbonSurcharge: float = 50.0
    strategy: str = "Balanced"
    useLiveTraffic: Optional[bool] = True
    useWeatherImpact: Optional[bool] = True
    useSocialBuzz: Optional[bool] = True


class FeedbackSubmit(BaseModel):
    prediction_id: int
    actual_price: float
    rating: Optional[int] = None       # 1–5 stars
    category: Optional[str] = "Pricing" # e.g. 'Pricing', 'Map', 'App'
    sentiment: Optional[str] = "Neutral" # e.g. 'Happy', 'Frustrated'
    is_accurate: Optional[bool] = True
    comment: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class GoogleLoginRequest(BaseModel):
    token: str

class SystemConfigSchema(BaseModel):
    base_fare: float
    per_km_economy: float
    per_km_premium: float
    per_km_xl: float
    surge_sensitivity: float
    ev_discount: float
    carbon_surcharge: float
    strategy: str
    use_live_traffic: bool
    use_weather_impact: bool
    use_social_buzz: bool
    use_dynamic_base_fare: bool
    use_dynamic_multiplier: bool
    auto_retrain_threshold: int
    morning_multiplier: float
    midday_multiplier: float
    evening_multiplier: float
    night_multiplier: float