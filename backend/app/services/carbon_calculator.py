# Carbon Footprint Calculation Engine
import math
from datetime import datetime
from typing import Optional

from app.models.models import (
    CARBON_FACTORS,
    ActivityInput,
    CarbonActivity,
    CarbonCalculationResult,
)


class CarbonCalculator:
    """Advanced carbon footprint calculation engine"""

    def __init__(self):
        self.factors = CARBON_FACTORS

    def calculate_emission(self, activity_input: ActivityInput) -> CarbonCalculationResult:
        """Calculate carbon emission for a single activity"""
        category = activity_input.category.value
        activity_type = activity_input.type
        amount = activity_input.amount
        unit = activity_input.unit

        # Get base emission factor
        base_factor = self._get_emission_factor(category, activity_type)

        # Convert units if necessary
        converted_amount = self._convert_units(amount, unit, category, activity_type)

        # Calculate base emission
        base_emission = base_factor * converted_amount

        # Apply location-based adjustments
        location_multiplier = self._get_location_multiplier(
            activity_input.location, category
        )

        # Apply temporal adjustments (seasonal effects, etc.)
        temporal_multiplier = self._get_temporal_multiplier(
            activity_input.date, category
        )

        # Calculate final emission
        final_emission = base_emission * location_multiplier * temporal_multiplier

        # Calculate confidence based on data quality
        confidence = self._calculate_confidence(category, activity_type, activity_input.metadata)

        # Generate breakdown
        breakdown = [
            {
                "factor": f"{category}_{activity_type}",
                "amount": converted_amount,
                "emission": base_emission,
                "unit": self._get_standard_unit(category)
            },
            {
                "factor": "location_adjustment",
                "amount": location_multiplier,
                "emission": base_emission * (location_multiplier - 1),
                "unit": "multiplier"
            },
            {
                "factor": "temporal_adjustment",
                "amount": temporal_multiplier,
                "emission": base_emission * location_multiplier * (temporal_multiplier - 1),
                "unit": "multiplier"
            }
        ]

        # Generate recommendations
        recommendations = self._generate_calculation_recommendations(
            category, activity_type, final_emission
        )

        return CarbonCalculationResult(
            carbon_emission=final_emission,
            confidence=confidence,
            breakdown=breakdown,
            recommendations=recommendations
        )

    def calculate_daily_footprint(self, activities: list[CarbonActivity]) -> dict[str, float]:
        """Calculate daily carbon footprint from activities"""
        daily_totals = {}

        for activity in activities:
            date_str = activity.date.strftime("%Y-%m-%d")
            daily_totals[date_str] = daily_totals.get(date_str, 0) + activity.carbon_emission

        return daily_totals

    def calculate_category_breakdown(self, activities: list[CarbonActivity]) -> dict[str, dict[str, float]]:
        """Calculate breakdown by category and subcategory"""
        breakdown = {}

        for activity in activities:
            category = activity.category.value
            if category not in breakdown:
                breakdown[category] = {"total": 0, "activities": {}}

            breakdown[category]["total"] += activity.carbon_emission

            activity_type = activity.type
            if activity_type not in breakdown[category]["activities"]:
                breakdown[category]["activities"][activity_type] = 0
            breakdown[category]["activities"][activity_type] += activity.carbon_emission

        return breakdown

    def calculate_trends(self, activities: list[CarbonActivity], days: int = 30) -> dict[str, any]:
        """Calculate emission trends over specified period"""
        if not activities:
            return {"trend": "no_data", "slope": 0, "correlation": 0}

        # Sort activities by date
        sorted_activities = sorted(activities, key=lambda x: x.date)

        # Group by day
        daily_emissions = {}
        for activity in sorted_activities:
            date_str = activity.date.strftime("%Y-%m-%d")
            daily_emissions[date_str] = daily_emissions.get(date_str, 0) + activity.carbon_emission

        # Calculate trend using linear regression
        dates = list(daily_emissions.keys())
        emissions = list(daily_emissions.values())

        if len(dates) < 2:
            return {"trend": "insufficient_data", "slope": 0, "correlation": 0}

        # Convert dates to numeric values (days since first date)
        first_date = datetime.strptime(dates[0], "%Y-%m-%d")
        x_values = [(datetime.strptime(date, "%Y-%m-%d") - first_date).days for date in dates]
        y_values = emissions

        # Calculate linear regression
        n = len(x_values)
        sum_x = sum(x_values)
        sum_y = sum(y_values)
        sum_xy = sum(x * y for x, y in zip(x_values, y_values))
        sum_x2 = sum(x * x for x in x_values)
        sum_y2 = sum(y * y for y in y_values)

        # Calculate slope and correlation
        denominator = n * sum_x2 - sum_x * sum_x
        if denominator == 0:
            slope = 0
        else:
            slope = (n * sum_xy - sum_x * sum_y) / denominator

        # Calculate correlation coefficient
        numerator = n * sum_xy - sum_x * sum_y
        denominator = math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y))
        correlation = numerator / denominator if denominator != 0 else 0

        # Determine trend direction
        if abs(slope) < 0.1:
            trend = "stable"
        elif slope > 0:
            trend = "increasing"
        else:
            trend = "decreasing"

        return {
            "trend": trend,
            "slope": slope,
            "correlation": correlation,
            "daily_average": sum(emissions) / len(emissions),
            "total_days": len(dates)
        }

    def _get_emission_factor(self, category: str, activity_type: str) -> float:
        """Get emission factor for activity type"""
        category_factors = self.factors.get(category, {})
        return category_factors.get(activity_type, 0.0)

    def _convert_units(self, amount: float, unit: str, category: str, activity_type: str) -> float:
        """Convert units to standard units for calculation"""
        # Define unit conversions
        conversions = {
            # Distance conversions to miles
            "km": 0.621371,
            "miles": 1.0,
            "meters": 0.000621371,

            # Weight conversions to pounds
            "kg": 2.20462,
            "lbs": 1.0,
            "pounds": 1.0,
            "grams": 0.00220462,

            # Energy conversions to kWh
            "kwh": 1.0,
            "wh": 0.001,
            "mwh": 1000.0,

            # Volume conversions to gallons
            "gallons": 1.0,
            "liters": 0.264172,
            "therms": 1.0  # Keep therms as-is for natural gas
        }

        return amount * conversions.get(unit.lower(), 1.0)

    def _get_location_multiplier(self, location: Optional[str], category: str) -> float:
        """Get location-based emission multiplier"""
        if not location:
            return 1.0

        # Location-based multipliers (simplified for demo)
        location_multipliers = {
            "california": {"energy": 0.7, "transportation": 1.0},  # Clean energy grid
            "texas": {"energy": 1.3, "transportation": 1.0},      # Coal-heavy grid
            "new_york": {"energy": 0.8, "transportation": 0.9},   # Decent grid, good transit
            "florida": {"energy": 1.1, "transportation": 1.0},    # Mixed energy sources
        }

        location_key = location.lower().replace(" ", "_")
        location_data = location_multipliers.get(location_key, {})
        return location_data.get(category, 1.0)

    def _get_temporal_multiplier(self, date: Optional[datetime], category: str) -> float:
        """Get temporal adjustment multiplier"""
        if not date:
            return 1.0

        # Seasonal adjustments
        month = date.month

        if category == "energy":
            # Higher energy use in summer (AC) and winter (heating)
            if month in [6, 7, 8]:  # Summer
                return 1.2
            elif month in [12, 1, 2]:  # Winter
                return 1.15
            else:
                return 0.95

        elif category == "transportation":
            # Higher travel during holidays
            if month in [7, 8, 12]:  # Summer vacation and holidays
                return 1.1
            else:
                return 1.0

        return 1.0

    def _calculate_confidence(self, category: str, activity_type: str, metadata: Optional[dict]) -> float:
        """Calculate confidence score for emission calculation"""
        base_confidence = 0.8

        # Factor-specific confidence
        factor_confidence = {
            "transportation": {"car_gasoline": 0.9, "flight_domestic": 0.85},
            "energy": {"electricity": 0.95, "natural_gas": 0.9},
            "food": {"beef": 0.8, "vegetables": 0.7}
        }

        category_data = factor_confidence.get(category, {})
        type_confidence = category_data.get(activity_type, base_confidence)

        # Adjust based on metadata quality
        if metadata:
            if "verified" in metadata and metadata["verified"]:
                type_confidence += 0.1
            if "estimated" in metadata and metadata["estimated"]:
                type_confidence -= 0.1

        return min(1.0, max(0.1, type_confidence))

    def _get_standard_unit(self, category: str) -> str:
        """Get standard unit for category"""
        units = {
            "transportation": "miles",
            "energy": "kWh",
            "food": "lbs",
            "waste": "lbs"
        }
        return units.get(category, "units")

    def _generate_calculation_recommendations(self, category: str, activity_type: str, emission: float) -> list[str]:
        """Generate recommendations based on calculation results"""
        recommendations = []

        if emission > 10:  # High emission activity
            if category == "transportation":
                recommendations.append("Consider carpooling or public transit to reduce emissions")
                recommendations.append("Explore electric or hybrid vehicle options")
            elif category == "energy":
                recommendations.append("Look into renewable energy options for your home")
                recommendations.append("Consider energy-efficient appliances")
            elif category == "food":
                recommendations.append("Try plant-based alternatives to reduce food emissions")
                recommendations.append("Choose locally-sourced foods when possible")

        return recommendations

