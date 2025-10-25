import numpy as np
import joblib
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
print("NumPy version:", np.__version__)
print("Joblib version:", joblib.__version__)
print("Pandas version:", pd.__version__)
print("Scikit-learn version:", StandardScaler().__class__.__module__.split('.')[0])