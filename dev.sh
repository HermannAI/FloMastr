#!/bin/bash

# FloMastr Docker Development Script
# This script provides easy commands for Docker-based development

case "$1" in
    "start"|"up")
        echo "🐳 Starting FloMastr development environment..."
        docker-compose up --build
        ;;
    "start-bg"|"up-bg")
        echo "🐳 Starting FloMastr development environment in background..."
        docker-compose up -d --build
        ;;
    "stop"|"down")
        echo "🛑 Stopping FloMastr development environment..."
        docker-compose down
        ;;
    "restart")
        echo "🔄 Restarting FloMastr development environment..."
        docker-compose restart
        ;;
    "logs")
        echo "📄 Showing logs..."
        docker-compose logs -f
        ;;
    "backend")
        echo "🖥️ Starting only backend..."
        docker-compose up backend
        ;;
    "frontend")
        echo "🌐 Starting only frontend..."
        docker-compose up frontend
        ;;
    "shell-backend")
        echo "🐚 Opening shell in backend container..."
        docker-compose exec backend bash
        ;;
    "shell-frontend")
        echo "🐚 Opening shell in frontend container..."
        docker-compose exec frontend sh
        ;;
    "clean")
        echo "🧹 Cleaning up containers, networks, and volumes..."
        docker-compose down --volumes --remove-orphans
        docker system prune -f
        ;;
    "help"|*)
        echo "FloMastr Docker Development Commands:"
        echo ""
        echo "  start, up          Start development environment"
        echo "  start-bg, up-bg    Start in background"
        echo "  stop, down         Stop all services"
        echo "  restart            Restart all services"
        echo "  logs               View live logs"
        echo "  backend            Start only backend service"
        echo "  frontend           Start only frontend service"
        echo "  shell-backend      Open shell in backend container"
        echo "  shell-frontend     Open shell in frontend container"
        echo "  clean              Clean up containers and volumes"
        echo "  help               Show this help"
        echo ""
        echo "Examples:"
        echo "  ./dev.sh start     # Start development environment"
        echo "  ./dev.sh logs      # View live logs"
        echo "  ./dev.sh clean     # Clean up everything"
        ;;
esac