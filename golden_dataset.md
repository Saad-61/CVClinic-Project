# CVClinic LLM Evaluation Golden Dataset

This document defines the evaluation dataset and test suite criteria for CVClinic's RAG-based Resume Advisor & Career Optimizer. It serves as the golden source of test cases (inputs, expected outputs, and failure conditions) for DeepEval, Promptfoo, and integration test suites, matching the actual validation, scoring, and post-processing architecture of the CVClinic backend.

---

## 🛠️ Project Pipeline Reference & Working

### 1. CV Validation (`cv_validator.py`)
* **Fast checks**: Non-empty; length $\ge 150$ characters (rejects scanned images).
* **Document type blacklist (regex + Gemini classifier)**: Rejects cover letters, offer letters, invoices, and legal contracts/NDAs with specific HTTP 400 detail messages.
* **Structural header check**: Rejects files with $< 2$ common resume headers (e.g., Experience, Skills, Education, Projects).

### 2. Retrieval & Scoring (`rag_pipeline.py`)
* **Scoring Formula**: `0.5 * embedding_score + 0.5 * overlap_score`, calibrated with overlap multipliers (0.15 for 0, 0.40 for 1, 0.65 for 2, 0.80 for 3, 0.90 for 4) and seniority penalties (cv vs job seniority).
* **Resume Score (0-100)**: Calculates score based on Skill Depth (25 pts), Project Evidence (20 pts), Links/Proof (10 pts), Impact Signals (15 pts), Education/Seniority (10 pts), and Target Role Alignment (20 pts).
* **Filtering**: Removes zero-overlap jobs; falls back to top 2 jobs if all have zero overlap.

### 3. Zero-Overlap Fast-Path (`analyzer.py`)
* Bypasses the LLM completely if total overlap for the top 2 matched jobs is 0. Returns a deterministic response template.

### 4. LLM Analysis Requirements (`analyzer.py`)
* **Output Format**: Strict JSON (no markdown fence wrapping).
* **Inferred Role**: Inferred 2-3 word career title.
* **Job Matches**: Exactly matches retrieved jobs, keeping scores as-is. Capped at top 2.
* **Missing Skills (Exactly 5)**: Exactly 2 "new" project ideas and exactly 3 "existing" updates.
  * *New projects*: Greenfield standalone project concept from scratch (no extensions/containerizing existing CV projects), step-by-step implementation (Phase 1, 2, 3), and official documentation/learning URLs.
  * *Existing updates*: Select project from CV and suggest advanced feature upgrade.
* **Project Improvements (Max 3)**: For existing CV projects. Formatted as project, current_issue, improvement, impact. Avoids basic REST or Git advice.
* **CV Fixes (Max 3)**: Specific section/project upgrades. Respects existing links (does not recommend adding GitHub/LinkedIn if already present in CV).
* **Top Actions (Exactly 3)**: Concrete, weekly actions. Must include time estimate in parentheses (e.g. `(~4 hours)`, `(~1 weekend)`) and specific tools.

### 5. Post-Processing Quality Control (`analysis_postprocess.py`)
* Normalizes nulls to empty values.
* Deduplicates recommendation lists.
* Computes section confidence levels (high, medium, low).
* New project guarantee.

---

## 📋 Normal User Questions (Evaluation Test Cases)

### Test Case 1: Backend Developer Alignment (Standard RAG Mode)
* **Inputs**:
  - **CV Text**: Saad Asif's CV (contains React, FastAPI, Supabase, PyTorch, ResNet50, OpenCV; missing Docker, Redis, Kubernetes).
  - **Target Role**: "Backend Developer"
