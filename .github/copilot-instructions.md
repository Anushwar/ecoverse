# Copilot Instructions for Ecoverse

## Project Overview

Ecoverse is a Python project in early development. The project uses Python-focused tooling and conventions as evidenced by the comprehensive `.gitignore` for Python ecosystems.

## Development Environment

- **Language**: Python (primary language based on .gitignore patterns)
- **Environment Management**: Supports multiple Python environment tools (.venv, venv, conda environments)
- **Code Quality**: Configured for Ruff linting (.ruff_cache/ in .gitignore)
- **Testing**: Supports pytest, coverage, and hypothesis testing frameworks
- **IDE**: VS Code compatible (.vscode/ ignored)

## Project Structure Conventions

Since this is an early-stage project, establish these patterns when creating new files:

### Python Package Structure

- Use standard Python package structure with `__init__.py` files
- Place main source code in a `src/` or project-named directory
- Separate tests in a `tests/` directory
- Use `requirements.txt` or `pyproject.toml` for dependency management

### Environment Configuration

- Use `.env` files for environment variables (already ignored)
- Support both direnv (`.envrc`) and standard environment files
- Virtual environments should be created in project root (already ignored patterns)

## Development Workflow Patterns

When implementing new features:

1. **Environment Setup**: Create virtual environment before adding dependencies
2. **Code Quality**: Use Ruff for linting and formatting
3. **Testing**: Write tests using pytest with coverage reporting
4. **Documentation**: Follow Python docstring conventions

## Key Files to Create

As the project grows, these files will be essential:

- `pyproject.toml` or `requirements.txt` for dependencies
- `setup.py` or modern `pyproject.toml` for package configuration
- `tests/` directory with pytest configuration
- `.python-version` for Python version specification
- Environment configuration files (`.env` template)

## External Dependencies

Monitor for these common Python project patterns:

- Database connections (Django/Flask patterns in .gitignore suggest web framework usage)
- Jupyter notebook integration (`.ipynb_checkpoints` ignored)
- Package distribution (PyPI configuration ready)

## Notes for AI Assistants

- This project is in bootstrap phase - establish Python best practices when creating initial structure
- .gitignore suggests support for multiple Python frameworks (Django, Flask)
- Environment management is flexible - detect user preference for venv vs conda
- Code quality tools (Ruff) are anticipated - configure them when adding source code
