import json
from ai.llm import generate_response
from utils.analysis_postprocess import postprocess_analysis



# ---------------------------------------------------------------------------
# Fix F: Zero-overlap fast-path — no LLM needed
# ---------------------------------------------------------------------------
_ZERO_OVERLAP_TEMPLATE = {
    "inferred_role": "Software Engineer",
    "job_matches": [],
    "missing_skills": [
        {
            "skill": "Skill alignment with target roles",
            "priority": "HIGH",
            "why": "No skill overlap was found between your CV and the matched jobs. Focus on building the core skills those roles require.",
            "project_type": "new",
            "project": "Starter Project",
            "project_idea": "Build a small project that uses at least 2-3 skills from the job descriptions.",
            "implementation": "Pick the most common skill in the job list, build a minimal working project around it, and push it to GitHub.",
            "evidence": "Zero skill overlap detected between CV and matched jobs.",
        }
    ],
    "project_improvements": [],
    "cv_fixes": [
        {
            "section": "Skills",
            "fix": "Add the technical skills required by your target roles.",
            "why": "Your skills section does not currently match the requirements of the retrieved jobs.",
            "how": "Review the job descriptions, identify the top 5 required skills, and add those you genuinely have.",
        }
    ],
    "top_actions": [
        {
            "action": "Research target job requirements and map your existing skills to them.",
            "section": "Skills",
            "why": "Zero overlap means recruiters will not shortlist this CV for these roles.",
            "how": "Pick 2-3 job postings, list their required skills, highlight gaps, and plan one small project per gap.",
        }
    ],
    "_source": "template:zero_overlap",
}


