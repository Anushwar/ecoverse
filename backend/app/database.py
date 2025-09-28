# Database configuration and models for EcoVerse
import sqlite3
import json
import logging
from datetime import datetime
from pathlib import Path

from app.models.models import (
    User,
    CarbonActivity,
    AIRecommendation,
    CarbonInsight,
    UserProfile,
    UserSettings,
    ActivityCategory,
    LifestyleType,
    GoalStatus,
    RecommendationType,
    InsightType,
    Severity,
    Difficulty,
    Impact,
)

logger = logging.getLogger(__name__)


class DatabaseManager:
    """SQLite database manager for EcoVerse"""

    def __init__(self, db_path: str = "ecoverse.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize database with required tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("PRAGMA foreign_keys = ON")

                # Users table
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        email TEXT UNIQUE NOT NULL,
                        name TEXT NOT NULL,
                        location TEXT NOT NULL,
                        household_size INTEGER NOT NULL,
                        lifestyle TEXT NOT NULL,
                        settings TEXT NOT NULL,  -- JSON
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )
                """)

                # Activities table
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS activities (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        category TEXT NOT NULL,
                        type TEXT NOT NULL,
                        amount REAL NOT NULL,
                        unit TEXT NOT NULL,
                        carbon_emission REAL NOT NULL,
                        date TEXT NOT NULL,
                        location TEXT,
                        metadata TEXT,  -- JSON
                        source TEXT NOT NULL,
                        confidence REAL,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)

                # Recommendations table
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS recommendations (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        type TEXT NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        category TEXT NOT NULL,
                        carbon_reduction REAL NOT NULL,
                        cost REAL NOT NULL,
                        difficulty TEXT NOT NULL,
                        timeframe TEXT NOT NULL,
                        confidence REAL NOT NULL,
                        reasoning TEXT NOT NULL,
                        status TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)

                # Insights table
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS insights (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        type TEXT NOT NULL,
                        title TEXT NOT NULL,
                        message TEXT NOT NULL,
                        data TEXT NOT NULL,  -- JSON
                        severity TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        read INTEGER DEFAULT 0,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)

                # Goals table
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS goals (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        type TEXT NOT NULL,
                        target_reduction REAL NOT NULL,
                        current_progress REAL DEFAULT 0,
                        deadline TEXT NOT NULL,
                        category TEXT,
                        status TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)

                # Dataset insights table for storing processed insights
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS dataset_insights (
                        id TEXT PRIMARY KEY,
                        dataset_name TEXT NOT NULL,
                        insight_type TEXT NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        data TEXT NOT NULL,  -- JSON
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )
                """)

                conn.commit()
                logger.info("Database initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

    # User operations
    def create_user(self, user: User) -> User:
        """Create a new user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT INTO users (id, email, name, location, household_size, 
                                     lifestyle, settings, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        user.id,
                        user.email,
                        user.name,
                        user.profile.location,
                        user.profile.household_size,
                        user.profile.lifestyle.value,
                        json.dumps(user.settings.__dict__),
                        user.created_at.isoformat(),
                        user.updated_at.isoformat(),
                    ),
                )
                conn.commit()
                return user
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            raise

    def get_user(self, user_id: str) -> User | None:
        """Get user by ID"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    """
                    SELECT * FROM users WHERE id = ?
                """,
                    (user_id,),
                )
                row = cursor.fetchone()

                if not row:
                    return None

                settings_data = json.loads(row[6])
                return User(
                    id=row[0],
                    email=row[1],
                    name=row[2],
                    profile=UserProfile(
                        location=row[3],
                        household_size=row[4],
                        lifestyle=LifestyleType(row[5]),
                    ),
                    settings=UserSettings(**settings_data),
                    created_at=datetime.fromisoformat(row[7]),
                    updated_at=datetime.fromisoformat(row[8]),
                )
        except Exception as e:
            logger.error(f"Failed to get user: {e}")
            return None

    # Activity operations
    def add_activity(self, activity: CarbonActivity) -> CarbonActivity:
        """Add a new carbon activity"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT INTO activities (id, user_id, category, type, amount, unit,
                                          carbon_emission, date, location, metadata, source, confidence)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        activity.id,
                        activity.user_id,
                        activity.category.value,
                        activity.type,
                        activity.amount,
                        activity.unit,
                        activity.carbon_emission,
                        activity.date.isoformat(),
                        activity.location,
                        json.dumps(activity.metadata),
                        activity.source,
                        1.0,  # Default confidence
                    ),
                )
                conn.commit()
                return activity
        except Exception as e:
            logger.error(f"Failed to add activity: {e}")
            raise

    def get_user_activities(
        self, user_id: str, limit: int = 100
    ) -> list[CarbonActivity]:
        """Get activities for a user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    """
                    SELECT * FROM activities WHERE user_id = ?
                    ORDER BY date DESC LIMIT ?
                """,
                    (user_id, limit),
                )

                activities = []
                for row in cursor.fetchall():
                    metadata = json.loads(row[9]) if row[9] else {}
                    activity = CarbonActivity(
                        id=row[0],
                        user_id=row[1],
                        category=ActivityCategory(row[2]),
                        type=row[3],
                        amount=row[4],
                        unit=row[5],
                        carbon_emission=row[6],
                        date=datetime.fromisoformat(row[7]),
                        location=row[8],
                        metadata=metadata,
                        source=row[10],
                    )
                    activities.append(activity)

                return activities
        except Exception as e:
            logger.error(f"Failed to get user activities: {e}")
            return []

    # Recommendation operations
    def add_recommendation(self, recommendation: AIRecommendation) -> AIRecommendation:
        """Add a new AI recommendation"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT INTO recommendations (id, user_id, type, title, description,
                                               category, carbon_reduction, cost, difficulty,
                                               timeframe, confidence, reasoning, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        recommendation.id,
                        recommendation.user_id,
                        recommendation.type.value,
                        recommendation.title,
                        recommendation.description,
                        recommendation.category.value,
                        recommendation.impact.carbon_reduction,
                        recommendation.impact.cost,
                        recommendation.impact.difficulty.value,
                        recommendation.impact.timeframe,
                        recommendation.confidence,
                        recommendation.reasoning,
                        recommendation.status,
                        recommendation.created_at.isoformat(),
                    ),
                )
                conn.commit()
                return recommendation
        except Exception as e:
            logger.error(f"Failed to add recommendation: {e}")
            raise

    def get_user_recommendations(
        self, user_id: str, limit: int = 50
    ) -> list[AIRecommendation]:
        """Get recommendations for a user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    """
                    SELECT * FROM recommendations WHERE user_id = ?
                    ORDER BY created_at DESC LIMIT ?
                """,
                    (user_id, limit),
                )

                recommendations = []
                for row in cursor.fetchall():
                    impact = Impact(
                        carbon_reduction=row[6],
                        cost=row[7],
                        difficulty=Difficulty(row[8]),
                        timeframe=row[9],
                    )

                    recommendation = AIRecommendation(
                        id=row[0],
                        user_id=row[1],
                        type=RecommendationType(row[2]),
                        title=row[3],
                        description=row[4],
                        category=ActivityCategory(row[5]),
                        impact=impact,
                        confidence=row[10],
                        reasoning=row[11],
                        status=row[12],
                        created_at=datetime.fromisoformat(row[13]),
                    )
                    recommendations.append(recommendation)

                return recommendations
        except Exception as e:
            logger.error(f"Failed to get user recommendations: {e}")
            return []

    # Insight operations
    def add_insight(self, insight: CarbonInsight) -> CarbonInsight:
        """Add a new carbon insight"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT INTO insights (id, user_id, type, title, message, data,
                                        severity, created_at, read)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        insight.id,
                        insight.user_id,
                        insight.type.value,
                        insight.title,
                        insight.message,
                        json.dumps(insight.data),
                        insight.severity.value,
                        insight.created_at.isoformat(),
                        int(insight.read),
                    ),
                )
                conn.commit()
                return insight
        except Exception as e:
            logger.error(f"Failed to add insight: {e}")
            raise

    def get_user_insights(self, user_id: str, limit: int = 50) -> list[CarbonInsight]:
        """Get insights for a user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    """
                    SELECT * FROM insights WHERE user_id = ?
                    ORDER BY created_at DESC LIMIT ?
                """,
                    (user_id, limit),
                )

                insights = []
                for row in cursor.fetchall():
                    data = json.loads(row[5])
                    insight = CarbonInsight(
                        id=row[0],
                        user_id=row[1],
                        type=InsightType(row[2]),
                        title=row[3],
                        message=row[4],
                        data=data,
                        severity=Severity(row[6]),
                        created_at=datetime.fromisoformat(row[7]),
                        read=bool(row[8]),
                    )
                    insights.append(insight)

                return insights
        except Exception as e:
            logger.error(f"Failed to get user insights: {e}")
            return []


# Initialize database instance
db_manager = DatabaseManager()
