import os
import sys
import json
import time
from pathlib import Path

# Setup import path for backend
eval_dir = Path(__file__).resolve().parent
project_root = eval_dir.parent
backend_dir = project_root / "backend"
sys.path.insert(0, str(backend_dir))

from ai.rag_pipeline import RAGPipeline
from ai.analyzer import analyze_cv
from test_cv_profiles import SAAD_CV, WEAK_FRONTEND_CV, STRONG_ML_CV
from ai.llm import get_and_clear_routing_trace

from deepeval.test_case import LLMTestCase
from metrics import (
    get_gemini_judge,
    get_faithfulness_metric,
    get_answer_relevancy_metric,
    get_career_quality_metric,
    get_project_quality_metric,
    get_business_compliance_metric,
    get_personalization_metric
)

CV_MAP = {
    "SaadAsifResume": SAAD_CV,
    "JohnDoe": WEAK_FRONTEND_CV,
    "DrAliceSmith": STRONG_ML_CV
}

PREVIOUS_SCORES = {
    "RAG-001": {"faithfulness": 0.90, "answer_relevancy": 0.90, "career_quality": 0.90, "project_quality": 0.90, "business_compliance": 0.90, "personalization": 0.90},
    "RAG-002": {"faithfulness": 0.90, "answer_relevancy": 0.90, "career_quality": 0.90, "project_quality": 0.90, "business_compliance": 0.90, "personalization": 0.90},
    "RAG-003": {"faithfulness": 0.90, "answer_relevancy": 0.90, "career_quality": 0.90, "project_quality": 0.90, "business_compliance": 0.90, "personalization": 0.90},
    "RAG-004": {"faithfulness": 0.90, "answer_relevancy": 0.90, "career_quality": 0.90, "project_quality": 0.90, "business_compliance": 0.90, "personalization": 0.90},
    "JD-001": {"faithfulness": 0.90, "answer_relevancy": 0.90, "career_quality": 0.90, "project_quality": 0.90, "business_compliance": 0.90, "personalization": 0.90}
}

def load_dataset(dataset_path: Path) -> dict:
    with open(dataset_path, "r", encoding="utf-8") as f:
        return json.load(f)

def categorize_score(score: float) -> str:
    if score >= 0.90:
        return "Excellent"
    elif score >= 0.80:
        return "Good"
    elif score >= 0.70:
        return "Fair"
    elif score >= 0.60:
        return "Needs Review"
    else:
        return "Fail"

def categorize_scenario_status(score: float) -> str:
    if score >= 0.70:
        return "PASSED"
    elif score >= 0.60:
        return "NEEDS REVIEW"
    else:
        return "FAILED"

def classify_failure(validation: dict, faithfulness: float, relevancy: float, career: float, project: float, business: float, personalization: float, latency: int, matched_jobs: list) -> str:
    if not validation["json_valid"]:
        return "Parser Failure"
    
    # Check if we got irrelevant jobs
    if matched_jobs:
        first_job_title = matched_jobs[0].get("title", "").lower()
        if "analyst" in first_job_title or "qa" in first_job_title or "tester" in first_job_title:
            return "Retriever Failure"
            
    if any(s < 0.70 for s in [faithfulness, relevancy, career, project, business, personalization]):
        return "Generator Failure"
        
    if not validation["inferred_role_valid"] or validation["missing_skills_count"] != validation["expected_skills_count"] or validation["actions_count"] != validation["expected_actions_count"]:
        return "Business Rule Failure"
        
    if latency > 15000:
        return "Latency Failure"
        
    return "None"

