#!/bin/bash
# ElectIQ Deployment Script
# Usage:
#   1) GEMINI_API_KEY=your_key ./scripts/deploy.sh
#   2) ./scripts/deploy.sh   (you will be prompted securely)
#   3) ./scripts/deploy.sh YOUR_GEMINI_API_KEY (legacy; not recommended)
# 
# This script:
#   1. Stores GEMINI_API_KEY in Secret Manager
#   2. Builds and deploys the backend to Cloud Run
#   3. Builds and deploys the web frontend to Cloud Run
#
# Prerequisites: gcloud CLI authenticated, project set to prompt-wars-2-by-soup

set -e

PROJECT="prompt-wars-2-by-soup"
REGION="asia-south1"  # Mumbai — best for Indian users
API_SERVICE="electiq-api"
WEB_SERVICE="electiq-web"

echo "🚀 ElectIQ Deployment — Project: $PROJECT"
echo "================================================"

# ─── 0. Resolve API key securely ─────────────────────────────────────────────
if [ -n "${GEMINI_API_KEY:-}" ]; then
  GEMINI_KEY="$GEMINI_API_KEY"
  echo "✅ Gemini API key loaded from GEMINI_API_KEY environment variable"
elif [ -n "${1:-}" ]; then
  GEMINI_KEY="$1"
  echo "⚠️  Legacy key argument mode used. Prefer GEMINI_API_KEY env var or secure prompt."
else
  echo "🔐 Enter your Gemini API key (input hidden):"
  read -r -s GEMINI_KEY
  echo
fi

if [ -z "$GEMINI_KEY" ]; then
  echo "❌ GEMINI_API_KEY is required."
  echo "   Get your key at: https://aistudio.google.com/app/apikey"
  exit 1
fi

# ─── 1. Store key in Secret Manager ────────────────────────────────────────
echo ""
echo "📦 Storing GEMINI_API_KEY in Secret Manager..."
echo -n "$GEMINI_KEY" | gcloud secrets create GEMINI_API_KEY \
  --replication-policy="automatic" \
  --project="$PROJECT" \
  --data-file=- 2>/dev/null || \
  echo -n "$GEMINI_KEY" | gcloud secrets versions add GEMINI_API_KEY \
    --project="$PROJECT" \
    --data-file=-

echo "✅ Secret stored"

# ─── 2. Grant Cloud Run SA access to secret ────────────────────────────────
echo ""
echo "🔐 Granting Cloud Run service account access to secret..."
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor" \
  --project="$PROJECT" > /dev/null
echo "✅ IAM binding set"

# ─── 3. Deploy Backend ───────────────────────────────────────────────────────
echo ""
echo "🐍 Deploying ElectIQ Backend to Cloud Run ($REGION)..."
cd "$(dirname "$0")/../backend"

gcloud run deploy "$API_SERVICE" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT" \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --project "$PROJECT"

API_URL=$(gcloud run services describe "$API_SERVICE" --region "$REGION" --format='value(status.url)' --project "$PROJECT")
echo "✅ Backend deployed: $API_URL"

# ─── 4. Build and Deploy Web Frontend ────────────────────────────────────────
echo ""
echo "⚛️  Building Web Frontend..."
cd "$(dirname "$0")/../web"

# Inject backend URL into build
VITE_API_URL="$API_URL" npm run build

echo "🌐 Deploying Web Frontend to Cloud Run..."
cat > Dockerfile.web << 'DOCKERFILE'
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
DOCKERFILE

cat > nginx.conf << 'NGINX'
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
NGINX

gcloud run deploy "$WEB_SERVICE" \
  --source . \
  --dockerfile Dockerfile.web \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --project "$PROJECT"

WEB_URL=$(gcloud run services describe "$WEB_SERVICE" --region "$REGION" --format='value(status.url)' --project "$PROJECT")
echo "✅ Web frontend deployed: $WEB_URL"

# ─── 5. Summary ──────────────────────────────────────────────────────────────
echo ""
echo "================================================"
echo "🎉 ElectIQ Deployment Complete!"
echo ""
echo "🌐 Web App:  $WEB_URL"
echo "🔌 API:      $API_URL"
echo "📚 API Docs: $API_URL/docs"
echo ""
echo "Test the API:"
echo "  curl $API_URL/health"
echo "  curl -X POST $API_URL/factcheck -H 'Content-Type: application/json' -d '{\"text\":\"EVMs can be hacked\"}'"
echo ""
echo "🇮🇳 Making Indian democracy legible to every citizen."
