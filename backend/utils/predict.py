import joblib
import numpy as np
import pandas as pd

def load_models(features_path="X_scaled.pkl",
               labels_path="y.pkl",
               scaler_path="scaler.pkl",
               encoders_path="categorical_encoders.pkl",
               model_path="model.pkl"):
    """
    Load all necessary models and preprocessors
    """
    try:
        scaler = joblib.load(scaler_path)
        encoders = joblib.load(encoders_path)
        model = joblib.load(model_path)
        return model, scaler, encoders
    except Exception as e:
        raise Exception(f"Error loading models: {str(e)}")

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
        # Load models
        model, scaler, encoders = load_models()
        
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
