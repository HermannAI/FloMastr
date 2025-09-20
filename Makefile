# Docker-first development commands
.PHONY: up down build logs restart clean dev backend frontend

# Default target - start the entire development environment
dev: up

# Start all services
up:
	docker-compose up --build

# Start services in background
up-bg:
	docker-compose up -d --build

# Stop all services
down:
	docker-compose down

# Stop and remove all containers, networks, and volumes
clean:
	docker-compose down --volumes --remove-orphans

# Build/rebuild containers
build:
	docker-compose build

# View logs
logs:
	docker-compose logs -f

# View specific service logs
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# Restart services
restart:
	docker-compose restart

restart-backend:
	docker-compose restart backend

restart-frontend:
	docker-compose restart frontend

# Start only backend
backend:
	docker-compose up backend

# Start only frontend
frontend:
	docker-compose up frontend

# Shell access to containers
shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend sh

# Legacy commands (for backward compatibility)
install: up
run-backend: backend
run-frontend: frontend

.DEFAULT_GOAL := dev
