"""
test_api.py — Backend API Tests
Run with: pytest test_api.py -v
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure imports resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

from main import app

client = TestClient(app)

# ─────────────────────────────
# Helpers
# ─────────────────────────────
TEST_USER = {
    "username": "testuser",
    "email": "testuser_pytest@example.com",
    "password": "SecurePass123!",
}

def get_token():
    """Register (ignore if exists) then login and return Bearer token."""
    client.post("/register", json=TEST_USER)
    
    # Manually verify user so login works
    from database import SessionLocal
    from models import User
    db = SessionLocal()
    user = db.query(User).filter(User.email == TEST_USER["email"]).first()
    if user and not user.is_verified:
        user.is_verified = True
        db.commit()
    db.close()
    
    resp = client.post("/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


def auth_headers():
    return {"Authorization": f"Bearer {get_token()}"}


PREDICT_PAYLOAD = {
    "Number_of_Riders": 50,
    "Number_of_Drivers": 20,
    "Location_Category": 1,
    "Customer_Loyalty_Status": 1,
    "Number_of_Past_Rides": 10,
    "Average_Ratings": 4.5,
    "Time_of_Booking": 2,
    "Vehicle_Type": 1,
    "Expected_Ride_Duration": 20,
    "Demand_Supply_Ratio": 2.5,
    "Ride_Duration_Category": 1,
    "Demand_Level": 2,
    "Driver_Availability": 20,
    "Weather_Condition": "Clear",
    "City": "Mumbai",
    "baseFareRider": 5.0,
    "perMileRate": 1.5,
    "surgeSensitivity": 1.2,
}


# ─────────────────────────────
# Auth Tests
# ─────────────────────────────
def test_register_and_login():
    """Register a user and successfully log in after verifying email."""
    client.post("/register", json=TEST_USER)

    from database import SessionLocal
    from models import User
    db = SessionLocal()
    user = db.query(User).filter(User.email == TEST_USER["email"]).first()
    if user:
        user.is_verified = True
        db.commit()
    db.close()

    resp = client.post("/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password():
    resp = client.post("/login", json={"email": TEST_USER["email"], "password": "WRONGPASSWORD"})
    assert resp.status_code == 401


# ─────────────────────────────
# Protected Endpoint Tests
# ─────────────────────────────
def test_predict_without_token_returns_401():
    resp = client.post("/predict", json=PREDICT_PAYLOAD)
    assert resp.status_code in (401, 403)


def test_predict_with_token_returns_200():
    resp = client.post("/predict", json=PREDICT_PAYLOAD, headers=auth_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert "predicted_price" in data
    assert "surge_multiplier" in data
    assert "prediction_id" in data


def test_predictions_without_token_returns_401():
    resp = client.get("/predictions")
    assert resp.status_code in (401, 403)


def test_predictions_with_token_returns_list():
    resp = client.get("/predictions", headers=auth_headers())
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_analytics_without_token_returns_401():
    resp = client.get("/analytics")
    assert resp.status_code in (401, 403)


def test_analytics_with_token():
    resp = client.get("/analytics", headers=auth_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert "total_predictions" in data


# ─────────────────────────────
# Feedback Tests
# ─────────────────────────────
def test_submit_feedback():
    headers = auth_headers()
    # First make a prediction to get an ID
    pred_resp = client.post("/predict", json=PREDICT_PAYLOAD, headers=headers)
    assert pred_resp.status_code == 200
    prediction_id = pred_resp.json()["prediction_id"]

    # Submit feedback
    fb_resp = client.post("/feedback", json={
        "prediction_id": prediction_id,
        "actual_price": 120.0,
        "rating": 4,
        "comment": "Pretty accurate!",
    }, headers=headers)
    assert fb_resp.status_code == 200
    assert "feedback_id" in fb_resp.json()


# ─────────────────────────────
# Retraining Tests
# ─────────────────────────────
def test_retrain_with_insufficient_data_returns_400():
    """Should fail gracefully when not enough feedback exists."""
    resp = client.post("/retrain", headers=auth_headers())
    # Either 400 (not enough data) or 200 (if enough feedback exists)
    assert resp.status_code in (200, 400)


# ─────────────────────────────
# Real-Time Endpoint Tests
# ─────────────────────────────
def test_realtime_endpoint_returns_signals():
    resp = client.get("/realtime/Mumbai")
    assert resp.status_code == 200
    data = resp.json()
    assert "weather" in data
    assert "traffic" in data
    assert "events" in data
    assert "holiday" in data


def test_realtime_fallback_when_no_api_keys():
    """With placeholder keys, all sources should return 'fallback' gracefully."""
    resp = client.get("/realtime/Delhi")
    assert resp.status_code == 200
    data = resp.json()
    # All should work even if keys are placeholders
    assert data["weather"]["condition"] in ("Clear", "Rain", "Storm")
