import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib

def preprocess_data(input_file="data/KDDTrain+.txt",
                    output_features="X_scaled.pkl",
                    output_labels="y.pkl",
                    output_scaler="scaler.pkl",
                    output_encoders="categorical_encoders.pkl"):
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

    # Identify categorical columns
    categorical_cols = [1, 2, 3]  # protocol_type, service, flag
    categorical_encoders = {}

    # Encode categorical features
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        categorical_encoders[col] = le
    print("[INFO] Categorical features encoded.")

    #Make sure all data is numeric
    X = X.apply(pd.to_numeric, errors='coerce')

    # Scale features
    print("[INFO] Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    print("[INFO] Features scaled.")

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

if __name__ == "__main__":
    preprocess_data()
