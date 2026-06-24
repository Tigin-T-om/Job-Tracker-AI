# ---------------------------------------------------------------------------
# Dockerfile - Hugging Face deployment build instructions
# Configures Python environment, installs requirements, and runs FastAPI
# on port 7860 (required by Hugging Face Spaces).
# ---------------------------------------------------------------------------

# Use an official lightweight Python image
FROM python:3.11-slim

# Set environment variables to prevent Python from writing pyc files and buffering output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /code

# Copy the requirements file and install dependencies
COPY requirements.txt /code/
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of the application files
COPY . /code/

# Expose port 7860 (Hugging Face routes external traffic to this port)
EXPOSE 7860

# Run Uvicorn pointing to our main FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
