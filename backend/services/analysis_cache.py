"""
Persistent disk-based analysis cache.

Key:   SHA-256 of the normalized CV text
Value: Full analysis response dict, stored as a JSON file.

Location: backend/cache/analyses/<hash>.json

Benefits over in-memory cache:
  - Survives server restarts
  - One file per unique CV — easy to inspect or purge
  - Zero external dependencies (no Redis, no DB)
"""
import hashlib
import json
import os
from pathlib import Path


# ---------------------------------------------------------------------------
# Cache directory
# ---------------------------------------------------------------------------
_CACHE_DIR = Path(__file__).resolve().parents[1] / "cache" / "analyses"


def _ensure_cache_dir() -> Path:
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    return _CACHE_DIR


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def cv_hash(cv_text: str) -> str:
    """Return a stable SHA-256 hex digest for the given CV text."""
    normalized = cv_text.strip().lower()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def get_cached_analysis(text_hash: str) -> dict | None:
    """
    Return the cached full response dict for this CV hash, or None if not
    found / corrupt.
    """
    cache_file = _ensure_cache_dir() / f"{text_hash}.json"
    if not cache_file.exists():
        return None

    try:
        with open(cache_file, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        print(f"[AnalysisCache] HIT  {text_hash[:12]}… — skipping Gemini call")
        return data
    except (json.JSONDecodeError, OSError) as exc:
        print(f"[AnalysisCache] Corrupt cache entry {text_hash[:12]}…: {exc} — ignoring")
        return None


def save_analysis(text_hash: str, response: dict) -> None:
    """
    Persist the full response dict to disk under the CV hash key.
    Non-blocking: failures are logged but not raised.
    """
    cache_file = _ensure_cache_dir() / f"{text_hash}.json"
    try:
        # Write atomically via a temp file to avoid half-written entries
        tmp_file = cache_file.with_suffix(".tmp")
        with open(tmp_file, "w", encoding="utf-8") as fh:
            json.dump(response, fh, ensure_ascii=False, indent=None)
        tmp_file.replace(cache_file)
        print(f"[AnalysisCache] SAVE {text_hash[:12]}…")
    except OSError as exc:
        print(f"[AnalysisCache] Failed to save cache entry: {exc}")


def cache_info() -> dict:
    """Return a summary of the cache: entry count and approximate disk size."""
    cache_dir = _ensure_cache_dir()
    entries = list(cache_dir.glob("*.json"))
    total_bytes = sum(f.stat().st_size for f in entries if f.is_file())
    return {
        "entries": len(entries),
        "size_mb": round(total_bytes / 1_048_576, 3),
        "cache_dir": str(cache_dir),
    }


def clear_cache() -> int:
    """Delete all cached entries. Returns the number of files removed."""
    cache_dir = _ensure_cache_dir()
    removed = 0
    for entry in cache_dir.glob("*.json"):
        try:
            entry.unlink()
            removed += 1
        except OSError:
            pass
    print(f"[AnalysisCache] Cleared {removed} entries")
    return removed
