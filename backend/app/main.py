# FastAPI Backend for EcoVerse
import os
from datetime import datetime, timedelta
from typing import Optional, Any

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

from app.models.models import (
    User, CarbonActivity, AIRecommendation, CarbonInsight,
    ActivityInput, CarbonCalculationResult, ActivityCategory,
    UserProfile, UserSettings, LifestyleType
)
from app.services.carbon_calculator import CarbonCalculator
from app.services.ai_agents import AgentOrchestrator

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="EcoVerse API",
    description="AI-powered carbon footprint management platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
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
orchestrator = AgentOrchestrator(
    gemini_api_key=os.getenv("GEMINI_API_KEY", "demo-key")
)
security = HTTPBearer()

# In-memory storage (replace with database in production)
users_db: dict[str, User] = {}
activities_db: dict[str, list[CarbonActivity]] = {}
recommendations_db: dict[str, list[AIRecommendation]] = {}
insights_db: dict[str, list[CarbonInsight]] = {}

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
    date: Optional[datetime] = None
    location: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None

class AnalyzeFootprintRequest(BaseModel):
    question: Optional[str] = None
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

# Helper functions
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user ID from token (simplified for demo)"""
    # In production, validate JWT token here
    return credentials.credentials

def generate_demo_data(user_id: str) -> None:
    """Generate demo data for a new user"""
    demo_activities = [
        CarbonActivity(
            id=f"act-{i}",
            user_id=user_id,
            category=ActivityCategory.TRANSPORTATION,
            type="car_gasoline",
            amount=25.0,
            unit="miles",
            carbon_emission=10.1,
            date=datetime.now() - timedelta(days=i),
            source="manual"
        ) for i in range(1, 8)
    ]

    demo_activities.extend([
        CarbonActivity(
            id=f"energy-{i}",
            user_id=user_id,
            category=ActivityCategory.ENERGY,
            type="electricity",
            amount=30.0,
            unit="kwh",
            carbon_emission=27.6,
            date=datetime.now() - timedelta(days=i),
            source="manual"
        ) for i in range(1, 5)
    ])

    activities_db[user_id] = demo_activities

# API Routes

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to EcoVerse API",
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

# User Management
@app.post("/users", response_model=UserResponse)
async def create_user(request: CreateUserRequest):
    """Create a new user"""
    user_id = f"user-{len(users_db) + 1}"

    user = User(
        id=user_id,
        email=request.email,
        name=request.name,
        profile=UserProfile(
            location=request.location,
            household_size=request.household_size,
            lifestyle=request.lifestyle
        ),
        settings=UserSettings()
    )

    users_db[user_id] = user
    activities_db[user_id] = []
    recommendations_db[user_id] = []
    insights_db[user_id] = []

    # Generate demo data
    generate_demo_data(user_id)

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        profile=user.profile,
        settings=user.settings,
        created_at=user.created_at
    )

@app.get("/users/me", response_model=UserResponse)
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    """Get current user information"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    user = users_db[user_id]
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        profile=user.profile,
        settings=user.settings,
        created_at=user.created_at
    )

# Activity Management
@app.post("/activities", response_model=CarbonCalculationResult)
async def add_activity(
    request: AddActivityRequest,
    user_id: str = Depends(get_current_user)
):
    """Add a new carbon activity"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate carbon emission
    activity_input = ActivityInput(
        category=request.category,
        type=request.type,
        amount=request.amount,
        unit=request.unit,
        date=request.date or datetime.now(),
        location=request.location,
        metadata=request.metadata
    )

    calculation_result = calculator.calculate_emission(activity_input)

    # Create activity record
    activity = CarbonActivity(
        id=f"act-{len(activities_db.get(user_id, [])) + 1}",
        user_id=user_id,
        category=request.category,
        type=request.type,
        amount=request.amount,
        unit=request.unit,
        carbon_emission=calculation_result.carbon_emission,
        date=activity_input.date,
        location=request.location,
        metadata=request.metadata or {},
        source="manual"
    )

    # Store activity
    if user_id not in activities_db:
        activities_db[user_id] = []
    activities_db[user_id].append(activity)

    return calculation_result

@app.get("/activities", response_model=list[CarbonActivity])
async def get_activities(
    user_id: str = Depends(get_current_user),
    category: Optional[ActivityCategory] = None,
    limit: int = 50
):
    """Get user's carbon activities"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    activities = activities_db.get(user_id, [])

    if category:
        activities = [a for a in activities if a.category == category]

    return activities[-limit:]  # Return most recent activities

