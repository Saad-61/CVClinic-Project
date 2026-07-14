# CVClinic RAG Pipeline AI QA Evaluation Report

This report presents a professional-grade evaluation of 5 test scenarios from the CVClinic golden dataset. The evaluation is structured across three distinct assessment layers—**Retrieval Layer**, **Generation Layer**, and **Application Validation Layer**—offering a comprehensive view of both pipeline quality and performance.

---

## 📊 Summary Comparison Table

### 1. Retrieval & Generation Layer Scores
Qualitative metrics have been mapped to numerical scores (High = `0.90`, Medium = `0.65`, Low = `0.30`).

| Scenario ID & Profile | Target Role / Mode | Context Precision | Context Recall | Faithfulness | Answer Relevancy | Hallucination |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **[RAG-001](#rag-001-saad-asif--backend-developer-alignment)** | Backend Developer (RAG) | 0.65 | 0.90 | 0.90 | 0.90 | None Observed |
| **[RAG-002](#rag-002-john-doe--frontend-developer-alignment)** | Frontend Developer (RAG) | 0.30 | 0.30 | 0.90 | 0.90 | None Observed |
| **[RAG-003](#rag-003-dr-alice-smith--machine-learning-alignment)** | Machine Learning (RAG) | 0.65 | 0.65 | 0.90 | 0.90 | None Observed |
| **[RAG-004](#rag-004-saad-asif--devops-alignment)** | Backend DevOps (RAG) | 0.30 | 0.30 | 0.90 | 0.90 | None Observed |
| **[JD-001](#jd-001-john-doe--remote-fullstack-alignment)** | Remote Fullstack (JD Mode) | 0.90 | 0.90 | 0.90 | 0.90 | None Observed |

### 2. Performance, QA Decision & Cost Summary

*Costs are approximate and estimated using Google Gemini 2.5 Flash pricing ($0.075 / 1M input tokens, $0.30 / 1M output tokens).*

| Scenario ID | Total Latency | Top Similarity Score | Generation Confidence | Overall Quality | Overall QA Evaluation | Deployment Ready | Approx. Cost ($) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **RAG-001** | 3.93 s | 0.30 | Not Measured | 80/100 | **PASS** | Yes | $0.000625 |
| **RAG-002** | 3.52 s | 0.05 | Not Measured | 55/100 | **FAIL** | No (Missing Frontend Jobs) | $0.000504 |
| **RAG-003** | 4.23 s | 0.43 | Not Measured | 75/100 | **PASS** | Yes | $0.000657 |
| **RAG-004** | 4.04 s | 0.28 | Not Measured | 55/100 | **FAIL** | No (Missing DevOps Jobs) | $0.000628 |
| **JD-001** | 12 ms | 0.03 | Not Measured | 95/100 | **PASS** | Yes (Fast-Path Active) | $0.000000 |

---

## 🛠️ Detailed QA Evaluation Sheets

### RAG-001: Saad Asif (Backend Developer Alignment)

#### 1. Retrieved Job Snippets
* **Job 1**: *Online Data Analyst Canada* at **TELUS Digital** (Score: 29.52%, Overlap: 2)
  - "...enhance content and quality of digital maps... AI Community contributors help support machine learning models..."
* **Job 2**: *Java Backend Developer* at **Apexon** (Score: 28.21%, Overlap: 2)
  - "...brings together core competencies in AI, analytics, app development, cloud, DevOps..."
* **Job 3**: *Technical Customer Success Manager, UK* at **Nash** (Score: 26.83%, Overlap: 4)
  - "...experience in Python, React, Node.js..."

#### 2. LLM Response Summary
* **Inferred Role**: `Full Stack Developer`
* **Matches**: Online Data Analyst (29.52%) and Java Backend Developer (28.21%).
* **Missing Skills**: `Docker & CI/CD` (New Project: "Containerized Full-Stack Microservice"), `Redis & Caching` (New Project: "Robust API with Pytest Coverage"), `Unit & Integration Testing` (Existing: BookYourShoot update).
* **Project Improvements**: BookYourShoot (PostgreSQL query indexing), ScoutVCT (WebSocket integration).
* **CV Fixes**: Add Docker/CI/CD, rewrite summary, quantify project metrics.
* **Top Actions**: Containerize BookYourShoot (~1 weekend), setup CI/CD for ScoutVCT (~3-5 days).

---

#### 3. Evaluation & Validation

##### Overall QA Evaluation
* **Overall Quality**: `80/100`
* **QA Decision**: **PASS**
* **Deployment Ready**: **Yes**

##### Retrieval Layer
* **Context Precision**: `0.65` (Medium)
  - *Explanation*: The FAISS query retrieved software developer roles, but also pulled an "Online Data Analyst" role which is irrelevant to a backend developer candidate.
* **Context Recall**: `0.90` (High)
  - *Explanation*: The retrieved context successfully captured the developer tools on Saad's CV (FastAPI, React) and highlighted the missing containerization and Java gaps required to evaluate a full-stack developer.
* **Top Similarity Score**: `0.30`
* **Retrieval Latency**: `120 ms`

##### Generation Layer
* **Faithfulness**: `0.90` (High)
  - *Explanation*: The LLM suggestions strictly references Saad's actual projects (BookYourShoot, ScoutVCT) and does not invent any fake work history.
* **Answer Relevancy**: `0.90` (High)
  - *Explanation*: The advice directly guides a student candidate on how to upgrade their existing portfolios to meet full-stack expectations.
* **Hallucinations**: `None Observed` (No hallucinations detected during manual evaluation).
* **Generation Confidence**: `Not Measured`
* **Generation Latency**: `3.8 s`

##### Application Validation
* **JSON Schema**: `Pass` (✓)
* **Exactly 5 Missing Skills**: `Pass` (✓) (2 new, 3 existing)
* **URLs Present**: `Pass` (✓) (Official docker/fastapi doc URLs included)
* **3 Actions**: `Pass` (✓)
* **Time Estimates**: `Pass` (✓) (e.g. "~1 weekend")
* **No Duplicate Skills**: `Pass` (✓)
* **No Redundant Links Fix**: `Pass` (✓) (Did not suggest adding GitHub/LinkedIn because they were already in the CV)

##### Failure Classification
* **Failure Type**: `Retrieval Mismatch`
* **Severity**: `Medium`
* **Root Cause**: Job database contains very few developer roles, causing keyword similarity to match non-developer roles.
* **Impact**: The candidate is matched with a data analyst job which does not fit their developer career goal.
* **Recommended Fix**: Expand the job description dataset in the local database to include more full stack roles.

##### Performance & Cost
* **Total Latency**: `3.93 s` (Retrieval: 120 ms, LLM: 3.8 s, Post-proc: 8 ms)
* **Prompt Tokens**: `3,850`
* **Completion Tokens**: `1,120`
* **Estimated Cost**: `$0.000625` (Approximate; based on Gemini 2.5 Flash API pricing)

---

### RAG-002: John Doe (Frontend Developer Alignment)

#### 1. Retrieved Job Snippets
* **Job 1**: *Senior Project Manager (SaaS / Remote / German)* at **Publitas.com B.V.** (Score: 4.14%, Overlap: 1)
  - "...requires basic JavaScript knowledge..."

#### 2. LLM Response Summary
* **Inferred Role**: `Frontend Developer`
* **Matches**: Senior Project Manager (4.14%).
* **Missing Skills**: `React.js & State Management` (New Project: Portfolio app using React), `Frontend Testing & Build Automation` (New Project: build tools/testing setup), `Responsive Layouts & Advanced CSS` (Existing: website update).
* **Top Actions**: Build a modern JavaScript portfolio project, establish GitHub, add unit testing.

---

#### 3. Evaluation & Validation

##### Overall QA Evaluation
* **Overall Quality**: `55/100`
* **QA Decision**: **FAIL**
* **Deployment Ready**: **No** (Pending Database Expansion)

##### Retrieval Layer
* **Context Precision**: `0.30` (Low)
  - *Explanation*: The only retrieved job is a "Senior Project Manager," which is completely irrelevant to a junior frontend candidate.
* **Context Recall**: `0.30` (Low)
  - *Explanation*: The local database contains no active frontend developer roles, which prevented the retrieval system from fetching matching jobs.
* **Top Similarity Score**: `0.05`
* **Retrieval Latency**: `110 ms`

##### Generation Layer
* **Faithfulness**: `0.90` (High)
  - *Explanation*: The LLM stayed faithful to the candidate's limited CV (HTML/CSS) and did not hallucinate advanced accomplishments.
* **Answer Relevancy**: `0.90` (High)
  - *Explanation*: Despite the poor job match, the LLM correctly identified that the candidate lacks modern JS frameworks (React) and testing, providing appropriate beginner advice.
* **Hallucinations**: `None Observed` (No hallucinations detected during manual evaluation).
* **Generation Confidence**: `Not Measured`
* **Generation Latency**: `3.4 s`

##### Application Validation
* **JSON Schema**: `Pass` (✓)
* **Exactly 5 Missing Skills**: `Pass` (✓)
* **URLs Present**: `Pass` (✓)
* **3 Actions**: `Pass` (✓)
* **Time Estimates**: `Pass` (✓)

##### Failure Classification
* **Failure Type**: `Retrieval Failure`
* **Severity**: `High`
* **Root Cause**: Local job database (`jobs.json`) lacks frontend developer positions.
* **Impact**: LLM is forced to infer frontend advice from an unrelated project manager role.
* **Recommended Fix**: Seed the database with junior-to-mid frontend developer positions or implement live job boards scraping.

##### Performance & Cost
* **Total Latency**: `3.52 s` (Retrieval: 110 ms, LLM: 3.4 s, Post-proc: 6 ms)
* **Prompt Tokens**: `2,800`
* **Completion Tokens**: `980`
* **Estimated Cost**: `$0.000504` (Approximate; based on Gemini 2.5 Flash API pricing)

---

### RAG-003: Dr. Alice Smith (Machine Learning Alignment)

#### 1. Retrieved Job Snippets
* **Job 1**: *Backend Developer* at **Strategic Resources International** (Score: 43.83%, Overlap: 3)
  - "...experience in Python, SQL, and general cloud services..."
* **Job 2**: *Java Backend Developer* at **Apexon** (Score: 33.50%, Overlap: 2)
  - "...skills in AI, cloud, DevOps, quality engineering..."
* **Job 3**: *Senior Full Stack Engineer* at **infisical** (Score: 28.75%, Overlap: 4)
  - "...skills in Python, Docker, cloud configurations..."

#### 2. LLM Response Summary
* **Inferred Role**: `Machine Learning Engineer`
* **Matches**: Backend Developer (43.83%) and Java Backend Developer (33.50%).
* **Missing Skills**: `CI/CD` (New Project: "ML Model Deployment CI/CD Pipeline"), `Message Queues / API Design` (New Project: "Secure FastAPI Microservice"), `Testing (Unit/Integration)` (Existing: Vision Corp pipeline integration tests).
* **Project Improvements**: Object Detection Pipeline (quantization and Prometheus/Grafana monitoring), Customer Churn Prediction (MLflow and Kubernetes deploy).
* **Top Actions**: Pytest testing (80%+ coverage), Docker containerization, pipeline architectural diagrams.

---

#### 3. Evaluation & Validation

##### Overall QA Evaluation
* **Overall Quality**: `75/100`
* **QA Decision**: **PASS**
* **Deployment Ready**: **Yes**

##### Retrieval Layer
* **Context Precision**: `0.65` (Medium)
  - *Explanation*: The search query returned generic backend development roles rather than specialized Machine Learning or Computer Vision jobs.
* **Context Recall**: `0.65` (Medium)
  - *Explanation*: The retrieval missed ML-specific positions, meaning the gaps and analysis were oriented more toward general backend/infrastructure rather than advanced ML scaling.
* **Top Similarity Score**: `0.43`
* **Retrieval Latency**: `125 ms`

##### Generation Layer
* **Faithfulness**: `0.90` (High)
  - *Explanation*: The LLM generated highly specific ML deployment advice (MLflow, quantization, CUDA/PyTorch) based strictly on Alice's real CV items.
* **Answer Relevancy**: `0.90` (High)
  - *Explanation*: The inferred role is correct, and the DevOps suggestions for ML models directly benefit an ML Engineer candidate.
* **Hallucinations**: `None Observed` (No hallucinations detected during manual evaluation).
* **Generation Confidence**: `Not Measured`
* **Generation Latency**: `4.1 s`

##### Application Validation
* **JSON Schema**: `Pass` (✓)
* **Exactly 5 Missing Skills**: `Pass` (✓)
* **URLs Present**: `Pass` (✓)
* **3 Actions**: `Pass` (✓)
* **Time Estimates**: `Pass` (✓)

##### Failure Classification
* **Failure Type**: `Retrieval Recall Gap`
* **Severity**: `Medium`
* **Root Cause**: No specialized ML/AI researcher jobs present in the seed data.
* **Impact**: LLM evaluates the senior ML scientist against backend developer requirements.
* **Recommended Fix**: Add specialized AI/ML engineering and research jobs to the FAISS index.

##### Performance & Cost
* **Total Latency**: `4.23 s` (Retrieval: 125 ms, LLM: 4.1 s, Post-proc: 8 ms)
* **Prompt Tokens**: `3,920`
* **Completion Tokens**: `1,210`
* **Estimated Cost**: `$0.000657` (Approximate; based on Gemini 2.5 Flash API pricing)

---

### RAG-004: Saad Asif (DevOps Alignment)

#### 1. Retrieved Job Snippets
* **Job 1**: *Online Data Analyst Canada* at **TELUS Digital** (Score: 28.31%, Overlap: 2)
  - "...assisting machine learning models..."
* **Job 2**: *Java Backend Developer* at **Apexon** (Score: 28.25%, Overlap: 2)
  - "...AI, cloud, DevOps..."

#### 2. LLM Response Summary
* **Inferred Role**: `Full Stack AI Engineer`
* **Matches**: Online Data Analyst (28.31%) and Java Backend Developer (28.25%).
* **Missing Skills**: `Docker & Container Orchestration` (New Project: "Containerized Microservice API with CI/CD"), `Infrastructure as Code (IaC) & Cloud` (New Project: "Terraform-Managed Cloud Web Service"), `Automated Testing` (Existing: ScoutVCT testing update).
* **Project Improvements**: BookYourShoot (FastAPI rate-limiting), ScoutVCT (PostgreSQL index tuning), VisionBench (pipeline containerization).
* **Top Actions**: Docker containerization (~1 weekend), GitHub Actions CI/CD (~3-5 days), Terraform cloud infrastructure (~2 weeks).

---

#### 3. Evaluation & Validation

##### Overall QA Evaluation
* **Overall Quality**: `55/100`
* **QA Decision**: **FAIL**
* **Deployment Ready**: **No** (Pending Database Expansion)

##### Retrieval Layer
* **Context Precision**: `0.30` (Low)
  - *Explanation*: None of the retrieved jobs are DevOps or SRE roles; instead, the system retrieved an online data analyst and a Java backend developer.
* **Context Recall**: `0.30` (Low)
  - *Explanation*: The retrieved context lacked real DevOps or Infrastructure engineering job details, forcing the LLM to infer DevOps requirements.
* **Top Similarity Score**: `0.28`
* **Retrieval Latency**: `130 ms`

##### Generation Layer
* **Faithfulness**: `0.90` (High)
  - *Explanation*: The LLM stayed faithful to the user's prompt parameters (DevOps target) and the candidate's existing portfolio.
* **Answer Relevancy**: `0.90` (High)
  - *Explanation*: The advice (IaC, Terraform, Docker, Prometheus) is highly relevant for a developer transitioning to DevOps.
* **Hallucinations**: `None Observed` (No hallucinations detected during manual evaluation).
* **Generation Confidence**: `Not Measured`
* **Generation Latency**: `3.9 s`

##### Application Validation
* **JSON Schema**: `Pass` (✓)
* **Exactly 5 Missing Skills**: `Pass` (✓)
* **URLs Present**: `Pass` (✓)
* **3 Actions**: `Pass` (✓)
* **Time Estimates**: `Pass` (✓)

##### Failure Classification
* **Failure Type**: `Retrieval Failure`
* **Severity**: `High`
* **Root Cause**: Database has no DevOps, SRE, or Infrastructure roles seeded.
* **Impact**: LLM is forced to extrapolate DevOps advice without concrete job references.
* **Recommended Fix**: Seed DevOps jobs (Kubernetes, AWS, Terraform, CI/CD) into the vector store.

##### Performance & Cost
* **Total Latency**: `4.04 s` (Retrieval: 130 ms, LLM: 3.9 s, Post-proc: 7 ms)
* **Prompt Tokens**: `3,780`
* **Completion Tokens**: `1,150`
* **Estimated Cost**: `$0.000628` (Approximate; based on Gemini 2.5 Flash API pricing)

---

### JD-001: John Doe (Remote Fullstack Alignment)

#### 1. Retrieved Job Snippets
* **Job 1**: *Remote Fullstack Engineer* (Score: 3.0%, Overlap: 0)
  - Full Job Description injected: "Bachelor degree... Python, JavaScript, TypeScript... software engineering best practices..."

#### 2. LLM Response Summary (Zero-Overlap Fast-Path Output)
* **Inferred Role**: `Remote Fullstack Engineer`
* **Matches**: Custom JD (3.0%).
* **Missing Skills**:
  - `Skill alignment with target roles` (Deterministic response: "No skill overlap was found between your CV and the matched jobs...").
* **Project Improvements**: `[]` (None).
* **CV Fixes**: Add required skills (skills section).
* **Top Actions**: Research target job requirements and map existing skills.
* **Source**: `template:zero_overlap`

---

#### 3. Evaluation & Validation

##### Overall QA Evaluation
* **Overall Quality**: `95/100`
* **QA Decision**: **PASS**
* **Deployment Ready**: **Yes** (Fast-Path Active)

##### Retrieval Layer
* **Context Precision**: `0.90` (High)
  - *Explanation*: Since JD Mode is enabled, the system bypasses the database and uses the exact Job Description provided, resulting in 100% precision.
* **Context Recall**: `0.90` (High)
  - *Explanation*: The system has 100% recall as it has access to the exact target job description requested.
* **Top Similarity Score**: `0.03`
* **Retrieval Latency**: `10 ms`

##### Generation Layer
* **Faithfulness**: `0.90` (High)
  - *Explanation*: The output uses a deterministic, hardcoded codebase template (`_ZERO_OVERLAP_TEMPLATE`) to avoid hallucinations when a junior CV tries to match a senior role.
* **Answer Relevancy**: `0.90` (High)
  - *Explanation*: Returning a clear warnings-and-reclassification template is the most relevant response when there is zero overlap.
* **Hallucinations**: `None Observed` (No hallucinations detected during manual evaluation).
* **Generation Confidence**: `Not Measured` (Bypassed LLM call)
* **Generation Latency**: `0 ms` (Bypassed LLM call)

##### Application Validation
* **JSON Schema**: `Pass` (✓)
* **1 Missing Skill (Zero-Overlap Template)**: `Pass` (✓) (System design outputs exactly 1 warning skill)
* **URLs Present**: `Pass` (✓) (Template resources are present)
* **1 CV Fix (Zero-Overlap Template)**: `Pass` (✓)
* **1 Action (Zero-Overlap Template)**: `Pass` (✓)

##### Failure Classification
* **Failure Type**: `None`
* **Severity**: `None`
* **Root Cause**: N/A (System worked exactly as designed for zero-overlap profiles).
* **Impact**: N/A
* **Recommended Fix**: N/A

##### Performance & Cost
* **Total Latency**: `12 ms` (Retrieval: 10 ms, LLM: 0 ms, Post-proc: 2 ms)
* **Prompt Tokens**: `0`
* **Completion Tokens**: `0`
* **Estimated Cost**: `$0.000000` (Fast-path saves 100% token cost)

---

## 💡 Key Takeaways

1. **Retrieval Precision/Recall vs. Database Size**:
   - The RAG mode returned low/medium precision because the local job seed database (`jobs.json`) has very few jobs. Standard keyword similarities pull semi-related titles (e.g. Online Data Analyst for an ML candidate).
   - *Recommendation*: Expanding the job database (or implementing live Jooble/Jobicy scraping in production) will automatically boost Context Precision and Recall.

2. **Zero-Overlap Fast-Path Robustness**:
   - The zero-overlap template successfully protects the system from LLM hallucinations when a candidate's background is completely detached from the role, ensuring high faithfulness and saving token costs.

3. **Faithfulness and Guardrails**:
   - The LLM consistently scores **High** on faithfulness because the prompt structure separates retrieved job metadata and CV details into compact, structured contexts, keeping the generation grounded.
