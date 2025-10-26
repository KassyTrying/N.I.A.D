import joblib
import numpy as np
import pandas as pd
import os

# Get the absolute path to the backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL = None
SCALER = None
ENCODERS = None

def load_models(features_path=os.path.join(BACKEND_DIR, "model", "X_scaled.pkl"),
               labels_path=os.path.join(BACKEND_DIR, "model", "y.pkl"),
               scaler_path=os.path.join(BACKEND_DIR, "model", "scaler.pkl"),
               encoders_path=os.path.join(BACKEND_DIR, "model", "categorical_encoders.pkl"),
               model_path=os.path.join(BACKEND_DIR, "model", "random_forest.pkl")):
    """
    Load all necessary models and preprocessors. This function returns newly loaded
    components; callers in this module will cache them in module-level globals.
    """
    try:
        scaler = joblib.load(scaler_path)
        encoders = joblib.load(encoders_path)
        model = joblib.load(model_path)
        return model, scaler, encoders
    except Exception as e:
        raise Exception(f"Error loading models: {str(e)}")

def ensure_models_loaded():
    """Ensure module-level MODEL/SCALER/ENCODERS are loaded and cached.
    Calling this repeatedly is inexpensive after first load.
    """
    global MODEL, SCALER, ENCODERS
    if MODEL is None or SCALER is None or ENCODERS is None:
        MODEL, SCALER, ENCODERS = load_models()
    return MODEL, SCALER, ENCODERS

def preprocess_input(data, scaler, encoders):
    """
    Preprocess input data using saved encoders and scaler
    
    Args:
        data (dict): Dictionary containing feature values
        scaler: Fitted StandardScaler
        encoders: Dictionary of fitted LabelEncoders
    """
    try:
        # Convert input to DataFrame
        df = pd.DataFrame([data])
        
        # Encode categorical features
        for col, encoder in encoders.items():
            if col in df.columns:
                df[col] = encoder.transform(df[col].astype(str))
        
        # Convert to numeric
        df = df.apply(pd.to_numeric, errors='coerce')
        
        # Handle missing values
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.fillna(df.mean())
        
        # Scale features
        X_scaled = scaler.transform(df)
        
        return X_scaled
        
    except Exception as e:
        raise Exception(f"Error preprocessing input: {str(e)}")

def predict(data):
    """
    Make predictions on input data
    
    Args:
        data (dict): Dictionary containing feature values
    
    Returns:
        dict: Prediction results including class and confidence
    """
    try:
        # Load models (cached)
        model, scaler, encoders = ensure_models_loaded()

        # Preprocess input
        X = preprocess_input(data, scaler, encoders)
        
        # Make prediction
        prediction = model.predict(X)
        probabilities = model.predict_proba(X)
        
        # Get confidence score
        confidence = np.max(probabilities)
        
        return {
            "prediction": "attack" if prediction[0] == 1 else "normal",
            "confidence": float(confidence),
            "is_attack": bool(prediction[0])
        }
        
    except Exception as e:
        raise Exception(f"Prediction error: {str(e)}")
