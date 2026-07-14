# AI Test Case Specification: RAG-001

* **Test Objective**: Verify that the CVClinic RAG pipeline correctly analyzes a backend-oriented resume and produces structured career recommendations without violating schema or introducing unsupported claims about the candidate.
* **Test Type**: `Functional Test`, `Regression Test`, `RAG Evaluation`
* **Evaluation Type**: `Offline Evaluation`, `Manual Evaluation`, `Regression Evaluation`

---

## ⚙️ 1. Environment Configuration & Preconditions

* **Database State**: Local jobs database (`jobs_cache.json`) is populated and contains backend developer roles.
* **Models State**: Google Gemini API (`gemini-2.5-flash`) and sentence-transformers model (`all-MiniLM-L6-v2`) are loaded and functional.
* **Parameters**: 
  * **Retrieval Threshold**: Cosine similarity $\ge 0.20$
  * **Top-k Retrieval**: $k = 2$
* **Inputs**: Target role supplied; resume parsed successfully.

---

## 📊 2. Test Data

* **Resume (CV)**: `SaadAsifResume.pdf` (FastAPI, Supabase, React, OpenCV).
* **Target Role**: `"Backend Developer"`
* **Database Version**: `jobs_cache.json` (75 jobs loaded)
* **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2`
* **LLM**: `gemini-2.5-flash`

---

## 🔍 3. Expected Retrieval Behaviour

* **Relevancy**: Top-k jobs retrieved are backend-developer oriented.
* **Deduplication**: Job titles and company names are unique in the retrieved dataset.
* **Calibration**: Semantic similarity matches meet the threshold $\ge 0.20$.

---

## 📝 4. Expected Generation Behaviour

* **Inferred Role**: One of `["Backend Developer", "Full Stack Developer", "Software Engineer"]`.
* **Missing Skills**: Exactly 5 entries total (exactly 2 "new" project ideas, 3 "existing" updates).
* **Project Improvements**: Max 3 entries using the `WHAT -> WHERE -> HOW -> IMPACT` format.
* **Weekly Actions**: Exactly 3 items with specific time estimates.

---

## 💾 5. Postconditions

* The analysis output is serialized into valid JSON conforming to the Pydantic schema.
* The analysis is saved in the local disk cache under the hashed query key.
* Output is returned to the client frontend with no model retries triggered.

---

## 🎯 6. Acceptance Thresholds & Pass/Fail Criteria

The test yields a **PASS** if all thresholds are met:
* **Context Precision** $\ge 0.70$
* **Context Recall** $\ge 0.85$
* **Faithfulness** $\ge 0.90$
* **Answer Relevancy** $\ge 0.85$
* **Overall Latency** $\le 5.0\text{ s}$

**Quality Checklists**:
* [x] Response matches JSON schema exactly.
* [x] Exactly 5 missing skills (2 new, 3 existing) and exactly 3 weekly actions are returned.
* [x] **No unsupported factual claims about the candidate's experience** (e.g. model must not state that the candidate has Docker experience when it is not on the CV).
* [x] Official URL resources are included for recommendations.

---

## 🐛 7. Severity Matrix & Bug Tracking

| Severity Level | Description |
| :--- | :--- |
| **Critical** | Schema validation failure, HTTP 500 error, or severe unsupported claims about candidate skills. |
| **High** | Retrieval completely failing to match target domains; missing/empty recommendations. |
| **Medium** | Minor retrieval mismatches (e.g. retrieving data analyst instead of backend developer). |
| **Low** | Typos, minor formatting variations, or missing optional URL endpoints. |

* **Bug ID**: `AIQA-001`
* **Severity**: `Medium`
* **Status**: `Open` (Assigned to expand backend job corpus in `jobs.json` to improve similarity clustering).
