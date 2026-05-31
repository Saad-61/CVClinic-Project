import json
from ai.llm import generate_response


def generate_cover_letter(cv_text: str, job: dict, tone: str = "professional") -> dict:
    job_block = json.dumps(job, indent=2)
    prompt = f"""
You are an expert career writer.

Write a concise, tailored cover letter for the candidate and the selected job.

CV TEXT:
{cv_text.strip()}

SELECTED JOB:
{job_block}

TONE:
{tone}

RULES:
- Keep it to 3 short paragraphs.
- Mention the target role and company if available.
- Use only evidence from the CV and selected job.
- Do not invent metrics, employers, degrees, projects, or skills.
- Focus on why the candidate is relevant, not generic enthusiasm.
- Return copy-ready text the user can paste into an email or application form.
- Do not include markdown fences.

RETURN STRICT JSON:
{{
  "job_title": "{str(job.get('title') or '')}",
  "company_name": "{str(job.get('company_name') or '')}",
  "cover_letter": "",
  "notes": ""
}}
"""

    try:
        result = generate_response(prompt, request_source="cover_letter")
        if not isinstance(result, dict):
            return {"error": "Cover letter generation returned an invalid response."}
        return result
    except Exception as e:
        print(f"[CoverLetter] Exception during cover letter generation: {e}")
        return {
            "error": f"Cover letter generation failed: {str(e)}",
            "job_title": str(job.get("title") or ""),
            "company_name": str(job.get("company_name") or ""),
            "cover_letter": "",
            "notes": "",
        }
