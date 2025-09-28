# FastAPI Backend for EcoVerse - Complete Implementation
import os
from datetime import datetime, timedelta, timezone
from typing import Any
import uuid
import logging

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

from app.models.models import (
    User,
    CarbonActivity,
    AIRecommendation,
    CarbonInsight,
    ActivityInput,
    CarbonCalculationResult,
    ActivityCategory,
    UserProfile,
    UserSettings,
    LifestyleType,
    RecommendationType,
    InsightType,
    Severity,
    Difficulty,
    Impact,
)
from app.services.carbon_calculator import CarbonCalculator
from app.services.ai_agents import AgentOrchestrator
from app.services.enhanced_dataset_processor import enhanced_dataset_processor
from app.database import db_manager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="EcoVerse API",
    description="AI-powered carbon footprint management platform with real dataset analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
calculator = CarbonCalculator()
orchestrator = AgentOrchestrator(gemini_api_key=os.getenv("GEMINI_API_KEY", "demo-key"))


# Pydantic models for API requests/responses
class CreateUserRequest(BaseModel):
    email: str
    name: str
    location: str
    household_size: int
    lifestyle: LifestyleType


class AddActivityRequest(BaseModel):
    category: ActivityCategory
    type: str
    amount: float
    unit: str
    date: datetime | None = None
    location: str | None = None
    metadata: dict[str, Any] | None = None


class AnalyzeFootprintRequest(BaseModel):
    question: str | None = None
    timeframe: str = "30d"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    profile: UserProfile
    settings: UserSettings
    created_at: datetime


class DashboardResponse(BaseModel):
    total_emissions: float
    daily_average: float
    weekly_trend: str
    top_category: str
    insights_count: int
    recommendations_count: int


class AnalysisResponse(BaseModel):
    insights: list[CarbonInsight]
    recommendations: list[AIRecommendation]
    gemini_insight: dict[str, Any]
    dataset_insights: list[dict[str, Any]]


# Helper functions
def get_current_user_id(credentials: HTTPAuthorizationCredentials = None) -> str:
    """Extract user ID from token (simplified for demo)"""
    if credentials and credentials.credentials:
        return credentials.credentials
    # Return demo user for testing
    return "demo-user"


def generate_demo_data(user_id: str) -> None:
    """Generate demo data for a new user"""
    demo_activities = [
        CarbonActivity(
            id=str(uuid.uuid4()),
            user_id=user_id,
            category=ActivityCategory.TRANSPORTATION,
            type="car_gasoline",
            amount=25.0,
            unit="miles",
            carbon_emission=10.1,
            date=datetime.now(timezone.utc) - timedelta(days=i),
            source="manual",
        )
        for i in range(1, 8)
    ]

    demo_activities.extend(
        [
            CarbonActivity(
                id=str(uuid.uuid4()),
                user_id=user_id,
                category=ActivityCategory.ENERGY,
                type="electricity",
                amount=30.0,
                unit="kwh",
                carbon_emission=27.6,
                date=datetime.now(timezone.utc) - timedelta(days=i),
                source="manual",
            )
            for i in range(1, 5)
        ]
    )

    # Add activities to database
    for activity in demo_activities:
        try:
            db_manager.add_activity(activity)
        except Exception as e:
            logger.error(f"Error adding demo activity: {e}")


# API Routes


