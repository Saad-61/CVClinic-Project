import json
import time
import os
from pathlib import Path
from dotenv import load_dotenv
from services.fetch_jobs import get_all_jobs

# Data directory relative to this file
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CACHE_FILE = DATA_DIR / "jobs_cache.json"
CACHE_EXPIRY = 60 * 60 * 6  # 6 hours
CACHE_VERSION = 2


def _load_env() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env", override=False)
    load_dotenv(backend_dir.parent / ".env", override=False)


def _cache_signature():
    _load_env()
    return {
        "version": CACHE_VERSION,
        "location": os.getenv("JOB_SEARCH_LOCATION", "Pakistan"),
        "keywords": os.getenv("JOB_SEARCH_KEYWORDS", ""),
        "has_jooble": bool(os.getenv("JOOBLE_API_KEY", "").strip()),
    }

def get_cached_jobs():
    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    if CACHE_FILE.exists():
        try:
            data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
            
            if (
                time.time() - data.get("timestamp", 0) < CACHE_EXPIRY
                and data.get("signature") == _cache_signature()
            ):
                return data["jobs"]
        except Exception as e:
            # If JSON is corrupted or invalid, we will re-fetch
            pass

    # Refresh cache
    jobs = get_all_jobs()

    try:
        CACHE_FILE.write_text(json.dumps({
            "timestamp": time.time(),
            "signature": _cache_signature(),
            "jobs": jobs
        }, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"Failed to write cache file: {e}")

    return jobs

def clear_job_cache():
    """Clear the job cache (for manual refresh)"""
    if CACHE_FILE.exists():
        CACHE_FILE.unlink()
