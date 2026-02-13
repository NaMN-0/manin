
import numpy as np
import pandas as pd

def test_regression():
    print("Testing Numpy Regression Logic...")
    # Dummy data
    X = np.array([[1, 2], [3, 4], [5, 6]])
    y = np.array([10, 20, 30])
    
    # Expected: y = 5x1 + 0x2 + 5 roughly? 
    # Let's just check it runs without error and produces a float
    
    try:
        X_b = np.c_[X, np.ones((X.shape[0], 1))]
        theta, residuals, rank, s = np.linalg.lstsq(X_b, y, rcond=None)
        
        latest_features = np.array([[7, 8]])
        latest_features_b = np.c_[latest_features, np.ones((1, 1))]
        
        predicted_price = float(latest_features_b.dot(theta)[0])
        print(f"Prediction: {predicted_price}")
        print("Success!")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_regression()
