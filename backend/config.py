# Configuration settings for the application
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv(Path(__file__).resolve().parent / ".env")


class Settings:
    PROJECT_NAME: str = "CV Parser"
    UPLOAD_DIR: str = "uploads"

    # Port settings — change these in backend/.env only
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8010"))
    FRONTEND_PORT: int = int(os.getenv("FRONTEND_PORT", "5173"))

    @property
    def allowed_origins(self) -> list[str]:
        """CORS origins derived from FRONTEND_PORT, supporting env overrides and wildcard fallback."""
        origins = [
            f"http://localhost:{self.FRONTEND_PORT}",
            f"http://127.0.0.1:{self.FRONTEND_PORT}",
        ]
        env_origins = os.getenv("ALLOWED_ORIGINS")
        if env_origins:
            for origin in env_origins.split(","):
                clean = origin.strip()
                if clean:
                    origins.append(clean)
        else:
            # Default to wildcard fallback in production to make deployment smooth
            origins.append("*")
        return origins


settings = Settings()
