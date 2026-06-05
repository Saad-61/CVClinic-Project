"""
Quick integration test: sends each CV against the fullstack JD
using the already-running backend at http://127.0.0.1:8000
"""
import httpx
import json

JD_FULLSTACK = (
    "Remote Fullstack Engineer\n"
    "A respected US-based client is looking for a Full-stack Developer.\n\n"
    "Job Responsibilities:\n"
    "- Apply Python and/or JavaScript/TypeScript knowledge to solve challenges.\n"
    "- Maintain open lines of communication with stakeholders.\n"
    "- Create reliable response mechanisms using scripting or algorithms.\n"
    "- Help with troubleshooting initiatives and documenting issues.\n\n"
    "Job Requirements:\n"
    "- Bachelor degree in Engineering or Computer Science.\n"
    "- Knowledgeable in Python, JavaScript, and TypeScript.\n"
    "- Familiar with software engineering best practices.\n"
    "- Able to communicate effectively in English.\n\n"
    "Job Benefits:\n"
    "- Competitive salary in USD. Remote work. Collaborate with global experts."
)

JD_DATA_ANALYST = (
    "Junior Data Analyst\n\n"
    "We are hiring a Junior Data Analyst to join our insights team.\n\n"
    "Requirements:\n"
    "- Proficiency in SQL, Excel, and at least one of: Python or R.\n"
    "- Experience with data visualization tools: Tableau, Power BI, or Matplotlib.\n"
    "- Strong analytical thinking and ability to communicate findings clearly.\n"
    "- Bachelor degree in Statistics, Mathematics, CS, or related field.\n"
    "- Familiarity with ETL pipelines and data warehousing concepts.\n\n"
    "Responsibilities:\n"
    "- Build dashboards and reports from raw data.\n"
    "- Write SQL queries to extract and transform data.\n"
    "- Collaborate with product and engineering teams on data requests.\n"
    "- Document data pipelines and maintain data dictionaries."
)

CVS = [
    ("SaadCV",             r"E:\work\New folder\RAG project\backend\data\SaadCV.pdf"),
    ("Saad_Resume",        r"E:\work\New folder\RAG project\backend\data\Saad_Resume.pdf"),
    ("SaadAsifResume",     r"E:\work\New folder\RAG project\SaadAsifResume.pdf"),
    ("SaadAsifResumeAIML", r"E:\work\New folder\RAG project\SaadAsifResumeAIML.pdf"),
]

JOBS = [
    ("Remote Fullstack Engineer", JD_FULLSTACK),
    ("Junior Data Analyst",       JD_DATA_ANALYST),
]

URL = "http://127.0.0.1:8000/cv/analyze"

print("=" * 70)
print("JD MODE INTEGRATION TESTS")
print("=" * 70)

for jd_title, jd_text in JOBS:
    print(f"\n{'─'*70}")
    print(f"JD: {jd_title}")
    print(f"{'─'*70}")

    for cv_name, cv_path in CVS:
        try:
            with open(cv_path, "rb") as f:
                files = {"file": (cv_name + ".pdf", f, "application/pdf")}
                data  = {"job_description": jd_text, "job_title": jd_title}
                r = httpx.post(URL, files=files, data=data, timeout=180)

            if r.status_code != 200:
                print(f"  [{cv_name}] HTTP {r.status_code}: {r.text[:200]}")
                continue

            res     = r.json()
            job     = res.get("matched_jobs", [{}])[0]
            an      = res.get("analysis", {})
            gaps    = [m["skill"] for m in an.get("missing_skills", [])[:3]]
            actions = [a["action"][:70] for a in an.get("top_actions", [])[:2]]

            print(f"\n  CV: {cv_name}")
            print(f"    is_jd_mode   : {res.get('is_jd_mode')}")
            print(f"    match_score  : {job.get('score')} %")
            print(f"    overlap      : {job.get('overlap')} shared skills")
            print(f"    matched_sk   : {job.get('matched_skills')}")
            print(f"    resume_score : {res.get('resume_score')}")
            print(f"    inferred_role: {an.get('inferred_role')}")
            print(f"    top gaps     : {gaps}")
            print(f"    top actions  :")
            for a in actions:
                print(f"      - {a}")

        except Exception as e:
            print(f"  [{cv_name}] FAILED: {e}")

print(f"\n{'='*70}")
print("Tests complete.")
print("=" * 70)
