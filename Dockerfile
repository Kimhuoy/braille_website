# Stage 1: Build the app
FROM node:22-alpine AS web-builder

WORKDIR /app/Frontend

COPY Frontend/package*.json ./
RUN npm ci

COPY Frontend/ ./

RUN npm run build

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Records people send: mount a volume at /data or they are lost on the next deploy
ENV CONTRIBUTIONS_DIR=/data/contributions
ENV FEEDBACK_DIR=/data/feedback

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-khm \
    && rm -rf /var/lib/apt/lists/*

COPY Backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY Backend/ ./
COPY --from=web-builder /app/Frontend/dist /app/dist

# The code stays read-only for the workers, which run as this unprivileged user
RUN groupadd --system app && useradd --system --gid app --no-create-home --shell /usr/sbin/nologin app && mkdir -p /data

# --timeout 120: gunicorn's default 30 s would cut off a long document or a scanned
# PDF being read (limits in Backend/FileFormat.py; Backend/docs/upload-limits.md)
# The master stays root only to bind port 80 and hand /data (also an existing volume) to the workers.
# --max-requests: workers are replaced regularly, so a slow memory leak cannot build up.
CMD ["sh", "-c", "chown -R app:app /data && exec gunicorn --user app --group app -w 4 --timeout 120 --max-requests 2000 --max-requests-jitter 200 -b 0.0.0.0:80 main:app"]

EXPOSE 80
