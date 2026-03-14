from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import SessionLocal
from models import User, Prediction
from schemas import UserRegister, UserLogin, PredictRequest
from auth import hash_password, verify_password, create_token, verify_token
from ml_model import predict_price

def predict_future_demand(time_of_booking: int, current_riders: int) -> dict:
    """
    Simulates a time-series forecast to predict demand 30 minutes into the future.
    Time_of_Booking: 0=Morning Rush, 1=Midday, 2=Evening Rush, 3=Late Night
    """
    # Base multiplier depends on the current time block
    trend_multipliers = {
        0: 0.8,  # Morning rush ending soon, demand dropping
        1: 1.5,  # Midday transitioning to evening rush, demand rising
        2: 0.9,  # Evening rush steady/tapering
        3: 0.5   # Late night, demand crashing
    }
    
    multiplier = trend_multipliers.get(time_of_booking, 1.0)
    future_riders = int(current_riders * multiplier)
    
    if multiplier > 1.2:
        trend = "Surging 📈"
    elif multiplier < 0.8:
        trend = "Crashing 📉"
    else:
        trend = "Steady ➡️"
        
    return {
        "expected_riders_30m": future_riders,
        "trend_direction": trend
    }
    
def optimize_revenue(base_price: float, elasticity_score: float, surge: float, current_riders: int) -> dict:
    """
    Calculates the optimum price point to maximize GROSS REVENUE, 
    balancing profit margins against driver/rider abandonment.
    """
    # Calculate revenue under Standard Supply/Demand Surge
    standard_price = base_price * surge
    
    # Estimate how many riders will ACTUALLY book at this price based on elasticity
    # Highly elastic = more dropoff at high prices
    conversion_rate = max(0.1, 1.0 - ((surge - 1.0) * (1.0 - elasticity_score)))
    converted_riders = int(current_riders * conversion_rate)
    
    estimated_revenue = standard_price * converted_riders
    
    # Are we leaving money on the table? Let's check a slightly lower price for volume
    volume_surge = max(1.0, surge - 0.2)
    volume_price = base_price * volume_surge
    volume_conversion = max(0.1, 1.0 - ((volume_surge - 1.0) * (1.0 - elasticity_score)))
    volume_riders = int(current_riders * volume_conversion)
    
    volume_revenue = volume_price * volume_riders
    
    # To calculate business margin, assume base price pays the driver, and surge is 80% kept by platform
    base_platform_fee = base_price * 0.25 # standard 25% take rate
    
    if volume_revenue > estimated_revenue:
        # Volume pricing wins (Highest total revenue)
        platform_revenue = (volume_price - base_price) * 0.8 + base_platform_fee
        margin_pct = (platform_revenue / volume_price) * 100 if volume_price > 0 else 0
        
        return {
            "strategy": "Volume Maximization (Elastic Demand)",
            "optimal_surge": round(volume_surge, 2),
            "projected_revenue": round(volume_revenue, 2),
            "expected_bookings": volume_riders,
            "lost_revenue": round(abs(volume_revenue - estimated_revenue), 2),
            "margin_percentage": round(margin_pct, 1)
        }
    else:
        # Margin pricing wins (Inelastic Demand)
        platform_revenue = (standard_price - base_price) * 0.8 + base_platform_fee
        margin_pct = (platform_revenue / standard_price) * 100 if standard_price > 0 else 0
        
        return {
            "strategy": "Margin Maximization (Inelastic Demand)",
            "optimal_surge": round(surge, 2),
            "projected_revenue": round(estimated_revenue, 2),
            "expected_bookings": converted_riders,
            "lost_revenue": round(abs(estimated_revenue - volume_revenue), 2),
            "margin_percentage": round(margin_pct, 1)
        }

def calculate_elasticity(loyalty_status: int, duration: int, ratio: float) -> float:
    """
    Calculate a price elasticity score between 0.0 (highly elastic/sensitive) 
    and 1.0 (highly inelastic/insensitive).
    """
    score = 1.0
    
    # Lower loyalty status users are more sensitive to price (elastic)
    if loyalty_status == 0:  # Assuming 0 is lowest tier
        score -= 0.2
        
    # Shorter rides are more price sensitive
    if duration < 15:
        score -= 0.3
    elif duration < 30:
        score -= 0.1
        
    # High demand makes people less sensitive (inelastic)
    if ratio > 3:
        score += 0.3
    elif ratio > 1.5:
        score += 0.1
        
    # Clamp between 0.0 and 1.0
    return max(0.0, min(1.0, score))

app = FastAPI(title="Dynamic Pricing API")


# -----------------------------
# Enable CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
def home():
    return {"message": "Dynamic Pricing API Running"}


# -----------------------------
# Register User
# -----------------------------
@app.post("/register")
def register(user: UserRegister):

    db = SessionLocal()

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        db.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password
    )

    try:
        db.add(new_user)
        db.commit()
    except Exception as e:
        db.rollback()
        db.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed due to a database error."
        )

    db.close()

    return {"message": "User registered successfully"}


