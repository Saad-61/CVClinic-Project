import sys
from pathlib import Path
import json

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from ai.rag_pipeline import RAGPipeline
from ai.analyzer import analyze_cv
from test_cv_profiles import SAAD_CV, WEAK_FRONTEND_CV, STRONG_ML_CV

def dump_full_advice():
    print("Loading RAG Pipeline...")
    rag = RAGPipeline()
    rag.load_jobs()
    
    profiles = [
        {
            "name": "Saad Asif (Strong Full Stack CV)",
            "cv_text": SAAD_CV,
            "target_role": "Full Stack Developer"
        },
        {
            "name": "John Doe (Weak Frontend CV)",
            "cv_text": WEAK_FRONTEND_CV,
            "target_role": "Frontend Developer"
        },
        {
            "name": "Dr. Alice Smith (Strong ML CV)",
            "cv_text": STRONG_ML_CV,
            "target_role": None
        }
    ]
    
    full_output = {}
    
    for p in profiles:
        name = p["name"]
        print(f"Running analysis for: {name}")
        rag_res = rag.retrieve_jobs_with_scores(p["cv_text"], target_role=p["target_role"])
        analysis = analyze_cv(
            cv_text=p["cv_text"],
            jobs=rag_res["matched_jobs"],
            target_role=p["target_role"]
        )
        full_output[name] = {
            "target_role": p["target_role"],
            "resume_score": rag_res["resume_score"],
            "analysis": analysis
        }
        
    out_file = backend_dir / "full_advice_dumps.json"
    out_file.write_text(json.dumps(full_output, indent=2), encoding="utf-8")
    print(f"Done! Full output dumped to {out_file}")

if __name__ == "__main__":
    dump_full_advice()