# Dashboard
@app.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(user_id: str = Depends(get_current_user)):
    """Get user dashboard data"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    activities = activities_db.get(user_id, [])
    insights = insights_db.get(user_id, [])
    recommendations = recommendations_db.get(user_id, [])

    # Calculate metrics
    total_emissions = sum(a.carbon_emission for a in activities)
    daily_average = total_emissions / max(len(activities), 1)

    # Get trends
    trends = calculator.calculate_trends(activities)
    weekly_trend = trends.get("trend", "stable")

    # Get top category
    category_totals = calculator.calculate_category_breakdown(activities)
    top_category = "none"
    if category_totals:
        top_category = max(category_totals.keys(),
                          key=lambda k: category_totals[k]["total"])

    return DashboardResponse(
        total_emissions=round(total_emissions, 2),
        daily_average=round(daily_average, 2),
        weekly_trend=weekly_trend,
        top_category=top_category,
        insights_count=len(insights),
        recommendations_count=len(recommendations)
    )

# AI Analysis
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_footprint(
    request: AnalyzeFootprintRequest,
    user_id: str = Depends(get_current_user)
):
    """Analyze carbon footprint using AI agents"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    user = users_db[user_id]
    activities = activities_db.get(user_id, [])

    try:
        # Run AI analysis
        results = await orchestrator.execute_workflow({
            "user": user,
            "activities": activities,
            "question": request.question
        })

        # Store results
        insights_db[user_id] = results["insights"]
        recommendations_db[user_id] = results["recommendations"]

        return AnalysisResponse(
            insights=results["insights"],
            recommendations=results["recommendations"],
            gemini_insight=results["gemini_insight"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@app.get("/insights", response_model=list[CarbonInsight])
async def get_insights(user_id: str = Depends(get_current_user)):
    """Get user's carbon insights"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    return insights_db.get(user_id, [])

@app.get("/recommendations", response_model=list[AIRecommendation])
async def get_recommendations(user_id: str = Depends(get_current_user)):
    """Get user's AI recommendations"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    return recommendations_db.get(user_id, [])

# Statistics
@app.get("/stats/trends")
async def get_trends(user_id: str = Depends(get_current_user)):
    """Get emission trends"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    activities = activities_db.get(user_id, [])
    trends = calculator.calculate_trends(activities)
    daily_footprint = calculator.calculate_daily_footprint(activities)
    category_breakdown = calculator.calculate_category_breakdown(activities)

    return {
        "trends": trends,
        "daily_footprint": daily_footprint,
        "category_breakdown": category_breakdown
    }

# Quick calculations
@app.post("/calculate")
async def quick_calculate(activity_input: ActivityInput):
    """Quick carbon emission calculation"""
    try:
        result = calculator.calculate_emission(activity_input)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Calculation failed: {str(e)}"
        )

# Demo endpoints
@app.get("/demo/categories")
async def get_demo_categories():
    """Get available activity categories for demo"""
    return {
        "categories": [
            {
                "name": "Transportation",
                "value": "transportation",
                "types": ["car_gasoline", "car_electric", "bus", "train", "flight_domestic"]
            },
            {
                "name": "Energy",
                "value": "energy",
                "types": ["electricity", "natural_gas", "heating_oil"]
            },
            {
                "name": "Food",
                "value": "food",
                "types": ["beef", "chicken", "fish", "vegetables", "dairy"]
            },
            {
                "name": "Waste",
                "value": "waste",
                "types": ["landfill", "recycling", "composting"]
            }
        ]
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )