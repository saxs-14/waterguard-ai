import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "WaterGuard AI"
    database_url: str = "sqlite:///./waterguard.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    anomaly_z_threshold: float = 2.5
    night_flow_threshold_lpm: float = 3.0  # flow at 00:00-05:00 above this suggests a leak
    api_key: str = "dev-local-key-change-me"

    class Config:
        env_file = ".env"


settings = Settings()
