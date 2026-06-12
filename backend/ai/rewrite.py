import re
from ai.llm import generate_response


def _extract_section_snippet(cv_text: str, section: str, max_lines: int = 80) -> str:
    """
    Extract the most relevant section block from the CV.
    Falls back to a head snippet if the section is not found.
    """
    lines = cv_text.splitlines()
    terms = [t.strip().lower() for t in section.split("->") if t.strip()]
    if not terms:
        return cv_text[:800].strip() + ("..." if len(cv_text) > 800 else "")

    target_term = terms[-1]
    start_index = None

    # 1. Look for a line containing/matching target_term with bullet or start check
    for idx, line in enumerate(lines):
        line_clean = line.strip().lower()
        if not line_clean:
            continue
        if (
            line_clean == target_term or
            line_clean.startswith(target_term + " ") or
            line_clean.startswith(target_term + ":") or
            (target_term in line_clean and any(bullet in line_clean for bullet in ["•", "-", "*"]))
        ):
            start_index = idx
            break

    # 2. Look for any line containing target_term
    if start_index is None:
        for idx, line in enumerate(lines):
            line_clean = line.strip().lower()
            if target_term in line_clean:
                start_index = idx
                break

    # 3. Fall back to parent term if multiple parts
    if start_index is None and len(terms) > 1:
        parent_term = terms[0]
        for idx, line in enumerate(lines):
            line_clean = line.strip().lower()
            if (
                line_clean == parent_term or
                line_clean.startswith(parent_term + " ") or
                line_clean.startswith(parent_term + ":")
            ):
                start_index = idx
                break

    if start_index is None:
        return cv_text[:800].strip() + ("..." if len(cv_text) > 800 else "")

    block: list[str] = []
    start_is_bullet = any(lines[start_index].strip().startswith(b) for b in ["•", "-", "*"])

    for idx in range(start_index, len(lines)):
        line = lines[idx]
        stripped = line.strip()
        
        if block:
            # If start was a bullet, stop at the next bullet
            if start_is_bullet and any(stripped.startswith(b) for b in ["•", "-", "*"]):
                break
            # Stop if we hit a clear new section header
            if stripped and stripped == stripped.upper() and len(stripped) <= 80:
                break
            if stripped.endswith(":") and len(stripped) <= 40:
                break
                
        block.append(line)
        if len(block) >= max_lines:
            break

    return "\n".join(block).strip()


def generate_fix_rewrite(
    cv_text: str,
    section: str,
    fix: str,
    why: str,
    how: str,
    output_format: str,
):
    format_name = "LaTeX-ready snippet" if output_format == "latex" else "plain text"

    # Provide the full CV plus a focused section block so the model can preserve names
    # while still keeping the rewrite targeted to the requested section.
    full_cv_text = cv_text.strip()
    section_snippet = _extract_section_snippet(cv_text, section)

    prompt = f"""
You are an expert resume editor.

Rewrite only the requested CV section. Do not rewrite the whole CV.

FULL CV TEXT:
{full_cv_text}

RELEVANT CV SECTION ({section}):
{section_snippet}

TARGET SECTION:
{section}

REQUESTED CHANGE:
{fix}

WHY:
{why}

HOW:
{how}

OUTPUT MODE:
{format_name}

RULES:
- Focus only on the named section.
- Preserve exact names of courses, certifications, projects, tools, employers, and titles that already appear in the CV.
- Keep the user's likely background grounded in the CV section text above.
- Do not invent jobs, projects, metrics, awards, links, or technologies.
- Do not replace a specific certification or course title with a generic placeholder.
- Do not append any note about the input being incomplete; if a bullet is unfinished, rewrite only the supported part cleanly.
- If information is missing, improve phrasing and structure using only supported details.
- Return replacement-ready content the user can paste directly into their CV.
- If output mode is plain text, the "rewritten_text" field of the JSON must contain clean resume-ready text only. Do not include section headings in this field unless it's part of a bullet point.
- If output mode is latex, the "rewritten_text" field of the JSON must contain valid LaTeX code. You MUST wrap key technical skills, tools, methodologies, and frameworks (like "Machine Learning", "Computer Vision", "PyTorch", "CUDA", "OpenCV", "RAG", "FAISS", etc.) in \\\\textbf{{...}}. Ensure special characters (like %, &, $, _, etc.) are escaped using standard single backslash notation in LaTeX (e.g. \\\\%, \\\\&, \\\\$, \\\\_).
- IMPORTANT: Any LaTeX backslash (like in \\\\textbf or \\\\%) must be written with a single backslash in the decoded text. This means in the raw JSON output, it must be escaped as two backslashes (e.g. "\\\\textbf{{...}}" and "\\\\%"). Any unescaped backslash in a JSON string is invalid and will cause a JSON parsing failure. Check that you do not output double backslashes (like \\\\\\\\% or \\\\\\\\textbf) in the final parsed text.
- Do not include markdown fences in the response.
- Add a short paste note explaining where to place the rewrite in the "notes" field.

RETURN STRICT JSON:
{{
  "section": "{section}",
  "format": "{output_format}",
  "rewritten_text": "",
  "notes": ""
}}
"""

    try:
        result = generate_response(prompt, request_source="rewrite")
        if not isinstance(result, dict):
            return {"error": "Rewrite generation returned an invalid response."}
        return result
    except Exception as e:
        print(f"[Rewrite] Exception during rewrite generation: {e}")
        return {
            "error": f"Rewrite generation failed: {str(e)}",
            "section": section,
            "format": output_format,
            "rewritten_text": "",
            "notes": ""
        }