# -----------------------------
# Login User
# -----------------------------
@app.post("/login")
def login(user: UserLogin):

    db = SessionLocal()

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        db.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not verify_password(user.password, db_user.password):
        db.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    token = create_token({"user_id": db_user.id})

    db.close()

    return {"access_token": token}


# -----------------------------
# Predict Dynamic Price
# -----------------------------
@app.post("/predict")
def predict(data: PredictRequest):

    db = SessionLocal()

    price = predict_price(data.dict())

    # Calculate base ML surge
    raw_surge = round(price / 100, 2)
    
    # -----------------------------
    # Apply Price Elasticity & Revenue Ops
    # -----------------------------
    elasticity_score = calculate_elasticity(
        loyalty_status=data.Customer_Loyalty_Status,
        duration=data.Expected_Ride_Duration,
        ratio=data.Demand_Supply_Ratio
    )
    
    # Apply system config settings
    base_ml_price = data.baseFareRider + (data.Expected_Ride_Duration * data.perMileRate * 0.5) # approx 0.5 miles per min
    # Adjust the ML surge with user-defined sensitivity
    raw_surge = max(1.0, 1.0 + ((raw_surge - 1.0) * data.surgeSensitivity))
    
    # Apply Weather Modifier (before revenue ops)
    weather = data.Weather_Condition
    weather_multiplier = 1.0
    if weather == "Rain":
        weather_multiplier = 1.3
    elif weather == "Storm":
        weather_multiplier = 1.6
        
    raw_surge = round(raw_surge * weather_multiplier, 2)
    
    rev_opt = optimize_revenue(
        base_price=base_ml_price,
        elasticity_score=elasticity_score,
        surge=raw_surge,
        current_riders=data.Number_of_Riders
    )
    
    surge = rev_opt["optimal_surge"]
    price = base_ml_price * surge
    expected_revenue = rev_opt["projected_revenue"]
    opt_strategy = rev_opt["strategy"]
    
    # Run Demand Forecast
    forecast = predict_future_demand(data.Time_of_Booking, data.Number_of_Riders)

    if data.Demand_Supply_Ratio > 3:
        demand = "High"

    elif data.Demand_Supply_Ratio > 1.5:
        demand = "Medium"

    else:
        demand = "Low"

    # Save prediction to database
    new_prediction = Prediction(
        predicted_price=round(price, 2),
        surge_multiplier=surge,
        demand_level=demand
    )

    db.add(new_prediction)
    db.commit()
    db.close()

    base_price = round(price / (surge if surge > 0 else 1), 2)
    # Calculate dynamic confidence score (varies depending on extremity of data)
    # Starts around 96% and drops as inputs get "weirder" or higher stakes (high surge/weird ratios)
    base_calc_confidence = 96.5
    if surge > 2.0:
        base_calc_confidence -= (surge * 1.5) # High surge is harder to predict
    if data.Expected_Ride_Duration > 60:
        base_calc_confidence -= 2.3  # Long rides have more variance
    if elasticity_score < 0.4:
        base_calc_confidence -= 3.1  # Highly elastic users are wildcard behave
        
    confidence = round(max(75.5, min(99.1, base_calc_confidence - (data.Demand_Supply_Ratio * 0.5))), 1)
    
    # Generate Detailed AI Explanation
    explanation_parts = []
    
    # 1. Base Demand Analysis
    explanation_parts.append(f"📊 Demand Analysis: A {demand.upper()} demand level is detected. There are {data.Number_of_Riders} riders competing for {data.Driver_Availability} drivers (Ratio: {round(data.Demand_Supply_Ratio, 2)}).")
    
    # 2. Demand Forecasting
    explanation_parts.append(f"🔮 30m Forecast: Demand trend is {forecast['trend_direction']}. The system expects {forecast['expected_riders_30m']} riders in the area shortly.")
    
    # 3. Revenue Optimization & Elasticity
    if raw_surge > 1.0:
        if opt_strategy == "Volume Maximization (Elastic Demand)":
            explanation_parts.append(f"⚖️ Revenue Optimization: Standard demand implies a {raw_surge}x multiplier. However, this ride profile is highly elastic. The algorithm actively dropped the surge to {surge}x. This undercuts standard pricing to maximize raw booking volume, projecting ₹{expected_revenue} in total fleet revenue.")
        else:
            explanation_parts.append(f"📈 Revenue Optimization: Rider demand is highly inelastic (price-insensitive) right now. The model holds the maximum {surge}x surge to capture top profit margins (Projected total payload: ₹{expected_revenue}).")
    else:
        explanation_parts.append(f"✅ Balanced Supply: Supply meets demand. Non-surge pricing is applied, projecting a baseline payload of ₹{expected_revenue}.")
        
    # 4. Contextual Factor Impact
    if data.Expected_Ride_Duration > 30:
        explanation_parts.append(f"⏱️ Ride Duration: The extended expected duration ({data.Expected_Ride_Duration} mins) increases the base premium.")
    else:
        explanation_parts.append("⏱️ Ride Duration: The short ride duration keeps the base cost minimal.")
        
    # 4. Weather Impact
    if weather == "Rain":
        explanation_parts.append("🌧️ Weather Alert: Rain detected. Anticipating a massive incoming demand spike as pedestrians seek shelter, a 1.3x preemptive weather multiplier was applied to the base surge.")
    elif weather == "Storm":
        explanation_parts.append("⛈️ Weather Alert: Severe Storm detected. Due to hazardous driving conditions and extreme demand pooling, a 1.6x preemptive weather multiplier was applied to the base surge.")
        
    # 5. Final summary
    explanation_parts.append(f"🎯 Final Calculation: The ML model calculated a base price of ₹{base_price}, resulting in a final recommended dynamic fare of ₹{round(price, 2)} (Confidence: {confidence}%).")
    
    # Join with newlines for visual clarity in UI
    explanation = "\n\n".join(explanation_parts)

    return {
        "actual_price": base_price,
        "predicted_price": round(price, 2),
        "tier_prices": {
            "Economy": round(price, 2),
            "Premium": round(price * 1.5, 2),
            "XL": round(price * 1.8, 2)
        },
        "surge_multiplier": surge,
        "demand_level": demand,
        "driver_availability": data.Driver_Availability,
        "rider_demand": data.Number_of_Riders,
        "demand_supply_ratio": round(data.Demand_Supply_Ratio, 2),
        "ride_duration": data.Expected_Ride_Duration,
        "model_confidence": confidence,
        "price_elasticity": round(elasticity_score, 2),
        "expected_revenue": expected_revenue,
        "future_demand_trend": forecast["trend_direction"],
        "weather_condition": weather,
        "city": data.City,
        "ai_explanation": explanation,
        "margin_percentage": rev_opt.get("margin_percentage", 25.0),
        "lost_revenue": rev_opt.get("lost_revenue", 0.0),
        "expected_bookings": rev_opt.get("expected_bookings", 0),
        "optimal_strategy": opt_strategy
    }


