# Use a slim, stable python image
FROM python:3.12-slim

# Set environment variables
# - Python: avoid writing pyc files, disable buffering for stdout/stderr logging
# - HF_HOME: cache HuggingFace models in the app directory for easier permission management
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/app/.cache \
    PORT=7860

# Install system dependencies needed for compiling faiss-cpu, PyMuPDF, etc.
# libgomp1 is required for OpenMP (used by FAISS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency definition
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the SentenceTransformer model during building
# This speeds up container startup time and prevents network timeouts at runtime
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy the rest of the application code
COPY . .

# Create the upload and cache directories and ensure they exist
RUN mkdir -p /app/uploads /app/cache/analyses

# Set up user 1000 (standard non-root user for Hugging Face Spaces)
RUN useradd -m -u 1000 user && \
    chown -R user:user /app

# Switch to the non-root user
USER user

# Expose Hugging Face default port
EXPOSE 7860

# Run FastAPI app with Uvicorn, mapping the port to the environment variable
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
