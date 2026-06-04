# CVClinic — RAG-Based Resume Advisor & Career Optimizer

##  Overview

An AI-powered system that analyzes a user's CV and matches it with real-world job postings using a Retrieval-Augmented Generation (RAG) pipeline. The system provides evidence-based, actionable feedback tied to real job market data.

**Key Features:**
* **Intelligent Job Matching** – Semantic similarity + skill-based scoring with evidence
* **Link Detection** – Extracts GitHub, LinkedIn, and portfolio links from PDF and text
* **Skill Gap Analysis** – Identifies missing skills with concrete project recommendations
* **Confidence Metadata** – Every output section includes confidence levels (high/medium/low)
* **Actionable Advice** – WHAT→WHERE→HOW format ensures concrete, implementable suggestions
* **Post-Processing Quality** – Deterministic deduplication and normalization for consistency

---

##  Problem Statement

Traditional CV analyzers provide generic feedback disconnected from real job requirements:
* No evidence-based matching
* Vague suggestions ("improve UI" instead of "add WebSocket for real-time updates in Project X")
* No link to actual market demand
* No quality guarantee on output

---

##  Solution

This system retrieves actual job postings, scores the CV against them, and uses an LLM to generate:
1. **Matched jobs** with evidence-based explanations
2. **Missing skills** tied to real job descriptions, with practical project ideas
3. **CV improvements** with specific implementation guidance
4. **Links** extracted from both PDF hyperlinks and text
5. **Top actions** – concrete, deliverable-focused next steps

---

##  AI Architecture (RAG)

### Retrieval & Scoring Pipeline
1. **Job Retrieval & Cache**: Jobs are fetched from external APIs (e.g. Remotive) and cached locally for 1 hour to prevent redundant API calls.
2. **FAISS Vector Database**: Job descriptions are stored and indexed using FAISS with embeddings generated via `sentence-transformers/all-MiniLM-L6-v2`.
3. **Semantic Querying**: The user's CV text (plus any targeted career role) is embedded to retrieve the top 20 job matches.
4. **Hybrid Scoring Formula**:
   * **Embedding Score**: 50% weight, computed as `similarity * 100` (where similarity is `1 / (1 + L2_distance)`).
   * **Skill Overlap Score**: 50% weight, computed as `(overlap / job_skill_count) * 100` (clamped to 1.0).
   * **Calibration**: The blended score is multiplied by `1.3` (clamped at `100`) to stretch high-quality matches into standard scoring ranges.
   * **Zero-Overlap Penalty**: A heavy `0.55` multiplier penalty (45% reduction) is applied if the CV has no overlapping skills with the job description.
5. **Ranking & Filtering**: Jobs are sorted by priority (favoring any positive skill overlap) and score. Jobs without overlap are filtered out unless all matches have zero overlap, in which case the top 2 matches are returned as a fallback.

### Resume Quality Score
Calculates an overall CV quality rating (0-100) based on four metrics:
* **Skill Depth** (Max 35 pts): Normalizes CV skills count (up to 7 canonical skills).
* **Project Evidence** (Max 30 pts): Counts action verbs/projects mentioned (up to 8 keywords).
* **Proof Presence** (Max 20 pts): Detects external links/portfolios (up to 3 links).
* **Impact Signals** (Max 15 pts): Evaluates measurable business outcomes or metric-oriented words (up to 4 words).

### Analysis & Processing Pipeline
1. **Extraction**: Text is extracted from uploaded PDF/DOCX resumes. Links (GitHub, LinkedIn, portfolios) are extracted from both PDF metadata/annotations and regex text matching.
2. **Disk-Based Analysis Cache**: CV hashes are checked against a persistent local cache to return instant analysis for identical resumes and target roles.
3. **Zero-Overlap Fast-Path**: If there is zero skill overlap across matches, the system bypasses the LLM completely and returns a deterministic, high-quality advice template. This saves token cost and avoids LLM hallucinations.
4. **Augmented LLM Analysis**: Otherwise, a structured prompt containing the CV details, target career role, and top 2 matched jobs (with evidence/gaps) is sent to Google Gemini.
5. **Post-Processing**: The raw LLM output is parsed, normalized (nulls handled), deduplicated, and enriched with confidence scores per section. It also ensures a new-project suggestion is always guaranteed.

---

##  Tech Stack

### Backend
* **FastAPI** – REST API framework
* **Uvicorn** – ASGI server (default port: 8010)
* **Pydantic** – Data validation
* **Disk Caching** – Persistent cache system for CV analyses

### AI / ML Stack
* **Embeddings**: sentence-transformers (`all-MiniLM-L6-v2`)
* **Vector DB**: FAISS (IndexFlatL2)
* **LLM**: Google Gemini 2.0 Flash / 1.5 Flash
* **JSON Parsing**: Multi-stage parser (direct → fenced blocks → streaming decode)

### File Parsing
* **PyMuPDF (fitz)** – PDF extraction + hyperlink detection
* **python-docx** – DOCX extraction
* **Regex + Pattern Matching** – Link extraction from text

### Dependencies
See [backend/requirements.txt](backend/requirements.txt) for the full list.

