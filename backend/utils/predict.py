import joblib
import numpy as np
import pandas as pd
import os

# Get the absolute path to the backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_models(features_path=os.path.join(BACKEND_DIR, "model", "X_scaled.pkl"),
               labels_path=os.path.join(BACKEND_DIR, "model", "y.pkl"),
               scaler_path=os.path.join(BACKEND_DIR, "model", "scaler.pkl"),
               encoders_path=os.path.join(BACKEND_DIR, "model", "categorical_encoders.pkl"),
               model_path=os.path.join(BACKEND_DIR, "model", "random_forest.pkl")):
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


def predict_file(features_path=os.path.join(BACKEND_DIR, "model", "X_scaled.pkl"),
                 model_path=os.path.join(BACKEND_DIR, "model", "random_forest.pkl")):
    """
    Run predictions on a saved, preprocessed features file (joblib dump).

    Returns a summary dict containing predictions and basic statistics.
    """
    try:
        # Load preprocessed features
        X = joblib.load(features_path)

        # Ensure X is a 2D numpy array
        X = np.asarray(X)
        if X.ndim == 1:
            X = X.reshape(1, -1)

        # Load model
        model = joblib.load(model_path)

        # Make predictions
        preds = model.predict(X)

        # Normalize anomaly label conventions: map -1 -> 1 (anomaly)
        preds = np.array([1 if p == -1 else int(p) for p in preds])

        # Try to get probabilities if available
        probs = None
        if hasattr(model, 'predict_proba'):
            try:
                probs = model.predict_proba(X)
                # take per-sample max probability
                max_probs = np.max(probs, axis=1)
                mean_confidence = float(np.mean(max_probs))
            except Exception:
                probs = None
                mean_confidence = None
        else:
            mean_confidence = None

        n = len(preds)
        num_anomalies = int(np.sum(preds == 1))

        return {
            "predictions": preds.tolist(),
            "num_samples": n,
            "num_anomalies": num_anomalies,
            "anomaly_ratio": float(num_anomalies) / n if n > 0 else 0.0,
            "prediction": "attack" if num_anomalies > 0 else "normal",
            "confidence": mean_confidence,
        }

    except Exception as e:
        raise Exception(f"Error predicting on saved file: {str(e)}")
