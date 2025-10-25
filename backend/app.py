from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Ensure the backend directory is on sys.path so local imports work when running
# the app from the repository root. This makes imports like `import preprocess_improved`
# and `from utils.predict import predict` reliable.
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import importlib.util
import pandas as pd

# Dynamically load utility modules from the backend/utils folder to avoid
# relying on package layout or sys.path order. This keeps imports robust when
# running the app from different working directories.
def _load_module_from_path(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

_utils_dir = os.path.join(BACKEND_DIR, 'utils')
_predict_path = os.path.join(_utils_dir, 'predict.py')
_preproc_path = os.path.join(_utils_dir, 'preprocess_improved.py')

_predict_mod = _load_module_from_path('predict', _predict_path)
predict = _predict_mod.predict

_preproc_mod = _load_module_from_path('preprocess_improved', _preproc_path)
preprocessor = _preproc_mod

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
        
        # Now run predictions over the preprocessed file that was saved by the
        # preprocessor. The `predict_file` helper loads `model/X_scaled.pkl`
        # and the trained model to produce per-sample predictions.
        if hasattr(_predict_mod, 'predict_file'):
            result = _predict_mod.predict_file()
        else:
            # Fallback: try calling the regular predict function (legacy)
            result = predict({})

        # Determine if anomaly was found
        # Expect result to include a 'predictions' list of 0/1 values
        preds = result.get('predictions') if isinstance(result, dict) else None
        if preds is None:
            # If predictions aren't provided, conservatively assume anomaly if
            # the returned prediction string contains 'attack'.
            is_anomaly = str(result.get('prediction', '')).lower() == 'attack'
        else:
            is_anomaly = any(int(p) == 1 for p in preds)
        
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
