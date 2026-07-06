# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
COPY . .

# Ensure the database directory exists
RUN mkdir -p src/database

# Expose port 5000
EXPOSE 5000

# Run the Flask application
CMD ["python", "src/main.py"]
