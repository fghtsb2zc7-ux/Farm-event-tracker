# Morning Paper builder. Small image: no Calibre, no Docker socket, no opencv, no cron binary.
FROM python:3.12-slim-bookworm

COPY app/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir setuptools wheel && pip install --no-cache-dir -r /app/requirements.txt

COPY upstream /upstream
COPY app /app
ENV UPSTREAM_DIR=/upstream/scripts \
    KOBO_PAPER_CONFIG=/app/kobo-config.json \
    PAPER_DATA=/data \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN useradd -u 1000 -m paper && mkdir -p /data && chown paper /data
USER paper
CMD ["python", "/app/scheduler.py"]
