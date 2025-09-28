# 🌱 EcoVerse - AI-Powered Carbon Footprint Management

EcoVerse is a comprehensive carbon footprint management platform that combines AI-powered insights with real-world dataset analysis to help users understand, track, and reduce their environmental impact.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🤖 AI-Powered Analysis

- **Gemini AI Integration**: Advanced insights using Google's Gemini AI
- **Personalized Recommendations**: Tailored suggestions based on user behavior
- **Pattern Recognition**: Identifies trends and anomalies in carbon footprint data
- **Natural Language Q&A**: Ask questions about your footprint in natural language

### 📊 Core Functionality

- **Activity Tracking**: Log transportation, energy, food, and waste activities
- **Dashboard Analytics**: Visual insights into your carbon footprint
- **Benchmarking**: Compare against real-world data from thousands of users
- **Goal Setting**: Set and track carbon reduction goals
- **Progress Monitoring**: Weekly and monthly trend analysis

## 🏗️ Technical Architecture

### Backend (Python/FastAPI)

- **FastAPI**: Modern, fast web framework for APIs
- **SQLite Database**: Lightweight database for development
- **Pandas/NumPy**: Data analysis and processing
- **Google Gemini AI**: Advanced AI insights
- **Pydantic**: Data validation and serialization

### Frontend (Next.js/React)

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Heroicons**: Beautiful icon library

### Data Processing

- **Enhanced Dataset Processor**: Real-time analysis of carbon footprint patterns
- **AI Agent System**: Orchestrated AI agents for insights and recommendations
- **Carbon Calculator**: Accurate emission calculations with real factors

### Project Structure

```
ecoverse/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application
│   │   ├── database.py             # Database management
│   │   ├── models/models.py        # Data models
│   │   └── services/               # Business logic
│   │       ├── ai_agents.py        # AI analysis agents
│   │       ├── carbon_calculator.py # Carbon calculations
│   │       └── enhanced_dataset_processor.py # Dataset analysis
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/page.tsx           # Main application page
│   │   ├── components/            # React components
│   │   └── services/api.ts        # API client
│   └── package.json               # Node.js dependencies
├── data/                          # Dataset files
└── start.sh                       # Quick start script
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))

### One-Click Setup (Recommended)

```bash
git clone <repository-url>
cd ecoverse
./start.sh
```

The script will set up the Python environment, install dependencies, initialize the database, and start both servers.

### Manual Setup

1. **Clone and set up Python environment**

```bash
git clone <repository-url>
cd ecoverse
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

2. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env and add your Gemini API key
```

3. **Start the backend**

```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

4. **Start the frontend** (in another terminal)

```bash
cd frontend
npm install
npm run dev
```

5. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📱 Application Overview

### Dashboard

- **Total Emissions**: Track your carbon footprint over time
- **Category Breakdown**: See which activities contribute most to emissions
- **Trend Analysis**: Weekly and monthly emission trends
- **AI Insights**: Get personalized analysis and recommendations

### Activity Tracking

- **Transportation**: Cars, public transit, flights, cycling
- **Energy**: Electricity, natural gas, heating oil
- **Food**: Meat consumption, dairy, vegetables, local vs imported
- **Waste**: Recycling, composting, landfill waste

### AI-Powered Features

- **Personal Insights**: Analysis of your individual patterns
- **Dataset Insights**: Benchmarking against real-world data
- **Gemini AI Analysis**: Advanced AI-powered recommendations
- **Natural Language Q&A**: Ask questions about your footprint

## 🔑 API Reference

### Core Endpoints

- `GET /` - Application info and dataset summary
- `GET /health` - Health check
- `POST /users` - Create user
- `GET /users/me` - Get current user
- `POST /activities` - Add carbon activity
- `GET /activities` - Get user activities
- `GET /dashboard` - Dashboard data

### AI & Analysis

- `POST /analyze` - Comprehensive AI analysis with Gemini
- `GET /insights` - Personal insights
- `GET /recommendations` - AI recommendations
- `GET /datasets/summary` - Dataset overview and citations
- `GET /datasets/insights` - Global dataset insights

## 📊 Data Sources

This application uses real-world data from the following sources:

1. **Individual Carbon Footprint Calculation**

   - 10,000+ individual records
   - Source: [Kaggle Dataset](https://www.kaggle.com/datasets/dumanmesut/individual-carbon-footprint-calculation)

2. **IoT Carbon Footprint Dataset**

   - 10,000+ IoT device monitoring records
   - Source: [Kaggle Dataset](https://www.kaggle.com/datasets/dawoodhuss227/iot-carbon-footprint-dataset)

3. **Individual Household Electric Power Consumption**
   - Time-series power consumption data
   - Source: [UCI Repository](https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption)

## 🛠️ Development

### Environment Variables

```env
# Required
GEMINI_API_KEY=your-gemini-api-key-here

# Optional
DATABASE_URL=sqlite:///./ecoverse.db
SECRET_KEY=your-secret-key
LOG_LEVEL=INFO
```

### Adding New Features

1. **Backend**: Add new endpoints in `main.py`
2. **Frontend**: Create components in `src/components/`
3. **AI Analysis**: Extend agents in `ai_agents.py`
4. **Data Processing**: Enhance `enhanced_dataset_processor.py`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Dataset Providers**: Thanks to Kaggle contributors and UCI ML Repository
- **Google AI**: For Gemini API access
- **Open Source Libraries**: FastAPI, Next.js, and all dependencies
- **Environmental Research Community**: For carbon footprint calculation methods

---

**EcoVerse** - Making carbon footprint management accessible through AI and real data 🌱
