from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.predict import predict
import os
import pandas as pd
import preprocess_improved as preprocessor

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/predict', methods=['POST'])
def predict_route():
    try:
        # Get input data from request
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No input data provided"}), 400
            
        # Make prediction
        result = predict(data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/process-file', methods=['POST'])
def process_file():
    try:
        # Get the filename from request
        file_name = request.json.get('fileName')
        if not file_name:
            return jsonify({"error": "No file name provided"}), 400
            
        # Get the absolute path to the data directory
        BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
        DATA_DIR = os.path.join(BACKEND_DIR, "data")
        file_path = os.path.join(DATA_DIR, file_name)
        
        if not os.path.exists(file_path):
            return jsonify({"error": f"File {file_name} not found"}), 404
            
        # Preprocess the file using the improved preprocessor
        preprocessor.preprocess_data(input_file=file_path)
        
        # Now use the predict function which will load the preprocessed data
        result = predict({})
        
        # Determine if anomaly was found
        is_anomaly = any(result.get('predictions', [1]))  # 1 indicates anomaly
        
        return jsonify({
            "status": "success",
            "anomalyFound": is_anomaly,
            "message": "Anomaly detected!" if is_anomaly else "No anomaly found",
            "details": result
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/available-files', methods=['GET'])
def get_available_files():
    try:
        # Get the absolute path to the data directory
        BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
        DATA_DIR = os.path.join(BACKEND_DIR, "data")
        
        # Get list of available files
        files = [f for f in os.listdir(DATA_DIR) 
                if os.path.isfile(os.path.join(DATA_DIR, f)) 
                and f.endswith(('.txt', '.csv', '.arff'))]
        
        return jsonify({
            "files": files
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    try:
        # Get the absolute path to the backend directory
        BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
        
        # Check if model file exists
        model_exists = os.path.exists(os.path.join(BACKEND_DIR, "model", "isolation_forest.pkl"))
        scaler_exists = os.path.exists(os.path.join(BACKEND_DIR, "model", "scaler.pkl"))
        encoders_exist = os.path.exists(os.path.join(BACKEND_DIR, "model", "categorical_encoders.pkl"))
        
        return jsonify({
            "model_loaded": model_exists,
            "scaler_loaded": scaler_exists,
            "encoders_loaded": encoders_exist,
            "status": "ready" if all([model_exists, scaler_exists, encoders_exist]) else "not_ready"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
