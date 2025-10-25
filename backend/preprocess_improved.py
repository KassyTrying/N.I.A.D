import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os

# Get the absolute path to the backend directory
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

def preprocess_data(input_file=os.path.join(BACKEND_DIR, "data", "KDDTrain+.txt"),
                    output_features=os.path.join(BACKEND_DIR, "model", "X_scaled.pkl"),
                    output_labels=os.path.join(BACKEND_DIR, "model", "y.pkl"),
                    output_scaler=os.path.join(BACKEND_DIR, "model", "scaler.pkl"),
                    output_encoders=os.path.join(BACKEND_DIR, "model", "categorical_encoders.pkl")):
    """
    Preprocess the NSL-KDD dataset:
    1. Encodes categorical features (protocol_type, service, flag)
    2. Converts attack labels to binary (normal vs attack)
    3. Scales features using StandardScaler
    4. Saves the processed features, labels, scaler, and encoders to disk
    
    Args:
        input_file (str): Path to the input dataset
        output_features (str): Path to save scaled features
        output_labels (str): Path to save encoded labels
        output_scaler (str): Path to save the scaler
        output_encoders (str): Path to save categorical encoders
    """
    try:
        # Load data
        print(f"[INFO] Loading data from {input_file}...")
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Input file not found: {input_file}")
            
        df = pd.read_csv(input_file, header=None)
        print(f"[INFO] Dataset shape: {df.shape}")

        # Define column names based on KDD dataset structure
        column_names = ['duration', 'protocol_type', 'service', 'flag', 'src_bytes',
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
                    'dst_host_srv_rerror_rate', 'attack', 'level']
        df.columns = column_names

        # Separate features and labels
        X = df.iloc[:, :-2]
        y = df.iloc[:, -2].apply(lambda x: 0 if x == 'normal' else 1)

        # Identify categorical columns by name
        categorical_cols = ['protocol_type', 'service', 'flag']
        categorical_encoders = {}

        # Encode categorical features
        for col in categorical_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            categorical_encoders[col] = le
        print("[INFO] Categorical features encoded.")

        # Handle missing values
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.mean())
        
        # Make sure all data is numeric
        X = X.apply(pd.to_numeric, errors='coerce')

        # Scale features
        print("[INFO] Scaling features...")
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        print("[INFO] Features scaled.")

        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_features), exist_ok=True)

        # Save processed data and models
        joblib.dump(X_scaled, output_features)
        joblib.dump(y, output_labels)
        joblib.dump(scaler, output_scaler)
        joblib.dump(categorical_encoders, output_encoders)
        print(f"[INFO] Processed features saved to {output_features}")
        print(f"[INFO] Processed labels saved to {output_labels}")
        print(f"[INFO] Scaler saved to {output_scaler}")
        print(f"[INFO] Categorical encoders saved to {output_encoders}")
        print("[INFO] Preprocessing complete.")
        
    except FileNotFoundError as e:
        print(f"[ERROR] {str(e)}")
        raise
    except Exception as e:
        print(f"[ERROR] An error occurred during preprocessing: {str(e)}")
        raise

if __name__ == "__main__":
    preprocess_data()