import os
import subprocess
import sys
import time

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n[STEP] {description}")
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed:")
        print(e.stderr)
        return False

def main():
    """
    Quickstart script to run the entire pipeline:
    1. Install dependencies
    2. Preprocess data
    3. Train model
    4. Run tests
    5. Start the Flask server
    """
    print("[SETUP] Starting Network Intrusion and Anomaly Detection System...")
    
    # Get the Python executable path
    python_exe = sys.executable
    
    try:
        # Install requirements
        if not run_command(
            [python_exe, "-m", "pip", "install", "-r", "requirements.txt"],
            "Installing requirements"
        ):
            return
        
        # Run preprocessing
        if not run_command(
            [python_exe, "preprocess_improved.py"],
            "Preprocessing data"
        ):
            return
            
        # Train model
        if not run_command(
            [python_exe, os.path.join("model", "train_model.py")],
            "Training model"
        ):
            return
            
        # Run tests
        if not run_command(
            [python_exe, "test_system.py"],
            "Running system tests"
        ):
            return
            
        # Start Flask server
        print("\n[FINAL STEP] Starting Flask server...")
        print("API will be available at http://localhost:5000")
        print("Press Ctrl+C to stop the server")
        subprocess.run([python_exe, "app.py"], check=True)
        
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down...")
    except Exception as e:
        print(f"\n[ERROR] An unexpected error occurred: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()