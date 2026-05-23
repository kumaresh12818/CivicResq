#!/usr/bin/env bash
set -e

echo "=== CivicResQ Monorepo Build ==="

# 1. Install and build the Next.js frontend
echo ">> Building frontend..."
cd frontend
npm install
npm run build
echo ">> Frontend build complete. Files in frontend/out:"
ls -la out/ || echo "WARNING: out/ directory not found!"
cd ..

# 2. Install Python backend dependencies
echo ">> Installing backend dependencies..."
cd backend
pip install -r requirements.txt
echo ">> Backend ready."
