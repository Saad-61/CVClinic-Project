import json
from pathlib import Path
import numpy as np

from ai.embeddings import get_embedding
from ai.vector_store import VectorStore
from services.job_cache import get_cached_jobs
from utils.skill_extractor import extract_skills
from utils.link_extractor import extract_links


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

    def compute_final_score(self, embedding_similarity, overlap, cv_skills, job_skills):
        """
        Hybrid scoring formula:
          - 50% embedding similarity
          - 50% skill overlap (normalized against actual job skill count)

        Calibrated to hit desired bands:
          Poor   0-35 | Average 35-55 | Good 55-75 | Excellent 75-90 | Near-perfect 90-100
        """
        embedding_score = embedding_similarity * 100

        # Skill overlap: fraction of job skills the CV covers (0-1)
        job_skill_count = max(len(job_skills), 1)
        overlap_ratio = min(overlap / job_skill_count, 1.0)
        overlap_score = overlap_ratio * 100

        # 50/50 blend
        raw = (0.5 * embedding_score) + (0.5 * overlap_score)

        # Mild calibration stretch so strong matches reach 75-85%
        calibrated = min(raw * 1.3, 100)

        # Heavy penalty for zero skill overlap
        if overlap == 0:
            calibrated *= 0.55

        return round(calibrated, 2)

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

    def calculate_resume_score(self, cv_skills, cv_text, cv_links=None):
        """
        Calculate overall resume quality score (0-100).

        Target bands:
          Needs Work  0-35   : sparse CV, few skills, no proof
          Fair        35-55  : some skills, weak proof or no links
          Good        55-75  : solid skills + projects
          Strong      75-90  : skills + projects + links
          Excellent   90-100 : everything — depth, breadth, impact, proof

        Buckets:
          Skill depth    : max 35 pts  (7 canonical skills = max)
          Project proof  : max 30 pts  (8 keyword hits = max)
          Link presence  : max 20 pts  (3 links = max)
          Impact signals : max 15 pts  (4 impact words = max)
        """
        text_lower = cv_text.lower()

        # Skill depth: 35 pts — normalized to 7 distinct skills
        skill_score = min(len(cv_skills) / 7 * 35, 35)

        # Project/experience evidence: 30 pts
        project_keywords = [
            "project", "built", "developed", "implemented",
            "designed", "created", "engineered", "launched",
        ]
        project_mentions = sum(text_lower.count(kw) for kw in project_keywords)
        project_score = min(project_mentions / 8 * 30, 30)

        # Links / proof: 20 pts — 3 links = max
        links = cv_links if cv_links is not None else extract_links(cv_text)
        link_score = min(len(links) / 3 * 20, 20)

        # Impact signals: 15 pts — measurable outcome words
        impact_words = [
            "improved", "reduced", "increased", "automated", "deployed",
            "scaled", "optimised", "optimized", "achieved", "awarded",
            "saved", "boosted", "accelerated", "delivered",
        ]
        impact_count = sum(text_lower.count(w) for w in impact_words)
        impact_score = min(impact_count / 4 * 15, 15)

        raw = skill_score + project_score + link_score + impact_score
        final = round(min(raw, 100), 2)
        print(
            f"[ResumeScore] skills={len(cv_skills)} skill_pts={round(skill_score,1)} "
            f"proj_mentions={project_mentions} proj_pts={round(project_score,1)} "
            f"links={len(links)} link_pts={round(link_score,1)} "
            f"impact={impact_count} impact_pts={round(impact_score,1)} "
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

        final_score  = self.compute_final_score(embedding_sim, overlap, cv_skills, jd_skills)
        resume_score = self.calculate_resume_score(cv_skills, cv_text, cv_links or [])
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
            np.array([query_embedding]).astype('float32'), min(20, len(self.vector_store.data))
        )

        # extract structured skills
        cv_skills = extract_skills(cv_text)
        resume_score = self.calculate_resume_score(cv_skills, cv_text, links)

        results = []

        for i, idx in enumerate(indices[0]):
            job = self.vector_store.data[idx]

            # --- normalized embedding similarity (0-1 range) ---
            embedding_similarity = float(1 / (1 + distances[0][i]))

            # extract job skills
            job_text = job.get("title", "") + " " + job.get("description", "")
            job_skills = extract_skills(job_text)

            # overlap using real skills
            overlap = int(len(set(cv_skills) & set(job_skills)))
            matched_skills = list(set(cv_skills) & set(job_skills))

            # --- HYBRID SCORING ---
            final_score = self.compute_final_score(embedding_similarity, overlap, cv_skills, job_skills)
            
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

        return {
            "matched_jobs": filtered_results,
            "all_jobs": [job.copy() for job in self.vector_store.data],
            "links": links,
            "resume_score": resume_score,
        }