import json
import re
from pathlib import Path
import numpy as np

from ai.embeddings import get_embedding
from ai.vector_store import VectorStore
from services.job_cache import get_cached_jobs
from utils.skill_extractor import extract_skills
from utils.link_extractor import extract_links


def _detect_seniority(text: str, title: str = "") -> str:
    """
    Detects seniority level: 'principal', 'senior', 'mid', or 'junior'.
    """
    text_lower = (title + " " + text).lower()
    
    # Principal / Staff / Executive keywords
    if any(w in text_lower for w in ["principal", "staff", "architect", "director", "vp", "head of", "chief", "cto", "cio"]):
        return "principal"
        
    # Senior / Lead keywords
    if any(w in text_lower for w in ["senior", "sr.", "lead engineer", "lead developer", "team lead", "tech lead", "engineering manager", "product manager", "project manager"]):
        return "senior"
        
    # Junior / Entry / Intern keywords
    if any(w in text_lower for w in ["junior", "jr.", "intern", "entry", "associate", "student", "graduate", "fresh", "final-year", "final year"]):
        return "junior"
        
    return "mid"


def _compute_seniority_penalty(cv_seniority: str, job_seniority: str) -> float:
    """
    Returns a multiplier (0.0 to 1.0) based on seniority alignment.
    """
    levels = {"junior": 1, "mid": 2, "senior": 3, "principal": 4}
    cv_val = levels.get(cv_seniority, 2)
    job_val = levels.get(job_seniority, 2)
    
    # If candidate meets or exceeds job seniority, no penalty
    if cv_val >= job_val:
        if cv_val - job_val >= 2:
            return 0.90  # minor penalty for severe overqualification
        return 1.0
        
    # Underqualified cases
    diff = job_val - cv_val
    if diff == 1:
        if job_seniority == "mid":
            return 0.85
        elif job_seniority == "senior":
            return 0.80
        return 0.85
    elif diff == 2:
        if job_seniority == "senior":
            return 0.60
        return 0.70
    elif diff >= 3:
        return 0.45
        
    return 1.0


