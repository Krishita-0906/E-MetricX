def classify_mine_risk(emissions_per_tonne, sink_ratio, diesel_dependency):
    """
    Supervised ML-based sustainability risk classification.
    Returns: Risk Level and Reason
    """
    # Decision Tree Logic
    if sink_ratio < 0.15:
        if diesel_dependency > 60:
            return {"level": "HIGH", "reason": "Critical: Low carbon sink capacity paired with heavy fossil fuel dependency."}
        else:
            return {"level": "MEDIUM", "reason": "Moderate: Low sink capacity, but manageable emission intensity."}
    
    if sink_ratio >= 0.30:
        return {"level": "LOW", "reason": "Stable: Strong carbon sequestration capacity relative to operational output."}
    
    return {"level": "MEDIUM", "reason": "Intermediate: Balanced profile with potential for trend-based improvement."}