#!/usr/bin/env bash

# FloMastr Frontend Setup with NPM (lighter alternative)
echo "🚀 Setting up FloMastr Frontend with NPM..."

cd /workspaces/FloMastr/frontend

# Clean previous installations
echo "🧹 Cleaning up..."
rm -rf node_modules
rm -f package-lock.json

# Install with npm (often more memory efficient)
echo "📦 Installing with npm (more memory efficient for large projects)..."
npm install --no-audit --no-fund --maxsockets=1

if [ $? -eq 0 ]; then
    echo "✅ NPM installation successful!"
    echo "🚀 Starting development server..."
    npm run dev
else
    echo "❌ NPM installation failed"
    exit 1
fi