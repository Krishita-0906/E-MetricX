import numpy as np
from sklearn.linear_model import LinearRegression

def predict_neutrality_year(years, emissions, sinks, max_horizon=2050):
    """
    Predicts the year a mine reaches net zero.
    years: List of historical years [2021, 2022, 2023, 2024, 2025]
    emissions: List of total emissions (tCO2e)
    sinks: List of carbon sinks (tCO2e)
    """
    # Reshape for Scikit-Learn
    X = np.array(years).reshape(-1, 1)
    
    # Train Model 1: Emissions Trend
    model_emissions = LinearRegression().fit(X, emissions)
    
    # Train Model 2: Sink Trend
    model_sinks = LinearRegression().fit(X, sinks)
    
    # Project into the future
    for future_year in range(max(years) + 1, max_horizon + 1):
        future_X = np.array([[future_year]])
        
        pred_emission = model_emissions.predict(future_X)[0]
        pred_sink = model_sinks.predict(future_X)[0]
        
        # Check for neutrality
        if pred_sink >= pred_emission:
            return {
                "neutrality_year": int(future_year),
                "status": "Achievable",
                "projected_emissions": round(pred_emission, 2),
                "projected_sink": round(pred_sink, 2)
            }
            
    return {
        "neutrality_year": None,
        "status": "Not achievable under current trends",
        "message": "Emissions are outpacing sink growth."
    }

# Example Usage
years = [2021, 2022, 2023, 2024, 2025]
emissions = [5000, 4850, 4700, 4600, 4450] # Decreasing trend
sinks = [800, 950, 1100, 1250, 1400]        # Increasing trend

result = predict_neutrality_year(years, emissions, sinks)
print(result)