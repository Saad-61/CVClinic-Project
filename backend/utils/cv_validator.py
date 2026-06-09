import re
from fastapi import HTTPException

RESUME_HEADERS = [
    "experience",
    "education",
    "skills",
    "projects",
    "employment",
    "work history",
    "contact",
    "summary",
    "qualification",
    "certification",
    "award",
    "languages",
    "about me",
    "objective"
]

def validate_cv_text(text: str) -> None:
    """
    Validates that the extracted CV text is non-empty, sufficiently long,
    and has structural markers characteristic of a resume/CV.
    Raises HTTPException(status_code=400, detail=...) if validation fails.
    """
    if not text:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty. Please upload a valid document."
        )

    # Basic cleaning to count characters reliably
    cleaned = text.strip()
    
    # 1. Scanned / Empty PDF check
    if len(cleaned) < 150:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file appears to be empty or a scanned image. Please upload a text-based PDF or DOCX file."
        )

    # 2. Structural header check
    text_lower = cleaned.lower()
    found_headers = []
    for header in RESUME_HEADERS:
        # Match as a word boundary prefix, e.g. \bexperience matches experience or experiences
        if re.search(rf"\b{re.escape(header)}", text_lower):
            found_headers.append(header)

    # If the text has less than 2 common resume headers, it's highly likely to be a non-resume document
    if len(found_headers) < 2:
        print(f"[CV-Validator] Validation failed. Found headers: {found_headers}. Text preview: {text_lower[:200]!r}")
        raise HTTPException(
            status_code=400,
            detail="The uploaded file does not look like a standard CV or resume. Please ensure you upload a PDF or DOCX containing your professional experience and skills."
        )