# -----------------------------
# Prediction History
# -----------------------------
@app.get("/predictions")
def get_predictions():

    db = SessionLocal()

    predictions = db.query(Prediction).all()

    db.close()

    return predictions



# -----------------------------
# Analytics Dashboard
# -----------------------------
@app.get("/analytics")
def get_analytics():
    db = SessionLocal()
    predictions = db.query(Prediction).order_by(Prediction.created_at.desc()).all()
    db.close()

    total_predictions = len(predictions)
    
    if total_predictions == 0:
        return {
            "total_predictions": 0,
            "average_price": 0,
            "average_surge": 1.0,
            "demand_distribution": [
                {"name": "High", "value": 0},
                {"name": "Medium", "value": 0},
                {"name": "Low", "value": 0}
            ],
            "recent_trends": []
        }

    total_price = sum((p.predicted_price or 0) for p in predictions)
    total_surge = sum((p.surge_multiplier or 1.0) for p in predictions)
    
    demand_counts = {"High": 0, "Medium": 0, "Low": 0}
    for p in predictions:
        # Gracefully handle any unmatched demand levels
        lvl = p.demand_level
        if lvl in demand_counts:
            demand_counts[lvl] += 1
        else:
            demand_counts["Low"] += 1

    # Format the trends for the chart (earliest to latest in the recent 10)
    # the predictions array is sorted descending (latest first)
    recent_preds = predictions[:10]
    recent_preds.reverse() # flip it so chart goes left-to-right chronologically
    
    recent_trends = []
    for i, p in enumerate(recent_preds):
        time_label = f"T-{10-i}"
        if p.created_at:
            dt = p.created_at
            if isinstance(dt, str):
                import datetime
                dt = datetime.datetime.fromisoformat(dt.replace('Z', '+00:00'))
            time_label = dt.strftime("%H:%M")
        
        recent_trends.append({
            "time": time_label,
            "price": round(p.predicted_price or 0, 2),
            "surge": round(p.surge_multiplier or 1.0, 2)
        })

    return {
        "total_predictions": total_predictions,
        "average_price": round(total_price / total_predictions, 2),
        "average_surge": round(total_surge / total_predictions, 2),
        "demand_distribution": [
            {"name": "High", "value": demand_counts["High"]},
            {"name": "Medium", "value": demand_counts["Medium"]},
            {"name": "Low", "value": demand_counts["Low"]}
        ],
        "recent_trends": recent_trends
    }

# -----------------------------
# Security Dependency
# -----------------------------
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload.get("user_id")


# -----------------------------
# Delete Prediction History
# -----------------------------
@app.delete("/predictions/{prediction_id}")
def delete_prediction(prediction_id: int, user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    
    if not prediction:
        db.close()
        raise HTTPException(status_code=404, detail="Prediction not found")
        
    db.delete(prediction)
    db.commit()
    db.close()
    
    return {"message": "Prediction deleted successfully"}


# -----------------------------
# Clear All Prediction History
# -----------------------------
@app.delete("/predictions")
def clear_all_predictions(user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    
    # Bulk delete all predictions
    db.query(Prediction).delete()
    db.commit()
    db.close()
    
    return {"message": "All predictions deleted successfully"}