def run_test_scenario(dataset_path: Path, rag: RAGPipeline, model) -> dict:
    data = load_dataset(dataset_path)
    test_id = data["test_id"]
    name = data["name"]
    dataset_input = data["input"]
    expected = data["expected_behavior"]
    
    cv_name = dataset_input["cv_name"]
    cv_text = CV_MAP.get(cv_name)
    if not cv_text:
        raise ValueError(f"CV text not found for name: {cv_name}")
        
    print(f"\n==================================================")
    print(f"RUNNING EVALUATION: {test_id} - {name}")
    print(f"==================================================")
    
    # Clear any previous routing trace
    _ = get_and_clear_routing_trace()
    
    # 1. Pipeline Execution & Latency Measurement
    start_time = time.perf_counter()
    
    if "job_description" in dataset_input:
        # JD Mode
        t_start = time.perf_counter()
        rag_res = rag.analyze_with_jd(
            cv_text=cv_text,
            cv_links=[],
            job_description=dataset_input["job_description"],
            job_title=dataset_input.get("job_title")
        )
        retrieval_ms = int((time.perf_counter() - t_start) * 1000)
        
        t_gen = time.perf_counter()
        analysis = analyze_cv(
            cv_text=cv_text,
            jobs=rag_res["matched_jobs"],
            target_role=dataset_input.get("job_title"),
            job_description=dataset_input["job_description"]
        )
        generation_ms = int((time.perf_counter() - t_gen) * 1000)
    else:
        # Standard RAG Mode
        t_start = time.perf_counter()
        rag_res = rag.retrieve_jobs_with_scores(
            cv_text, 
            target_role=dataset_input.get("target_role")
        )
        retrieval_ms = int((time.perf_counter() - t_start) * 1000)
        
        t_gen = time.perf_counter()
        analysis = analyze_cv(
            cv_text=cv_text,
            jobs=rag_res["matched_jobs"],
            target_role=dataset_input.get("target_role")
        )
        generation_ms = int((time.perf_counter() - t_gen) * 1000)
        
    # Capture the pipeline routing trace
    routing_attempts = get_and_clear_routing_trace()
    
    # 2. Output Formatting & Verification
    actual_output_str = json.dumps(analysis, indent=2)
    retrieval_context = [job.get("description", "")[:1200] for job in rag_res["matched_jobs"][:2]]
    retrieval_titles = [job.get("title", "") for job in rag_res["matched_jobs"][:2]]
    
    # Define input query representation
    input_str = f"Analyze CV for role: {dataset_input.get('target_role') or dataset_input.get('job_title') or 'General'}"
    
    # DEBUG: Print Test Case Details to Verify Pipeline State
    print("\n--- [DEBUG] Test Case Details ---")
    print(f"Input: {input_str}")
    print(f"Retrieval Context Job Titles: {retrieval_titles}")
    print(f"Routing Attempts Trace: {routing_attempts}")
    print(f"Actual Output snippet (first 300 chars):\n{actual_output_str[:300]}...")
    print("---------------------------------\n")
    
    # 3. Construct DeepEval Test Case
    test_case = LLMTestCase(
        input=input_str,
        actual_output=actual_output_str,
        retrieval_context=retrieval_context if retrieval_context else ["No jobs matched."]
    )
    
    # 4. Measure Metrics
    t_eval = time.perf_counter()
    
    print("Evaluating with DeepEval Faithfulness Metric...")
    faithfulness_metric = get_faithfulness_metric(model)
    faithfulness_metric.measure(test_case)
    
    print("Evaluating with DeepEval Answer Relevancy Metric...")
    relevancy_metric = get_answer_relevancy_metric(model)
    relevancy_metric.measure(test_case)
    
    print("Evaluating with GEval: Career Recommendation Quality...")
    career_quality_metric = get_career_quality_metric(model)
    career_quality_metric.measure(test_case)
    
    print("Evaluating with GEval: Project Recommendation Quality...")
    project_quality_metric = get_project_quality_metric(model)
    project_quality_metric.measure(test_case)
    
    print("Evaluating with GEval: Business Rule Compliance...")
    business_compliance_metric = get_business_compliance_metric(model)
    business_compliance_metric.measure(test_case)
    
    print("Evaluating with GEval: Resume Personalization...")
    personalization_metric = get_personalization_metric(model)
    personalization_metric.measure(test_case)
    
    evaluation_ms = int((time.perf_counter() - t_eval) * 1000)
    total_ms = int((time.perf_counter() - start_time) * 1000)
    print(f"Evaluation complete in {evaluation_ms}ms. Total: {total_ms}ms")
    
    # 5. Application Validation Layer Checks
    inferred_role = analysis.get("inferred_role", "")
    role_options = expected.get("inferred_role_options", [])
    role_check = any(option.lower() in inferred_role.lower() for option in role_options)
    
    missing_skills = analysis.get("missing_skills", [])
    actions = analysis.get("top_actions", [])
    
    validation = {
        "json_valid": "error" not in analysis,
        "inferred_role_valid": role_check,
        "missing_skills_count": len(missing_skills),
        "actions_count": len(actions),
        "expected_skills_count": expected.get("missing_skills_count"),
        "expected_actions_count": expected.get("top_actions_count")
    }
    
    # Scores
    f_score = float(faithfulness_metric.score)
    r_score = float(relevancy_metric.score)
    cq_score = float(career_quality_metric.score)
    pq_score = float(project_quality_metric.score)
    bc_score = float(business_compliance_metric.score)
    pe_score = float(personalization_metric.score)
    
    # Blend Python deterministic counts into the Business Rule Compliance score & reasoning
    skills_ok = (validation["missing_skills_count"] == validation["expected_skills_count"])
    actions_ok = (validation["actions_count"] == validation["expected_actions_count"])
    
    if not skills_ok:
        bc_score -= 0.25
        business_compliance_metric.weaknesses.append(f"Did not exactly identify 5 missing skills (found {validation['missing_skills_count']}).")
        business_compliance_metric.deductions.append({
            "criterion": "Missing skills count mismatch",
            "points": -0.25
        })
    if not actions_ok:
        bc_score -= 0.25
        business_compliance_metric.weaknesses.append(f"Did not exactly recommend 3 weekly actions (found {validation['actions_count']}).")
        business_compliance_metric.deductions.append({
            "criterion": "Weekly actions count mismatch",
            "points": -0.25
        })
    bc_score = max(0.0, bc_score)
    business_compliance_metric.score = bc_score
    
    # Calculate Quality Indices
    retrieval_quality = round((f_score * 0.30 + r_score * 0.20) / 0.50, 3)
    generation_quality = round((cq_score * 0.20 + pq_score * 0.15 + pe_score * 0.05) / 0.40, 3)
    business_compliance = round(bc_score, 3)
    overall_ai_quality = round(f_score * 0.30 + r_score * 0.20 + cq_score * 0.20 + pq_score * 0.15 + bc_score * 0.10 + pe_score * 0.05, 3)
    
    # Scenario level status
    scenario_status = categorize_scenario_status(overall_ai_quality)
    passed_evaluation = (scenario_status == "PASSED" and validation["json_valid"])
    
    # Determine failure classification dynamically
    failure_class = classify_failure(validation, f_score, r_score, cq_score, pq_score, bc_score, pe_score, total_ms, rag_res["matched_jobs"])
    
    # Metric categorization bands
    f_band = categorize_score(f_score)
    r_band = categorize_score(r_score)
    cq_band = categorize_score(cq_score)
    pq_band = categorize_score(pq_score)
    bc_band = categorize_score(bc_score)
    pe_band = categorize_score(pe_score)
    
    # Calculate regression comparisons
    prev_f = PREVIOUS_SCORES.get(test_id, {}).get("faithfulness", 0.90)
    prev_r = PREVIOUS_SCORES.get(test_id, {}).get("answer_relevancy", 0.90)
    prev_cq = PREVIOUS_SCORES.get(test_id, {}).get("career_quality", 0.90)
    prev_pq = PREVIOUS_SCORES.get(test_id, {}).get("project_quality", 0.90)
    prev_bc = PREVIOUS_SCORES.get(test_id, {}).get("business_compliance", 0.90)
    prev_pe = PREVIOUS_SCORES.get(test_id, {}).get("personalization", 0.90)
    
    delta_f = f_score - prev_f
    delta_r = r_score - prev_r
    delta_cq = cq_score - prev_cq
    delta_pq = pq_score - prev_pq
    delta_bc = bc_score - prev_bc
    delta_pe = pe_score - prev_pe
    
    # 6. Final Report Generation
    report = {
        "test_id": test_id,
        "name": name,
        "latency": {
            "retrieval_ms": retrieval_ms,
            "generation_ms": generation_ms,
            "evaluation_ms": evaluation_ms,
            "total_ms": total_ms
        },
        "routing_attempts": routing_attempts,
        "quality_indices": {
            "retrieval_quality": retrieval_quality,
            "generation_quality": generation_quality,
            "business_compliance": business_compliance,
            "overall_ai_quality": overall_ai_quality
        },
        "metrics": {
            "faithfulness": {
                "score": f_score,
                "band": f_band,
                "confidence": "N/A",
                "previous_score": prev_f,
                "delta": round(delta_f, 3),
                "reason": str(faithfulness_metric.reason),
                "status": f_band
            },
            "answer_relevancy": {
                "score": r_score,
                "band": r_band,
                "confidence": "N/A",
                "previous_score": prev_r,
                "delta": round(delta_r, 3),
                "reason": str(relevancy_metric.reason),
                "status": r_band
            },
            "career_recommendation_quality": {
                "score": cq_score,
                "band": cq_band,
                "confidence": getattr(career_quality_metric, "confidence", 1.0),
                "previous_score": prev_cq,
                "delta": round(delta_cq, 3),
                "reason": str(career_quality_metric.reason),
                "strengths": getattr(career_quality_metric, "strengths", []),
                "weaknesses": getattr(career_quality_metric, "weaknesses", []),
                "deductions": getattr(career_quality_metric, "deductions", []),
                "status": cq_band
            },
            "project_recommendation_quality": {
                "score": pq_score,
                "band": pq_band,
                "confidence": getattr(project_quality_metric, "confidence", 1.0),
                "previous_score": prev_pq,
                "delta": round(delta_pq, 3),
                "reason": str(project_quality_metric.reason),
                "strengths": getattr(project_quality_metric, "strengths", []),
                "weaknesses": getattr(project_quality_metric, "weaknesses", []),
                "deductions": getattr(project_quality_metric, "deductions", []),
                "status": pq_band
            },
            "business_rule_compliance": {
                "score": bc_score,
                "band": bc_band,
                "confidence": getattr(business_compliance_metric, "confidence", 1.0),
                "previous_score": prev_bc,
                "delta": round(delta_bc, 3),
                "reason": str(business_compliance_metric.reason),
                "strengths": getattr(business_compliance_metric, "strengths", []),
                "weaknesses": getattr(business_compliance_metric, "weaknesses", []),
                "deductions": getattr(business_compliance_metric, "deductions", []),
                "status": bc_band
            },
            "resume_personalization": {
                "score": pe_score,
                "band": pe_band,
                "confidence": getattr(personalization_metric, "confidence", 1.0),
                "previous_score": prev_pe,
                "delta": round(delta_pe, 3),
                "reason": str(personalization_metric.reason),
                "strengths": getattr(personalization_metric, "strengths", []),
                "weaknesses": getattr(personalization_metric, "weaknesses", []),
                "deductions": getattr(personalization_metric, "deductions", []),
                "status": pe_band
            }
        },
        "application_validation": validation,
        "failure_classification": failure_class if scenario_status != "PASSED" else "None",
        "overall_evaluation": {
            "passed": passed_evaluation,
            "status": scenario_status
        }
    }
    
    report_file = eval_dir / "reports" / f"report_{test_id}.json"
    report_file.parent.mkdir(parents=True, exist_ok=True)
    report_file.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Report saved to {report_file}")
    
    return report

