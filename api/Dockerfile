FROM python:3.11-slim

WORKDIR /app

# Optimize Python memory for container
ENV MALLOC_ARENA_MAX=2

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libxml2-dev libxslt-dev python3-dev curl gnupg && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy existing analysis modules from parent
COPY market_loader.py .
COPY penny_loader.py .
COPY tickers.json .
COPY penny_tickers.json .

# Copy API source
COPY api/ ./

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
