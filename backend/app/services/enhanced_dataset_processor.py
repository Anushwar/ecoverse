# Enhanced Dataset Processing Service for EcoVerse
import pandas as pd
import numpy as np
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime
from dataclasses import dataclass

logger = logging.getLogger(__name__)


def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, (pd.Series, pd.DataFrame)):
        return convert_numpy_types(obj.to_dict())
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(item) for item in obj]
    elif hasattr(obj, 'item'):  # Additional numpy scalar types
        return obj.item()
    return obj


@dataclass
class DatasetInsight:
    """Dataset analysis insight"""

    title: str
    description: str
    data: Dict[str, Any]
    confidence: float
    source_dataset: str
    insight_type: str  # trend, correlation, comparison, prediction


@dataclass
class CarbonBenchmark:
    """Carbon footprint benchmarks from datasets"""

    category: str
    low_emission: float
    avg_emission: float
    high_emission: float
    unit: str
    sample_size: int


class EnhancedDatasetProcessor:
    """Enhanced dataset processor for comprehensive carbon footprint analysis"""

    def __init__(self):
        # Set data directory relative to project root
        self.data_dir = Path(__file__).parent.parent.parent.parent / "data"
        self.insights_cache: Dict[str, List[DatasetInsight]] = {}
        self.benchmarks_cache: Dict[str, List[CarbonBenchmark]] = {}
        self.datasets = {}
        self._load_datasets()

    def _load_datasets(self):
        """Load and preprocess all datasets"""
        try:
            # Load Carbon Emission Dataset
            carbon_emission_path = self.data_dir / "Carbon Emission.csv"
            if carbon_emission_path.exists():
                self.datasets["carbon_emission"] = pd.read_csv(carbon_emission_path)
                logger.info(
                    f"Loaded Carbon Emission dataset: {len(self.datasets['carbon_emission'])} records"
                )

            # Load IoT Carbon Footprint Dataset
            iot_carbon_path = self.data_dir / "IoT_Carbon_Footprint_Dataset.csv"
            if iot_carbon_path.exists():
                self.datasets["iot_carbon"] = pd.read_csv(iot_carbon_path)
                logger.info(
                    f"Loaded IoT Carbon Footprint dataset: {len(self.datasets['iot_carbon'])} records"
                )

            # Load Household Power Consumption Dataset (sample due to size)
            power_consumption_path = self.data_dir / "household_power_consumption.txt"
            if power_consumption_path.exists():
                # Load first 10000 rows for analysis due to file size
                self.datasets["power_consumption"] = pd.read_csv(
                    power_consumption_path,
                    sep=";",
                    nrows=10000,
                    parse_dates=[["Date", "Time"]],
                    na_values="?",
                )
                logger.info(
                    f"Loaded Power Consumption dataset sample: {len(self.datasets['power_consumption'])} records"
                )

        except Exception as e:
            logger.error(f"Error loading datasets: {e}")

    def analyze_carbon_emission_patterns(self) -> List[DatasetInsight]:
        """Analyze patterns from the Carbon Emission dataset"""
        if "carbon_emission" not in self.datasets:
            return []

        df = self.datasets["carbon_emission"]
        insights = []

        try:
            # Diet impact analysis
            diet_emissions = (
                df.groupby("Diet")["CarbonEmission"]
                .agg(["mean", "std", "count"])
                .round(2)
            )
            insights.append(
                DatasetInsight(
                    title="Diet Impact on Carbon Emissions",
                    description=f"Omnivores have the highest average emissions ({diet_emissions.loc['omnivore', 'mean']:.1f} kg CO2e), while vegans have the lowest ({diet_emissions.loc['vegan', 'mean']:.1f} kg CO2e)",
                    data=convert_numpy_types(diet_emissions.to_dict("index")),
                    confidence=0.95,
                    source_dataset="Individual Carbon Footprint Calculation",
                    insight_type="comparison",
                )
            )

            # Transportation analysis
            transport_emissions = (
                df.groupby("Transport")["CarbonEmission"]
                .agg(["mean", "std", "count"])
                .round(2)
            )
            insights.append(
                DatasetInsight(
                    title="Transportation Mode Impact",
                    description="Private vehicles show higher emissions compared to public transport and walking/cycling",
                    data=convert_numpy_types(transport_emissions.to_dict("index")),
                    confidence=0.92,
                    source_dataset="Individual Carbon Footprint Calculation",
                    insight_type="comparison",
                )
            )

            # Energy source analysis
            energy_emissions = (
                df.groupby("Heating Energy Source")["CarbonEmission"]
                .agg(["mean", "std", "count"])
                .round(2)
            )
            insights.append(
                DatasetInsight(
                    title="Heating Energy Source Impact",
                    description="Coal heating shows significantly higher emissions than other energy sources",
                    data=convert_numpy_types(energy_emissions.to_dict("index")),
                    confidence=0.88,
                    source_dataset="Individual Carbon Footprint Calculation",
                    insight_type="comparison",
                )
            )

            # Lifestyle correlation analysis
            lifestyle_factors = [
                "Monthly Grocery Bill",
                "Vehicle Monthly Distance Km",
                "How Long TV PC Daily Hour",
            ]
            correlations = (
                df[lifestyle_factors + ["CarbonEmission"]]
                .corr()["CarbonEmission"]
                .drop("CarbonEmission")
            )

            insights.append(
                DatasetInsight(
                    title="Lifestyle Factor Correlations",
                    description="Vehicle distance and TV/PC usage show strongest correlations with emissions",
                    data=convert_numpy_types(correlations.to_dict()),
                    confidence=0.85,
                    source_dataset="Individual Carbon Footprint Calculation",
                    insight_type="correlation",
                )
            )

        except Exception as e:
            logger.error(f"Error analyzing carbon emission patterns: {e}")

        return insights

    def analyze_iot_carbon_patterns(self) -> List[DatasetInsight]:
        """Analyze patterns from IoT Carbon Footprint dataset"""
        if "iot_carbon" not in self.datasets:
            return []

        df = self.datasets["iot_carbon"]
        insights = []

        try:
            # Energy usage vs emissions
            energy_corr = df["Energy_Usage_kWh"].corr(df["Carbon_Emission_kgCO2"])
            insights.append(
                DatasetInsight(
                    title="Energy Usage Correlation",
                    description=f"Strong correlation between energy usage and carbon emissions (r={energy_corr:.3f})",
                    data=convert_numpy_types({"correlation": energy_corr, "analysis": "energy_emissions"}),
                    confidence=0.93,
                    source_dataset="IoT Carbon Footprint",
                    insight_type="correlation",
                )
            )

            # Vehicle type analysis
            vehicle_emissions = (
                df.groupby("Vehicle_Type")["Carbon_Emission_kgCO2"]
                .agg(["mean", "std", "count"])
                .round(2)
            )
            insights.append(
                DatasetInsight(
                    title="IoT-Monitored Vehicle Emissions",
                    description="Electric vehicles show lowest emissions, while traditional cars show highest",
                    data=convert_numpy_types(vehicle_emissions.to_dict("index")),
                    confidence=0.90,
                    source_dataset="IoT Carbon Footprint",
                    insight_type="comparison",
                )
            )

            # Renewable energy impact
            renewable_high = df[df["Renewable_Energy_Usage_percent"] > 50]
            renewable_low = df[df["Renewable_Energy_Usage_percent"] <= 50]

            high_avg = renewable_high["Carbon_Emission_kgCO2"].mean()
            low_avg = renewable_low["Carbon_Emission_kgCO2"].mean()

            insights.append(
                DatasetInsight(
                    title="Renewable Energy Impact",
                    description=f"High renewable energy usage (>50%) reduces emissions by {((low_avg - high_avg) / low_avg * 100):.1f}%",
                    data=convert_numpy_types({
                        "high_renewable_avg": high_avg,
                        "low_renewable_avg": low_avg,
                        "reduction_percent": (low_avg - high_avg) / low_avg * 100,
                    }),
                    confidence=0.87,
                    source_dataset="IoT Carbon Footprint",
                    insight_type="trend",
                )
            )

            # Building type impact
            building_emissions = (
                df.groupby("Building_Type")["Carbon_Emission_kgCO2"]
                .agg(["mean", "std", "count"])
                .round(2)
            )
            insights.append(
                DatasetInsight(
                    title="Building Type Efficiency",
                    description="Commercial and residential buildings show different emission patterns",
                    data=convert_numpy_types(building_emissions.to_dict("index")),
                    confidence=0.82,
                    source_dataset="IoT Carbon Footprint",
                    insight_type="comparison",
                )
            )

        except Exception as e:
            logger.error(f"Error analyzing IoT carbon patterns: {e}")

        return insights

    def analyze_power_consumption_patterns(self) -> List[DatasetInsight]:
        """Analyze household power consumption patterns"""
        if "power_consumption" not in self.datasets:
            return []

        df = self.datasets["power_consumption"].copy()
        insights = []

        try:
            # Clean and prepare data
            df = df.dropna()

            if "Date_Time" in df.columns:
                df["hour"] = df["Date_Time"].dt.hour
                df["day_of_week"] = df["Date_Time"].dt.day_name()

                # Hourly consumption patterns
                hourly_avg = df.groupby("hour")["Global_active_power"].mean()
                peak_hour = hourly_avg.idxmax()
                peak_consumption = hourly_avg.max()

                insights.append(
                    DatasetInsight(
                        title="Daily Energy Usage Patterns",
                        description=f"Peak energy consumption occurs at {peak_hour}:00 with {peak_consumption:.2f} kW",
                        data=convert_numpy_types({
                            "hourly_consumption": hourly_avg.to_dict(),
                            "peak_hour": peak_hour,
                            "peak_consumption": peak_consumption,
                        }),
                        confidence=0.94,
                        source_dataset="Individual Household Electric Power Consumption",
                        insight_type="trend",
                    )
                )

                # Weekly patterns
                weekly_avg = df.groupby("day_of_week")["Global_active_power"].mean()
                insights.append(
                    DatasetInsight(
                        title="Weekly Energy Consumption Patterns",
                        description="Weekdays show different consumption patterns compared to weekends",
                        data=convert_numpy_types(weekly_avg.to_dict()),
                        confidence=0.89,
                        source_dataset="Individual Household Electric Power Consumption",
                        insight_type="trend",
                    )
                )

            # Sub-metering analysis
            if all(
                col in df.columns
                for col in ["Sub_metering_1", "Sub_metering_2", "Sub_metering_3"]
            ):
                submetering_avg = {
                    "kitchen": df["Sub_metering_1"].mean(),
                    "laundry": df["Sub_metering_2"].mean(),
                    "electric_water_heater_ac": df["Sub_metering_3"].mean(),
                }

                insights.append(
                    DatasetInsight(
                        title="Household Energy Distribution",
                        description="Energy consumption breakdown by household areas",
                        data=convert_numpy_types(submetering_avg),
                        confidence=0.91,
                        source_dataset="Individual Household Electric Power Consumption",
                        insight_type="comparison",
                    )
                )

        except Exception as e:
            logger.error(f"Error analyzing power consumption patterns: {e}")

        return insights

    def generate_carbon_benchmarks(self) -> Dict[str, List[CarbonBenchmark]]:
        """Generate carbon footprint benchmarks from datasets"""
        benchmarks = {}

        try:
            if "carbon_emission" in self.datasets:
                df = self.datasets["carbon_emission"]

                # Overall emissions benchmark
                emissions = df["CarbonEmission"]
                benchmarks["overall"] = [
                    CarbonBenchmark(
                        category="total_emissions",
                        low_emission=emissions.quantile(0.25),
                        avg_emission=emissions.mean(),
                        high_emission=emissions.quantile(0.75),
                        unit="kg CO2e",
                        sample_size=len(emissions),
                    )
                ]

                # Diet-based benchmarks
                diet_benchmarks = []
                for diet in df["Diet"].unique():
                    diet_emissions = df[df["Diet"] == diet]["CarbonEmission"]
                    diet_benchmarks.append(
                        CarbonBenchmark(
                            category=diet,
                            low_emission=diet_emissions.quantile(0.25),
                            avg_emission=diet_emissions.mean(),
                            high_emission=diet_emissions.quantile(0.75),
                            unit="kg CO2e",
                            sample_size=len(diet_emissions),
                        )
                    )
                benchmarks["diet"] = diet_benchmarks

                # Transportation benchmarks
                transport_benchmarks = []
                for transport in df["Transport"].unique():
                    transport_emissions = df[df["Transport"] == transport][
                        "CarbonEmission"
                    ]
                    transport_benchmarks.append(
                        CarbonBenchmark(
                            category=transport,
                            low_emission=transport_emissions.quantile(0.25),
                            avg_emission=transport_emissions.mean(),
                            high_emission=transport_emissions.quantile(0.75),
                            unit="kg CO2e",
                            sample_size=len(transport_emissions),
                        )
                    )
                benchmarks["transport"] = transport_benchmarks

            if "iot_carbon" in self.datasets:
                df = self.datasets["iot_carbon"]

                # Energy usage benchmarks
                energy_benchmarks = []
                energy_bins = pd.cut(
                    df["Energy_Usage_kWh"], bins=3, labels=["low", "medium", "high"]
                )
                for category in ["low", "medium", "high"]:
                    category_data = df[energy_bins == category]
                    if len(category_data) > 0:
                        energy_benchmarks.append(
                            CarbonBenchmark(
                                category=f"energy_usage_{category}",
                                low_emission=category_data[
                                    "Carbon_Emission_kgCO2"
                                ].quantile(0.25),
                                avg_emission=category_data[
                                    "Carbon_Emission_kgCO2"
                                ].mean(),
                                high_emission=category_data[
                                    "Carbon_Emission_kgCO2"
                                ].quantile(0.75),
                                unit="kg CO2",
                                sample_size=len(category_data),
                            )
                        )
                benchmarks["energy_iot"] = energy_benchmarks

        except Exception as e:
            logger.error(f"Error generating benchmarks: {e}")

        return benchmarks

    def get_personalized_insights(
        self, user_activities: List[Dict], user_profile: Dict = None
    ) -> List[DatasetInsight]:
        """Generate personalized insights based on user data and dataset analysis"""
        insights = []

        try:
            if not user_activities:
                return insights

            # Calculate user's total emissions
            user_total_emissions = sum(
                activity.get("carbon_emission", 0) for activity in user_activities
            )

            # Compare with dataset benchmarks
            benchmarks = self.generate_carbon_benchmarks()

            if "overall" in benchmarks and benchmarks["overall"]:
                overall_benchmark = benchmarks["overall"][0]

                if user_total_emissions < overall_benchmark.low_emission:
                    insights.append(
                        DatasetInsight(
                            title="Excellent Carbon Performance",
                            description=f"Your emissions ({user_total_emissions:.1f} kg CO2e) are in the bottom 25% globally",
                            data=convert_numpy_types({
                                "user_emissions": user_total_emissions,
                                "percentile": "bottom_25",
                            }),
                            confidence=0.89,
                            source_dataset="Individual Carbon Footprint Calculation",
                            insight_type="comparison",
                        )
                    )
                elif user_total_emissions > overall_benchmark.high_emission:
                    insights.append(
                        DatasetInsight(
                            title="High Carbon Emissions Detected",
                            description=f"Your emissions ({user_total_emissions:.1f} kg CO2e) are in the top 25% - significant reduction opportunities exist",
                            data=convert_numpy_types({
                                "user_emissions": user_total_emissions,
                                "percentile": "top_25",
                            }),
                            confidence=0.91,
                            source_dataset="Individual Carbon Footprint Calculation",
                            insight_type="alert",
                        )
                    )
                else:
                    insights.append(
                        DatasetInsight(
                            title="Average Carbon Performance",
                            description=f"Your emissions ({user_total_emissions:.1f} kg CO2e) are within the average range",
                            data=convert_numpy_types({
                                "user_emissions": user_total_emissions,
                                "percentile": "average",
                            }),
                            confidence=0.87,
                            source_dataset="Individual Carbon Footprint Calculation",
                            insight_type="comparison",
                        )
                    )

            # Category-specific insights
            user_categories = {}
            for activity in user_activities:
                category = activity.get("category", "other")
                user_categories[category] = user_categories.get(
                    category, 0
                ) + activity.get("carbon_emission", 0)

            if user_categories:
                top_category = max(user_categories.items(), key=lambda x: x[1])
                insights.append(
                    DatasetInsight(
                        title=f"Primary Emission Source: {top_category[0].title()}",
                        description=f"{top_category[0].title()} accounts for {(top_category[1] / user_total_emissions * 100):.1f}% of your carbon footprint",
                        data=convert_numpy_types({
                            "category": top_category[0],
                            "emissions": top_category[1],
                            "percentage": top_category[1] / user_total_emissions * 100,
                        }),
                        confidence=0.95,
                        source_dataset="User Data Analysis",
                        insight_type="comparison",
                    )
                )

        except Exception as e:
            logger.error(f"Error generating personalized insights: {e}")

        return insights

    def get_all_insights(self) -> Dict[str, List[DatasetInsight]]:
        """Get all dataset insights"""
        if not self.insights_cache:
            self.insights_cache = {
                "carbon_emission": self.analyze_carbon_emission_patterns(),
                "iot_carbon": self.analyze_iot_carbon_patterns(),
                "power_consumption": self.analyze_power_consumption_patterns(),
            }

        return self.insights_cache

    def get_dataset_summary(self) -> Dict[str, Any]:
        """Get summary of loaded datasets"""
        summary = {}

        for name, df in self.datasets.items():
            if df is not None:
                summary[name] = {
                    "records": len(df),
                    "columns": list(df.columns),
                    "size_mb": df.memory_usage(deep=True).sum() / 1024 / 1024,
                }

        return summary


# Global instance
enhanced_dataset_processor = EnhancedDatasetProcessor()
