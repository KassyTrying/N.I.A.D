# import pandas as pd
# import numpy as np
# from sklearn.preprocessing import StandardScaler, LabelEncoder
# import joblib
# import os

# def preprocess_data(data):
#     """
#     Preprocess the input data for anomaly detection
#     """
#     try:
#         # Get the absolute path to the model directory
#         BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
#         MODEL_DIR = os.path.join(BACKEND_DIR, "model")
        
#         # Load the scaler and encoders
#         scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
#         encoders = joblib.load(os.path.join(MODEL_DIR, "categorical_encoders.pkl"))
        
#         # Handle categorical features (if any)
#         categorical_columns = data.select_dtypes(include=['object']).columns
#         for column in categorical_columns:
#             if column in encoders:
#                 data[column] = encoders[column].transform(data[column])
#             else:
#                 # If we encounter a new categorical column, we'll skip it
#                 data = data.drop(columns=[column])
        
#         # Convert to numeric, replacing any remaining non-numeric values with 0
#         numeric_data = data.apply(pd.to_numeric, errors='coerce').fillna(0)
        
#         # Scale the features
#         scaled_data = scaler.transform(numeric_data)
        
#         return scaled_data
        
#     except Exception as e:
#         raise Exception(f"Error in preprocessing: {str(e)}")