@app.get("/")
async def root():
    """Root endpoint with dataset information"""
    dataset_summary = enhanced_dataset_processor.get_dataset_summary()
    return {
        "message": "Welcome to EcoVerse API - AI-Powered Carbon Footprint Management",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "healthy",
        "features": [
            "Real dataset analysis from Kaggle",
            "Gemini AI integration",
            "Carbon footprint tracking",
            "Personalized recommendations",
        ],
        "datasets_loaded": list(dataset_summary.keys()),
        "dataset_info": {
            "carbon_emission": "Individual Carbon Footprint Calculation - https://www.kaggle.com/datasets/dumanmesut/individual-carbon-footprint-calculation",
            "iot_carbon": "IoT Carbon Footprint Dataset - https://www.kaggle.com/datasets/dawoodhuss227/iot-carbon-footprint-dataset",
            "power_consumption": "UCI Individual Electric Power Consumption - https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}


# User Management
@app.post("/users", response_model=UserResponse)
async def create_user(request: CreateUserRequest):
    """Create a new user"""
    user_id = str(uuid.uuid4())

    user = User(
        id=user_id,
        email=request.email,
        name=request.name,
        profile=UserProfile(
            location=request.location,
            household_size=request.household_size,
            lifestyle=request.lifestyle,
        ),
        settings=UserSettings(),
    )

    # Save to database
    try:
        db_manager.create_user(user)
        # Generate demo data
        generate_demo_data(user_id)

        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            profile=user.profile,
            settings=user.settings,
            created_at=user.created_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {e}")


@app.get("/users/me", response_model=UserResponse)
async def get_current_user_info():
    """Get current user information"""
    user_id = get_current_user_id()

    user = db_manager.get_user(user_id)
    if not user:
        # Create demo user if not exists
        demo_user = User(
            id=user_id,
            email="demo@ecoverse.ai",
            name="Demo User",
            profile=UserProfile(
                location="US", household_size=2, lifestyle=LifestyleType.MODERATE
            ),
            settings=UserSettings(),
        )
        db_manager.create_user(demo_user)
        generate_demo_data(user_id)
        user = demo_user

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        profile=user.profile,
        settings=user.settings,
        created_at=user.created_at,
    )


# Activity Management
@app.post("/activities")
async def add_activity(request: AddActivityRequest):
    """Add a new carbon activity"""
    user_id = get_current_user_id()

    # Ensure user exists
    user = db_manager.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate carbon emission
    activity_input = ActivityInput(
        category=request.category,
        type=request.type,
        amount=request.amount,
        unit=request.unit,
        date=request.date or datetime.now(timezone.utc),
        location=request.location,
        metadata=request.metadata,
    )

    calculation_result = calculator.calculate_emission(activity_input)

    # Create activity
    activity = CarbonActivity(
        id=str(uuid.uuid4()),
        user_id=user_id,
        category=request.category,
        type=request.type,
        amount=request.amount,
        unit=request.unit,
        carbon_emission=calculation_result.carbon_emission,
        date=request.date or datetime.now(timezone.utc),
        location=request.location or "US",
        metadata=request.metadata or {},
        source="manual",
    )

    # Save to database
    try:
        db_manager.add_activity(activity)

        return {
            "id": activity.id,
            "category": activity.category,
            "type": activity.type,
            "amount": activity.amount,
            "unit": activity.unit,
            "carbon_emission": activity.carbon_emission,
            "calculation_result": calculation_result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add activity: {e}")


@app.get("/activities")
async def get_activities(limit: int = Query(default=50, le=200)):
    """Get user's activities"""
    user_id = get_current_user_id()

    try:
        activities = db_manager.get_user_activities(user_id, limit)
        return activities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get activities: {e}")


# Dashboard
@app.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard():
    """Get dashboard data with dataset insights"""
    user_id = get_current_user_id()

    try:
        activities = db_manager.get_user_activities(user_id, 100)
        insights = db_manager.get_user_insights(user_id, 10)
        recommendations = db_manager.get_user_recommendations(user_id, 10)

        # Calculate metrics
        total_emissions = sum(act.carbon_emission for act in activities)
        daily_average = total_emissions / max(
            len(set(act.date.date() for act in activities)), 1
        )

        # Determine weekly trend (simplified)
        if len(activities) >= 7:
            recent_week = [act for act in activities[:7]]
            older_week = (
                [act for act in activities[7:14]] if len(activities) >= 14 else []
            )
            recent_emissions = sum(act.carbon_emission for act in recent_week)
            older_emissions = (
                sum(act.carbon_emission for act in older_week)
                if older_week
                else recent_emissions
            )

            if recent_emissions > older_emissions * 1.1:
                weekly_trend = "increasing"
            elif recent_emissions < older_emissions * 0.9:
                weekly_trend = "decreasing"
            else:
                weekly_trend = "stable"
        else:
            weekly_trend = "insufficient_data"

        # Find top category
        category_emissions = {}
        for activity in activities:
            cat = activity.category.value
            category_emissions[cat] = (
                category_emissions.get(cat, 0) + activity.carbon_emission
            )

        top_category = (
            max(category_emissions.items(), key=lambda x: x[1])[0]
            if category_emissions
            else "transportation"
        )

        return DashboardResponse(
            total_emissions=round(total_emissions, 2),
            daily_average=round(daily_average, 2),
            weekly_trend=weekly_trend,
            top_category=top_category,
            insights_count=len(insights),
            recommendations_count=len(recommendations),
        )
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load dashboard data")


# AI Analysis
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_footprint(request: AnalyzeFootprintRequest):
    """Analyze user's carbon footprint with AI and dataset insights"""
    user_id = get_current_user_id()

    try:
        user = db_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        activities = db_manager.get_user_activities(user_id, 100)

        # Filter activities if a specific date is provided (format: YYYY-MM-DD)
        filtered_activities = activities
        date_format_length = 10
        expected_hyphens = 2
        if (
            request.timeframe
            and len(request.timeframe) == date_format_length
            and request.timeframe.count("-") == expected_hyphens
        ):
            try:
                # Parse the date and filter activities for that specific day
                target_date = datetime.fromisoformat(request.timeframe).date()
                filtered_activities = [
                    act for act in activities if act.date == target_date
                ]
                logger.info(
                    f"Filtered to {len(filtered_activities)} activities for date {target_date}"
                )
            except (ValueError, TypeError) as e:
                logger.warning(
                    f"Invalid date format '{request.timeframe}', using all activities: {e}"
                )
                filtered_activities = activities

        # Convert activities to dict format for dataset processor
        activity_dicts = [
            {
                "carbon_emission": act.carbon_emission,
                "category": act.category.value,
                "type": act.type,
                "amount": act.amount,
                "unit": act.unit,
                "date": act.date.isoformat(),
            }
            for act in filtered_activities
        ]

        # Get AI analysis
        analysis_data = {
            "user": user,
            "activities": filtered_activities,
            "timeframe": request.timeframe,
            "question": request.question,
        }

        # Get insights from AI agents
        ai_insights = await orchestrator.analyze_carbon_footprint(analysis_data)

        # Get dataset-based insights
        dataset_insights = enhanced_dataset_processor.get_personalized_insights(
            activity_dicts,
            {
                "location": user.profile.location,
                "lifestyle": user.profile.lifestyle.value,
            },
        )

        # Get Gemini insights
        gemini_insight = await orchestrator.get_gemini_insights(
            filtered_activities, request.question
        )

        # Save insights to database
        for insight in ai_insights.get("insights", []):
            try:
                db_manager.add_insight(insight)
            except Exception as e:
                logger.error(f"Failed to save insight: {e}")

        # Save recommendations to database
        for rec in ai_insights.get("recommendations", []):
            try:
                db_manager.add_recommendation(rec)
            except Exception as e:
                logger.error(f"Failed to save recommendation: {e}")

        # Format dataset insights for response
        formatted_dataset_insights = [
            {
                "title": insight.title,
                "description": insight.description,
                "data": insight.data,
                "confidence": insight.confidence,
                "source": insight.source_dataset,
                "type": insight.insight_type,
            }
            for insight in dataset_insights
        ]

        return AnalysisResponse(
            insights=ai_insights.get("insights", []),
            recommendations=ai_insights.get("recommendations", []),
            gemini_insight=gemini_insight,
            dataset_insights=formatted_dataset_insights,
        )

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e!s}")


# Dataset Endpoints
@app.get("/datasets/summary")
async def get_dataset_summary():
    """Get summary of loaded datasets"""
    try:
        summary = enhanced_dataset_processor.get_dataset_summary()
        insights = enhanced_dataset_processor.get_all_insights()

        return {
            "datasets": summary,
            "total_insights": sum(
                len(insight_list) for insight_list in insights.values()
            ),
            "insight_categories": list(insights.keys()),
            "citations": {
                "carbon_emission": "Individual Carbon Footprint Calculation - https://www.kaggle.com/datasets/dumanmesut/individual-carbon-footprint-calculation",
                "iot_carbon": "IoT Carbon Footprint Dataset - https://www.kaggle.com/datasets/dawoodhuss227/iot-carbon-footprint-dataset",
                "power_consumption": "UCI Individual Electric Power Consumption - https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption",
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get dataset summary: {e}"
        )


@app.get("/datasets/insights")
async def get_dataset_insights():
    """Get all insights from dataset analysis"""
    try:
        from app.services.enhanced_dataset_processor import convert_numpy_types
        import json

        insights = enhanced_dataset_processor.get_all_insights()

        # Format insights for API response with comprehensive numpy type conversion
        formatted_insights = {}
        for category, insight_list in insights.items():
            formatted_insights[category] = []
            for insight in insight_list:
                # Convert each field individually to handle all numpy types
                insight_dict = {
                    "title": str(insight.title),
                    "description": str(insight.description),
                    "data": convert_numpy_types(insight.data),
                    "confidence": convert_numpy_types(insight.confidence),
                    "source": str(insight.source_dataset),
                    "type": str(insight.insight_type),
                }
                formatted_insights[category].append(insight_dict)

        # Double-convert to ensure all numpy types are handled
        final_result = convert_numpy_types(formatted_insights)

        # Test JSON serialization to catch any remaining issues
        json.dumps(final_result)

        return final_result
    except Exception as e:
        logger.error(f"Dataset insights error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get dataset insights: {e}"
        )


@app.get("/insights")
async def get_user_insights(limit: int = Query(default=20, le=100)):
    """Get user's personal insights"""
    user_id = get_current_user_id()

    try:
        insights = db_manager.get_user_insights(user_id, limit)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get insights: {e}")


@app.get("/recommendations")
async def get_user_recommendations(limit: int = Query(default=20, le=100)):
    """Get user's recommendations"""
    user_id = get_current_user_id()

    try:
        recommendations = db_manager.get_user_recommendations(user_id, limit)
        return recommendations
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get recommendations: {e}"
        )


# Initialize database and start server
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting EcoVerse API...")
    logger.info(
        f"Datasets available: {list(enhanced_dataset_processor.datasets.keys())}"
    )
    logger.info("Database initialized")
    logger.info("Enhanced dataset processor loaded")


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",  # Changed from 0.0.0.0 for security
        port=8000,
        reload=True,
    )
