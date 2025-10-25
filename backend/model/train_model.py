import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
import os

# Get the absolute path to the backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Path to preprocessed files
X_path = os.path.join(BACKEND_DIR, "model", "X_scaled.pkl")
y_path = os.path.join(BACKEND_DIR, "model", "y.pkl")
model_output = os.path.join(BACKEND_DIR, "model", "random_forest.pkl")

print("[INFO] Loading preprocessed data...")
X = joblib.load(X_path)
y = joblib.load(y_path)

# Split the data into training and testing sets
print("[INFO] Splitting data into train/test sets...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Train Random Forest
print("[INFO] Training Random Forest model...")
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=20,
    min_samples_split=10,
    min_samples_leaf=4,
    max_features='sqrt',
    class_weight='balanced',
    random_state=42,
    n_jobs=-1,
    verbose=1
)
model.fit(X_train, y_train)

# Get predictions
print("[INFO] Making predictions...")
train_predictions = model.predict(X_train)
test_predictions = model.predict(X_test)
train_proba = model.predict_proba(X_train)
test_proba = model.predict_proba(X_test)

# Calculate ROC AUC scores
train_auc = roc_auc_score(y_train, train_proba[:, 1])
test_auc = roc_auc_score(y_test, test_proba[:, 1])

print("[INFO] Model training complete...")

# Evaluation
print("\n[INFO] Evaluating model...")
print("\nTraining Set Performance:")
print("-------------------------")
print(f"Accuracy: {accuracy_score(y_train, train_predictions):.4f}")
print(f"ROC AUC Score: {train_auc:.4f}")
print("\nConfusion Matrix:")
print(confusion_matrix(y_train, train_predictions))
print("\nClassification Report:")
print(classification_report(y_train, train_predictions))

print("\nTest Set Performance:")
print("-------------------------")
print(f"Accuracy: {accuracy_score(y_test, test_predictions):.4f}")
print(f"ROC AUC Score: {test_auc:.4f}")
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, test_predictions))
print("\nClassification Report:")
print(classification_report(y_test, test_predictions))

# Feature importance analysis
feature_importance = pd.DataFrame({
    'feature': range(X.shape[1]),
    'importance': model.feature_importances_
})
print("\nTop 10 Most Important Features:")
print(feature_importance.nlargest(10, 'importance'))

# Save the trained model
print(f"\n[INFO] Saving trained model to {model_output}...")
joblib.dump(model, model_output)
print("[SUCCESS] Model saved successfully.")