from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from utils.predict import predict, ensure_models_loaded
import os
import pandas as pd
import preprocess_improved as preprocessor
import json
import detect_realtime
from flask import Flask, render_template
app = Flask(__name__,template_folder='../', static_folder='../static')
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
        print(BACKEND_DIR)
        print(DATA_DIR)
        print(file_path)
        if not os.path.exists(file_path):
            return jsonify({"error": f"File {file_name} not found"}), 404
            
        # Preprocess the file using the improved preprocessor
        # preprocessor.preprocess_data(input_file=file_path)

        # json_data -> {}
        # 1. Read file_path
        with open(file_path, 'r') as f:
                try:
                    # Try to parse as JSON first
                    data_dict = json.load(f)
                except json.JSONDecodeError:
                    # Not JSON — treat as a plain text dataset (e.g. KDD files)
                    f.seek(0)
                    lines = [ln for ln in f.read().splitlines() if ln.strip()]
                    # create a lightweight summary result and write results.txt so the frontend sees a file created
                    BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
                    results_path = os.path.join(BACKEND_DIR, 'results.txt')
                    summary = {
                        "file": file_name,
                        "lines": len(lines),
                        "message": "File processed as text; no JSON payload. A summary file was created.",
                    }
                    with open(results_path, 'w') as rf:
                        json.dump(summary, rf)

                    return jsonify({
                        "status": "success",
                        "anomalyFound": False,
                        "message": "Processed text file; results.txt created",
                        "details": summary
                    }), 200

        # If we got here, data_dict is parsed JSON — call predict and detector
        result = predict(data_dict)

        # detect_intrusion(<json data -> {}>) — this will also write results.txt inside detect_realtime
        try:
            detect_realtime.detect_intrusion(data_dict)
        except Exception:
            # Keep going even if the realtime detector errors; prediction result is still returned
            pass

        # Determine if anomaly was found using predict() return value
        is_anomaly = bool(result.get('is_attack', False))

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

@app.route('/', methods=['GET'])
def home():
   return render_template('index.html')

@app.route('/anomaly', methods=['GET'])
def page2():
   return render_template('anomaly.html')
@app.route('/intrusion', methods=['GET'])
def page3():
   return render_template('intrusion.html')
@app.route('/live', methods=['GET'])
def page4():
   return render_template('live.html')

@app.route('/status', methods=['GET'])
def status():
    """Lightweight status endpoint that ensures models are warmed up when possible."""
    try:
        try:
            ensure_models_loaded()
        except Exception:
            # If ensure_models_loaded fails, still return files existence info
            pass

        model_ready = False
        try:
            res = model_info()[0]
            # model_info returns a flask response tuple; attempt to read its JSON
            # but fallback to filesystem checks below
        except Exception:
            res = None

        BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
        model_exists = os.path.exists(os.path.join(BACKEND_DIR, "model", "random_forest.pkl"))
        scaler_exists = os.path.exists(os.path.join(BACKEND_DIR, "model", "scaler.pkl"))
        encoders_exist = os.path.exists(os.path.join(BACKEND_DIR, "model", "categorical_encoders.pkl"))
        model_ready = all([model_exists, scaler_exists, encoders_exist])

        return jsonify({"ready": bool(model_ready)}), 200
    except Exception as e:
        return jsonify({"ready": False, "error": str(e)}), 500


@app.route('/results-file', methods=['GET'])
def get_results_file():
    try:
        BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
        results_path = os.path.join(BACKEND_DIR, 'results.txt')
        if not os.path.exists(results_path):
            return jsonify({"error": "results.txt not found"}), 404
        # serve as attachment so user can download
        return send_file(results_path, mimetype='application/json', as_attachment=True, download_name='results.txt')
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Attempt to warm model assets at startup to reduce first-request latency
    try:
        ensure_models_loaded()
    except Exception:
        # Ignore errors here; /status will still report readiness
        pass
    app.run(debug=True, host='0.0.0.0', port=5000)