* **Good Answer Should Contain**:
  - JSON containing: `inferred_role` (e.g., "Backend Developer" or "Full Stack Developer").
  - `job_matches`: Capped at top 2 jobs, scores preserved, reasons referencing their FastAPI/React work, gaps highlighting missing deployment/infra skills.
  - `missing_skills`: Exactly 5 entries (2 new, 3 existing).
    * New project ideas targeting Docker, Redis, or Celery. Must be greenfield standalone concepts (e.g., "Containerized Task Queue Pipeline").
    * Step-by-step implementation with 'Phase 1:', 'Phase 2:', 'Phase 3:' and official URLs (e.g., https://docs.docker.com/).
    * Existing project updates targeting Supabase or FastAPI projects already on CV (e.g., BookYourShoot, ScoutVCT).
  - `project_improvements`: Max 3 entries suggesting advanced technical upgrades (e.g., PostgreSQL query optimization, API caching, WebSocket rate limiting).
  - `cv_fixes`: Suggests specific formatting or section improvements (e.g., "Add API documentation links to Projects").
  - `top_actions`: Exactly 3 actions, each with a time estimate in parentheses (e.g. `(~4 hours)`).
* **Failure Conditions**:
  - Modifies the retrieved job scores.
  - Suggests adding GitHub/LinkedIn links (since they are already present on Saad's CV).
  - Proposes less or more than 5 missing skills, or incorrect ratio (must be 2 new, 3 existing).
  - Proposes a new project that is actually an extension of "BookYourShoot" or "ScoutVCT" (extensions belong in existing updates).
  - Recommends basic REST API or Git/GitHub advice.

### Test Case 2: AI Engineering Internship Alignment
* **Inputs**:
  - **CV Text**: Student CV with Python, scikit-learn, basic JavaScript, and React.
  - **Target Role**: "AI Engineer"
* **Good Answer Should Contain**:
  - JSON containing: `inferred_role` (e.g., "AI Engineer" or "Machine Learning Engineer").
  - `missing_skills`: Exactly 5 entries. Suggests new projects for Vector Databases (e.g., Pinecone/FAISS) or LLM orchestration (e.g., LangChain/Gemini API).
  - New projects must contain real URLs (e.g., https://faiss.ai/, https://ai.google.dev/) and estimated hours.
  - `project_improvements`: Cites existing Python or machine learning projects and suggests advanced model evaluation, tracking (MLflow), or dataset auditing.
  - `top_actions`: 3 concrete weekly actions with time estimates (e.g., `(~1 weekend)`).
* **Failure Conditions**:
  - Misses Python or machine learning fundamentals as critical skills.
  - Recommends outdated AI tech stacks.
  - Missing resource URLs or estimated hours.

### Test Case 3: JD Mode Matching (Tailored Single JD Alignment)
* **Inputs**:
  - **CV Text**: John Doe (junior developer, basic HTML/CSS/JavaScript).
  - **Job Title**: "Remote Fullstack Engineer"
  - **Job Description**: JD_FULLSTACK (requires Python, JavaScript, TypeScript, communication, software engineering best practices).
* **Good Answer Should Contain**:
  - JSON output aligned strictly against the custom JD (JD mode enabled).
  - `job_matches`: Exactly 1 synthetic job with title "Remote Fullstack Engineer" and source "Custom JD".
  - `missing_skills`: Explanations quoting the exact line in the job description that requires it (e.g., 'as required by "Knowledgeable in Python, JavaScript, and TypeScript."').
  - Greenfield new projects for Python/TypeScript backend services.
* **Failure Conditions**:
  - Bypasses JD mode or attempts to retrieve jobs from the vector database.
  - Fails to quote the specific requirements from the provided Job Description.
  - Suggests skills or tools completely unrelated to the provided JD.

### Test Case 4: Advanced Docker & Backend Analysis
* **Inputs**:
  - **CV Text**: Saad Asif's CV (no Docker mentioned).
  - **Target Role**: "Backend DevOps Engineer"
* **Good Answer Should Contain**:
  - `missing_skills`: Docker identified as a HIGH priority missing skill.
  - Proposes a new project for containerized multi-container setup (Docker Compose, Redis, FastAPI).
  - Implementation instructions must feature 3 distinct phases and contain the URL `https://docs.docker.com/compose/`.
* **Failure Conditions**:
  - Suggests Docker is optional or unnecessary.
  - Fails to provide concrete, multi-stage implementation steps.

### Test Case 5: AI QA Role Alignment
* **Inputs**:
  - **CV Text**: Saad Asif's CV (includes face analysis, ResNet50 transfer learning, but no automated testing/QA tools like pytest, DeepEval, or Promptfoo).
  - **Target Role**: "AI QA Engineer"
* **Good Answer Should Contain**:
  - `inferred_role` containing "QA" or "ML Evaluation".
  - `missing_skills`: Recommends evaluation pipelines, unit testing, and test automation frameworks (pytest).
  - Greenfield project idea for building an automated evaluation suite for a RAG pipeline or LLM wrapper.
* **Failure Conditions**:
  - Recommends generic frontend or unrelated model-building projects.
  - Recommends manual testing instead of automation.

### Test Case 6: RAG Project Optimization
* **Inputs**:
  - **CV Text**: A resume listing a basic RAG system built with LangChain and FAISS, but no evaluation metrics or optimization.
  - **Target Role**: "RAG Engineer"
* **Good Answer Should Contain**:
  - `project_improvements`: Advanced upgrades for the existing RAG project (e.g., implementing RAGAS or DeepEval evaluation, context reranking with Cohere, or query expansion).
  - Formatting: WHAT -> WHERE -> HOW -> IMPACT.
* **Failure Conditions**:
  - Generic advice like "improve retrieval".
  - Recommends rebuilding the chatbot from scratch.

### Test Case 7: Software Testing / QA Project Upgrades
* **Inputs**:
  - **CV Text**: Standard backend developer CV.
  - **Target Role**: "Software Engineer in Test (SDET)"
* **Good Answer Should Contain**:
  - `missing_skills` and `project_improvements`: Recommends unit test suites, integration testing, CI/CD pipeline automation (GitHub Actions), and edge-case test planning.
  - Provides official learning URLs for pytest or JUnit.
* **Failure Conditions**:
  - Suggests manual test case writing only.
  - Lists tools only, without project context or implementation phases.

### Test Case 8: AI Project Prominence & Impact
* **Inputs**:
  - **CV Text**: Resume listing AI projects with vague descriptions ("worked on ResNet50", "used Gemini API").
  - **Target Role**: "Machine Learning Engineer"
* **Good Answer Should Contain**:
  - `project_improvements`: Suggests adding measurable outcomes (e.g., latency, throughput, accuracy benchmarks) and model deployment metrics.
  - `cv_fixes`: Explains how to rewrite project bullet points to incorporate quantifiable results.
* **Failure Conditions**:
  - Recommends vague, non-measurable improvements.
  - Suggests unrelated technologies.

### Test Case 9: Unit Testing vs Integration Testing Gaps
* **Inputs**:
  - **CV Text**: Backend resume with "wrote unit tests" but no integration tests or mocked services.
  - **Target Role**: "Senior Backend Engineer"
* **Good Answer Should Contain**:
  - `missing_skills` or `project_improvements`: Proposes adding integration testing (e.g., using Testcontainers, database mocking, or API-level integration testing with pytest-asyncio).
* **Failure Conditions**:
  - Confuses unit testing with integration testing.
  - Suggests manual verification as a substitute.

### Test Case 10: Debugging and Diagnostic Experience
* **Inputs**:
  - **CV Text**: CV lists "debugging code" under skills.
  - **Target Role**: "Support Engineer" or "Site Reliability Engineer"
* **Good Answer Should Contain**:
  - `project_improvements` or `cv_fixes`: Suggests documenting actual root-cause analyses, logging pipeline integration (ELK stack, Prometheus), and error monitoring tools (Sentry).
* **Failure Conditions**:
  - Recommends simply listing "fixed bugs" without technical depth.

---

## ⚡ Edge Case Questions (Evaluation Test Cases)

### Edge Case 1: Empty Document Upload
* **Inputs**:
  - **CV Text**: (Empty String)
* **Good Answer (Validator Behavior)**:
  - HTTP 400 Bad Request: `detail="The uploaded file is empty. Please upload a valid document."`
* **Failure Conditions**:
  - Bypasses validator and sends empty text to RAG or LLM.
  - Returns HTTP 500 error instead of a handled HTTP 400.

### Edge Case 2: Scanned / Tiny Document Upload
* **Inputs**:
  - **CV Text**: "Saad Asif resume" (length $< 150$ characters)
* **Good Answer (Validator Behavior)**:
  - HTTP 400 Bad Request: `detail="The uploaded file appears to be empty or a scanned image. Please upload a text-based PDF or DOCX file."`
* **Failure Conditions**:
  - Attempts to analyze the snippet.
  - Returns a generic validation error.

### Edge Case 3: Blacklisted Document Upload (Offer Letter)
* **Inputs**:
  - **CV Text**: A document containing text like "We are pleased to offer you employment at Acme Corp with a start date of..."
* **Good Answer (Validator Behavior)**:
  - HTTP 400 Bad Request: `detail="The uploaded file appears to be a job offer letter or employment agreement (...). Please upload a standard candidate CV or resume."`
* **Failure Conditions**:
  - Accepts the document and tries to match jobs or suggest career improvements.
  - Returns standard HTTP 500.

### Edge Case 4: Blacklisted Document Upload (Cover Letter)
* **Inputs**:
  - **CV Text**: A document starting with "Dear Hiring Manager, I am writing to express my interest in..."
* **Good Answer (Validator Behavior)**:
  - HTTP 400 Bad Request: `detail="The uploaded file appears to be a cover letter (...). Please upload a standard candidate CV or resume."`
* **Failure Conditions**:
  - Accepts the document and treats it as a resume.

### Edge Case 5: Blacklisted Document Upload (Invoice)
* **Inputs**:
  - **CV Text**: A document containing "Invoice To: John Doe", "Amount Due: $500", "Payment Receipt".
* **Good Answer (Validator Behavior)**:
  - HTTP 400 Bad Request: `detail="The uploaded file appears to be an invoice or receipt (...). Please upload a standard candidate CV or resume."`
* **Failure Conditions**:
  - Treats invoice fields as resume sections.

### Edge Case 6: Lack of Structural Resume Headers
* **Inputs**:
  - **CV Text**: A general story/essay about coding that does not contain sections like "Experience", "Skills", "Education", or "Projects" (less than 2 headers matched).
* **Good Answer (Validator Behavior)**:
  - HTTP 400 Bad Request: `detail="The uploaded file does not look like a standard CV or resume. Please ensure you upload a PDF or DOCX containing your professional experience and skills."`
* **Failure Conditions**:
  - Accepts non-resume text and invokes LLM.

### Edge Case 7: Zero Skill Overlap Fast-Path
* **Inputs**:
  - **CV Text**: Weak Frontend CV (John Doe - only knows HTML/CSS/basic JS).
  - **Target Role**: "Machine Learning Researcher" (all matched jobs require PyTorch, ResNet, CUDA, PhD).
* **Good Answer (System Behavior)**:
  - Bypasses the LLM call entirely.
  - Instantly returns the deterministic template `_ZERO_OVERLAP_TEMPLATE` containing a default skill gap recommendation, a skills CV fix, and a weekly action plan.
  - `_source` key in response is set to `"template:zero_overlap"`.
* **Failure Conditions**:
  - Bypasses fast-path and makes an LLM call.
  - Hallucinates skill matches or scores.

### Edge Case 8: Irrelevant / Out-of-Scope Prompts or JDs
* **Inputs**:
  - **CV Text**: Saad Asif's CV.
  - **Target Role**: "Professional Footballer" or "Medical Doctor"
* **Good Answer (System Behavior)**:
  - Inferred Role: Matches the target role or defaults to a developer role based on CV text.
  - Since skill overlap is 0 across all matched jobs, it falls back to the top 2 closest jobs by score, triggers the Zero-Overlap Fast-Path, and advises aligning skills with target career roles.
* **Failure Conditions**:
  - Hallucinates a soccer or medical career path with fake technical details.
  - Crashes due to lack of matches.

### Edge Case 9: Missing GitHub or LinkedIn Links in CV
* **Inputs**:
  - **CV Text**: A resume with no external URLs (e.g. John Doe's CV).
* **Good Answer**:
  - The structured prompt informs the LLM that no links are present.
  - `cv_fixes` or `top_actions` recommends adding a GitHub link and LinkedIn profile to improve recruiter discoverability.
* **Failure Conditions**:
  - Fails to identify the missing links.

### Edge Case 10: Existing GitHub and LinkedIn Links present in CV
* **Inputs**:
  - **CV Text**: Saad Asif's CV (contains `github.com/Saad-61` and `linkedin.com/in/saad-asif`).
* **Good Answer**:
  - The link note in the prompt explicitly warns: "GitHub/LinkedIn link is present in CV — do NOT suggest adding them."
  - `cv_fixes` and `top_actions` do NOT contain recommendations to add GitHub or LinkedIn links.
* **Failure Conditions**:
  - LLM suggests adding GitHub or LinkedIn links (violating the link notes guideline).
