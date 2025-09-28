"""
EcoVerse Dataset Processing Service
Processes and analyzes real-world carbon footprint datasets
"""

import pandas as pd
import numpy as np
import os
from typing import Dict, List, Any, Optional
from pathlib import Path
import logging
from datetime import datetime, timedelta
import json

from app.models.models import CarbonActivity, ActivityCategory

logger = logging.getLogger(__name__)

class DatasetProcessor:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.datasets = {
            'carbon_emission': None,
            'iot_carbon': None,
            'household_power': None
        }
        self.processed_insights = {}

    async def load_datasets(self) -> bool:
        """Load all available datasets"""
        try:
            # Load Carbon Emission dataset
            carbon_path = os.path.join(self.data_dir, "Carbon Emission.csv")
            if os.path.exists(carbon_path):
                self.datasets['carbon_emission'] = pd.read_csv(carbon_path)
                logger.info(f"Loaded Carbon Emission dataset: {len(self.datasets['carbon_emission'])} records")

            # Load IoT Carbon dataset
            iot_path = os.path.join(self.data_dir, "IoT_Carbon_Footprint_Dataset.csv")
            if os.path.exists(iot_path):
                self.datasets['iot_carbon'] = pd.read_csv(iot_path)
                logger.info(f"Loaded IoT Carbon dataset: {len(self.datasets['iot_carbon'])} records")

            # Load Household Power dataset
            power_path = os.path.join(self.data_dir, "household_power_consumption.txt")
            if os.path.exists(power_path):
                self.datasets['household_power'] = pd.read_csv(
                    power_path,
                    sep=';',
                    parse_dates=[['Date', 'Time']],
                    na_values=['?']
                )
                logger.info(f"Loaded Household Power dataset: {len(self.datasets['household_power'])} records")

            # Process initial insights
            await self._process_dataset_insights()
            return True

        except Exception as e:
            logger.error(f"Error loading datasets: {e}")
            return False

    async def _process_dataset_insights(self):
        """Process datasets to extract insights"""
        insights = {}

        # Process Carbon Emission dataset
        if self.datasets['carbon_emission'] is not None:
            df = self.datasets['carbon_emission']
            insights['lifestyle_patterns'] = {
                'total_users': len(df),
                'avg_carbon_emission': float(df['CarbonEmission'].mean()),
                'emission_by_diet': df.groupby('Diet')['CarbonEmission'].mean().to_dict(),
                'emission_by_transport': df.groupby('Transport')['CarbonEmission'].mean().to_dict(),
                'emission_by_energy_source': df.groupby('Heating Energy Source')['CarbonEmission'].mean().to_dict(),
                'high_emitters_percentage': float((df['CarbonEmission'] > df['CarbonEmission'].quantile(0.75)).sum() / len(df) * 100)
            }

        # Process IoT Carbon dataset
        if self.datasets['iot_carbon'] is not None:
            df = self.datasets['iot_carbon']
            insights['iot_patterns'] = {
                'total_readings': len(df),
                'avg_energy_usage': float(df['Energy_Usage_kWh'].mean()),
                'avg_carbon_emission': float(df['Carbon_Emission_kgCO2'].mean()),
                'renewable_usage_avg': float(df['Renewable_Energy_Usage_percent'].mean()),
                'emission_by_vehicle': df.groupby('Vehicle_Type')['Carbon_Emission_kgCO2'].mean().to_dict(),
                'emission_by_building': df.groupby('Building_Type')['Carbon_Emission_kgCO2'].mean().to_dict()
            }

        # Process Household Power dataset (sample)
        if self.datasets['household_power'] is not None:
            df = self.datasets['household_power'].dropna()
            if len(df) > 0:
                # Sample data for performance
                sample_df = df.sample(n=min(10000, len(df)), random_state=42)
                insights['power_patterns'] = {
                    'total_readings': len(df),
                    'avg_global_power': float(sample_df['Global_active_power'].mean()),
                    'avg_voltage': float(sample_df['Voltage'].mean()),
                    'peak_usage_hours': self._find_peak_usage_hours(sample_df)
                }

        self.processed_insights = insights
        logger.info("Processed dataset insights successfully")

    def _find_peak_usage_hours(self, df: pd.DataFrame) -> List[int]:
        """Find peak usage hours from household power data"""
        try:
            df['hour'] = pd.to_datetime(df['Date_Time']).dt.hour
            hourly_avg = df.groupby('hour')['Global_active_power'].mean()
            return hourly_avg.nlargest(3).index.tolist()
        except:
            return [19, 20, 21]  # Default peak hours

    async def get_personalized_recommendations(self, user_activities: List[CarbonActivity]) -> List[Dict[str, Any]]:
        """Generate personalized recommendations based on user data and dataset insights"""
        if not self.datasets['carbon_emission'] is not None:
            return []

        recommendations = []
        df = self.datasets['carbon_emission']

        # Calculate user's profile
        user_total_emission = sum(activity.carbon_emission for activity in user_activities)

        # Diet-based recommendations
        diet_emissions = self.processed_insights.get('lifestyle_patterns', {}).get('emission_by_diet', {})
        if diet_emissions:
            lowest_diet = min(diet_emissions.items(), key=lambda x: x[1])
            if user_total_emission > diet_emissions.get('omnivore', 2000):
                recommendations.append({
                    'id': 'diet_change',
                    'title': f'Consider {lowest_diet[0].title()} Diet',
                    'description': f'Users with {lowest_diet[0]} diet have {lowest_diet[1]:.0f}kg CO2e average emissions, which is lower than omnivore diet.',
                    'impact': {
                        'carbon_reduction': max(50, diet_emissions.get('omnivore', 2000) - lowest_diet[1]),
                        'cost': 0,
                        'difficulty': 'medium'
                    },
                    'data_source': 'Carbon Emission Dataset'
                })

        # Transportation recommendations
        transport_emissions = self.processed_insights.get('lifestyle_patterns', {}).get('emission_by_transport', {})
        if transport_emissions:
            lowest_transport = min(transport_emissions.items(), key=lambda x: x[1])
            recommendations.append({
                'id': 'transport_change',
                'title': f'Switch to {lowest_transport[0].replace("/", " or ").title()}',
                'description': f'Users using {lowest_transport[0]} have {lowest_transport[1]:.0f}kg CO2e average emissions.',
                'impact': {
                    'carbon_reduction': max(30, transport_emissions.get('private', 2000) - lowest_transport[1]),
                    'cost': 50,
                    'difficulty': 'easy'
                },
                'data_source': 'Carbon Emission Dataset'
            })

        # Energy source recommendations
        energy_emissions = self.processed_insights.get('lifestyle_patterns', {}).get('emission_by_energy_source', {})
        if energy_emissions:
            lowest_energy = min(energy_emissions.items(), key=lambda x: x[1])
            recommendations.append({
                'id': 'energy_change',
                'title': f'Switch to {lowest_energy[0].title()} Energy',
                'description': f'Users with {lowest_energy[0]} heating have {lowest_energy[1]:.0f}kg CO2e average emissions.',
                'impact': {
                    'carbon_reduction': max(100, energy_emissions.get('coal', 2500) - lowest_energy[1]),
                    'cost': 500,
                    'difficulty': 'hard'
                },
                'data_source': 'Carbon Emission Dataset'
            })

        # IoT-based recommendations
        if self.datasets['iot_carbon'] is not None:
            iot_insights = self.processed_insights.get('iot_patterns', {})
            renewable_avg = iot_insights.get('renewable_usage_avg', 50)

            recommendations.append({
                'id': 'renewable_energy',
                'title': 'Increase Renewable Energy Usage',
                'description': f'IoT data shows average renewable usage is {renewable_avg:.1f}%. Increasing yours could reduce emissions significantly.',
                'impact': {
                    'carbon_reduction': 80,
                    'cost': 300,
                    'difficulty': 'medium'
                },
                'data_source': 'IoT Carbon Footprint Dataset'
            })

        return recommendations[:4]  # Return top 4 recommendations

    async def get_comparative_insights(self, user_activities: List[CarbonActivity]) -> List[Dict[str, Any]]:
        """Generate insights comparing user to dataset patterns"""
        insights = []

        if not user_activities:
            return insights

        user_total_emission = sum(activity.carbon_emission for activity in user_activities)

        # Compare with Carbon Emission dataset
        if self.datasets['carbon_emission'] is not None:
            lifestyle_data = self.processed_insights.get('lifestyle_patterns', {})
            avg_emission = lifestyle_data.get('avg_carbon_emission', 2000)

            if user_total_emission < avg_emission:
                percentile = ((avg_emission - user_total_emission) / avg_emission) * 100
                insights.append({
                    'id': 'lifestyle_comparison',
                    'title': 'Below Average Emissions',
                    'message': f'Your carbon footprint is {percentile:.1f}% below the dataset average of {avg_emission:.0f}kg CO2e.',
                    'severity': 'success',
                    'data_source': 'Carbon Emission Dataset'
                })
            else:
                percentile = ((user_total_emission - avg_emission) / avg_emission) * 100
                insights.append({
                    'id': 'lifestyle_comparison',
                    'title': 'Above Average Emissions',
                    'message': f'Your carbon footprint is {percentile:.1f}% above the dataset average. Consider our recommendations.',
                    'severity': 'warning',
                    'data_source': 'Carbon Emission Dataset'
                })

        # Compare with IoT dataset
        if self.datasets['iot_carbon'] is not None:
            iot_data = self.processed_insights.get('iot_patterns', {})
            iot_avg = iot_data.get('avg_carbon_emission', 25)

            # Calculate daily equivalent
            daily_user_emission = user_total_emission / 30  # Assume monthly data

            if daily_user_emission < iot_avg:
                insights.append({
                    'id': 'iot_comparison',
                    'title': 'Efficient Energy Usage',
                    'message': f'Your daily emissions ({daily_user_emission:.1f}kg) are below IoT device average ({iot_avg:.1f}kg).',
                    'severity': 'success',
                    'data_source': 'IoT Carbon Footprint Dataset'
                })
            else:
                insights.append({
                    'id': 'iot_comparison',
                    'title': 'High Energy Usage Detected',
                    'message': f'Your daily emissions are {((daily_user_emission - iot_avg) / iot_avg * 100):.1f}% above IoT average.',
                    'severity': 'info',
                    'data_source': 'IoT Carbon Footprint Dataset'
                })

        return insights

    async def get_dataset_summary(self) -> Dict[str, Any]:
        """Get summary of all loaded datasets"""
        summary = {
            'datasets_loaded': [],
            'total_records': 0,
            'insights': self.processed_insights
        }

        for name, dataset in self.datasets.items():
            if dataset is not None:
                summary['datasets_loaded'].append({
                    'name': name,
                    'records': len(dataset),
                    'columns': list(dataset.columns) if hasattr(dataset, 'columns') else []
                })
                summary['total_records'] += len(dataset)

        return summary

    async def export_processed_data(self, output_path: str = "processed_data.json"):
        """Export processed insights and summaries"""
        export_data = {
            'processing_date': datetime.now().isoformat(),
            'dataset_summary': await self.get_dataset_summary(),
            'processed_insights': self.processed_insights
        }

        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)

        logger.info(f"Exported processed data to {output_path}")

# Global instance
dataset_processor = DatasetProcessor()