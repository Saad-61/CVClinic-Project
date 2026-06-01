import sys
from pathlib import Path
import json

# Setup import path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from ai.rag_pipeline import RAGPipeline
from ai.analyzer import analyze_cv

# ---------------------------------------------------------------------------
# Define Test Profiles
# ---------------------------------------------------------------------------

SAAD_CV = """
SAAD ASIF
(+92) 300 4879000 | saadasif78656@gmail.com
github.com/Saad-61 | linkedin.com/in/saad-asif

PROFESSIONAL SUMMARY
Final-year Computer Science student specializing in computer vision and machine learning, with experience building end-to-end systems and deep learning pipelines. Skilled in image processing, feature extraction, and transfer learning using PyTorch and OpenCV. Developed practical computer-vision solutions including face analysis, clustering, and multi-label classification. Seeking to apply ML and computer-vision expertise to real-world intelligent systems.

EDUCATION
FAST National University of Computer and Emerging Sciences (June 2026)
Bachelor of Science in Computer Science

TECHNICAL SKILLS
- Languages: C++, Python, JavaScript.
- Frameworks: OpenCV, PyTorch, scikit-learn, React.js, Express.js, Node.js, FastAPI, TailwindCSS.
- Databases & Cloud: Supabase, MongoDB, PostgreSQL, DuckDB.
- AI & Tools: Google Gemini API, Git, GitHub, Postman, Stripe.

PERSONAL PROJECTS
BookYourShoot (Final Year Project) – AI-Powered Photography Marketplace
[React.js, FastAPI, Supabase, Stripe]
- Built a full-stack marketplace with role-based dashboards, real-time chat (WebSockets), and secure Stripe escrow payments.
- Designed an optimization-based matching system to recommend photographers based on rating, price, distance, and experience.
- Developed an AI pipeline for automatic photo organization using face recognition and clustering, along with automated highlight reel generation.

VisionBench-CelebA – Deep Learning Face Analysis Pipeline
[Python, OpenCV, scikit-learn, PyTorch, ResNet50, CUDA]
- Built a 3-stage CV pipeline on CelebA: image preprocessing/restoration, feature analysis, and deep facial attribute classification.
- Benchmarked Baseline CNN vs ResNet50 transfer learning.

ScoutVCT – AI-Powered Esports Scouting Dashboard
[React, FastAPI, PostgreSQL]
- Built a full-stack analytics platform to evaluate player and team performance across competitive matches.
- Developed a natural-language interface that converts user queries into structured database operations.
"""

WEAK_FRONTEND_CV = """
JOHN DOE
john.doe@example.com

SUMMARY
Junior developer looking for a job. I know some HTML and CSS. I want to build web pages.

EDUCATION
High School Graduate

SKILLS
HTML, CSS, basic JavaScript.

PROJECTS
- Built my personal website using simple HTML.
- Made a basic calculator in Javascript.
"""

STRONG_ML_CV = """
DR. ALICE SMITH
alice.smith@example.com | github.com/alice-ml | linkedin.com/alice-smith-ml

SUMMARY
Senior Machine Learning Scientist with 6+ years of experience designing and deploying deep learning models in production. Specialist in Computer Vision and NLP. Proven record of reducing model latency by 40% and increasing prediction accuracy by 15% in high-traffic commercial applications.

TECHNICAL SKILLS
- Languages: Python, C++, SQL, Go.
- AI/ML Frameworks: PyTorch, TensorFlow, Keras, HuggingFace, OpenCV, scikit-learn.
- Big Data & Cloud: AWS (Sagemaker, EC2, S3), Docker, Kubernetes, Spark, MLflow.

EXPERIENCE
Lead ML Engineer - Vision Corp (2022 - Present)
- Designed and scaled a real-time object detection pipeline handling 10M+ daily requests, improving accuracy by 12%.
- Maintained production PyTorch models running on Kubernetes clusters.
- Mentored a team of 4 junior ML engineers.

Senior Data Scientist - Tech Solutions (2020 - 2022)
- Developed customer churn prediction models using XGBoost, saving $1.2M in annual revenue.
- Created NLP pipelines for sentiment analysis on customer feedback.
"""

PROFILES = [
    {
        "name": "Saad Asif (Targeting Full Stack)",
        "cv_text": SAAD_CV,
        "target_role": "Full Stack Developer"
    },
    {
        "name": "John Doe (Weak Frontend Profile)",
        "cv_text": WEAK_FRONTEND_CV,
        "target_role": "Frontend Developer"
    },
    {
        "name": "Dr. Alice Smith (Strong ML Profile - No Target Role)",
        "cv_text": STRONG_ML_CV,
        "target_role": None
    }
]

def run_tests():
    print("Initializing RAG Pipeline...")
    rag = RAGPipeline()
    rag.load_jobs()
    print(f"Total jobs loaded: {len(rag.jobs)}")

    results = []

    for profile in PROFILES:
        name = profile["name"]
        cv_text = profile["cv_text"]
        target_role = profile["target_role"]
        
        print(f"\n========================================\nRUNNING PROFILE: {name} (Target: {target_role})\n========================================")
        
        # 1. RAG Search
        rag_result = rag.retrieve_jobs_with_scores(cv_text, target_role=target_role)
        matched_jobs = rag_result["matched_jobs"]
        resume_score = rag_result["resume_score"]
        
        # 2. LLM Analysis
        analysis = analyze_cv(
            cv_text=cv_text,
            jobs=matched_jobs,
            target_role=target_role
        )
        
        # Collect top matched job reports
        top_matches = []
        for job in matched_jobs[:3]:
            top_matches.append({
                "title": job.get("title"),
                "company": job.get("company_name", "N/A"),
                "score": job.get("score"),
                "overlap": job.get("overlap"),
                "source": job.get("source")
            })
            
        profile_result = {
            "name": name,
            "target_role": target_role,
            "inferred_role": analysis.get("inferred_role", "Software Engineer"),
            "resume_score": resume_score,
            "top_matches": top_matches,
            "missing_skills": [s.get("skill") for s in analysis.get("missing_skills", [])],
            "top_actions": [a.get("action") for a in analysis.get("top_actions", [])]
        }
        results.append(profile_result)
        
        # Print Summary
        print(f"Resume Score: {resume_score}")
        print(f"Inferred Role: {profile_result['inferred_role']}")
        print("Top Matched Jobs:")
        for idx, m in enumerate(top_matches):
            print(f"  {idx+1}. {m['title']} at {m['company']} (Score: {m['score']}%, Overlap: {m['overlap']} skills, Source: {m['source']})")
        print("Missing Skills:")
        for s in profile_result["missing_skills"]:
            print(f"  - {s}")
        print("Top Actions:")
        for a in profile_result["top_actions"]:
            print(f"  - {a}")
            
    # Write summary report to a JSON file for analysis
    output_file = backend_dir / "profile_test_results.json"
    output_file.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nDone! Summary saved to {output_file}")

if __name__ == "__main__":
    run_tests()
