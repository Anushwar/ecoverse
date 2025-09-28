# EcoVerse Data Models
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional


class ActivityCategory(str, Enum):
    TRANSPORTATION = "transportation"
    ENERGY = "energy"
    FOOD = "food"
    SHOPPING = "shopping"
    WASTE = "waste"
    TRAVEL = "travel"
    HOUSING = "housing"

class LifestyleType(str, Enum):
    MINIMAL = "minimal"
    MODERATE = "moderate"
    HIGH_CONSUMPTION = "high-consumption"

class GoalType(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"

class RecommendationType(str, Enum):
    ACTION = "action"
    PRODUCT = "product"
    HABIT = "habit"
    GOAL = "goal"

class InsightType(str, Enum):
    TREND = "trend"
    COMPARISON = "comparison"
    MILESTONE = "milestone"
    ALERT = "alert"

class Severity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    SUCCESS = "success"
    ERROR = "error"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Rarity(str, Enum):
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"

@dataclass
class CarbonGoal:
    id: str
    user_id: str
    type: GoalType
    target_reduction: float  # percentage
    current_progress: float
    deadline: datetime
    category: Optional[ActivityCategory] = None
    status: GoalStatus = GoalStatus.ACTIVE

@dataclass
class Achievement:
    id: str
    title: str
    description: str
    icon: str
    category: str
    points: int
    unlocked_at: datetime
    rarity: Rarity

@dataclass
class UserProfile:
    location: str
    household_size: int
    lifestyle: LifestyleType
    goals: list[CarbonGoal] = field(default_factory=list)
    achievements: list[Achievement] = field(default_factory=list)

@dataclass
class UserSettings:
    notifications: bool = True
    data_sharing: bool = True
    units: Literal["metric", "imperial"] = "metric"
    currency: str = "USD"

@dataclass
class User:
    id: str
    email: str
    name: str
    profile: UserProfile
    settings: UserSettings
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

@dataclass
class CarbonActivity:
    id: str
    user_id: str
    category: ActivityCategory
    type: str
    amount: float
    unit: str
    carbon_emission: float  # kg CO2e
    date: datetime
    location: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)
    source: Literal["manual", "api", "ai-detected"] = "manual"

@dataclass
class Impact:
    carbon_reduction: float  # kg CO2e
    cost: float  # USD
    difficulty: Difficulty
    timeframe: str

@dataclass
class AIRecommendation:
    id: str
    user_id: str
    type: RecommendationType
    title: str
    description: str
    category: ActivityCategory
    impact: Impact
    confidence: float  # 0-1
    reasoning: str
    created_at: datetime = field(default_factory=datetime.now)
    status: Literal["pending", "accepted", "declined", "completed"] = "pending"

@dataclass
class CarbonInsight:
    id: str
    user_id: str
    type: InsightType
    title: str
    message: str
    data: dict[str, Any]
    severity: Severity
    created_at: datetime = field(default_factory=datetime.now)
    read: bool = False

@dataclass
class ActivityInput:
    category: ActivityCategory
    type: str
    amount: float
    unit: str
    date: Optional[datetime] = None
    location: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None

@dataclass
class CarbonCalculationResult:
    carbon_emission: float
    confidence: float
    breakdown: list[dict[str, Any]]
    recommendations: list[str]

# Carbon emission factors (kg CO2e per unit)
CARBON_FACTORS = {
    "transportation": {
        "car_gasoline": 0.404,  # per mile
        "car_electric": 0.127,  # per mile
        "bus": 0.089,  # per mile
        "train": 0.048,  # per mile
        "flight_domestic": 0.385,  # per mile
        "flight_international": 0.582,  # per mile
        "bicycle": 0,  # per mile
        "walking": 0,  # per mile
    },
    "energy": {
        "electricity": 0.92,  # per kWh (US average)
        "natural_gas": 5.3,  # per therm
        "heating_oil": 10.15,  # per gallon
        "propane": 5.75,  # per gallon
    },
    "food": {
        "beef": 26.61,  # per lb
        "pork": 5.77,  # per lb
        "chicken": 4.57,  # per lb
        "fish": 5.4,  # per lb
        "dairy": 9.9,  # per lb
        "vegetables": 0.88,  # per lb
        "fruits": 1.1,  # per lb
        "grains": 1.4,  # per lb
    },
    "waste": {
        "landfill": 0.57,  # per lb
        "recycling": -1.1,  # per lb (negative = avoided emissions)
        "composting": -0.34,  # per lb
    }
}
