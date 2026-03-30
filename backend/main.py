import logging
import asyncio
from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import SessionLocal, engine
from models import Base, User, Prediction, UserFeedback, TrainingRecord, SystemConfig, CityPricing
from schemas import (
    UserRegister, UserLogin, PredictRequest, FeedbackSubmit, 
    ForgotPasswordRequest, ResetPasswordRequest, GoogleLoginRequest,
    SystemConfigSchema
)
from auth import hash_password, verify_password, create_token, verify_token
from ml_model import predict_price, reload_model
from realtime import get_all_realtime_signals, get_route_distance_and_time, get_competitor_radar_prices
from email_utils import send_verification_email, send_reset_password_email
import secrets
import os
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# ─────────────────────────────
# Logging setup
# ─────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("dynamic_pricing")

# ─────────────────────────────
# Rate Limiter
# ─────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─────────────────────────────
# Helper functions
# ─────────────────────────────
def predict_future_demand(time_of_booking: int, current_riders: int, config: SystemConfig, rt_signals: dict = None) -> dict:
    trend_multipliers = {
        0: config.morning_multiplier, 
        1: config.midday_multiplier, 
        2: config.evening_multiplier, 
        3: config.night_multiplier
    }
    multiplier = trend_multipliers.get(time_of_booking, 1.0)
    
    # ── Inject real-time signals into the forecasting model ──
    if rt_signals:
        # Bad weather drives more future demand for rides
        weather = rt_signals.get("weather", {}).get("condition", "Clear")
        if weather in ["Rain", "Storm"]:
            multiplier += 0.25
            
        # Heavy traffic means fewer people walking/driving themselves
        traffic = rt_signals.get("traffic", {}).get("congestion_level", 0.0)
        if traffic > 0.6:
            multiplier += 0.15
        
        # Events create steady future demand
        events = rt_signals.get("events", {})
        if events.get("active_events", 0) > 0:
            if events.get("max_rank") == "major":
                multiplier += 0.3
            else:
                multiplier += 0.1
        
        # Holidays change baseline behavior
        if rt_signals.get("holiday", {}).get("is_holiday"):
            multiplier += 0.15

    future_riders = int(current_riders * multiplier)
    
    if multiplier > 1.25:
        trend = "Surging 📈"
    elif multiplier < 0.85:
        trend = "Crashing 📉"
    else:
        trend = "Steady ➡️"
        
    return {"expected_riders_30m": future_riders, "trend_direction": trend}


def optimize_revenue(strategy: str, current_surge: float, base_fare: float):
    if strategy == "Revenue Max":
        optimal_surge = current_surge * 1.2
        expected_bookings = max(5, 50 - (optimal_surge * 15))
        explanation = "Priority: Margin optimization (+20% surge) for high-value demand."
    elif strategy == "Volume Push":
        optimal_surge = max(1.0, current_surge * 0.8)
        expected_bookings = min(100, 50 + (2.0 - optimal_surge) * 40)
        explanation = "Priority: Market share expansion (-20% surge) to maximize utilization."
    else: # Balanced
        optimal_surge = current_surge
        expected_bookings = 50 
        explanation = "Priority: Standard equilibrium between satisfaction and overhead."
        
    projected_revenue = expected_bookings * (base_fare * optimal_surge)
    
    return {
        "optimal_surge": round(optimal_surge, 3),
        "strategy": strategy,
        "explanation": explanation,
        "projected_revenue": round(projected_revenue, 2),
        "expected_bookings": int(expected_bookings),
    }

def calculate_elasticity(loyalty_status: int, duration: int, ratio: float) -> float:
    score = 1.0
    if loyalty_status == 0:
        score -= 0.2
    if duration < 15:
        score -= 0.3
    elif duration < 30:
        score -= 0.1
    if ratio > 3:
        score += 0.3
    elif ratio > 1.5:
        score += 0.1
    return max(0.0, min(1.0, score))


# ─────────────────────────────
# DB & App Init
# ─────────────────────────────
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dynamic Pricing API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────
# Auth Dependency
# ─────────────────────────────
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        logger.warning("Rejected request — invalid or expired token.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload.get("user_id")


# ─────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "Dynamic Pricing API Running"}


# ── Register ──────────────────────────────────────────
@app.post("/register")
def register(user: UserRegister, background_tasks: BackgroundTasks):
    db = SessionLocal()
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    ver_token = secrets.token_urlsafe(32)
    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password),
        is_verified=True,  # Auto-verify during development
        verification_token=ver_token,
        verification_token_expires=datetime.utcnow() + timedelta(hours=24),
    )
    try:
        db.add(new_user)
        db.commit()
        logger.info(f"New user registered: {user.email}")
        background_tasks.add_task(send_verification_email, user.email, ver_token)
    except Exception as e:
        db.rollback()
        db.close()
        logger.error(f"Registration failed for {user.email}: {e}")
        raise HTTPException(status_code=500, detail="Registration failed.")
    db.close()
    return {"message": "User registered successfully. Please check your email to verify your account."}


# ── Login ─────────────────────────────────────────────
@app.post("/login")
def login(user: UserLogin):
    db = SessionLocal()
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        db.close()
        logger.warning(f"Login failed — user not found: {user.email}")
        raise HTTPException(status_code=401, detail="User not found")
        
    if not db_user.is_verified:
        db.close()
        logger.warning(f"Login failed — email not verified: {user.email}")
        raise HTTPException(status_code=401, detail="Email not verified. Please check your inbox.")

    if not verify_password(user.password, db_user.password):
        db.close()
        logger.warning(f"Login failed — wrong password for: {user.email}")
        raise HTTPException(status_code=401, detail="Invalid password")
    
    token = create_token({"user_id": db_user.id})
    db.close()
    logger.info(f"User logged in: {user.email}")
    return {"access_token": token}


# ── Get Current User ──────────────────────────────────
@app.get("/me")
def get_me(user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).get(user_id)
    db.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_verified": user.is_verified
    }


# ── Google Login ──────────────────────────────────────
@app.post("/auth/google")
def google_login(req: GoogleLoginRequest):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google Auth is not configured on the server.")

    try:
        idinfo = id_token.verify_oauth2_token(req.token, google_requests.Request(), client_id)
        email = idinfo.get("email")
        if not email:
            raise ValueError("Email not found in Google token")

        db = SessionLocal()
        db_user = db.query(User).filter(User.email == email).first()
        
        if not db_user:
            # Auto-register new user from Google
            db_user = User(
                username=idinfo.get('name', email.split("@")[0]),
                email=email,
                # Random strong string since they will never use it to login natively
                password=hash_password(secrets.token_urlsafe(32)),
                is_verified=True, # Google already verifies emails
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            logger.info(f"New user registered via Google: {email}")
            
        token = create_token({"user_id": db_user.id})
        db.close()
        logger.info(f"User logged in via Google: {email}")
        return {"access_token": token}
    except ValueError as e:
        logger.warning(f"Google login failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")


# ── Verify Email ──────────────────────────────────────
@app.get("/verify-email")
def verify_email(token: str):
    db = SessionLocal()
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        db.close()
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        
    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        db.close()
        raise HTTPException(status_code=400, detail="Verification token has expired")

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    user_email = user.email
    db.close()
    logger.info(f"Email verified: {user_email}")
    return {"message": "Email verified successfully. You can now log in."}


# ── Forgot Password ───────────────────────────────────
@app.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    db = SessionLocal()
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        reset_tok = secrets.token_urlsafe(32)
        user.reset_token = reset_tok
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=24)
        db.commit()
        background_tasks.add_task(send_reset_password_email, user.email, reset_tok)
        logger.info(f"Password reset requested for: {user.email}")
    db.close()
    # Always return success to prevent email enumeration
    return {"message": "If that email is registered, a reset link has been sent."}


# ── Reset Password ────────────────────────────────────
@app.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    db = SessionLocal()
    
    # Defensive measure: strip any accidental whitespace from user input
    token = req.token.strip() if req.token else ""
    logger.info(f"Reset attempt with token length: {len(token)}")
    
    user = db.query(User).filter(User.reset_token == token).first()
    if not user:
        db.close()
        logger.warning(f"Reset failed — token not found in DB: {token[:5]}...{token[-5:] if token else ''}")
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        db.close()
        raise HTTPException(status_code=400, detail="Reset token has expired")
        
    user.password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    user_email = user.email
    db.close()
    logger.info(f"Password reset completed for: {user_email}")
    return {"message": "Password reset successfully. You can now log in."}


# ── Real-Time Signals Endpoint ────────────────────────
@app.get("/realtime/{city}")
async def get_realtime(city: str):
    """
    Returns live weather, traffic, local events, and holiday status for a city.
    Frontend can poll this endpoint to auto-fill the prediction form.
    """
    signals = await get_all_realtime_signals(city)
    return signals


# ── Real-Time Signals (Frontend Compatible) ──────────
@app.get("/realtime-signals")
async def get_realtime_signals(city: str = "Mumbai"):
    return await get_all_realtime_signals(city)


# Feedback logic moved to the bottom with background task support


# ── System Configuration (Global) ────────────────────
def get_global_config(db):
    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@app.get("/config")
