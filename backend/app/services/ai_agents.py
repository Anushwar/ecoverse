# AI Agent System for EcoVerse
import asyncio
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import google.generativeai as genai

from app.models.models import (
    ActivityCategory,
    AIRecommendation,
    CarbonActivity,
    CarbonInsight,
    Difficulty,
    Impact,
    InsightType,
    RecommendationType,
    Severity,
    User,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Base class for all AI agents"""

    def __init__(self, agent_id: str, name: str, description: str):
        self.agent_id = agent_id
        self.name = name
        self.description = description
        self.capabilities = []

    @abstractmethod
    async def execute(self, input_data: dict[str, Any]) -> Any:
        """Execute the agent's main functionality"""
        pass

    def log(self, message: str):
        logger.info(f"[{self.name}]: {message}")


class CarbonAnalysisAgent(BaseAgent):
    """Analyzes carbon footprint patterns and identifies trends"""

    def __init__(self):
        super().__init__(
            "carbon-analysis-agent",
            "Carbon Analysis Agent",
            "Analyzes carbon footprint patterns and identifies trends",
        )
        self.capabilities = [
            "pattern-analysis",
            "trend-detection",
            "anomaly-detection",
            "comparative-analysis",
        ]

    async def execute(self, input_data: dict[str, Any]) -> list[CarbonInsight]:
        """Analyze carbon footprint data and generate insights"""
        self.log("Analyzing carbon footprint patterns...")

        user: User = input_data["user"]
        activities: list[CarbonActivity] = input_data["activities"]
        timeframe: str = input_data.get("timeframe", "30d")

        insights = []

        # Weekly trend analysis
        weekly_trend = self._analyze_weekly_trends(activities)
        if weekly_trend["trend"] != "stable":
            insights.append(
                CarbonInsight(
                    id=f"trend-{int(datetime.now(timezone.utc).timestamp())}",
                    user_id=user.id,
                    type=InsightType.TREND,
                    title=f"Carbon Footprint {'Rising' if weekly_trend['trend'] == 'increasing' else 'Improving'}",
                    message=f"Your emissions have {weekly_trend['trend']}d by {weekly_trend['percentage']:.1f}% this week",
                    data=weekly_trend,
                    severity=Severity.WARNING
                    if weekly_trend["trend"] == "increasing"
                    else Severity.SUCCESS,
                )
            )

        # Category analysis
        category_breakdown = self._analyze_category_breakdown(activities)
        top_category = (
            max(category_breakdown.items(), key=lambda x: x[1])
            if category_breakdown
            else None
        )

        if top_category and top_category[1] > 40:  # If any category is >40% of total
            insights.append(
                CarbonInsight(
                    id=f"category-{int(datetime.now().timestamp())}",
                    user_id=user.id,
                    type=InsightType.ALERT,
                    title="High Impact Category Detected",
                    message=f"{top_category[0]} accounts for {top_category[1]:.1f}% of your carbon footprint",
                    data={"category": top_category[0], "percentage": top_category[1]},
                    severity=Severity.INFO,
                )
            )

        # Anomaly detection
        anomalies = self._detect_anomalies(activities)
        for anomaly in anomalies:
            insights.append(anomaly)

        return insights

    def _analyze_weekly_trends(
        self, activities: list[CarbonActivity]
    ) -> dict[str, Any]:
        """Analyze weekly emission trends"""
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        two_weeks_ago = now - timedelta(days=14)

        this_week = sum(a.carbon_emission for a in activities if a.date >= week_ago)
        last_week = sum(
            a.carbon_emission for a in activities if two_weeks_ago <= a.date < week_ago
        )

        if last_week == 0:
            return {"trend": "stable", "percentage": 0}

        change = ((this_week - last_week) / last_week) * 100

        if abs(change) < 5:
            return {"trend": "stable", "percentage": change}

        return {
            "trend": "increasing" if change > 0 else "decreasing",
            "percentage": abs(change),
        }

    def _analyze_category_breakdown(
        self, activities: list[CarbonActivity]
    ) -> dict[str, float]:
        """Calculate percentage breakdown by category"""
        total = sum(a.carbon_emission for a in activities)
        if total == 0:
            return {}

        breakdown = {}
        for activity in activities:
            category = activity.category.value
            breakdown[category] = breakdown.get(category, 0) + activity.carbon_emission

        # Convert to percentages
        for category in breakdown:
            breakdown[category] = (breakdown[category] / total) * 100

        return breakdown

    def _detect_anomalies(
        self, activities: list[CarbonActivity]
    ) -> list[CarbonInsight]:
        """Detect unusual emission patterns"""
        anomalies = []

        # Check for unusually high daily emissions
        daily_emissions = {}
        for activity in activities:
            day = activity.date.date()
            daily_emissions[day] = (
                daily_emissions.get(day, 0) + activity.carbon_emission
            )

        if daily_emissions:
            avg_daily = sum(daily_emissions.values()) / len(daily_emissions)
            std_dev = (
                sum((x - avg_daily) ** 2 for x in daily_emissions.values())
                / len(daily_emissions)
            ) ** 0.5

            for day, emission in daily_emissions.items():
                if (
                    emission > avg_daily + 2 * std_dev
                ):  # 2 standard deviations above mean
                    anomalies.append(
                        CarbonInsight(
                            id=f"anomaly-{int(datetime.now().timestamp())}-{day}",
                            user_id="",  # Will be set by caller
                            type=InsightType.ALERT,
                            title=f"Unusually High Emissions on {day}",
                            message=f"Your emissions on {day} were {emission:.1f} kg CO2e, significantly above your average of {avg_daily:.1f} kg CO2e",
                            data={
                                "date": str(day),
                                "emission": emission,
                                "average": avg_daily,
                            },
                            severity=Severity.WARNING,
                        )
                    )

        return anomalies


class RecommendationAgent(BaseAgent):
    """Generates personalized sustainability recommendations"""

    def __init__(self):
        super().__init__(
            "recommendation-agent",
            "Eco Recommendation Agent",
            "Generates personalized sustainability recommendations",
        )
        self.capabilities = [
            "personalized-recommendations",
            "impact-calculation",
            "cost-analysis",
            "feasibility-assessment",
        ]

    async def execute(self, input_data: dict[str, Any]) -> list[AIRecommendation]:
        """Generate personalized recommendations"""
        self.log("Generating personalized recommendations...")

        user: User = input_data["user"]
        activities: list[CarbonActivity] = input_data["activities"]
        insights: list[CarbonInsight] = input_data.get("insights", [])

        recommendations = []

        # Analyze user's highest impact categories
        category_totals = self._calculate_category_totals(activities)
        sorted_categories = sorted(
            category_totals.items(), key=lambda x: x[1], reverse=True
        )[:3]

        for category, emission in sorted_categories:
            category_recs = self._generate_category_recommendations(
                category, emission, user
            )
            recommendations.extend(category_recs)

        # Add goal-based recommendations
        goal_recs = self._generate_goal_recommendations(user)
        recommendations.extend(goal_recs)

        # Sort by impact and return top 5
        recommendations.sort(key=lambda x: x.impact.carbon_reduction, reverse=True)
        return recommendations[:5]

    def _calculate_category_totals(
        self, activities: list[CarbonActivity]
    ) -> dict[str, float]:
        """Calculate total emissions by category"""
        totals = {}
        for activity in activities:
            category = activity.category.value
            totals[category] = totals.get(category, 0) + activity.carbon_emission
        return totals

    def _generate_category_recommendations(
        self, category: str, emission: float, user: User
    ) -> list[AIRecommendation]:
        """Generate recommendations for specific categories"""
        recommendations = []
        base_id = f"rec-{category}-{int(datetime.now().timestamp())}"

        if category == "transportation" and emission > 100:
            recommendations.append(
                AIRecommendation(
                    id=f"{base_id}-1",
                    user_id=user.id,
                    type=RecommendationType.ACTION,
                    title="Switch to Electric or Hybrid Vehicle",
                    description="Consider transitioning to an electric or hybrid vehicle for daily commute",
                    category=ActivityCategory.TRANSPORTATION,
                    impact=Impact(
                        carbon_reduction=emission * 0.7,
                        cost=300,
                        difficulty=Difficulty.MEDIUM,
                        timeframe="3-6 months",
                    ),
                    confidence=0.85,
                    reasoning="Transportation is your highest emission category. Electric vehicles can reduce emissions by up to 70%.",
                )
            )

        elif category == "energy":
            recommendations.append(
                AIRecommendation(
                    id=f"{base_id}-2",
                    user_id=user.id,
                    type=RecommendationType.ACTION,
                    title="Install Smart Thermostat",
                    description="A programmable smart thermostat can reduce heating/cooling energy by 10-15%",
                    category=ActivityCategory.ENERGY,
                    impact=Impact(
                        carbon_reduction=emission * 0.15,
                        cost=250,
                        difficulty=Difficulty.EASY,
                        timeframe="1 week",
                    ),
                    confidence=0.9,
                    reasoning="Smart thermostats provide immediate energy savings with minimal lifestyle changes.",
                )
            )

        elif category == "food":
            recommendations.append(
                AIRecommendation(
                    id=f"{base_id}-3",
                    user_id=user.id,
                    type=RecommendationType.HABIT,
                    title="Reduce Meat Consumption",
                    description="Try 'Meatless Monday' or plant-based alternatives 2-3 times per week",
                    category=ActivityCategory.FOOD,
                    impact=Impact(
                        carbon_reduction=emission * 0.3,
                        cost=-50,  # Saves money
                        difficulty=Difficulty.EASY,
                        timeframe="immediate",
                    ),
                    confidence=0.8,
                    reasoning="Plant-based meals typically have 50-90% lower carbon footprint than meat-based meals.",
                )
            )

        return recommendations

    def _generate_goal_recommendations(self, user: User) -> list[AIRecommendation]:
        """Generate goal-related recommendations"""
        recommendations = []
        active_goals = [g for g in user.profile.goals if g.status.value == "active"]

        if not active_goals:
            recommendations.append(
                AIRecommendation(
                    id=f"goal-rec-{int(datetime.now().timestamp())}",
                    user_id=user.id,
                    type=RecommendationType.GOAL,
                    title="Set Your First Carbon Reduction Goal",
                    description="Start with a 10% reduction this month to build sustainable habits",
                    category=ActivityCategory.ENERGY,
                    impact=Impact(
                        carbon_reduction=0,
                        cost=0,
                        difficulty=Difficulty.EASY,
                        timeframe="1 month",
                    ),
                    confidence=1.0,
                    reasoning="Setting clear goals increases success rate by 42% according to sustainability research.",
                )
            )

        return recommendations


class GeminiInsightAgent(BaseAgent):
    """Uses Google Gemini API for advanced insights"""

    def __init__(self, api_key: str):
        super().__init__(
            "gemini-insight-agent",
            "Gemini Insight Agent",
            "Leverages Google Gemini API for advanced AI insights",
        )
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")
        self.capabilities = [
            "natural-language-insights",
            "comparative-analysis",
            "predictive-modeling",
            "personalized-coaching",
        ]

    async def execute(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Generate Gemini-powered insights"""
        self.log("Generating Gemini-powered insights...")

        user: User = input_data["user"]
        activities: list[CarbonActivity] = input_data["activities"]
        question: Optional[str] = input_data.get("question")

        context = self._prepare_context(user, activities)

        try:
            insight = await self._call_gemini_api(context, question)
            return insight
        except Exception as e:
            self.log(f"Error calling Gemini API: {e}")
            return self._fallback_insight(user, activities)

    def _prepare_context(self, user: User, activities: list[CarbonActivity]) -> str:
        """Prepare context for Gemini API"""
        total_emissions = sum(a.carbon_emission for a in activities)
        category_breakdown = {}

        for activity in activities:
            category = activity.category.value
            category_breakdown[category] = (
                category_breakdown.get(category, 0) + activity.carbon_emission
            )

        context = f"""
User Profile:
- Location: {user.profile.location}
- Household Size: {user.profile.household_size}
- Lifestyle: {user.profile.lifestyle.value}

Carbon Footprint Data:
- Total Monthly Emissions: {total_emissions:.2f} kg CO2e
- Category Breakdown: {json.dumps(category_breakdown, indent=2)}
- Number of Activities: {len(activities)}

Goals: {", ".join([f"{g.type.value} goal: {g.target_reduction}% reduction" for g in user.profile.goals])}

Please analyze this carbon footprint data and provide:
1. Key insights about the user's environmental impact
2. Specific actionable recommendations
3. Predictions about potential improvements
        """.strip()

        return context

    async def _call_gemini_api(
        self, context: str, question: Optional[str] = None
    ) -> dict[str, Any]:
        """Call Gemini API for insights"""
        prompt = context
        if question:
            prompt += f"\n\nSpecific Question: {question}"

        prompt += """

Please respond with a JSON object containing:
{
    "insight": "A clear, actionable insight about the user's carbon footprint",
    "actionable_steps": ["step1", "step2", "step3"],
    "confidence": 0.85,
    "predictions": "What improvements could be expected if recommendations are followed"
}
"""

        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None, self.model.generate_content, prompt
            )

            # Parse JSON from response
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:-3]
            elif response_text.startswith("```"):
                response_text = response_text[3:-3]

            return json.loads(response_text)

        except Exception as e:
            self.log(f"Error parsing Gemini response: {e}")
            return self._fallback_insight_dict()

    def _fallback_insight(
        self, user: User, activities: list[CarbonActivity]
    ) -> dict[str, Any]:
        """Fallback insight when Gemini API fails"""
        return self._fallback_insight_dict()

    def _fallback_insight_dict(self) -> dict[str, Any]:
        """Return fallback insight dictionary"""
        return {
            "insight": "Your carbon footprint shows opportunities for improvement through targeted actions in your highest-impact categories.",
            "actionable_steps": [
                "Focus on your top emission category first",
                "Set a weekly carbon reduction goal",
                "Track progress with daily activities",
            ],
            "confidence": 0.7,
            "predictions": "With consistent action, you could reduce emissions by 15-25% within 3 months.",
        }


class AgentOrchestrator:
    """Coordinates multiple AI agents"""

    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        self.agents = {}
        self._register_agents(gemini_api_key)

        # Configure Gemini
        if gemini_api_key and gemini_api_key != "demo-key":
            genai.configure(api_key=gemini_api_key)
            self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.gemini_model = None

    def _register_agents(self, gemini_api_key: str):
        """Register all agents"""
        self.agents["carbon-analysis"] = CarbonAnalysisAgent()
        self.agents["recommendation"] = RecommendationAgent()
        if gemini_api_key != "demo-key":
            self.agents["gemini-insight"] = GeminiInsightAgent(gemini_api_key)

    async def analyze_carbon_footprint(
        self, input_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Comprehensive carbon footprint analysis using all agents"""
        results = {
            "insights": [],
            "recommendations": [],
            "analysis": {},
            "gemini_insights": {},
        }

        try:
            # Run carbon analysis
            insights = await self.agents["carbon-analysis"].execute(input_data)
            results["insights"].extend(insights)

            # Generate recommendations
            recommendations = await self.agents["recommendation"].execute(
                {**input_data, "insights": insights}
            )
            results["recommendations"].extend(recommendations)

            # Get Gemini analysis if available
            if "gemini-insight" in self.agents:
                gemini_insights = await self.agents["gemini-insight"].execute(
                    input_data
                )
                results["gemini_insights"] = gemini_insights
            elif self.gemini_model:
                gemini_insights = await self.get_gemini_insights(
                    input_data.get("activities", []), input_data.get("question")
                )
                results["gemini_insights"] = gemini_insights

            return results

        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            # Return basic analysis even if some agents fail
            return {
                "insights": results["insights"],
                "recommendations": results["recommendations"],
                "analysis": {"error": str(e)},
                "gemini_insights": {"error": "Analysis partially failed"},
            }

    async def get_gemini_insights(
        self, activities: list[Any], question: str = None
    ) -> dict[str, Any]:
        """Get insights from Gemini AI"""
        if not self.gemini_model:
            return {
                "summary": "Gemini AI not available - API key not configured",
                "recommendations": [],
                "insights": "Please configure GEMINI_API_KEY to enable AI insights",
            }

        try:
            # Prepare activity summary
            total_emissions = sum(
                getattr(act, "carbon_emission", 0) for act in activities
            )
            activity_summary = self._prepare_activity_summary(activities)

            # Create prompt
            prompt = f"""
            As an environmental expert, analyze this carbon footprint data:

            Total emissions: {total_emissions:.2f} kg CO2e
            Activities summary: {activity_summary}

            User question: {question or "Provide general insights and recommendations"}

            Please provide:
            1. Key insights about the user's carbon footprint
            2. Specific recommendations for reduction
            3. Comparison with typical footprint patterns
            4. Priority actions based on impact potential

            Format your response as actionable insights with specific numbers where possible.
            """

            response = await asyncio.get_event_loop().run_in_executor(
                None, self.gemini_model.generate_content, prompt
            )

            return {
                "summary": response.text,
                "recommendations": self._extract_recommendations_from_text(
                    response.text
                ),
                "insights": response.text,
                "source": "Gemini AI",
            }

        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return {
                "summary": f"Gemini analysis unavailable: {str(e)}",
                "recommendations": [],
                "insights": "AI analysis is currently unavailable. Please check your API configuration.",
                "error": str(e),
            }

    def _prepare_activity_summary(self, activities: list[Any]) -> str:
        """Prepare a summary of activities for Gemini"""
        if not activities:
            return "No activities recorded"

        # Group by category
        category_totals = {}
        for activity in activities:
            category = getattr(activity, "category", "unknown")
            if hasattr(category, "value"):
                category = category.value
            emission = getattr(activity, "carbon_emission", 0)
            category_totals[category] = category_totals.get(category, 0) + emission

        summary_parts = []
        for category, total in category_totals.items():
            summary_parts.append(f"{category}: {total:.2f} kg CO2e")

        return "; ".join(summary_parts)

    def _extract_recommendations_from_text(self, text: str) -> list[str]:
        """Extract actionable recommendations from Gemini response"""
        recommendations = []
        lines = text.split("\n")

        for line in lines:
            line = line.strip()
            # Look for recommendations (lines that start with numbers, bullets, or recommendation keywords)
            if line and (
                line[0].isdigit()
                or line.startswith("-")
                or line.startswith("•")
                or "recommend" in line.lower()
                or "suggest" in line.lower()
                or "reduce" in line.lower()
                or "switch" in line.lower()
            ):
                # Clean up the line
                clean_line = line.lstrip("0123456789.-• ").strip()
                if len(clean_line) > 10:  # Only add substantial recommendations
                    recommendations.append(clean_line)

        return recommendations[:5]  # Limit to top 5 recommendations

    async def execute_workflow(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Execute the complete AI workflow"""
        return await self.analyze_carbon_footprint(input_data)

    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """Get agent by ID"""
        return self.agents.get(agent_id)

    def list_agents(self) -> list[BaseAgent]:
        """List all registered agents"""
        return list(self.agents.values())
