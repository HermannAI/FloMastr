#!/bin/bash
# FloMastr Docker Startup Script
# Use this script to start the entire application in Docker containers

set -e

echo "🐳 FloMastr - Docker Container Startup"
echo "====================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to start the application
start_app() {
    echo "🚀 Starting FloMastr application..."
    docker-compose up --build
}

# Function to start in background
start_bg() {
    echo "🚀 Starting FloMastr application in background..."
    docker-compose up -d --build
}

# Function to stop the application
stop_app() {
    echo "🛑 Stopping FloMastr application..."
    docker-compose down
}

# Function to view logs
view_logs() {
    echo "📄 Viewing FloMastr logs..."
    docker-compose logs -f
}

# Function to clean up
cleanup() {
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down --volumes --remove-orphans
    docker system prune -f
}

# Main execution
case "${1:-start}" in
    "start"|"up")
        check_docker
        start_app
        ;;
    "start-bg"|"up-bg"|"background")
        check_docker
        start_bg
        ;;
    "stop"|"down")
        stop_app
        ;;
    "logs")
        view_logs
        ;;
    "clean"|"cleanup")
        cleanup
        ;;
    "restart")
        check_docker
        echo "🔄 Restarting FloMastr application..."
        docker-compose restart
        ;;
    *)
        echo "Usage: $0 {start|start-bg|stop|logs|clean|restart}"
        echo ""
        echo "Commands:"
        echo "  start, up       - Start the application (foreground)"
        echo "  start-bg, up-bg - Start the application (background)"
        echo "  stop, down      - Stop the application"
        echo "  logs            - View application logs"
        echo "  clean, cleanup  - Clean up Docker resources"
        echo "  restart         - Restart the application"
        exit 1
        ;;
esac