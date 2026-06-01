import os
import requests
import logging
from pathlib import Path
from dotenv import load_dotenv
from utils.html_cleaner import clean_job_description

logger = logging.getLogger(__name__)


def _load_env() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env", override=False)
    load_dotenv(backend_dir.parent / ".env", override=False)


def _make_job_id(source: str, job_id: object) -> str:
    return f"{source}:{job_id}"


def fetch_remotive():
    url = "https://remotive.com/api/remote-jobs"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()

        jobs = []
        for job in data.get("jobs", [])[:20]:
            raw_job = {
                "id": _make_job_id("remotive", job["id"]),
                "title": job["title"],
                "description": job["description"],
                "url": job.get("url", ""),
                "company_name": job.get("company_name", ""),
                "location": job.get("candidate_required_location", "Remote"),
                "source": "Remotive",
            }
            cleaned_job = clean_job_description(raw_job)
            jobs.append(cleaned_job)
        return jobs
    except Exception as e:
        logger.error(f"Error fetching from Remotive: {e}")
        return []

def fetch_jobicy():
    url = "https://jobicy.com/api/v2/remote-jobs?count=20"
    
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()

        jobs = []
        for job in data.get("jobs", []):
            raw_job = {
                "id": _make_job_id("jobicy", job["id"]),
                "title": job["jobTitle"],
                "description": job["jobDescription"],
                "url": job.get("url", ""),
                "company_name": job.get("companyName", ""),
                "location": job.get("jobGeo", "Remote"),
                "source": "Jobicy",
            }
            cleaned_job = clean_job_description(raw_job)
            jobs.append(cleaned_job)
        return jobs
    except Exception as e:
        logger.error(f"Error fetching from Jobicy: {e}")
        return []


def fetch_jooble_pakistan():
    _load_env()
    api_key = os.getenv("JOOBLE_API_KEY", "").strip()
    if not api_key:
        logger.info("Skipping Jooble: JOOBLE_API_KEY is not configured")
        return []

    location = os.getenv("JOB_SEARCH_LOCATION", "Pakistan").strip() or "Pakistan"
    queries = [
        query.strip()
        for query in os.getenv(
            "JOB_SEARCH_KEYWORDS",
            "software developer,frontend developer,backend developer,python developer,react developer,data analyst",
        ).split(",")
        if query.strip()
    ]

    jobs = []
    seen_ids = set()

    for query in queries:
        try:
            res = requests.post(
                f"https://jooble.org/api/{api_key}",
                json={
                    "keywords": query,
                    "location": location,
                    "page": "1",
                    "ResultOnPage": "10",
                    "companysearch": "false",
                },
                timeout=12,
            )
            res.raise_for_status()
            data = res.json()

            for job in data.get("jobs", []):
                job_id = _make_job_id("jooble", job.get("id") or job.get("link") or f"{query}:{len(jobs)}")
                if job_id in seen_ids:
                    continue
                seen_ids.add(job_id)

                raw_job = {
                    "id": job_id,
                    "title": job.get("title", ""),
                    "description": job.get("snippet", ""),
                    "url": job.get("link", ""),
                    "company_name": job.get("company", ""),
                    "location": job.get("location", location),
                    "source": f"Jooble · {job.get('source', 'Pakistan')}",
                }
                jobs.append(clean_job_description(raw_job))
        except Exception as e:
            logger.error(f"Error fetching from Jooble for query '{query}': {e}")

    return jobs


def fetch_arbeitnow():
    url = "https://www.arbeitnow.com/api/job-board-api"
    try:
        headers = {"Accept": "application/json"}
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        data = res.json()

        jobs = []
        for job in data.get("data", [])[:20]:
            raw_job = {
                "id": _make_job_id("arbeitnow", job.get("slug")),
                "title": job.get("title", ""),
                "description": job.get("description", ""),
                "url": job.get("url", ""),
                "company_name": job.get("company_name", ""),
                "location": "Remote" if job.get("remote") else "Europe",
                "source": "Arbeitnow",
            }
            cleaned_job = clean_job_description(raw_job)
            jobs.append(cleaned_job)
        return jobs
    except Exception as e:
        logger.error(f"Error fetching from Arbeitnow: {e}")
        return []


def fetch_adzuna():
    _load_env()
    app_id = os.getenv("ADZUNA_APP_ID", "").strip()
    app_key = os.getenv("ADZUNA_APP_KEY", "").strip()
    if not app_id or not app_key:
        logger.info("Skipping Adzuna: ADZUNA_APP_ID or ADZUNA_APP_KEY is not configured")
        return []

    # We will search in 'us' (United States) for tech jobs
    country = "us"
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"

    queries = [
        query.strip()
        for query in os.getenv(
            "JOB_SEARCH_KEYWORDS",
            "software developer,frontend developer,backend developer",
        ).split(",")
        if query.strip()
    ][:3]  # Limit to 3 queries to avoid rate limits

    jobs = []
    seen_ids = set()

    for query in queries:
        try:
            params = {
                "app_id": app_id,
                "app_key": app_key,
                "what": query,
                "results_per_page": 5,
            }
            res = requests.get(url, params=params, timeout=10)
            res.raise_for_status()
            data = res.json()

            for job in data.get("results", []):
                job_id = _make_job_id("adzuna", job.get("id"))
                if job_id in seen_ids:
                    continue
                seen_ids.add(job_id)

                company_name = ""
                if isinstance(job.get("company"), dict):
                    company_name = job["company"].get("display_name", "")

                location_str = "Remote"
                if isinstance(job.get("location"), dict):
                    location_str = job["location"].get("display_name", "")

                raw_job = {
                    "id": job_id,
                    "title": job.get("title", ""),
                    "description": job.get("description", ""),
                    "url": job.get("redirect_url", ""),
                    "company_name": company_name,
                    "location": location_str,
                    "source": "Adzuna",
                }
                jobs.append(clean_job_description(raw_job))
        except Exception as e:
            logger.error(f"Error fetching from Adzuna for query '{query}': {e}")

    return jobs


def get_all_jobs():
    jobs = []
    
    # Location-aware jobs first, then broad remote fallback boards.
    jobs.extend(fetch_jooble_pakistan())
    jobs.extend(fetch_remotive())
    jobs.extend(fetch_jobicy())
    jobs.extend(fetch_arbeitnow())
    jobs.extend(fetch_adzuna())

    return jobs
