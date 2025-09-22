#!/usr/bin/env bash

# Test script for FloMastr Codespaces setup
echo "🔍 Testing FloMastr Codespaces environment..."

# Check if we're in Codespaces
if [ -n "$CODESPACE_NAME" ]; then
  echo "✅ Running in GitHub Codespaces: $CODESPACE_NAME"
  echo "   Backend URL would be: https://${CODESPACE_NAME}-8000.app.github.dev"
  echo "   Frontend URL would be: https://${CODESPACE_NAME}-5173.app.github.dev"
else
  echo "⚠️  Not running in Codespaces (local development mode)"
fi

# Check Yarn configuration
echo ""
echo "📦 Checking Yarn configuration..."
yarn --version

# Check Node.js version
echo ""
echo "📦 Checking Node.js version..."
node --version

# Check TypeScript configuration
echo ""
echo "📦 Checking TypeScript configuration..."
if [ -f "node_modules/typescript/lib/tsserver.js" ]; then
  echo "✅ TypeScript server found at node_modules/typescript/lib/tsserver.js"
else
  echo "❌ TypeScript server not found"
fi

# Check VS Code settings
echo ""
echo "📦 Checking VS Code settings..."
if [ -f ".vscode/settings.json" ]; then
  echo "✅ VS Code settings found"
  echo "   TypeScript SDK: $(grep -o '"typescript.tsdk": "[^"]*"' .vscode/settings.json)"
else
  echo "❌ VS Code settings not found"
fi

# Check Docker containers if running
echo ""
echo "🐳 Checking Docker containers..."
if command -v docker &> /dev/null; then
  if docker ps | grep -q "flomastr"; then
    echo "✅ FloMastr containers are running"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  else
    echo "⚠️  FloMastr containers not running. Use 'docker-compose up -d' to start."
  fi
else
  echo "⚠️  Docker not available"
fi

echo ""
echo "🎉 Environment test complete!"