'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import Dashboard from '../components/Dashboard'
import ActivityForm from '../components/ActivityForm'
import RecommendationCard from '../components/RecommendationCard'
import InsightCard from '../components/InsightCard'
import {
  ChartBarIcon,
  PlusIcon,
  LightBulbIcon,
  SparklesIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

interface DashboardData {
  total_emissions: number
  daily_average: number
  weekly_trend: string
  top_category: string
  insights_count: number
  recommendations_count: number
}

interface Activity {
  id: string
  category: string
  type: string
  amount: number
  unit: string
  carbon_emission: number
  date: string
}

interface Recommendation {
  id: string
  title: string
  description: string
  impact: {
    carbon_reduction: number
    cost: number
    difficulty: string
  }
}

interface Insight {
  id: string
  title: string
  message: string
  severity: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Mock user for demo
  useEffect(() => {
    // Simulate user creation/login
    const mockUser = {
      id: 'demo-user',
      name: 'Eco Warrior',
      email: 'demo@ecoverse.ai'
    }
    setUser(mockUser)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load real data from API
      const [dashboardResult, activitiesResult, recommendationsResult, insightsResult] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getActivities().catch(() => []),
        api.getRecommendations().catch(() => []),
        api.getInsights().catch(() => [])
      ])

      // Use real data if available, otherwise fallback to mock data
      if (dashboardResult) {
        setDashboardData(dashboardResult)
      } else {
        // Fallback mock data
        setDashboardData({
          total_emissions: 245.8,
          daily_average: 8.2,
          weekly_trend: 'decreasing',
          top_category: 'transportation',
          insights_count: 3,
          recommendations_count: 5
        })
      }

      setActivities(activitiesResult.length > 0 ? activitiesResult : [
        {
          id: '1',
          category: 'transportation',
          type: 'car_gasoline',
          amount: 25,
          unit: 'miles',
          carbon_emission: 10.1,
          date: new Date().toISOString()
        },
        {
          id: '2',
          category: 'energy',
          type: 'electricity',
          amount: 30,
          unit: 'kwh',
          carbon_emission: 27.6,
          date: new Date().toISOString()
        }
      ])

      setRecommendations(recommendationsResult.length > 0 ? recommendationsResult : [
        {
          id: '1',
          title: 'Switch to Electric Vehicle',
          description: 'Consider an electric vehicle for your daily commute to reduce emissions by 70%',
          impact: {
            carbon_reduction: 150,
            cost: 300,
            difficulty: 'medium'
          }
        },
        {
          id: '2',
          title: 'Install Smart Thermostat',
          description: 'Reduce heating and cooling energy consumption by 15%',
          impact: {
            carbon_reduction: 45,
            cost: 250,
            difficulty: 'easy'
          }
        }
      ])

      setInsights(insightsResult.length > 0 ? insightsResult : [
        {
          id: '1',
          title: 'Weekly Improvement',
          message: 'Your emissions decreased by 12% this week!',
          severity: 'success'
        },
        {
          id: '2',
          title: 'Transportation Focus',
          message: 'Transportation accounts for 60% of your carbon footprint',
          severity: 'info'
        }
      ])

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoading(false)
    }
  }

  const handleActivityAdded = (newActivity: any) => {
    setActivities(prev => [newActivity, ...prev])
    loadDashboardData() // Refresh dashboard
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4"
          >
            <BeakerIcon className="h-12 w-12 text-primary-600" />
          </motion.div>
          <p className="text-gray-600">Loading EcoVerse...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BeakerIcon className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">EcoVerse</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.name?.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
              { id: 'activities', name: 'Add Activity', icon: PlusIcon },
              { id: 'insights', name: 'Insights', icon: LightBulbIcon },
              { id: 'recommendations', name: 'AI Recommendations', icon: SparklesIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && dashboardData && (
              <Dashboard data={dashboardData} activities={activities} />
            )}

            {activeTab === 'activities' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Add Carbon Activity
                  </h2>
                  <p className="text-gray-600">
                    Track your daily activities to calculate your carbon footprint.
                  </p>
                </div>
                <ActivityForm onActivityAdded={handleActivityAdded} />
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Carbon Insights
                  </h2>
                  <p className="text-gray-600">
                    AI-powered insights about your carbon footprint patterns.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    AI Recommendations
                  </h2>
                  <p className="text-gray-600">
                    Personalized recommendations to reduce your carbon footprint.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {recommendations.map((recommendation) => (
                    <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}