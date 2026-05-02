# ElectIQ Submission Quickstart

This repository contains the full production-ready implementation of the ElectIQ civic accountability platform.

## Architecture & Code Quality
Unlike the initial monolithic submission, this codebase has been completely refactored into a **Service-Oriented Modular Architecture**. 
- `main.py` is now a thin entrypoint handling only middleware and router wiring.
- Core logic is extracted to dedicated services (`ai_service.py`, `analytics_service.py`, `factcheck_service.py`).
- Endpoints are properly domain-separated (`api/core.py`, `api/chat.py`, `api/accountability.py`).
- Security is locked down with strict CSP, HSTS, and X-Request-ID tracing middleware.
- Full custom exception hierarchy returns structured JSON error codes for clean API consumption.

## Fast Local Development

We have added a `docker-compose.yml` to make local orchestration simple and reliable.

```bash
docker-compose up --build
```
- Admin / Web: http://localhost:5173
- API: http://localhost:8000

## Deploy to Google Cloud Run (Recommended for Judging)

We provide a single root-level deployment script to automate your GCP deployment:

```bash
# Ensure gcloud is authenticated and project is set to prompt-wars-2-by-soup
./deploy-gcp.sh
```

This script:
1. Stores your `GEMINI_API_KEY` securely in Secret Manager.
2. Deploys the FastAPI backend to Cloud Run.
3. Injects the deployed API URL into the React frontend during build.
4. Deploys the React frontend to Cloud Run behind an Nginx static server.

## Evaluation Checklist
This codebase directly addresses the "Election Process Education" problem statement via:
- **EVM Simulator:** Interactive module allowing voters to practice the voting flow.
- **Election Timeline:** Live phase tracking showing what happens next.
- **Fact-checking & AI Chat:** Contextual, Gemini-powered responses specifically scoped to civic data and election rules.
