---
title: CVClinic Backend
emoji: 🩺
colorFrom: purple
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# CVClinic Backend

This is the FastAPI backend for CVClinic (AI Resume Diagnostics), designed to run as a Docker Space on Hugging Face.

## API Endpoints

- `POST /cv/analyze`: Analyze resume text, extract skills, and match relevant jobs.
- `POST /cv/generate-fix`: Generate plain text or LaTeX rewrites for CV sections.
- `POST /cv/generate-cover-letter`: Draft a customized cover letter for a matched job.
- `GET /cv/cache-info`: Inspect analysis cache stats.
