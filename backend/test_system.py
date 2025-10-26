import pandas as pd
import numpy as np
import joblib
import os
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import requests
import json

def test_preprocessing():
    """Test the preprocessing pipeline"""
    print("\n=== Testing Preprocessing ===")
    try:
        # Load raw data
        input_file=os.path.join( "data", "KDDTrain+.txt")
        if not os.path.exists(input_file):
            
            print(f"[ERROR] Input file not found: {input_file}")
            return False
            
        # Import the preprocessing function
        from preprocess_improved import preprocess_data
        
        # Run preprocessing
        preprocess_data()
        
        # Check if output files exist
        required_files = [
            os.path.join("model", "X_scaled.pkl"),
            os.path.join("model", "y.pkl"),
            os.path.join("model", "scaler.pkl"),
            os.path.join("model", "categorical_encoders.pkl")
        ]
        
        for file in required_files:
            if not os.path.exists(file):
                print(f"[ERROR] Missing output file: {file}")
                return False
                
        print("[SUCCESS] Preprocessing test passed!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Preprocessing test failed: {str(e)}")
        return False

def test_model():
    """Test the model training and evaluation"""
    print("\n=== Testing Model Training ===")
    try:
        # Import and run model training
        import model.train_model as tm
        
        # Check if model file exists
        model_path = os.path.join("model", "isolation_forest.pkl")
        if not os.path.exists(model_path):
            print(f"[ERROR] Model file not found: {model_path}")
            return False
            
        # Load test data
        X_test = joblib.load(os.path.join("model", "X_scaled.pkl"))
        y_test = joblib.load(os.path.join("model", "y.pkl"))
        model = joblib.load(model_path)
        
        # Make predictions
        predictions = model.predict(X_test)
        predictions = np.where(predictions == -1, 1, 0)
        
        # Print evaluation metrics
        print("\nModel Evaluation:")
        print(f"Accuracy: {accuracy_score(y_test, predictions):.4f}")
        print("\nConfusion Matrix:")
        print(confusion_matrix(y_test, predictions))
        print("\nClassification Report:")
        print(classification_report(y_test, predictions))
        
        print("[SUCCESS] Model training test passed!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Model training test failed: {str(e)}")
        return False

def test_api():
    """Test the Flask API endpoints"""
    print("\n=== Testing API Endpoints ===")
    try:
        base_url = "http://localhost:5000"
        
        # Test health check endpoint
        try:
            response = requests.get(f"{base_url}/health")
            if response.status_code != 200:
                print("[ERROR] Health check failed")
                return False
            print("[SUCCESS] Health check passed")
        except requests.exceptions.ConnectionError:
            print("[ERROR] Cannot connect to server. Make sure Flask app is running.")
            return False
            
        # Test model info endpoint
        response = requests.get(f"{base_url}/model-info")
        if response.status_code != 200:
            print("[ERROR] Model info check failed")
            return False
        print("[SUCCESS] Model info check passed")
        
        # Test prediction endpoint with sample data
        sample_data = {
            "duration": 0,
            "protocol_type": "tcp",
            "service": "http",
            "flag": "SF",
            "src_bytes": 181,
            "dst_bytes": 5450,
            "land": 0,
            "wrong_fragment": 0,
            "urgent": 0,
            "hot": 0,
            "num_failed_logins": 0,
            "logged_in": 1,
            "num_compromised": 0,
            "root_shell": 0,
            "su_attempted": 0,
            "num_root": 0,
            "num_file_creations": 0,
            "num_shells": 0,
            "num_access_files": 0,
            "num_outbound_cmds": 0,
            "is_host_login": 0,
            "is_guest_login": 0,
            "count": 1,
            "srv_count": 1,
            "serror_rate": 0,
            "srv_serror_rate": 0,
            "rerror_rate": 0,
            "srv_rerror_rate": 0,
            "same_srv_rate": 1,
            "diff_srv_rate": 0,
            "srv_diff_host_rate": 0,
            "dst_host_count": 1,
            "dst_host_srv_count": 1,
            "dst_host_same_srv_rate": 1,
            "dst_host_diff_srv_rate": 0,
            "dst_host_same_src_port_rate": 1,
            "dst_host_srv_diff_host_rate": 0,
            "dst_host_serror_rate": 0,
            "dst_host_srv_serror_rate": 0,
            "dst_host_rerror_rate": 0,
            "dst_host_srv_rerror_rate": 0
        }
        
        response = requests.post(f"{base_url}/predict", json=sample_data)
        if response.status_code != 200:
            print(f"[ERROR] Prediction failed: {response.text}")
            return False
            
        result = response.json()
        print("\nPrediction Test Result:")
        print(json.dumps(result, indent=2))
        print("[SUCCESS] Prediction test passed")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] API test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("Starting system tests...")
    
    # Test preprocessing
    if not test_preprocessing():
        print("[ERROR] Preprocessing tests failed. Stopping tests.")
        return
        
    # Test model
    if not test_model():
        print("[ERROR] Model tests failed. Stopping tests.")
        return
        
    # Test API
    if not test_api():
        print("[ERROR] API tests failed.")
        return
        
    print("\n[SUCCESS] All system tests passed!")

if __name__ == "__main__":
    main()