def main():
    print("Loading RAG Pipeline...")
    rag = RAGPipeline()
    rag.load_jobs()
    
    print("Loading Judge Model...")
    model = get_gemini_judge()
    
    datasets_dir = eval_dir / "datasets"
    scenarios = sorted(list(datasets_dir.glob("*.json")))
    
    results = {}
    for i, scenario in enumerate(scenarios):
        if i > 0:
            print("\nSleeping 25 seconds to reset Groq TPM rate limits...")
            time.sleep(25)
        try:
            report = run_test_scenario(scenario, rag, model)
            results[report["test_id"]] = {
                "status": report["overall_evaluation"]["status"],
                "failure_classification": report["failure_classification"],
                "overall_ai_quality": report["quality_indices"]["overall_ai_quality"],
                "retrieval_quality": report["quality_indices"]["retrieval_quality"],
                "generation_quality": report["quality_indices"]["generation_quality"],
                "business_compliance": report["quality_indices"]["business_compliance"],
                "f_score": report["metrics"]["faithfulness"]["score"],
                "f_delta": report["metrics"]["faithfulness"]["delta"],
                "r_score": report["metrics"]["answer_relevancy"]["score"],
                "r_delta": report["metrics"]["answer_relevancy"]["delta"],
                "cq_score": report["metrics"]["career_recommendation_quality"]["score"],
                "cq_delta": report["metrics"]["career_recommendation_quality"]["delta"],
                "pq_score": report["metrics"]["project_recommendation_quality"]["score"],
                "pq_delta": report["metrics"]["project_recommendation_quality"]["delta"],
                "bc_score": report["metrics"]["business_rule_compliance"]["score"],
                "bc_delta": report["metrics"]["business_rule_compliance"]["delta"],
                "pe_score": report["metrics"]["resume_personalization"]["score"],
                "pe_delta": report["metrics"]["resume_personalization"]["delta"]
            }
        except Exception as e:
            print(f"Error running evaluation for {scenario.name}: {e}")
            import traceback
            traceback.print_exc()
            
    print("\n========================================================================================================")
    print("MANAGEMENT VIEW: HIGH-LEVEL QUALITY INDICES")
    print("========================================================================================================")
    m_header = f"{'Scenario':<9} | {'Status':<12} | {'Overall AI Q':<12} | {'Retrieval Q':<11} | {'Generation Q':<12} | {'Biz Compliance':<14} | {'Failure Category':<20}"
    print(m_header)
    print("-" * len(m_header))
    for test_id, res in results.items():
        print(f"{test_id:<9} | {res['status']:<12} | {res['overall_ai_quality']:<12.2f} | {res['retrieval_quality']:<11.2f} | {res['generation_quality']:<12.2f} | {res['business_compliance']:<14.2f} | {res['failure_classification']:<20}")
    print("========================================================================================================")
    
    print("\n====================================================================================================================================")
    print("DEVELOPER VIEW: DETAILED SCORES & REGRESSION COMPARISONS")
    print("====================================================================================================================================")
    header = f"{'Scenario':<9} | {'Faithful':<11} | {'Relevance':<11} | {'Career Q':<11} | {'Proj Q':<11} | {'Compliance':<11} | {'Personal':<11}"
    print(header)
    print("-" * len(header))
    for test_id, res in results.items():
        f_str = f"{res['f_score']:.2f}({res['f_delta']:+0.2f})"
        r_str = f"{res['r_score']:.2f}({res['r_delta']:+0.2f})"
        cq_str = f"{res['cq_score']:.2f}({res['cq_delta']:+0.2f})"
        pq_str = f"{res['pq_score']:.2f}({res['pq_delta']:+0.2f})"
        bc_str = f"{res['bc_score']:.2f}({res['bc_delta']:+0.2f})"
        pe_str = f"{res['pe_score']:.2f}({res['pe_delta']:+0.2f})"
        print(f"{test_id:<9} | {f_str:<11} | {r_str:<11} | {cq_str:<11} | {pq_str:<11} | {bc_str:<11} | {pe_str:<11}")
    print("====================================================================================================================================")

if __name__ == "__main__":
    main()
