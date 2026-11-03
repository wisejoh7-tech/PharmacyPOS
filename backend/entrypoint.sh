#!/usr/bin/env bash
set -e

echo "=== Starting Pharmacy Backend Container ==="

# Execute database schema migrations and initial checks
if [ -f "run_migrations.py" ]; then
    echo "Running database migrations via run_migrations.py..."
    python run_migrations.py || {
        echo "run_migrations.py encountered an issue, falling back to manage.py migrate..."
        python manage.py migrate --noinput
    }
else
    echo "Running manage.py migrate..."
    python manage.py migrate --noinput
fi

# Ensure superuser / initial admin setup if script exists
if [ -f "ensure_admin.py" ]; then
    echo "Ensuring initial admin exists..."
    python ensure_admin.py || echo "Warning: ensure_admin.py failed or skipped."
fi

# Collect static files for Whitenoise serving
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn application server..."
exec gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 core.wsgi:application