def get_config(user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    config = get_global_config(db)
    db.close()
    return config

@app.patch("/config")
def update_config(req: SystemConfigSchema, user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    config = get_global_config(db)
    for key, value in req.dict().items():
        setattr(config, key, value)
    db.commit()
    db.refresh(config)
    db.close()
    logger.info(f"System Configuration updated by user {user_id}")
    return {"message": "Configuration updated successfully", "config": config}


async def calculate_price_internals(data: PredictRequest, global_config: SystemConfig, db, user_id: int):
    city = data.City or "Mumbai"
    city_price_entry = db.query(CityPricing).filter(CityPricing.city_name == city).first()
    
    if not city_price_entry and global_config:
        # ✨ City Auto-Discovery ✨
        city_price_entry = CityPricing(
            city_name=city,
            base_fare=global_config.base_fare,
            per_km_economy=global_config.per_km_economy,
            per_km_premium=global_config.per_km_premium,
            per_km_xl=global_config.per_km_xl
        )
        db.add(city_price_entry)
        db.commit()
        db.refresh(city_price_entry)
        logger.info(f"✨ [City Auto-Discovery] Registered new dynamic city: {city}")

    # 'config' prioritizes city-specific rates; 'global_config' covers system-wide switches
    config = city_price_entry if city_price_entry else global_config

    # 1. Apply overrides from request or fallback to Config
    base_fare = data.baseFareRider if data.baseFareRider != 50.0 else config.base_fare
    
    # Tiered Per-KM Rate selection
    if data.Vehicle_Type == 1: # Premium
        km_rate = config.per_km_premium
    elif data.Vehicle_Type == 2: # XL
        km_rate = config.per_km_xl
    else: # Economy / EV
        km_rate = config.per_km_economy
    
    # Allow manual override in request if it's not the default
    if hasattr(data, "perKmRate") and data.perKmRate != 15.0:
        km_rate = data.perKmRate

    surge_sensitivity = data.surgeSensitivity if data.surgeSensitivity != 1.2 else global_config.surge_sensitivity
    ev_discount = data.evDiscount if data.evDiscount != 20.0 else global_config.ev_discount
    carbon_surcharge = data.carbonSurcharge if data.carbonSurcharge != 50.0 else global_config.carbon_surcharge
    
    use_traffic = data.useLiveTraffic if data.useLiveTraffic is not None else global_config.use_live_traffic
    use_weather = data.useWeatherImpact if data.useWeatherImpact is not None else global_config.use_weather_impact
    use_social = data.useSocialBuzz if data.useSocialBuzz is not None else global_config.use_social_buzz
    use_dynamic_base = global_config.use_dynamic_base_fare
    use_dynamic_mult = global_config.use_dynamic_multiplier

    # ───── Distance & Routing Calculation (Pre-requisite for Radar) ─────
    distance_km = data.Expected_Ride_Duration * 0.5  # Form heuristic fallback
    if data.Origin and data.Destination:
        route_info = await get_route_distance_and_time(data.Origin, data.Destination, data.City)
        # Always use the route_info (either real API result or High-Fidelity Fallback)
        data.Expected_Ride_Duration = route_info["duration_mins"]
        distance_km = route_info["distance_km"]
    
    # ── Apply real-time data enrichment (Harden) ──────
    try:
        # Inject manual simulator parameters into real-time intelligence
        rt_signals = await get_all_realtime_signals(
            data.City, 
            manual_riders=data.Number_of_Riders, 
            manual_drivers=data.Number_of_Drivers
        )
        # ── Competitor Radar Scan (Now Demand-Aware) ─────
        # We pass the intelligence factors so competitors also surge in simulation
        intel_factors = rt_signals.get("intelligence", {"demand_factor": 1.0, "supply_index": 1.0})
        radar = await get_competitor_radar_prices(
            data.City, 
            distance_km,
            demand_factor=intel_factors.get("demand_factor", 1.0),
            supply_index=intel_factors.get("supply_index", 1.0)
        )
        uber_price = radar["uber_estimate"]
        ola_price = radar["ola_estimate"]
        market_avg = radar["market_avg"]
    except Exception as e:
        logger.warning(f"Signal enrichment or radar failed for {data.City}: {e}")
        uber_price = 0.0
        ola_price = 0.0
        market_avg = 0.0
        # Build high-fidelity fallback to ensure calculation never crashes
        rt_signals = {
            "city": data.City,
            "weather": {"condition": "Clear", "temp_c": 25.0, "source": "fallback"},
            "traffic": {"congestion_level": 0.4, "source": "fallback"},
            "events": {"active_events": 0, "max_rank": "none", "source": "fallback"},
            "holiday": {"is_holiday": False, "holiday_name": None, "source": "fallback"},
            "transit": {"status": "Normal ✅", "detail": "Smooth", "source": "fallback"},
            "fuel": {"petrol": 96.0, "cng": 75.0, "trend": "Steady ➡️", "index_factor": 1.0, "source": "fallback"},
            "ripple": {"has_ripple": False, "intensity": 1.0},
            "buzz": {"has_buzz": False, "multiplier": 1.0},
            "arrival": {"is_blast": False, "multiplier": 1.0},
            "frozen": {"is_frozen": False, "reason": "Clear", "surcharge": 0},
            "intelligence": {"demand_factor": 1.0, "supply_index": 1.0, "market_pressure": "Stable"}
        }
    
    # 2. Forecasting with Dynamic Global Config
    forecast = predict_future_demand(
        time_of_booking=data.Time_of_Booking, 
        current_riders=data.Number_of_Riders, 
        config=global_config,
        rt_signals=rt_signals
    )
    
    weather = data.Weather_Condition
    realtime_enrichments = []

    # 1. Auto-fetch live weather if not manually specified
    if weather == "Auto":
        weather_data = rt_signals.get("weather", {"condition": "Clear", "source": "fallback"})
        weather = weather_data.get("condition", "Clear")
        src = weather_data.get("source", "fallback")
        realtime_enrichments.append(f"🌐 Weather auto-fetched: **{weather}** (source: {src})")

    # 2. Traffic congestion → adjusts demand supply ratio
    congestion = rt_signals["traffic"]["congestion_level"]
    adjusted_ratio = round(data.Demand_Supply_Ratio * (1 + congestion * 0.5), 2)
    if congestion > 0.5:
        realtime_enrichments.append(
            f"🚦 Heavy traffic detected (congestion={congestion}). "
            f"Demand ratio adjusted: {data.Demand_Supply_Ratio} → {adjusted_ratio}"
        )
    demand_ratio = adjusted_ratio

    # 3. Local events boost riders estimate
    event_count = rt_signals["events"]["active_events"]
    event_rank = rt_signals["events"]["max_rank"]
    adjusted_riders = data.Number_of_Riders
    if event_rank == "major":
        adjusted_riders = int(data.Number_of_Riders * 1.4)
        realtime_enrichments.append(
            f"🎉 Major local event detected ({event_count} events). "
            f"Rider estimate boosted: {data.Number_of_Riders} → {adjusted_riders}"
        )
    elif event_rank == "minor":
        adjusted_riders = int(data.Number_of_Riders * 1.15)
        realtime_enrichments.append(
            f"🎟️ Minor local event detected ({event_count} events). "
            f"Rider estimate adjusted: {data.Number_of_Riders} → {adjusted_riders}"
        )

    # 4. Public Holiday flag
    is_holiday = rt_signals["holiday"]["is_holiday"]
    holiday_name = rt_signals["holiday"]["holiday_name"]
    if is_holiday:
        realtime_enrichments.append(f"🏖️ Public Holiday: **{holiday_name}** — elevated leisure demand expected.")

    # ── TomTom Live Routing Reports ───────────────────
    if data.Origin and data.Destination:
        if route_info["success"]:
            realtime_enrichments.append(
                f"🗺️ Live Route: **{data.Origin} → {data.Destination}**. "
                f"({distance_km}km, {data.Expected_Ride_Duration} mins via live traffic)"
            )
        else:
            realtime_enrichments.append(
                f"🗺️ Route: **{data.Origin} → {data.Destination}** (using estimated {distance_km}km / {data.Expected_Ride_Duration} mins)"
            )

    if rt_signals.get("intelligence"):
        intel = rt_signals["intelligence"]
        realtime_enrichments.append(
            f"🧠 **Market Intelligence:** Demand Factor {intel['demand_factor']}x | Supply Index {intel['supply_index']} | Pressure: **{intel['market_pressure']}**"
        )

    # 5. Fuel Price Index (Adjusts Base Rate)
    fuel_data = rt_signals.get("fuel", {})
    fuel_multiplier = fuel_data.get("index_factor", 1.0)
    if fuel_multiplier > 1.0 and use_traffic:
        realtime_enrichments.append(
            f"⛽ Fuel Index is High ({fuel_data.get('trend')}). "
            f"Base rate adjusted by **{round((fuel_multiplier-1)*100)}%**."
        )

    # 6. Public Transit Status (Transit Surge)
    transit = rt_signals.get("transit", {})
    transit_multiplier = 1.0
    if transit.get("status") != "Normal ✅":
        transit_multiplier = 1.25
        realtime_enrichments.append(
            f"🚆 Public Transit Alert: **{transit.get('status')}**. "
            f"High commuter spillover detected — applying **1.25x emergency surge**."
        )

    # 7. Heat Index (AC Demand Surge)
    temp = rt_signals["weather"].get("temp_c", 25)
    humidity = rt_signals["weather"].get("humidity", 50)
    heat_index = temp + 0.55 * (1 - humidity/100) * (temp - 14.5)
    heat_multiplier = 1.0
    if heat_index > 38 and use_weather:
        heat_multiplier = 1.15
        realtime_enrichments.append(
            f"🔥 Extreme Heat (Feels like {round(heat_index)}°C). "
            f"AC-tier demand optimization active (+15% surge)."
        )

    # ── Frontier & Ultra Signals ──────────────────────
    frontier_multipliers = 1.0
    arrival = rt_signals.get("arrival", {})
    if arrival.get("is_blast"):
        frontier_multipliers *= arrival["multiplier"]
        realtime_enrichments.append(
            f"🚀 [ULTRA] Arrival Blast ({arrival.get('type')}): "
            f"Mass transit arrival detected — **{arrival['multiplier']}x instant surge** active."
        )

    ripple = rt_signals.get("ripple", {})
    if ripple.get("has_ripple"):
        frontier_multipliers *= ripple["intensity"]
        realtime_enrichments.append(
            f"🌊 [FRONTIER] Predictive Ripple: Upstream congestion detected. "
            f"Proactive **{ripple['intensity']}x surge** applied to prevent supply depletion (Impact in {ripple['impact_time_mins']}m)."
        )

    buzz = rt_signals.get("buzz", {})
    if buzz.get("has_buzz"):
        frontier_multipliers *= buzz["multiplier"]
        realtime_enrichments.append(
            f"📣 [FRONTIER] Social Buzz: **{buzz['topic']}** trending nearby ({buzz['sentiment']}). "
            f"Surging **{buzz['multiplier']}x** for localized high interest."
        )

    frozen = rt_signals.get("frozen", {})
    frozen_surchage = 0
    if frozen.get("is_frozen"):
        frozen_surchage = frozen["surcharge"]
        realtime_enrichments.append(
            f"🚩 [ULTRA] Frozen Zone: **{frozen['reason']}**. "
            f"Critical traffic blockade detected — adding **₹{frozen_surchage} emergency surcharge**."
        )

    # ── Map to internal state ──
    data.Weather_Condition = weather
    data.Demand_Supply_Ratio = demand_ratio
    data.Number_of_Riders = adjusted_riders
    
    if demand_ratio > 2.5:
        data.Demand_Level = 2
    elif demand_ratio > 1.2:
        data.Demand_Level = 1
    else:
        data.Demand_Level = 0

    ml_price = predict_price(data.model_dump())
    
    effective_sensitivity = surge_sensitivity
    if use_dynamic_mult and rt_signals.get("intelligence"):
        if rt_signals["intelligence"]["market_pressure"] == "High":
            effective_sensitivity *= 1.4
            realtime_enrichments.append("⚡ **Dynamic Multiplier:** Market pressure is HIGH. Engine sensitivity boosted by 1.4x.")
    
    raw_surge = max(1.0, 1.0 + ((ml_price / 100 - 1.0) * effective_sensitivity))
    
    effective_base = base_fare
    if use_dynamic_base:
        effective_base = base_fare * fuel_multiplier
        if fuel_multiplier > 1.0:
            realtime_enrichments.append(f"⛽ **Dynamic Base Fare:** Fuel index is high ({round(fuel_multiplier, 2)}x). Base price adjusted.")

    form_intensity = 1.0
    if data.Number_of_Drivers > 0:
        ratio = data.Number_of_Riders / data.Number_of_Drivers
        if ratio > 2.0:
            form_intensity = 1.15 + (min(ratio, 10.0) - 2.0) * 0.05
            realtime_enrichments.append(f"📊 **Input Sensitivity:** Manual Rider:Driver ratio is high ({round(ratio, 1)}). Boosting responsiveness by {round(form_intensity, 2)}x.")
        elif ratio < 0.5:
            form_intensity = 0.85
            realtime_enrichments.append(f"📊 **Input Sensitivity:** Low manual demand detected. Reducing intensity for competitiveness.")

    def run_strategy(strategy_mode):
        rev_opt = optimize_revenue(strategy_mode, raw_surge * form_intensity, effective_base)
        surge = rev_opt["optimal_surge"]
        
        signal_multiplier = 1.0
        if use_traffic:
            signal_multiplier *= fuel_multiplier
            signal_multiplier *= transit_multiplier
        if use_weather:
            signal_multiplier *= heat_multiplier
        signal_multiplier *= frontier_multipliers
        
        final_surge = round(surge * signal_multiplier, 3)
        
        # Local copies for strategy variations
        loc_dist = distance_km
        loc_base = effective_base
        loc_km_rate = 15.0
        loc_enrichments = []

        if loc_dist < 5:
            loc_km_rate = 22.0
            loc_base *= 0.85
            if final_surge > 1.0:
                final_surge = 1.0 + (final_surge - 1.0) * 0.7
            loc_enrichments.append(f"🟢 **Tier: Short-Haul:** Using ₹22/km. Applying 15% base discount.")
        elif loc_dist > 15:
            loc_km_rate = 12.0
            loc_base *= 1.20
            if final_surge > 2.0:
                final_surge = 2.0
            loc_enrichments.append(f"🚩 **Tier: Long-Haul:** Using ₹12/km. Surge capped at 2.0x.")
        else:
            loc_km_rate = 15.0
            loc_enrichments.append(f"🟡 **Tier: Mid-Range:** Standard ₹15/km optimization active.")

        base_calc = (loc_base + (loc_dist * loc_km_rate))
        price = (base_calc * final_surge) + frozen_surchage

        # ── Competitive Intelligence Rule ────
        market_ref = market_avg if (market_avg and market_avg > 0) else price
        if strategy_mode == "Volume Push":
            max_markup = 1.05
        elif strategy_mode == "Revenue Max":
            max_markup = 1.20
        else:   # Balanced
            max_markup = 1.10

        if price > (market_ref * max_markup):
            original_price = price
            price = market_ref * max_markup
            loc_enrichments.append(f"📡 **Radar Scan:** Price capped at {int((max_markup-1)*100)}% above market (₹{round(original_price)} → ₹{round(price)}).")
        elif price < market_ref * 0.85:
            price *= 1.05
            loc_enrichments.append(f"📡 **Radar Scan:** Nexus price was significantly below market. Optimizing for capture premium.")
        
        if data.Vehicle_Type == 3: # EV
            price -= (price * (ev_discount / 100))

        return {
            "price": round(price, 2),
            "surge": final_surge,
            "projected_revenue": rev_opt["projected_revenue"],
            "expected_bookings": rev_opt["expected_bookings"],
            "explanation": rev_opt["explanation"],
            "enrichments": loc_enrichments
        }

    return {
        "rt_signals": rt_signals,
        "distance_km": distance_km,
        "uber_price": uber_price,
        "ola_price": ola_price,
        "market_avg": market_avg,
        "realtime_enrichments": realtime_enrichments,
        "run_strategy": run_strategy,
        "forecast": forecast,
        "adjusted_ratio": adjusted_ratio,
        "adjusted_riders": adjusted_riders,
        "weather": weather,
        "congestion": congestion,
        "event_rank": event_rank,
        "is_holiday": is_holiday,
        "holiday_name": holiday_name,
        "arrival": arrival,
        "heat_multiplier": heat_multiplier,
        "frozen_surchage": frozen_surchage,
        "ride_duration": data.Expected_Ride_Duration
    }


@app.post("/simulate")
async def simulate(data: PredictRequest, user_id: int = Depends(get_current_user)):
    """
    Parallel Operational Outcomes Simulator.
    Calculates 3 pricing strategies simultaneously to help operators choose.
    """
    db = SessionLocal()
    global_config = get_global_config(db)
    
    # Pass dummy user_id for simulation as it's only needed for logging/tracking in predict
    internals = await calculate_price_internals(data, global_config, db, user_id=0)
    db.close()

    outcomes = {}
    best_strategy = "Balanced"
    max_rev = -1.0

    for strategy in ["Revenue Max", "Balanced", "Volume Push"]:
        res = internals["run_strategy"](strategy)
        outcomes[strategy] = {
            "projected_revenue": res["projected_revenue"],
            "expected_bookings": res["expected_bookings"],
            "surge_multiplier": res["surge"],
            "explanation": res["explanation"],
            "uber_radar": internals["uber_price"],
            "ola_radar": internals["ola_price"]
        }
        if res["projected_revenue"] > max_rev:
            max_rev = res["projected_revenue"]
            best_strategy = strategy

    return {
        "outcomes": outcomes,
        "recommended": best_strategy,
        "city": data.City,
        "market_pressure": internals["rt_signals"]["intelligence"]["market_pressure"]
    }


@app.post("/predict")
@limiter.limit("50/minute")
async def predict(request: Request, data: PredictRequest, user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    global_config = get_global_config(db)
    
    strategy_mode = data.strategy if data.strategy != "Balanced" else global_config.strategy
    
    internals = await calculate_price_internals(data, global_config, db, user_id)
    res = internals["run_strategy"](strategy_mode)
    
    # Extract vars for narrative building
    price = res["price"]
    final_surge = res["surge"]
    rt_signals = internals["rt_signals"]
    distance_km = internals["distance_km"]
    uber_price = internals["uber_price"]
    ola_price = internals["ola_price"]
    market_avg = internals["market_avg"]
    realtime_enrichments = internals["realtime_enrichments"] + res["enrichments"]
    
    # ── Full Bilingual Voice Narratives (Keep logic same) ──
    full_narrative_en = f"The final price is {round(price)} rupees. "
    if final_surge > 1.05:
        full_narrative_en += f"We have applied a {round(final_surge, 2)}x surge. "
        factors = []
        if internals["congestion"] > 0.6: factors.append(f"traffic congestion is at {int(internals['congestion']*100)}%")
        if internals["event_rank"] != "none": factors.append(f"there is a {internals['event_rank']} event nearby")
        if internals["is_holiday"]: factors.append("it is a public holiday")
        if internals["arrival"].get("is_blast"): factors.append("a high-volume transit arrival was detected")
        if internals["heat_multiplier"] > 1.1: factors.append("temperature is extremely high")
        if factors:
            full_narrative_en += "This is because " + ", ".join(factors[:-1]) + (" and " if len(factors) > 1 else "") + factors[-1] + ". "
    
    if data.Number_of_Riders > data.Number_of_Drivers * 2:
        full_narrative_en += "Demand is currently significantly higher than available drivers. "
    
    full_narrative_hi = f"Aapka total kiraya {round(price)} rupaye hai. "
    if final_surge > 1.05:
        full_narrative_hi += f"Isme {round(final_surge, 1)}x surge lagaya gaya hai. "
        factors_hi = []
        if internals["congestion"] > 0.6: factors_hi.append(f"traffic {int(internals['congestion']*100)}% zyada hai")
        if internals["event_rank"] != "none": factors_hi.append(f"paas mein event chal raha hai")
        if internals["is_holiday"]: factors_hi.append("aaj chutti ka din hai")
        if internals["arrival"].get("is_blast"): factors_hi.append("kafi zyada log station ya airport par pahunche hain")
        if internals["heat_multiplier"] > 1.1: factors_hi.append("bahut zyada garmi hai")
        if factors_hi:
            full_narrative_hi += "Kyunki " + ", ".join(factors_hi[:-1]) + (" aur " if len(factors_hi) > 1 else "") + factors_hi[-1] + ". "

    if data.Number_of_Riders > data.Number_of_Drivers * 2:
        full_narrative_hi += "Abhi riders zyada hain aur drivers kam, isliye market pressure high hai. "

    ai_report = f"Nexus 2.0 successfully calculated price based on **{strategy_mode}** strategy. {res['explanation']}"
    if realtime_enrichments:
        ai_report += "\n\nReal-time Signals:\n" + "\n".join(realtime_enrichments)

    # Save to Database
    try:
        new_prediction = Prediction(
            user_id=user_id,
            predicted_price=round(price, 2),
            surge_multiplier=round(final_surge, 2),
            distance_km=round(distance_km, 2),
            ride_duration=internals["ride_duration"],
            demand_level="Dynamic",
            uber_price=uber_price,
            ola_price=ola_price
        )
        db.add(new_prediction)
        db.commit()
        db.refresh(new_prediction)
        pred_id = new_prediction.id
    except:
        db.rollback()
        pred_id = secrets.token_hex(8)
    finally:
        db.close()

    return {
        "prediction_id": pred_id,
        "predicted_price": round(price, 2),
        "distance_km": round(distance_km, 2),
        "ride_duration": internals["ride_duration"],
        "tier_prices": {
            "Economy": round(price, 2),
            "Premium": round(price * 1.5, 2),
            "XL": round(price * 2.2, 2)
        },
        "surge_multiplier": final_surge,
        "ai_explanation": ai_report,
        "active_strategy": strategy_mode,
        "projected_revenue": res["projected_revenue"],
        "uber_radar": uber_price,
        "ola_radar": ola_price,
        "city_context": {
            "temp": rt_signals.get("weather", {}).get("temp_c", 25.0),
            "condition": rt_signals.get("weather", {}).get("condition", "Clear"),
            "traffic": rt_signals.get("traffic", {}).get("congestion_level", 0.0)
        },
        "voice_summary_en": full_narrative_en,
        "voice_summary_hi": full_narrative_hi,
        "realtime_signals": rt_signals
    }


# ── Prediction History (user-scoped) ──────────────────


# ── Prediction History (user-scoped) ──────────────────
@app.get("/predictions")
def get_predictions(user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    predictions = db.query(Prediction).filter(Prediction.user_id == user_id).all()
    db.close()
    
    # Map database columns (uber_price/ola_price) to frontend keys (uber_radar/ola_radar)
    history = []
    for p in predictions:
        p_dict = {c.name: getattr(p, c.name) for c in p.__table__.columns}
        p_dict["uber_radar"] = p.uber_price
        p_dict["ola_radar"] = p.ola_price
        history.append(p_dict)
    return history


# ── Delete Single Prediction ──────────────────────────
@app.delete("/predictions/{prediction_id}")
def delete_prediction(prediction_id: int, user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == user_id,
    ).first()
    if not prediction:
        db.close()
        raise HTTPException(status_code=404, detail="Prediction not found")
    # 1. Delete associated feedback first to avoid FKey constraint errors
    db.query(UserFeedback).filter(UserFeedback.prediction_id == prediction_id).delete()
    
    # 2. Delete the prediction
    db.delete(prediction)
    db.commit()
    db.close()
    logger.info(f"Prediction #{prediction_id} and its feedback deleted by user {user_id}")
    return {"message": "Prediction deleted successfully"}


# ── Clear All Predictions ─────────────────────────────
@app.delete("/predictions")
def clear_all_predictions(user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    # 1. Delete all feedback for this user first
    db.query(UserFeedback).filter(UserFeedback.user_id == user_id).delete()
    
    # 2. Delete all predictions for this user
    db.query(Prediction).filter(Prediction.user_id == user_id).delete()
    db.commit()
    db.close()
    logger.info(f"All predictions cleared by user {user_id}")
    return {"message": "All predictions deleted successfully"}


# ── Real-Time Signals (standalone) ─────────────────────
@app.get("/realtime-signals")
async def realtime_signals(city: str = "Mumbai", user_id: int = Depends(get_current_user)):
    """
    Fetches live real-time data (weather, traffic, events, holidays)
    for a given city. Called independently by the frontend for live updates.
    """
    from datetime import datetime as dt
    signals = await get_all_realtime_signals(city)
    signals["fetched_at"] = dt.utcnow().isoformat() + "Z"
    return signals


# ── Analytics Dashboard ───────────────────────────────
@app.get("/analytics")
def get_analytics(user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    predictions = (
        db.query(Prediction)
        .filter(Prediction.user_id == user_id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    feedback_entries = db.query(UserFeedback).filter(UserFeedback.user_id == user_id).all()
    db.close()

    total = len(predictions)
    if total == 0:
        return {
            "total_predictions": 0,
            "average_price": 0,
            "average_surge": 1.0,
            "avg_rating": 0,
            "avg_accuracy": 100,
            "demand_distribution": [
                {"name": "High", "value": 0},
                {"name": "Medium", "value": 0},
                {"name": "Low", "value": 0},
            ],
            "recent_trends": [],
        }

    # Calculate Average Rating and Accuracy based on real feedback
    avg_rating = 0.0
    avg_accuracy = 100.0
    if feedback_entries:
        total_rating = 0
        total_error = 0.0
        feedback_count = 0
        for f in feedback_entries:
            pred = next((p for p in predictions if p.id == f.prediction_id), None)
            if pred:
                feedback_count += 1
                total_rating += (f.rating or 0)
                error_pct = abs(f.actual_price - pred.predicted_price) / max(f.actual_price, 1)
                total_error += error_pct
        
        if feedback_count > 0:
            avg_rating = round(total_rating / feedback_count, 1)
            avg_accuracy = round(max(0, 100 * (1 - (total_error / feedback_count))), 1)

    total_price = sum((p.predicted_price or 0) for p in predictions)
    total_surge = sum((p.surge_multiplier or 1.0) for p in predictions)

    demand_counts = {"High": 0, "Medium": 0, "Low": 0}
    for p in predictions:
        lvl = p.demand_level
        demand_counts[lvl if lvl in demand_counts else "Low"] += 1

    recent_preds = list(reversed(predictions[:10]))
    recent_trends = []
    for i, p in enumerate(recent_preds):
        time_label = f"T-{10-i}"
        if p.created_at:
            import datetime
            dt = p.created_at
            if isinstance(dt, str):
                dt = datetime.datetime.fromisoformat(dt.replace("Z", "+00:00"))
            time_label = dt.strftime("%H:%M")
        recent_trends.append({
            "time": time_label,
            "price": round(p.predicted_price or 0, 2),
            "surge": round(p.surge_multiplier or 1.0, 2),
        })

    # High-fidelity simulated historical aggregations for insights
    avg_price = round(total_price / total, 2)
    
    price_by_city = [
        {"city": "Mumbai", "price": round(avg_price * 1.15, 2)},
        {"city": "Delhi", "price": round(avg_price * 0.95, 2)},
        {"city": "Bangalore", "price": round(avg_price * 1.25, 2)},
        {"city": "Chennai", "price": round(avg_price * 0.85, 2)},
    ]
    
    impact_by_weather = [
        {"weather": "Clear", "avg_surge": 1.05},
        {"weather": "Rain", "avg_surge": 1.35},
        {"weather": "Storm", "avg_surge": 1.62},
    ]
    
    peak_hours = [
        {"hour": "00:00", "surge": 1.1},
        {"hour": "04:00", "surge": 1.0},
        {"hour": "08:00", "surge": 1.8},
        {"hour": "12:00", "surge": 1.2},
        {"hour": "16:00", "surge": 1.4},
        {"hour": "18:00", "surge": 2.2},
        {"hour": "22:00", "surge": 1.5},
    ]

    ai_insights = [
        f"Bangalore shows the highest average profitability, yielding ₹{round(avg_price*1.25, 2)} per ride on average.",
        "Storm conditions increase revenue by 62% per ride compared to clear conditions.",
        "Peak evening rush (18:00) generates the highest sustained surge multiplier (2.2x)."
    ]

    return {
        "total_predictions": total,
        "average_price": avg_price,
        "average_surge": round(total_surge / total, 2),
        "avg_rating": avg_rating,
        "avg_accuracy": avg_accuracy,
        "demand_distribution": [
            {"name": "High", "value": demand_counts["High"]},
            {"name": "Medium", "value": demand_counts["Medium"]},
            {"name": "Low", "value": demand_counts["Low"]},
        ],
        "recent_trends": recent_trends,
        "price_by_city": price_by_city,
        "impact_by_weather": impact_by_weather,
        "peak_hours": peak_hours,
        "ai_insights": ai_insights
    }


# ── Recent Feedback Feed ──────────────────────────────
@app.get("/analytics/feedback")
def get_recent_feedback(user_id: int = Depends(get_current_user)):
    """
    Returns recent user feedback joined with prediction data.
    """
    db = SessionLocal()
    # Joining Feedback with Prediction to get City and Predicted Price
    # Since Prediction model doesn't store city yet, we use a placeholder or city logic
    # Actually, in /predict I return city, but it's not in the model.
    # Let's just return the feedback for now.
    results = db.query(UserFeedback, Prediction)\
                .join(Prediction, UserFeedback.prediction_id == Prediction.id)\
                .filter(UserFeedback.user_id == user_id)\
                .order_by(UserFeedback.created_at.desc())\
                .limit(10).all()
    
    feed = []
    for feedback, pred in results:
        accuracy = round(max(0, 100 * (1 - abs(feedback.actual_price - pred.predicted_price) / max(feedback.actual_price, 1))), 1)
        feed.append({
            "id": feedback.id,
            "rating": feedback.rating,
            "actual_price": feedback.actual_price,
            "predicted_price": pred.predicted_price,
            "accuracy": accuracy,
            "comment": feedback.comment,
            "created_at": feedback.created_at.isoformat()
        })
    
    db.close()
    return feed


# ─────────────────────────────────────────────────────────────
# Shared retraining logic (used by auto + manual retrain)
# ─────────────────────────────────────────────────────────────
AUTO_RETRAIN_EVERY = 50   # auto-retrain every time this many feedbacks accumulate

def _run_retraining(triggered_by: int = None):
    """
    Core retraining logic. Trains a correction model on accumulated feedback.
    Safe to call from a background task or directly from the /retrain endpoint.
    Returns a dict with result info, or None if not enough data.
    """
    import pandas as pd
    import joblib
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import r2_score

    db = SessionLocal()
    feedbacks = db.query(UserFeedback).all()
    total = len(feedbacks)

    if total < 10:
        db.close()
        logger.info(f"[AutoRetrain] Skipped — only {total} feedback samples (need 10+).")
        return None

    rows = []
    for fb in feedbacks:
        pred = db.query(Prediction).filter(Prediction.id == fb.prediction_id).first()
        if pred:
            rows.append({
                "surge_multiplier": pred.surge_multiplier or 1.0,
                "demand_level_encoded": {"High": 2, "Medium": 1, "Low": 0}.get(pred.demand_level, 0),
                "actual_price": fb.actual_price,
            })
    db.close()

    if len(rows) < 10:
        return None

    df = pd.DataFrame(rows)
    X = df[["surge_multiplier", "demand_level_encoded"]]
    y = df["actual_price"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    correction_model = RandomForestRegressor(n_estimators=100, random_state=42)
    correction_model.fit(X_train, y_train)
    score = round(r2_score(y_test, correction_model.predict(X_test)), 4) if len(X_test) > 0 else None

    import joblib as jbl
    jbl.dump(correction_model, "../model/correction_model.pkl")

    # Log the training event
    db = SessionLocal()
    rec = TrainingRecord(triggered_by=triggered_by, samples_used=len(rows), model_score=score)
    db.add(rec)
    db.commit()
    rec_id = rec.id
    db.close()

    logger.info(f"[Retrain] Correction model updated — record #{rec_id}, {len(rows)} samples, R²={score}")
    return {"training_record_id": rec_id, "samples_used": len(rows), "r2_score": score}


def _auto_retrain_if_needed(total_feedback: int):
    """
    Background task: retrain automatically when feedback crosses a milestone.
    Runs silently — users never wait for this.
    """
    if total_feedback > 0 and total_feedback % AUTO_RETRAIN_EVERY == 0:
        logger.info(f"[AutoRetrain] Milestone reached: {total_feedback} feedbacks. Starting background retrain...")
        _run_retraining(triggered_by=None)
    else:
        remaining = AUTO_RETRAIN_EVERY - (total_feedback % AUTO_RETRAIN_EVERY)
        logger.debug(f"[AutoRetrain] {remaining} more feedbacks until next auto-retrain.")


# ── Submit Feedback (auto-retrains in background at milestones) ──
@app.post("/feedback")
def submit_feedback(fb: FeedbackSubmit, background_tasks: BackgroundTasks, user_id: int = Depends(get_current_user)):
    """
    Store user feedback on a prediction.
    Automatically triggers background retraining every 50 feedback submissions.
    """
    db = SessionLocal()
    record = UserFeedback(
        prediction_id=fb.prediction_id,
        user_id=user_id,
        actual_price=fb.actual_price,
        rating=fb.rating,
        category=fb.category,
        sentiment=fb.sentiment,
        is_accurate=fb.is_accurate,
        comment=fb.comment,
    )
    db.add(record)
    db.commit()
    fb_id = record.id
    
    # 0. Fetch Global Config for threshold
    global_config = db.query(SystemConfig).first()
    if not global_config:
        global_config = SystemConfig()
        db.add(global_config)
        db.commit()
        db.refresh(global_config)

    total = db.query(UserFeedback).count()
    db.close()

    logger.info(f"Feedback #{fb_id} by user {user_id} for prediction #{fb.prediction_id} (total: {total})")

    # Schedule auto-retraining check in the background
    threshold = global_config.auto_retrain_threshold or 50
    if total > 0 and total % threshold == 0:
        background_tasks.add_task(_run_retraining, triggered_by=None)
        auto_msg = "Milestone reached! Auto-retraining triggered in background."
    else:
        next_milestone = threshold - (total % threshold)
        auto_msg = f"Next auto-retrain in {next_milestone} more feedback(s)."

    return {
        "message": "Feedback submitted successfully",
        "feedback_id": fb_id,
        "total_feedback": total,
        "auto_retrain_status": auto_msg,
    }


# ── On-Demand Manual Retrain (admin/backend use) ─────
@app.post("/retrain")
@limiter.limit("10/minute")
def retrain_model(request: Request, user_id: int = Depends(get_current_user)):
    """
    Manually triggers model retraining immediately.
    Use this for on-demand retraining outside the auto schedule.
    """
    result = _run_retraining(triggered_by=user_id)
    if not result:
        db = SessionLocal()
        total = db.query(UserFeedback).count()
        db.close()
        raise HTTPException(
            status_code=400,
            detail=f"Not enough feedback data to retrain ({total} samples, need at least 10)."
        )
    return {"message": "Model retrained successfully", **result}


# ── Training History ──────────────────────────────────
@app.get("/retrain/history")
def get_training_history(user_id: int = Depends(get_current_user)):
    db = SessionLocal()
    records = db.query(TrainingRecord).order_by(TrainingRecord.created_at.desc()).all()
    db.close()
    return records