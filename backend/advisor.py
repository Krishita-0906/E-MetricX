def generate_ai_pathways(emissions_breakdown, net_gap, target_year):
    """
    AI Decision Engine for Carbon Neutrality
    emissions_breakdown: {'diesel': 60, 'electricity': 30, 'other': 10}
    net_gap: current tCO2e that needs to be offset
    """
    recommendations = []

    # Rule 1: Prioritize the largest emission source
    if emissions_breakdown['diesel'] > 50:
        recommendations.append({
            "action": "Fleet Electrification",
            "impact": "High",
            "reason": f"Diesel contributes {emissions_breakdown['diesel']}% of total emissions. Transitioning to EV haulers is critical."
        })
    
    # Rule 2: Address Scope 2 (Electricity)
    if emissions_breakdown['electricity'] > 20:
        recommendations.append({
            "action": "Solar PV Installation",
            "impact": "Medium-High",
            "reason": f"Electricity usage is a significant Scope 2 contributor. Offsetting with onsite solar reduces grid dependency."
        })

    # Rule 3: Sequestration (Sinks)
    if net_gap > 1000:
        recommendations.append({
            "action": "Aggressive Afforestation",
            "impact": "Long-term",
            "reason": f"A gap of {net_gap} tCO2e remains. Expanding green cover is necessary to reach neutrality by {target_year}."
        })

    # Rule 4: Last Resort
    if not recommendations:
        recommendations.append({
            "action": "Carbon Credits",
            "impact": "Low",
            "reason": "Current trends are stable; minor gaps can be bridged via certified carbon offsets."
        })

    return recommendations