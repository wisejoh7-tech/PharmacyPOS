FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/

# Run database migrations, static collection, and ensure admin user during container startup or build
CMD ["sh", "-c", "python run_migrations.py && python ensure_admin.py && gunicorn --bind 0.0.0.0:8000 core.wsgi:application"]
