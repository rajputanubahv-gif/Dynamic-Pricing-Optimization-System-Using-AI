from pydantic import BaseModel


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
    Weather_Condition: str = "Clear"
    City: str = "Mumbai"
    baseFareRider: float = 5.0
    perMileRate: float = 1.5
    surgeSensitivity: float = 1.2