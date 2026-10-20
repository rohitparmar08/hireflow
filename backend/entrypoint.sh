#!/bin/sh
set -e

echo "[HireFlow] Applying database migrations..."
python manage.py migrate --noinput

echo "[HireFlow] Collecting static files..."
python manage.py collectstatic --noinput

echo "[HireFlow] Starting Gunicorn production server..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers ${GUNICORN_WORKERS:-3} \
    --threads ${GUNICORN_THREADS:-2} \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
