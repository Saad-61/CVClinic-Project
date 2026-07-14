import sys
import json
import time
from pathlib import Path

# Setup import path
eval_dir = Path(__file__).resolve().parent
backend_dir = eval_dir.parent / "backend"
sys.path.insert(0, str(backend_dir))

from ai.rag_pipeline import RAGPipeline
from ai.analyzer import analyze_cv
from test_cv_profiles import SAAD_CV, WEAK_FRONTEND_CV, STRONG_ML_CV

CV_MAP = {
    "SaadAsifResume": SAAD_CV,
    "JohnDoe": WEAK_FRONTEND_CV,
    "DrAliceSmith": STRONG_ML_CV
}

def main():
    print("Initializing RAG Pipeline for pre-computation...")
    rag = RAGPipeline()
    rag.load_jobs()

    # Define the 3 target test cases
    test_cases = [
        {
            "cv_name": "JohnDoe",
            "job_title": "Remote Fullstack Engineer",
            "job_description": (
                "We are looking for a Remote Fullstack Engineer.\n"
                "Requirements:\n"
                "- 3+ years experience with React and Node.js.\n"
                "- Experience with Python or Go.\n"
                "- Solid understanding of Docker and AWS.\n"
            )
        },
        {
            "cv_name": "SaadAsifResume",
            "target_role": "Backend Developer"
        },
        {
            "cv_name": "JohnDoe",
            "target_role": "Frontend Developer"
        }
    ]

    outputs = {}

    for i, case in enumerate(test_cases):
        cv_name = case["cv_name"]
        target_role = case.get("target_role", "")
        job_title = case.get("job_title", "")
        job_description = case.get("job_description", "")

        # Key for matching in Promptfoo JS provider
        key = f"{cv_name}_{target_role or job_title}"
        print(f"[{i+1}/{len(test_cases)}] Pre-computing output for {key}...")

        cv_text = CV_MAP[cv_name]

        # Rate-limiting delay
        if i > 0:
            print("Sleeping 5 seconds to prevent rate limits...")
            time.sleep(5)

        if job_description:
            # JD Mode
            rag_res = rag.analyze_with_jd(
                cv_text=cv_text,
                cv_links=[],
                job_description=job_description,
                job_title=job_title
            )
            analysis = analyze_cv(
                cv_text=cv_text,
                jobs=rag_res["matched_jobs"],
                target_role=job_title,
                job_description=job_description
            )
        else:
            # Standard RAG Mode
            rag_res = rag.retrieve_jobs_with_scores(
                cv_text, 
                target_role=target_role
            )
            analysis = analyze_cv(
                cv_text=cv_text,
                jobs=rag_res["matched_jobs"],
                target_role=target_role
            )

        outputs[key] = analysis

    # Write pre-computed results to JSON file
    output_path = eval_dir / "promptfoo_outputs.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(outputs, f, indent=2)
    
    print(f"Pre-computation complete! Saved {len(outputs)} test outputs to {output_path}")

if __name__ == "__main__":
    main()