# ---------------------------------------------------------------------------
# Fix A+B: Build compact structured prompt — no raw CV text, no full JDs
# ---------------------------------------------------------------------------
def _build_structured_prompt(
    cv_skills: list,
    top_jobs: list,
    full_cv_text: str,
    project_context: str,
    links: list,
    target_role: str | None = None,
    job_description: str | None = None,
) -> str:
    """
    Sends structured data to the LLM plus a focused excerpt of the CV for projects.
    Eliminates full job description text from the prompt to save tokens.
    """
    jobs_block = json.dumps(top_jobs, indent=2)

    has_github = any("github" in l.lower() for l in links)
    has_linkedin = any("linkedin" in l.lower() for l in links)
    link_note = ""
    if has_github:
        link_note += " GitHub link is present in CV — do NOT suggest adding GitHub.\n"
    if has_linkedin:
        link_note += " LinkedIn link is present in CV — do NOT suggest adding LinkedIn.\n"

    target_role_section = ""
    if job_description and job_description.strip():
        # JD mode: full job description injected — advice is role-specific
        jd_preview = job_description.strip()[:3000]
        role_label = (target_role or "the target role").strip()
        target_role_section = f"""
---
TARGET JOB DESCRIPTION (pasted by candidate — analyse ONLY against this):
Role: {role_label}

{jd_preview}

CRITICAL INSTRUCTION:
All missing skills, CV fixes, top actions, and project ideas MUST be derived
exclusively from the requirements stated in the job description above.
Do NOT give generic advice. Every recommendation must directly map to a
specific requirement in this job description.
The candidate wants to know: "Am I a fit for THIS specific role?"
"""
    elif target_role and target_role.strip():
        target_role_section = f"""
---
CANDIDATE TARGET CAREER ROLE:
{target_role.strip()}

Your analysis, explanations, missing skills, and actions MUST prioritize helping the candidate align with and get hired for this target career role.
If the top matched jobs below don't fit this target career role, focus your recommendations and actions on this target career role anyway.
Ignore/demote matched job gaps or requirements that are completely irrelevant to this target career role.
"""

    return f"""
You are an AI career assistant. All matching, scoring, and skill extraction has already been done by code.
Your job is ONLY to write the explanations, reasons, gaps, and actionable advice.

Do NOT re-score jobs. Do NOT change the scores. Use them as-is.
{target_role_section}

---
CANDIDATE SUMMARY:
- skills: {json.dumps(cv_skills)}
- links: {json.dumps(links)}

---
CANDIDATE FULL CV DETAILS:
{full_cv_text}

---
CANDIDATE PROJECT/EXPERIENCE EXCERPT:
{project_context}

---
TOP MATCHED JOBS (pre-scored by code):
{jobs_block}

---
LINK NOTES:
{link_note if link_note else 'No GitHub/LinkedIn links found — you may suggest adding them.'}

---
TASKS & DETAILED INSTRUCTIONS:

1. JOB MATCHING — for each job in top_jobs:
   - Use the provided score as-is
   - Write reason in 2 concise sentences: mention the specific CV projects, tools, or experience that support this role
   - Write evidence: cite matched_skills and, if relevant, one project or section name
   - Write gap: state the exact requirements the CV does not yet show, using the job's wording where possible

2. MISSING SKILLS (Exactly 5 entries total):
   - You MUST propose EXACTLY 2 entries as new project ideas (project_type: "new"). 
   - You MUST propose EXACTLY 3 entries as existing projects to update (project_type: "existing").
   - For the 2 new projects:
     * STRICT CRITICAL RULE: The proposed projects MUST be completely new, standalone project concepts from scratch that are NOT listed anywhere on the candidate's CV. Do NOT suggest containerizing, writing tests for, or adding features to projects already listed on the candidate's CV (e.g. do not suggest containerizing or testing their existing 'Student Management System' or 'Simple Portfolio Website'). Any extensions, containerizations, or test suites for existing CV projects belong strictly in the 'existing' projects updates.
     * Focus on critical technical gaps (e.g. Docker, Redis, CI/CD, testing frameworks like PyTest, message queues like RabbitMQ/Celery).
     * Propose a highly tailored, production-grade project title and details.
     * In "project_idea": Describe a solid architecture, the specific features, and exactly what tools/libraries to use. Write a detailed paragraph (2-3 sentences).
     * In "implementation": Give advanced step-by-step instructions and explicitly tell the candidate WHERE to look/what resources to read (e.g. "Follow the official Docker multi-stage build docs", "Refer to the FastAPI background tasks guide", "Check the Redis caching standard tutorials"). Write a detailed paragraph (3-4 sentences).
   - For the 3 existing project updates (project_type: "existing"):
     * Select a project from the CV (e.g., BookYourShoot, ScoutVCT, Student Management System) and suggest adding a highly advanced feature that demonstrates the missing skill.

3. PROJECT IMPROVEMENTS — for existing projects only (Max 3 entries):
   - Read the candidate's existing projects (BookYourShoot, ScoutVCT, VisionBench) and suggest ADVANCED technical upgrades.
   - STRICT CRITICAL RULES: 
     * Do NOT suggest basic REST API endpoint creation. If the candidate built a project in FastAPI or Express, assume they already have REST APIs. Suggest advanced upgrades like query optimizations (PostgreSQL indexes, EXPLAIN ANALYZE), API caching (Redis), rate-limiting middleware, integration tests with PyTest/Supertest, or setting up Docker Compose.
     * Do NOT suggest adding basic Git/GitHub workflows. The candidate is a senior CS student who already lists Git/GitHub in their skills.
     * Propose technical enhancements with measurable outcomes.

4. CV FIXES — max 3 short fixes:
   - Tie each fix to a specific section or project
   - Be specific: name the section, the exact change, and why

5. TOP ACTIONS — exactly 3:
   - STRICT CRITICAL RULES:
     * Do NOT suggest creating a GitHub repository or setting up basic Git.
     * Do NOT suggest generic "tailor your LinkedIn profile" or "add a summary". If suggesting a LinkedIn/resume polish, be highly specific and advanced (e.g., "Add your PyTorch/CUDA benchmarks or face recognition models pipeline diagram link to LinkedIn").
     * Focus on high-impact, professional actions (e.g. containerizing a service, setting up unit tests with 80%+ coverage, writing API documentation).

6. INFERRED ROLE — Determine a short 2-3 word career title that best describes the candidate's CV profile (e.g. 'Frontend Developer', 'Machine Learning Engineer', 'DevOps Engineer', 'Full Stack Developer').

---
RULES:
- Keep ALL explanations to 2-3 sentences where helpful to provide detail.
- Be specific: name projects, technologies, exact deliverables
- Do NOT invent projects, metrics, links, or technologies not found in the excerpt or skills list
- Use the full CV details when proposing top actions, project improvements, and new projects.
- missing_skills: EXACTLY 2 "new" project entries, and EXACTLY 3 "existing" project entries (5 entries total).
- project_improvements: max 3 entries
- cv_fixes: max 3 entries
- top_actions: exactly 3 entries

---
OUTPUT (STRICT JSON ONLY — no markdown fences):
{{
  "inferred_role": "Short 2-3 word career title inferred from CV details",
  "job_matches": [
    {{"title": "", "score": 0, "reason": "", "evidence": "", "gap": ""}}
  ],
  "missing_skills": [
    {{"skill": "", "priority": "HIGH|MEDIUM|LOW", "why": "",
      "project_type": "existing|new", "project": "",
      "project_idea": "", "implementation": "", "evidence": ""}}
  ],
  "project_improvements": [
    {{"project": "", "current_issue": "", "improvement": "", "impact": ""}}
  ],
  "cv_fixes": [
    {{"section": "", "fix": "", "why": "", "how": ""}}
  ],
  "top_actions": [
    {{"action": "", "section": "", "why": "", "how": ""}}
  ]
}}
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def analyze_cv(
    cv_text: str,
    jobs: list,
    links: list | None = None,
    cv_skills: list | None = None,
    projects: list | None = None,
    target_role: str | None = None,
    job_description: str | None = None,
) -> dict:
    """
    Main CV analysis entry point.

    Parameters
    ----------
    cv_text   : raw CV text (used only to extract skills/projects if not supplied)
    jobs      : pre-scored job list from RAGPipeline (already has matched_skills,
                missing_skills, score, overlap, etc.)
    links     : links found in the CV
    cv_skills : pre-extracted skills (avoids re-extraction if already available)
    project_context: text excerpt to use for projects, if not supplied will be extracted from cv_text
    """
    from utils.skill_extractor import extract_skills as _extract_skills

    links = links or []

    # --- Resolve cv_skills -----------------------------------------------
    if not cv_skills:
        cv_skills = _extract_skills(cv_text)

    # --- Fix C: cap at top 2 jobs -----------------------------------------
    top_jobs = jobs[:2]

    # --- Fix F: zero-overlap fast-path ------------------------------------
    total_overlap = sum(j.get("overlap", 0) for j in top_jobs)
    if total_overlap == 0 and len(top_jobs) > 0:
        print("[Analyzer] Zero overlap detected — returning template response (no LLM call)")
        template = dict(_ZERO_OVERLAP_TEMPLATE)
        # Populate job_matches from scored data so UI still shows jobs
        template["job_matches"] = [
            {
                "title": j.get("title", ""),
                "score": j.get("score", 0),
                "reason": "No skill overlap found between your CV and this role.",
                "evidence": "None",
                "gap": ", ".join(j.get("missing_skills", [])[:5]) or "See job description for required skills.",
            }
            for j in top_jobs
        ]
        return postprocess_analysis(template)

    # --- Fix B: build structured prompt context ---------------------------
    # Enrich each job with missing_skills (skills in job but not in CV)
    structured_jobs = []
    for j in top_jobs:
        job_matched = j.get("matched_skills", [])
        # Compute missing: job skills minus cv skills
        from utils.skill_extractor import extract_skills as _es
        job_text = j.get("title", "") + " " + j.get("description", "")
        job_skills_all = _es(job_text)
        missing = [s for s in job_skills_all if s not in cv_skills][:8]
        structured_jobs.append({
            "title": j.get("title", ""),
            "score": j.get("score", 0),
            "matched_skills": job_matched[:10],
            "missing_skills": missing,
        })

    # Extract project context (focused excerpt of CV text)
    full_cv_text = cv_text.strip()
    project_context = full_cv_text
    if cv_text:
        text_lower = cv_text.lower()
        idx = text_lower.find("project")
        if idx == -1:
            idx = text_lower.find("experience")

        if idx != -1:
            start = max(0, idx - 200)
            end = min(len(cv_text), idx + 3000)
            project_context = cv_text[start:end].strip()

    # --- Build and send compact prompt ------------------------------------
    prompt = _build_structured_prompt(
        cv_skills, structured_jobs, full_cv_text, project_context, links,
        target_role=target_role,
        job_description=job_description,
    )

    try:
        response = generate_response(prompt, request_source="analysis")
        result = postprocess_analysis(response)
        return result
    except Exception as e:
        error_response = {
            "error": f"Analysis failed: {str(e)}",
            "raw": "",
            "job_matches": [],
            "missing_skills": [],
            "project_improvements": [],
            "cv_fixes": [],
            "top_actions": []
        }
        print(f"[Analyzer] Exception during CV analysis: {e}")
        return error_response