class RAGPipeline:
    def __init__(self):
        self.vector_store = None
    # Loads job descriptions from a JSON file, generates embeddings for each job description, and stores them in a vector store for later retrieval.
    # def load_jobs(self):
    #     data_file = Path(__file__).resolve().parents[1] / "data" / "jobs.json"
    #     with open(data_file, "r", encoding="utf-8") as f:
    #         jobs = json.load(f)

    #     texts = [job["description"] for job in jobs]
    #     embeddings = [get_embedding(text) for text in texts]

    #     dim = len(embeddings[0])
    #     self.vector_store = VectorStore(dim)
    #     self.vector_store.add_vectors(embeddings, jobs)

    
    # This method checks if the vector store is initialized, and if not, it loads the job descriptions and their embeddings. It then generates an embedding for the input CV text and retrieves the most relevant job descriptions based on similarity from the vector store.
    def load_jobs(self):
        jobs = get_cached_jobs()
        self.jobs = jobs

        texts = [job["description"] for job in jobs]
        embeddings = [get_embedding(text) for text in texts]

        dim = len(embeddings[0])
        self.vector_store = VectorStore(dim)
        self.vector_store.add_vectors(embeddings, jobs)


    # Given the text extracted from a CV, this method generates an embedding for the CV text and retrieves the most relevant job descriptions from the vector store based on similarity.
    def retrieve_jobs(self, cv_text):
        if self.vector_store is None:
            self.load_jobs()

        query_embedding = get_embedding(cv_text)
        results = self.vector_store.search(query_embedding)

        return results

    def compute_final_score(self, embedding_similarity, overlap, cv_skills, job_skills, cv_text=None, job_text=None, job_title=None):
        """
        Hybrid scoring formula:
          - 50% embedding similarity
          - 50% skill overlap (normalized against actual job skill count)
        """
        embedding_score = embedding_similarity * 100

        # Skill overlap: fraction of job skills the CV covers (0-1)
        job_skill_count = max(len(job_skills), 1)
        overlap_ratio = min(overlap / job_skill_count, 1.0)
        overlap_score = overlap_ratio * 100

        # 50/50 blend
        score = (0.5 * embedding_score) + (0.5 * overlap_score)

        # Apply stricter penalties based on absolute overlap count to ensure realism
        if overlap == 0:
            score *= 0.15
        elif overlap == 1:
            score *= 0.40
        elif overlap == 2:
            score *= 0.65
        elif overlap == 3:
            score *= 0.80
        elif overlap == 4:
            score *= 0.90

        # Apply seniority mismatch penalty if text is provided
        if cv_text is not None and (job_text is not None or job_title is not None):
            cv_seniority = _detect_seniority(cv_text)
            job_seniority = _detect_seniority(job_text or "", job_title or "")
            seniority_penalty = _compute_seniority_penalty(cv_seniority, job_seniority)
            score *= seniority_penalty

        return round(min(score, 100.0), 2)

    def generate_evidence(self, cv_skills, job_skills, cv_text, job_text):
        """
        Generate human-readable evidence of why this job matched
        Example: "Matched FastAPI, PostgreSQL from BookYourShoot project"
        """
        matched_skills = list(set(cv_skills) & set(job_skills))
        
        if matched_skills:
            # Take top 2-3 matched skills for conciseness
            top_skills = matched_skills[:3]
            evidence = f"Matched: {', '.join(top_skills)}"
            return evidence
        return "Semantic match on job description"

    def calculate_resume_score(self, cv_skills, cv_text, cv_links=None, best_match_score=None):
        """
        Calculate overall resume quality score (0-100).
        """
        text_lower = cv_text.lower()

        # Skill depth: 25 pts — normalized to 20 distinct skills
        skill_score = min(len(cv_skills) / 20 * 25, 25)

        # Project/experience evidence: 20 pts — normalized to 24 keyword hits
        project_keywords = [
            "project", "projects", "built", "build", "building",
            "developed", "develop", "developing", "developer",
            "implemented", "implement", "implementing", "implementation",
            "designed", "design", "designing", "designer",
            "created", "create", "creating", "creation",
            "engineered", "engineer", "engineering",
            "launched", "launch", "launching",
            "led", "lead", "leading", "leader",
            "managed", "manage", "managing", "manager",
            "experience", "experiences", "worked", "working", "work"
        ]
        project_mentions = 0
        for kw in project_keywords:
            project_mentions += len(re.findall(rf"\b{re.escape(kw)}\b", text_lower))
        project_score = min(project_mentions / 24 * 20, 20)

        # Links / proof: 10 pts — 2 links = max
        links = cv_links if cv_links is not None else extract_links(cv_text)
        link_score = min(len(links) / 2 * 10, 10)

        # Impact signals: 15 pts — 12 hits = max (words count 1, numeric metrics count 2)
        impact_keywords = [
            "improved", "improve", "improving", "improvement", "improvements",
            "reduced", "reduce", "reducing", "reduction", "reductions",
            "increased", "increase", "increasing", "growth",
            "automated", "automate", "automating", "automation",
            "deployed", "deploy", "deploying", "deployment", "deployments",
            "scaled", "scale", "scaling", "scalability",
            "optimised", "optimise", "optimising", "optimized", "optimize", "optimizing", "optimization", "optimizations",
            "achieved", "achieve", "achieving", "achievement", "achievements",
            "awarded", "award", "awards",
            "saved", "save", "saving", "savings",
            "boosted", "boost", "boosting",
            "accelerated", "accelerate", "accelerating",
            "delivered", "deliver", "delivering", "delivery",
            "revenue", "profit", "efficiency", "performance"
        ]
        impact_count = 0
        for kw in impact_keywords:
            impact_count += len(re.findall(rf"\b{re.escape(kw)}\b", text_lower))

        metric_matches = re.findall(r"\b\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?\s*[kKmMbB]?\b|\b\d+\s*[kKmM]\+?\b", cv_text)
        metric_count = len(metric_matches)

        total_impact_points = impact_count + (metric_count * 2)
        impact_score = min(total_impact_points / 12 * 15, 15)

        # Education & Seniority depth: 10 pts
        has_phd = any(re.search(rf"\b{re.escape(w)}\b", text_lower) for w in ["phd", "ph.d", "doctorate", "doctor of philosophy"])
        has_masters = any(re.search(rf"\b{re.escape(w)}\b", text_lower) for w in ["master", "masters", "ms", "m.s.", "msc", "m.sc", "postgraduate"])
        has_bachelors = any(re.search(rf"\b{re.escape(w)}\b", text_lower) for w in ["bachelor", "bachelors", "bs", "b.s.", "bsc", "b.sc", "undergraduate", "university", "college"])

        education_pts = 3  # default
        if has_phd:
            education_pts = 10
        elif has_masters:
            education_pts = 8
        elif has_bachelors:
            education_pts = 6

        cv_seniority = _detect_seniority(cv_text)
        if cv_seniority in ["senior", "principal"] and education_pts < 10:
            education_pts = min(education_pts + 4, 10)

        education_score = education_pts

        # Target Role/Job Alignment: 20 pts
        if best_match_score is not None:
            alignment_score = (best_match_score / 100) * 20
        else:
            alignment_score = 10  # default baseline if no job context is present

        raw = skill_score + project_score + link_score + impact_score + education_score + alignment_score
        final = round(min(raw, 100), 2)
        print(
            f"[ResumeScore] skills={len(cv_skills)} skill_pts={round(skill_score,1)} "
            f"proj_mentions={project_mentions} proj_pts={round(project_score,1)} "
            f"links={len(links)} link_pts={round(link_score,1)} "
            f"impact={total_impact_points} (kw={impact_count}, metrics={metric_count}) impact_pts={round(impact_score,1)} "
            f"edu_pts={round(education_score,1)} "
            f"alignment_pts={round(alignment_score,1)} "
            f"TOTAL={final}"
        )
        return final


    def analyze_with_jd(self, cv_text: str, cv_links: list | None, job_description: str, job_title: str | None = None) -> dict:
        """
        JD-specific mode: skip the job database entirely.
        Score the CV against the single user-provided job description using
        the same hybrid scoring formula as retrieve_jobs_with_scores.
        """
        cv_embedding  = get_embedding(cv_text)
        jd_embedding  = get_embedding(job_description)

        # Cosine similarity — embeddings from get_embedding are L2-normalised
        embedding_sim = float(np.dot(cv_embedding, jd_embedding))
        # Clamp to [0, 1] to guard against floating-point drift
        embedding_sim = max(0.0, min(1.0, embedding_sim))

        cv_skills  = extract_skills(cv_text)
        jd_text    = (job_title or "") + " " + job_description
        jd_skills  = extract_skills(jd_text)
        overlap    = len(set(cv_skills) & set(jd_skills))
        matched    = list(set(cv_skills) & set(jd_skills))

        final_score  = self.compute_final_score(
            embedding_sim, overlap, cv_skills, jd_skills,
            cv_text=cv_text, job_text=job_description, job_title=job_title
        )
        resume_score = self.calculate_resume_score(cv_skills, cv_text, cv_links or [], best_match_score=final_score)
        evidence     = self.generate_evidence(cv_skills, jd_skills, cv_text, job_description)

        synthetic_job = {
            "id":             "custom_jd",
            "title":          job_title or "Target Role",
            "description":    job_description,
            "score":          final_score,
            "overlap":        overlap,
            "matched_skills": matched,
            "evidence":       evidence,
            "source":         "Custom JD",
            "company_name":   "",
            "location":       "",
            "url":            "",
            "priority":       overlap,
        }

        print(
            f"[JD-Mode] title={job_title!r} jd_len={len(job_description)} "
            f"sim={round(embedding_sim,3)} overlap={overlap} score={final_score}"
        )

        return {
            "matched_jobs":  [synthetic_job],
            "all_jobs":      [synthetic_job],
            "links":         cv_links or [],
            "resume_score":  resume_score,
            "is_jd_mode":    True,
            "jd_job_title":  job_title or "Target Role",
        }

    def retrieve_jobs_with_scores(self, cv_text, cv_links=None, target_role=None):
        if self.vector_store is None:
            self.load_jobs()

        search_query = cv_text
        if target_role and target_role.strip():
            role_str = target_role.strip()
            search_query = f"Target Role: {role_str} Job Title: {role_str} Position: {role_str}\n\n{cv_text}"

        query_embedding = get_embedding(search_query)
        links = cv_links if cv_links is not None else extract_links(cv_text)

        distances, indices = self.vector_store.index.search(
            np.array([query_embedding]).astype('float32'), len(self.vector_store.data)
        )

        # extract structured skills
        cv_skills = extract_skills(cv_text)

        results = []

        for i, idx in enumerate(indices[0]):
            job = self.vector_store.data[idx]

            # --- Convert L2 distance squared to Cosine Similarity ---
            distance = float(distances[0][i])
            embedding_similarity = max(0.0, min(1.0, 1.0 - 0.5 * distance))

            # extract job skills
            job_text = job.get("title", "") + " " + job.get("description", "")
            job_skills = extract_skills(job_text)

            # overlap using real skills
            overlap = int(len(set(cv_skills) & set(job_skills)))
            matched_skills = list(set(cv_skills) & set(job_skills))

            # --- HYBRID SCORING ---
            final_score = self.compute_final_score(
                embedding_similarity, overlap, cv_skills, job_skills,
                cv_text=cv_text, job_text=job.get("description", ""), job_title=job.get("title", "")
            )
            
            # Generate evidence
            evidence = self.generate_evidence(cv_skills, job_skills, cv_text, job_text)

            results.append({
                **job.copy(),
                "score": final_score,
                "overlap": overlap,
                "matched_skills": matched_skills,
                "evidence": evidence,
                "priority": int(overlap) if overlap > 0 else 0
            })

        # Sort by priority (overlap > 0) then by score
        results = sorted(
            results,
            key=lambda x: (x["priority"] > 0, x["score"]),
            reverse=True
        )

        # Filter results with skill overlap
        filtered_results = [job for job in results if job["overlap"] > 0]

        # Fallback: if nothing overlaps, return top 2 by score
        if not filtered_results:
            filtered_results = results[:2]

        # Couple resume score to the best matched job's score
        best_match_score = filtered_results[0]["score"] if filtered_results else 0.0
        resume_score = self.calculate_resume_score(cv_skills, cv_text, links, best_match_score=best_match_score)

        return {
            "matched_jobs": filtered_results,
            "all_jobs": results,
            "links": links,
            "resume_score": resume_score,
        }