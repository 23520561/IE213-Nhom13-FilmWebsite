FROM python:3.11-slim

WORKDIR /usr/local/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 50051

RUN useradd app
USER app

CMD ["python", "-m", "app.main"]
