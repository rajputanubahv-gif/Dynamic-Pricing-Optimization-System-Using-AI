import joblib
import pandas as pd

MODEL_PATH = "../model/dynamic_pricing_model.pkl"
FEATURES_PATH = "../model/feature_columns.pkl"

model = joblib.load(MODEL_PATH)
features = joblib.load(FEATURES_PATH)


def predict_price(data: dict) -> float:
    df = pd.DataFrame([data])
    df = df[features]
    return model.predict(df)[0]


def reload_model():
    """
    Hot-swap the model in memory after retraining.
    Called by POST /retrain after the new .pkl is saved to disk.
    No server restart needed.
    """
    global model, features
    model = joblib.load(MODEL_PATH)
    features = joblib.load(FEATURES_PATH)
    return True