---

##  API Endpoints

### 1. Upload CV
**POST** `/cv/upload`  
Uploads and previews a CV file.

* **Input**: `multipart/form-data` with `file` (PDF/DOCX)
* **Output**:
  ```json
  {
    "filename": "resume.pdf",
    "preview": "John Doe... [first 500 chars]"
  }
  ```

---

### 2. Match Jobs (Simple)
**POST** `/cv/match-jobs`  
Retrieves basic job matches without scoring.

* **Input**: `multipart/form-data` with `file`
* **Output**:
  ```json
  {
    "matched_jobs": [
      {
        "id": 0,
        "title": "Backend Engineer",
        "description": "..."
      }
    ]
  }
  ```

---

### 3. Analyze CV (Full Pipeline)
**POST** `/cv/analyze`  
Runs the complete RAG + LLM analysis pipeline.

* **Input**: `multipart/form-data` with `file` and optional `target_role` (form text)
* **Output**:
  ```json
  {
    "matched_jobs": [
      {
        "id": 0,
        "title": "Backend Engineer",
        "description": "...",
        "score": 78,
        "overlap": 3,
        "matched_skills": ["Python", "FastAPI", "React"],
        "evidence": "Matched: Python, FastAPI",
        "gap": "Missing Docker and Kubernetes experience"
      }
    ],
    "all_jobs": [...],
    "links": ["https://github.com/user", "https://linkedin.com/in/user"],
    "resume_score": 72.5,
    "jooble_configured": false,
    "target_role": "Backend Engineer",
    "result_id": "2026-06-03T19:24:58.123456__resume.pdf",
    "analysis": {
      "inferred_role": "Backend Developer",
      "job_matches": [...],
      "missing_skills": [...],
      "project_improvements": [...],
      "cv_fixes": [...],
      "top_actions": [...]
    }
  }
  ```

---

### 4. Generate CV Fix Rewrite
**POST** `/cv/generate-fix`  
Generates tailored LaTeX or plain-text rewrites for specific CV recommendations.

* **Input**: JSON payload
  ```json
  {
    "cv_text": "...",
    "output_format": "plain | latex",
    "fix": {
      "section": "Projects",
      "fix": "Add database optimizations to scoutvct",
      "why": "...",
      "how": "..."
    }
  }
  ```
* **Output**:
  ```json
  {
    "section": "Projects",
    "format": "latex",
    "rewritten_text": "\\item Optimized queries by adding PostgreSQL index...",
    "notes": "Ensure you place this under your scoutvct project section."
  }
  ```

---

### 5. Generate Cover Letter
**POST** `/cv/generate-cover-letter`  
Generates a highly personalized cover letter for a matched job.

* **Input**: JSON payload
  ```json
  {
    "cv_text": "...",
    "tone": "professional | conversational | enthusiastic",
    "job": {
      "title": "Backend Engineer",
      "company_name": "Acme Corp",
      "description": "..."
    }
  }
  ```
* **Output**:
  ```json
  {
    "job_title": "Backend Engineer",
    "company_name": "Acme Corp",
    "cover_letter": "Dear Hiring Manager,\n\nI am writing to express my interest...",
    "notes": "Tailored towards your Python/FastAPI experience."
  }
  ```

---

### 6. Cache Info (Dev)
**GET** `/cv/cache-info`  
Returns the number of cached CV analyses and disk usage.

* **Output**:
  ```json
  {
    "cached_items_count": 12,
    "total_size_bytes": 45032
  }
  ```

---

##  Quick Start
- Python 3.13+
- pip or venv

### Installation

1. **Clone the repo**
   ```bash
   git clone <repo>
   cd "RAG project"
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # or: source .venv/bin/activate  # macOS/Linux
   ```

3. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add:
   ```
   HF_TOKEN=your_huggingface_token
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

5. **Run the backend**
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010
   ```

### Frontend (Vite + React)

1. **Install frontend deps**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the frontend**
   ```bash
   npm run dev
   ```

The frontend runs on `http://127.0.0.1:5173` and proxies API requests to the backend on `http://127.0.0.1:8010` via `/api/*`.

6. **Test the API**
   ```bash
   curl -X POST -F "file=@resume.pdf" http://127.0.0.1:8010/cv/analyze
   ```

See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for detailed setup instructions.

---

##  Documentation

* [API.md](docs/API.md) – Detailed endpoint documentation
* [AI_DESIGN.md](docs/AI_DESIGN.md) – RAG pipeline, scoring formula, post-processing
* [TECH_STACK.md](docs/TECH_STACK.md) – Technology choices and rationale
* [SRS.md](docs/SRS.md) – Software requirements
* [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) – Environment setup and deployment

---

## 🧪 Testing

Run tests:
```bash
pytest backend/tests/
```

---

##  Future Enhancements

* Resume rewriting assistant
* Portfolio optimization suggestions
* Live job scraping and data updates
* Redis caching for embeddings
* Frontend dashboard
* Batch CV analysis

---

##  Project Goal

Build a real-world AI system that bridges the gap between user skills and job market demands using evidence-based retrieval and reasoning.
