from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./network_topology.db"
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Ollama Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    # OLLAMA_MODEL: str = "llama3.2"
    OLLAMA_MODEL: str = "deepseek-r1:14b"   # ใช้ model เดียวกับโปรเจคเก่า
    OLLAMA_TIMEOUT: int = 600  # 10 minutes timeout
    # OLLAMA_MODEL: str = "mistral:latest" 
    class Config:
        env_file = ".env"

settings = Settings() 