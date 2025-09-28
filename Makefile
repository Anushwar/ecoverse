# EcoVerse Development Makefile

.PHONY: help
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: setup
setup: ## Set up development environment
	python -m venv venv
	./venv/bin/pip install --upgrade pip
	./venv/bin/pip install -e ".[dev]"
	./venv/bin/pre-commit install
	cp .env.example .env
	@echo "✅ Development environment set up!"
	@echo "📝 Please edit .env with your API keys"

.PHONY: install
install: ## Install dependencies
	./venv/bin/pip install -e ".[dev]"

.PHONY: format
format: ## Format code with black and ruff
	./venv/bin/ruff format .
	./venv/bin/ruff check --fix .

.PHONY: lint
lint: ## Lint code with ruff and mypy
	./venv/bin/ruff check .
	./venv/bin/mypy .

.PHONY: test
test: ## Run tests
	./venv/bin/pytest

.PHONY: test-cov
test-cov: ## Run tests with coverage
	./venv/bin/pytest --cov=ecoverse --cov-report=term-missing --cov-report=html

.PHONY: run
run: ## Run the FastAPI server
	./venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000

.PHONY: run-prod
run-prod: ## Run the FastAPI server in production mode
	./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

.PHONY: clean
clean: ## Clean up temporary files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	rm -rf .coverage

.PHONY: shell
shell: ## Start Python shell with app context
	./venv/bin/python -i -c "from main import app; from models import *; from ai_agents import *"

.PHONY: check
check: format lint test ## Run all checks (format, lint, test)

.PHONY: demo-data
demo-data: ## Generate demo data for testing
	./venv/bin/python scripts/generate_demo_data.py