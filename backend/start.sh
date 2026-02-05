#!/bin/bash
echo "🚀 Starting Cenny Grosz Backend..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   sudo systemctl start mongodb"
    echo "   OR"
    echo "   mongod --dbpath /path/to/data"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env with your configuration"
fi

# Start the server
echo "✅ Starting FastAPI server..."
uvicorn server:app --reload --host 0.0.0.0 --port 8000