# Utility functions for common calculations
def calculate_commute_emissions(distance_miles: float, vehicle_type: str = "car_gasoline") -> float:
    """Quick calculation for daily commute emissions"""
    calculator = CarbonCalculator()
    daily_emission = calculator._get_emission_factor("transportation", vehicle_type) * distance_miles * 2  # Round trip
    return daily_emission * 5 * 4  # 5 days/week * 4 weeks/month

def calculate_home_energy_emissions(kwh_usage: float, location: str = "") -> float:
    """Quick calculation for monthly home energy emissions"""
    calculator = CarbonCalculator()
    base_emission = calculator._get_emission_factor("energy", "electricity") * kwh_usage
    location_multiplier = calculator._get_location_multiplier(location, "energy")
    return base_emission * location_multiplier

def calculate_diet_emissions(meals_per_week: dict[str, int]) -> float:
    """Quick calculation for weekly diet emissions"""
    calculator = CarbonCalculator()
    total_emission = 0

    # Assume average portion sizes (lbs)
    portion_sizes = {"beef": 0.5, "chicken": 0.4, "fish": 0.4, "vegetables": 0.3}

    for food_type, meals in meals_per_week.items():
        if food_type in portion_sizes:
            emission_factor = calculator._get_emission_factor("food", food_type)
            portion_lbs = portion_sizes[food_type]
            total_emission += emission_factor * portion_lbs * meals

    return total_emission
