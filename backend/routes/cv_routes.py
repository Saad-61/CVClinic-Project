from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from ai.rag_pipeline import RAGPipeline
from ai.cover_letter import generate_cover_letter
from ai.rewrite import generate_fix_rewrite
from models.schemas import GenerateCoverLetterRequest, GenerateFixRequest
from models.history import save_analysis_result
from services.cv_parser import extract_text_from_file, extract_links_from_file
from services.analysis_cache import cv_hash, get_cached_analysis, save_analysis, cache_info
from utils.file_handler import save_file
from utils.skill_extractor import extract_skills
from utils.cv_validator import validate_cv_text
from ai.analyzer import analyze_cv
import os


router = APIRouter(prefix="/cv", tags=["CV"])

_rag: RAGPipeline | None = None


def get_rag_pipeline() -> RAGPipeline:
    global _rag
    if _rag is None:
        _rag = RAGPipeline()
    return _rag

@router.post("/upload")
async def upload_cv(file: UploadFile = File(...)):
    file_path = save_file(file)
    text = extract_text_from_file(file_path)
    validate_cv_text(text)

    return {
        "filename": file.filename,
        "preview": text
    }

@router.post("/match-jobs")
async def match_jobs(file: UploadFile = File(...)):
    file_path = save_file(file)
    text = extract_text_from_file(file_path)
    validate_cv_text(text)

    jobs = get_rag_pipeline().retrieve_jobs(text)

    return {
        "matched_jobs": jobs
    }

@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    target_role: str | None = Form(None),
    job_description: str | None = Form(None),
    job_title: str | None = Form(None),
    cv_text: str | None = Form(None),
):
    file_path = save_file(file)
    if cv_text:
        text = cv_text
    else:
        text = extract_text_from_file(file_path)
    validate_cv_text(text)
    file_links = extract_links_from_file(file_path, text)
    if cv_text:
        file_links = [l for l in file_links if "@" not in l and not l.lower().startswith("mailto:")]

    # Normalise JD inputs
    jd_text  = (job_description or "").strip()[:4000] or None
    jd_title = (job_title or "").strip() or None

    # ── Persistent disk cache check ────────────────────────────────────────
    role_key = (target_role or "").strip().lower()
    jd_key   = jd_text or ""
    h = cv_hash(text + "||role:" + role_key + "||jd:" + jd_key)
    cached = get_cached_analysis(h)
    if cached is not None:
        cached["jooble_configured"] = bool(os.getenv("JOOBLE_API_KEY", "").strip())
        if "target_role" not in cached or cached["target_role"] is None:
            cached["target_role"] = target_role
        return cached

    # ── Full analysis ──────────────────────────────────────────────────────
    if jd_text:
        # JD mode: skip the vector database entirely
        rag_result = get_rag_pipeline().analyze_with_jd(
            text, file_links, jd_text, job_title=jd_title
        )
    else:
        # Normal mode: RAG against the live job database
        rag_result = get_rag_pipeline().retrieve_jobs_with_scores(
            text, file_links, target_role=target_role
        )

    jobs         = rag_result["matched_jobs"]
    all_jobs     = rag_result.get("all_jobs", [])
    links        = list(dict.fromkeys([*(rag_result.get("links", [])), *file_links]))
    resume_score = rag_result.get("resume_score", 0)
    is_jd_mode   = rag_result.get("is_jd_mode", False)
    jd_job_title = rag_result.get("jd_job_title")

    # Extract skills once and pass through — avoids double extraction
    cv_skills = extract_skills(text)

    try:
        analysis = analyze_cv(
            text, jobs, links, cv_skills=cv_skills,
            target_role=jd_title or target_role,
            job_description=jd_text,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    response = {
        "matched_jobs":      jobs,
        "all_jobs":          all_jobs,
        "links":             links,
        "resume_score":      resume_score,
        "analysis":          analysis,
        "cv_text":           text,
        "jooble_configured": bool(os.getenv("JOOBLE_API_KEY", "").strip()),
        "target_role":       target_role,
        "is_jd_mode":        is_jd_mode,
        "jd_job_title":      jd_job_title,
    }

    # ── Persist to disk cache ──────────────────────────────────────────────
    save_analysis(h, response)

    # Save to history (non-critical)
    try:
        result_id = save_analysis_result(file.filename, response)
        response["result_id"] = result_id
    except Exception as e:
        print(f"Warning: Failed to save result to history: {e}")

    return response



@router.get("/cache-info")
async def get_cache_info():
    """Dev endpoint: returns the number of cached analyses and disk usage."""
    return cache_info()


@router.post("/generate-fix")
async def generate_fix(payload: GenerateFixRequest):
    output_format = (payload.output_format or "").strip().lower()
    if output_format not in {"plain", "latex"}:
        raise HTTPException(status_code=400, detail="output_format must be 'plain' or 'latex'")

    result = generate_fix_rewrite(
        cv_text=payload.cv_text,
        section=payload.fix.section,
        fix=payload.fix.fix,
        why=payload.fix.why,
        how=payload.fix.how,
        output_format=output_format,
    )

    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="Rewrite generation failed")

    if "error" in result:
        raise HTTPException(status_code=502, detail=str(result["error"]))

    return {
        "section": str(result.get("section") or payload.fix.section),
        "format": str(result.get("format") or output_format),
        "rewritten_text": str(result.get("rewritten_text") or "").strip(),
        "notes": str(result.get("notes") or "").strip(),
    }


@router.post("/generate-cover-letter")
async def generate_cover_letter_route(payload: GenerateCoverLetterRequest):
    if not payload.cv_text.strip():
        raise HTTPException(status_code=400, detail="cv_text is required")
    if not payload.job.title.strip():
        raise HTTPException(status_code=400, detail="job.title is required")

    result = generate_cover_letter(
        cv_text=payload.cv_text,
        job=payload.job.model_dump(),
        tone=payload.tone,
    )

    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="Cover letter generation failed")

    if "error" in result:
        raise HTTPException(status_code=502, detail=str(result["error"]))

    return {
        "job_title": str(result.get("job_title") or payload.job.title),
        "company_name": str(result.get("company_name") or payload.job.company_name),
        "cover_letter": str(result.get("cover_letter") or "").strip(),
        "notes": str(result.get("notes") or "").strip(),
    }
