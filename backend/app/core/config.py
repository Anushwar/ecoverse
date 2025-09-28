# Configuration settings for EcoVerse
import os
from functools import lru_cache
from typing import List

from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # Environment
    environment: str = "development"
    debug: bool = True

    # API Configuration
    api_title: str = "EcoVerse API"
    api_description: str = "AI-powered carbon footprint management platform"
    api_version: str = "1.0.0"

    # API Keys
    gemini_api_key: str = "demo-key"
    openai_api_key: str = ""
    carbon_interface_api_key: str = ""

    # Database
    database_url: str = "sqlite:///./ecoverse.db"

    # Security
    secret_key: str = "your-secret-key-here-for-demo"
    access_token_expire_minutes: int = 30

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Logging
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
