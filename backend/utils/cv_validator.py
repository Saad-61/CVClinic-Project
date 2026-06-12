import re
from fastapi import HTTPException
from ai.llm import generate_response

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
    does not match typical offer letter/cover letter/invoice/contract patterns,
    and has structural markers characteristic of a resume/CV.
    Also calls the LLM for high-confidence classification to strictly reject non-CV files.
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

    text_lower = cleaned.lower()

    # 2. Fast Rule-Based Blacklist Check
    # Instantly catch typical offer letter, invoice, cover letter, or contract signatures/clauses
    blacklist_rules = [
        (
            r"pleased to offer you|offer of employment|employment offer|job offer|base salary of|annual salary of|compensation package|start date|accept this offer|sign and return|welcome to the team|welcome you to|letter of offer|offer letter",
            "offer_letter",
            "The uploaded file appears to be a job offer letter or employment agreement. Please upload a standard candidate CV or resume."
        ),
        (
            r"dear hiring manager|dear recruiter|dear sir|dear madam|i am writing to apply|writing to express my interest|my application for|enclosed is my resume|please find attached my CV",
            "cover_letter",
            "The uploaded file appears to be a cover letter. Please upload a standard candidate CV or resume."
        ),
        (
            r"invoice to:|bill to:|amount due|payment receipt|receipt number|payment confirmation|total due:",
            "invoice",
            "The uploaded file appears to be an invoice, bill, or receipt. Please upload a standard candidate CV or resume."
        ),
        (
            r"confidentiality agreement|non-disclosure agreement|mutual nda|indemnification clause|governing law|hereby agree|terms of service|terms and conditions",
            "legal_contract",
            "The uploaded file appears to be a legal contract, agreement, or terms document. Please upload a standard candidate CV or resume."
        )
    ]

    for pattern, doc_type, error_msg in blacklist_rules:
        if re.search(pattern, text_lower):
            print(f"[CV-Validator] Blacklist match: {doc_type}. Text snippet: {text_lower[:250]!r}")
            raise HTTPException(status_code=400, detail=error_msg)

    # 3. Structural header check
    found_headers = []
    for header in RESUME_HEADERS:
        # Match as a word boundary prefix, e.g. \bexperience matches experience or experiences
        if re.search(rf"\b{re.escape(header)}", text_lower):
            found_headers.append(header)

    # If the text has less than 2 common resume headers, it's highly likely to be a non-resume document
    if len(found_headers) < 2:
        print(f"[CV-Validator] Structural check failed. Found headers: {found_headers}. Text preview: {text_lower[:200]!r}")
        raise HTTPException(
            status_code=400,
            detail="The uploaded file does not look like a standard CV or resume. Please ensure you upload a PDF or DOCX containing your professional experience and skills."
        )

    # 4. LLM Verification (Strict Classification)
    validation_prompt = f"""
You are an expert ATS (Applicant Tracking System) document classifier.
Your job is to determine if the text document provided below is a standard Candidate CV/Resume, or if it is another type of document (e.g. an offer letter, cover letter, invoice, contract, recommendation letter, etc.).

A valid CV/resume MUST:
- Describe a single individual's professional work experience, technical/soft skills, projects, and educational background.
- Be structured as a personal CV profile, resume, or portfolio summary.

Documents that are NOT CVs/resumes (and MUST be rejected):
- Offer letters (e.g., offering a job, discussing salary/compensation/benefits, mentioning a start date, asking to sign/accept).
- Cover letters (e.g., addressed to a hiring manager, expressing interest in a role, starting with "Dear...", signing off with "Sincerely").
- Invoices / Receipts / Bills (e.g., "invoice", "billed to", "payment confirmation", financial transactions).
- Reference / Recommendation letters.
- NDAs, Contracts, or Legal agreements.

Analyze the document below and decide if it is a CV/resume.

DOCUMENT TEXT:
\"\"\"
{cleaned[:3500]}
\"\"\"

RETURN STRICT JSON ONLY:
{{
  "is_cv": true or false,
  "document_type": "cv" or "offer_letter" or "cover_letter" or "invoice" or "other",
  "reason": "Explain why it is or is not a CV/resume in one sentence."
}}
"""

    try:
        res = generate_response(validation_prompt, request_source="cv_validation")
        if isinstance(res, dict) and not res.get("is_cv", True):
            doc_type = res.get("document_type", "other")
            reason = res.get("reason", "This document does not represent a candidate's CV or resume details.")
            print(f"[CV-Validator] LLM rejected document. Type: {doc_type}, Reason: {reason}")

            if doc_type == "offer_letter":
                detail = f"The uploaded file appears to be a job offer letter or employment agreement ({reason}). Please upload a standard candidate CV or resume."
            elif doc_type == "cover_letter":
                detail = f"The uploaded file appears to be a cover letter ({reason}). Please upload a standard candidate CV or resume."
            elif doc_type == "invoice":
                detail = f"The uploaded file appears to be an invoice or receipt ({reason}). Please upload a standard candidate CV or resume."
            else:
                detail = f"The uploaded file does not look like a standard CV or resume ({reason}). Please upload a standard candidate CV or resume."
            
            raise HTTPException(status_code=400, detail=detail)
    except HTTPException:
        raise
    except Exception as e:
        # If the LLM call fails due to quota or other network issues, we fall back to the structural header validation results
        print(f"[CV-Validator] LLM validation exception: {e}. Falling back to structural validation.")

