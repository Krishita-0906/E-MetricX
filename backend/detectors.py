import numpy as np

def detect_emission_anomalies(years, diesel_data, electricity_data):
    """
    Statistical Anomaly Detection using Z-Score
    Flags years where consumption is significantly higher than average.
    """
    anomalies = []
    
    datasets = [
        {"name": "Diesel Spike", "data": diesel_data},
        {"name": "Electricity Surge", "data": electricity_data}
    ]

    for ds in datasets:
        data = np.array(ds['data'])
        mean = np.mean(data)
        std_dev = np.std(data)
        
        for i, val in enumerate(data):
            # Z-Score formula: (val - mean) / std_dev
            z_score = (val - mean) / std_dev if std_dev > 0 else 0
            
            # Threshold of 1.5 for synthetic/small datasets to ensure a hit
            if z_score > 1.5:
                anomalies.append({
                    "year": years[i],
                    "type": ds['name'],
                    "description": f"Consumption of {val} is significantly above the historical mean of {round(mean, 2)}."
                })
                
    return anomalies