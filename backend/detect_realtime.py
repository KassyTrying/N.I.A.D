import pandas as pd
import numpy as np
import joblib
import os
import sys
import json

def load_model_elements():
    """Load all required model elements with proper error handling"""
    try:
        # Get the absolute path to the backend directory
        BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
        
        model_path = os.path.join(BACKEND_DIR, "model", "random_forest.pkl")
        scaler_path = os.path.join(BACKEND_DIR, "model", "scaler.pkl")
        encoders_path = os.path.join(BACKEND_DIR, "model", "categorical_encoders.pkl")

        # Check if all required files exist
        required_files = {
            "Model": model_path,
            "Scaler": scaler_path,
            "Encoders": encoders_path
        }
        
        for name, path in required_files.items():
            if not os.path.exists(path):
                raise FileNotFoundError(f"{name} file not found at: {path}")

        # Load all components with error handling
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        encoders = joblib.load(encoders_path)

        return model, scaler, encoders
        
    except Exception as e:
        print(f"[ERROR] Failed to load model elements: {str(e)}")
        raise

def preprocess_input(data_dict, scaler, encoders):
    """Preprocess input data with validation and error handling"""
    try:
        # Validate input features
        required_features = set([
            'duration', 'protocol_type', 'service', 'flag', 'src_bytes',
            'dst_bytes', 'land', 'wrong_fragment', 'urgent', 'hot',
            'num_failed_logins', 'logged_in', 'num_compromised', 'root_shell',
            'su_attempted', 'num_root', 'num_file_creations', 'num_shells',
            'num_access_files', 'num_outbound_cmds', 'is_host_login',
            'is_guest_login', 'count', 'srv_count', 'serror_rate',
            'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate', 'same_srv_rate',
            'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count',
            'dst_host_srv_count', 'dst_host_same_srv_rate',
            'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
            'dst_host_srv_diff_host_rate', 'dst_host_serror_rate',
            'dst_host_srv_serror_rate', 'dst_host_rerror_rate',
            'dst_host_srv_rerror_rate'
        ])
        
        missing_features = required_features - set(data_dict.keys())
        if missing_features:
            raise ValueError(f"Missing required features: {missing_features}")

        # Convert to DataFrame
        df = pd.DataFrame([data_dict])

        # Encode categorical columns
        categorical_cols = ['protocol_type', 'service', 'flag']

        for col in categorical_cols:
            if col in df.columns:
                if df[col].values[0] not in encoders[col].classes_:
                    print(f"[WARNING] Unknown value in {col}: {df[col].values[0]}, replacing with 'other'")
                    df[col] = encoders[col].transform(["other"])
                else:
                    df[col] = encoders[col].transform(df[col])

        # Validate numeric values
        df = df.apply(pd.to_numeric, errors="coerce")
        null_columns = df.columns[df.isnull().any()].tolist()
        if null_columns:
            print(f"[WARNING] Non-numeric values found in columns: {null_columns}")
        
        # Handle missing/invalid values
        df = df.fillna(0)
        
        # Scale features
        df_scaled = scaler.transform(df)
        return df_scaled
        
    except Exception as e:
        print(f"[ERROR] Failed to preprocess input: {str(e)}")
        raise

def detect_intrusion(data_dict):
    """Detect intrusion with confidence scores and feature importance"""
    try:
        # Load model components
        model, scaler, encoders = load_model_elements()
        
        # Preprocess input
        X = preprocess_input(data_dict, scaler, encoders)
        
        # Get prediction and probability
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]
        
        # Get feature importance for this prediction
        feature_importance = dict(zip(
            data_dict.keys(),
            model.feature_importances_
        ))
        
        # Sort features by importance
        top_features = dict(sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5])
        
        result = {
            "prediction": "ATTACK" if prediction == 1 else "NORMAL",
            "confidence": float(max(probabilities)),
            "is_attack": bool(prediction == 1),
            "probability_normal": float(probabilities[0]),
            "probability_attack": float(probabilities[1]),
            "top_features": top_features
        }
        # Write results to backend/results.txt so it's easy to find from the server
        BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
        results_path = os.path.join(BACKEND_DIR, 'results.txt')
        with open(results_path, 'w') as json_file:
            json.dump(result, json_file)
        return result
        
    except Exception as e:
        print(f"[ERROR] Detection failed: {str(e)}")
        raise

if __name__ == "__main__":
    # Quick demo input (modify to test)
    sample_input = {
        'duration': 0,
        'protocol_type': 'tcp',
        'service': 'http',
        'flag': 'SF',
        'src_bytes': 181,
        'dst_bytes': 545,
        'land': 0,
        'wrong_fragment': 0,
        'urgent': 0,
        'hot': 0,
        'num_failed_logins': 0,
        'logged_in': 1,
        'num_compromised': 0,
        'root_shell': 0,
        'su_attempted': 0,
        'num_root': 0,
        'num_file_creations': 0,
        'num_shells': 0,
        'num_access_files': 0,
        'num_outbound_cmds': 0,
        'is_host_login': 0,
        'is_guest_login': 0,
        'count': 9,
        'srv_count': 9,
        'serror_rate': 0.00,
        'srv_serror_rate': 0.00,
        'rerror_rate': 0.00,
        'srv_rerror_rate': 0.00,
        'same_srv_rate': 1.00,
        'diff_srv_rate': 0.00,
        'srv_diff_host_rate': 0.00,
        'dst_host_count': 25,
        'dst_host_srv_count': 25,
        'dst_host_same_srv_rate': 1.00,
        'dst_host_diff_srv_rate': 0.00,
        'dst_host_same_src_port_rate': 0.00,
        'dst_host_srv_diff_host_rate': 0.00,
        'dst_host_serror_rate': 0.00,
        'dst_host_srv_serror_rate': 0.00,
        'dst_host_rerror_rate': 0.00,
        'dst_host_srv_rerror_rate': 0.00
    }

    print("\n[RESULT] Detected:", detect_intrusion(sample_input))
