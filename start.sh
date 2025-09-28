#!/bin/bash

# EcoVerse Startup Script
# This script sets up and runs the complete EcoVerse application

echo "🌱 Starting EcoVerse - AI-Powered Carbon Footprint Management"
echo "============================================================"

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: Please run this script from the EcoVerse project root directory"
    exit 1
fi

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install -r backend/requirements.txt

# Install additional required packages for dataset analysis
echo "📊 Installing dataset analysis packages..."
pip install pandas numpy python-dotenv google-generativeai

# Create database if it doesn't exist
echo "🗃️ Initializing database..."
cd backend
python -c "
from app.database import db_manager
print('✅ Database initialized successfully')
"
cd ..

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Set up environment variables if they don't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment configuration..."
    cp .env.example .env
    echo ""
    echo "🔑 IMPORTANT: Please update your .env file with your Gemini API key"
    echo "   1. Get your API key from: https://makersuite.google.com/app/apikey"
    echo "   2. Edit the .env file and replace 'your-gemini-api-key-here' with your actual key"
    echo ""
    read -p "Press Enter to continue once you've updated the API key..."
fi

# Start the backend server
echo "🚀 Starting backend server..."
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start the frontend server
echo "🎨 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ EcoVerse is now running!"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📖 API Documentation: http://localhost:8000/docs"
echo ""
echo "Features available:"
echo "  🤖 Gemini AI integration for insights"
echo "  📈 Real dataset analysis (3 Kaggle datasets)"
echo "  🎯 Personalized recommendations"
echo "  📱 Interactive carbon footprint tracking"
echo ""
echo "Dataset sources:"
echo "  • Individual Carbon Footprint Calculation"
echo "  • IoT Carbon Footprint Dataset" 
echo "  • UCI Individual Electric Power Consumption"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down EcoVerse..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    deactivate 2>/dev/null
    echo "✅ Shutdown complete"
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup INT

# Wait for user to stop
wait