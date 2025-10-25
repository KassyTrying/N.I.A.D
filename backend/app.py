from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.predict import predict
import os

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

@app.route('/model-info', methods=['GET'])
def model_info():
    try:
        # Check if model file exists
        model_exists = os.path.exists("model.pkl")
        scaler_exists = os.path.exists("scaler.pkl")
        encoders_exist = os.path.exists("categorical_encoders.pkl")
        
        return jsonify({
            "model_loaded": model_exists,
            "scaler_loaded": scaler_exists,
            "encoders_loaded": encoders_exists,
            "status": "ready" if all([model_exists, scaler_exists, encoders_exist]) else "not_ready"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
