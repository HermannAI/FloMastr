#!/usr/bin/env bash

# Start script for GitHub Codespaces
echo "🚀 Initializing FloMastr in GitHub Codespaces..."

# Install dependencies
echo "📦 Installing dependencies with npm..."
cd /workspaces/FloMastr/frontend && npm install

# Set environment variables for Codespaces
export CODESPACE_NAME=$(echo $CODESPACE_NAME)
echo "🌍 Codespace name: $CODESPACE_NAME"

# Start the application
echo "🚀 Starting FloMastr..."
docker-compose up -d

echo "✅ FloMastr is ready!"
echo "📝 Backend API: https://${CODESPACE_NAME}-8000.app.github.dev"
echo "🖥️ Frontend: https://${CODESPACE_NAME}-5173.app.github.dev"