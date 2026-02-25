"""
Configuration management for the Internal Linking Tool backend.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration."""
    
    # OnCrawl API
    ONCRAWL_API_TOKEN = os.getenv("ONCRAWL_API_TOKEN", "")
    ONCRAWL_PROJECT_ID = os.getenv("ONCRAWL_PROJECT_ID", "")
    ONCRAWL_BASE_URL = "https://app.oncrawl.com/api/v2"
    
    # Server
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", 8000))
    
    # Database
    DATABASE_PATH = os.getenv("DATABASE_PATH", "data/cache.db")
    
    # Thresholds (defaults from criteria doc)
    DEFAULT_INLINK_THRESHOLD = 5
    DEFAULT_RANKING_DROP_THRESHOLD = 5
    DEFAULT_SEARCH_VOLUME_THRESHOLD = 100
    
    @classmethod
    def is_oncrawl_configured(cls) -> bool:
        """Check if OnCrawl API is properly configured."""
        return bool(cls.ONCRAWL_API_TOKEN and cls.ONCRAWL_PROJECT_ID)


config = Config()
