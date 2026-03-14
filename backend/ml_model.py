import joblib
import pandas as pd

model = joblib.load("../model/dynamic_pricing_model.pkl")
features = joblib.load("../model/feature_columns.pkl")


def predict_price(data):

    df = pd.DataFrame([data])

    df = df[features]

    price = model.predict(df)[0]

    return price