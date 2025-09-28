"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, AnalysisResponse, DatasetInsight } from "../services/api";
import Dashboard from "../components/Dashboard";
import EnhancedActivityForm from "../components/EnhancedActivityForm";
import RecommendationCard from "../components/RecommendationCard";
import InsightCard from "../components/InsightCard";
import EnhancedDatasetAnalysis from "../components/EnhancedDatasetAnalysis";
import EnhancedAIAnalysis from "../components/EnhancedAIAnalysis";
import {
  ChartBarIcon,
  PlusIcon,
  LightBulbIcon,
  SparklesIcon,
  BeakerIcon,
  CircleStackIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface DashboardData {
  total_emissions: number;
  daily_average: number;
  weekly_trend: string;
  top_category: string;
  insights_count: number;
  recommendations_count: number;
}

interface Activity {
  id: string;
  category: string;
  type: string;
  amount: number;
  unit: string;
  carbon_emission: number;
  date: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: {
    carbon_reduction: number;
    cost: number;
    difficulty: string;
    timeframe: string;
  };
  confidence: number;
  reasoning: string;
  status: string;
}

interface Insight {
  id: string;
  title: string;
  message: string;
  severity: string;
  type?: string;
  data?: Record<string, any>;
  confidence?: number;
  created_at?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [datasetInsights, setDatasetInsights] = useState<
    Record<string, DatasetInsight[]>
  >({});
  const [datasetSummary, setDatasetSummary] = useState<any>(null);
  const [analysisResponse, setAnalysisResponse] =
    useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({
    insights: false,
    recommendations: false,
    datasets: false,
  });
  const [user, setUser] = useState<any>(null);
  const [analysisQuestion, setAnalysisQuestion] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load user and basic data
      const [userResult, dashboardResult, activitiesResult] = await Promise.all(
        [
          api.getCurrentUser().catch(() => null),
          api.getDashboardData().catch(() => null),
          api.getActivities(20).catch(() => []),
        ]
      );

      if (userResult) {
        setUser(userResult);
      } else {
        // Create demo user if none exists
        const demoUser = {
          id: "demo-user",
          name: "Eco Warrior",
          email: "demo@ecoverse.ai",
          profile: {
            location: "US",
            household_size: 2,
            lifestyle: "moderate",
          },
        };
        setUser(demoUser);
      }

      if (dashboardResult) {
        setDashboardData(dashboardResult);
      }
      setActivities(activitiesResult || []);

      // Load insights and recommendations
      const [recommendationsResult, insightsResult] = await Promise.all([
        api.getRecommendations(10).catch(() => []),
        api.getInsights(15).catch(() => []),
      ]);

      setRecommendations(recommendationsResult || []);
      setInsights(insightsResult || []);

      // Load dataset information
      const [datasetSummaryResult, datasetInsightsResult] = await Promise.all([
        api.getDatasetSummary().catch(() => null),
        api.getDatasetInsights().catch(() => {}),
      ]);

      setDatasetSummary(datasetSummaryResult);
      setDatasetInsights(datasetInsightsResult || {});
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityAdded = async (activity: Activity) => {
    // Refresh data after adding activity
    setActivities((prev) => [activity, ...prev.slice(0, 19)]);

    // Refresh dashboard with loading state
    try {
      setRefreshLoading(true);
      const newDashboard = await api.getDashboardData();
      setDashboardData(newDashboard);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleAnalyzeFootprint = async () => {
    if (analysisLoading) return;

    try {
      setAnalysisLoading(true);
      const analysis = await api.analyzeFootprint(
        analysisQuestion || undefined
      );
      setAnalysisResponse(analysis);

      // Update insights and recommendations with new data, avoiding duplicates
      if (analysis.insights) {
        setInsights((prev) => {
          const existingIds = new Set(prev.map(insight => insight.id));
          const newInsights = analysis.insights.filter(insight => !existingIds.has(insight.id));
          return [...newInsights, ...prev].slice(0, 20);
        });
      }
      if (analysis.recommendations) {
        setRecommendations((prev) => {
          const existingIds = new Set(prev.map(rec => rec.id));
          const newRecs = analysis.recommendations.filter(rec => !existingIds.has(rec.id));
          return [...newRecs, ...prev].slice(0, 15);
        });
      }
    } catch (error) {
      console.error("Error analyzing footprint:", error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleLearnMore = async (insight: any) => {
    // Set the analysis question and switch to dashboard for analysis
    setAnalysisQuestion(`Provide detailed analysis and recommendations for: ${insight.title}`);
    setActiveTab("dashboard");
    // Scroll to analysis section
    setTimeout(() => {
      document.getElementById('ai-analysis-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleTabChange = async (tabId: string) => {
    setActiveTab(tabId);

    // Handle tab-specific loading for data that might need refreshing
    if (tabId === "insights" && insights.length === 0) {
      setTabLoading(prev => ({ ...prev, insights: true }));
      try {
        const freshInsights = await api.getInsights(15);
        setInsights(freshInsights || []);
      } catch (error) {
        console.error("Error loading insights:", error);
      } finally {
        setTabLoading(prev => ({ ...prev, insights: false }));
      }
    } else if (tabId === "recommendations" && recommendations.length === 0) {
      setTabLoading(prev => ({ ...prev, recommendations: true }));
      try {
        const freshRecommendations = await api.getRecommendations(10);
        setRecommendations(freshRecommendations || []);
      } catch (error) {
        console.error("Error loading recommendations:", error);
      } finally {
        setTabLoading(prev => ({ ...prev, recommendations: false }));
      }
    } else if (tabId === "datasets" && !datasetSummary) {
      setTabLoading(prev => ({ ...prev, datasets: true }));
      try {
        const [summaryResult, insightsResult] = await Promise.all([
          api.getDatasetSummary().catch(() => null),
          api.getDatasetInsights().catch(() => {}),
        ]);
        setDatasetSummary(summaryResult);
        setDatasetInsights(insightsResult || {});
      } catch (error) {
        console.error("Error loading dataset data:", error);
      } finally {
        setTabLoading(prev => ({ ...prev, datasets: false }));
      }
    }
  };

  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: ChartBarIcon },
    { id: "activities", name: "Add Activity", icon: PlusIcon },
    { id: "insights", name: "AI Insights", icon: LightBulbIcon },
    { id: "datasets", name: "Dataset Analysis", icon: CircleStackIcon },
    { id: "recommendations", name: "Recommendations", icon: SparklesIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-carbon-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🌱 EcoVerse</h1>
          <p className="text-xl text-gray-600 mb-2">
            AI-Powered Carbon Footprint Management with Real Dataset Analysis
          </p>
          {user && (
            <p className="text-sm text-gray-500">
              Welcome back, {user.name}!
              {datasetSummary && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  <CircleStackIcon className="w-3 h-3 mr-1" />
                  {Object.keys(datasetSummary.datasets || {}).length} datasets
                  loaded
                </span>
              )}
            </p>
          )}
        </motion.header>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center px-4 py-2 mx-2 my-1 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-carbon-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "dashboard" && (
              <div className="relative">
                {refreshLoading && (
                  <div className="absolute top-0 right-0 z-10 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Refreshing data...
                  </div>
                )}
                {dashboardData && activities && (
                  <Dashboard data={dashboardData} activities={activities} />
                )}

                {/* Enhanced AI Analysis Section */}
                <EnhancedAIAnalysis
                  analysisQuestion={analysisQuestion}
                  setAnalysisQuestion={setAnalysisQuestion}
                  onAnalyze={handleAnalyzeFootprint}
                  analysisLoading={analysisLoading}
                  geminiInsight={analysisResponse?.gemini_insight || null}
                />
              </div>
            )}

            {activeTab === "activities" && (
              <EnhancedActivityForm onActivityAdded={handleActivityAdded} />
            )}

            {activeTab === "insights" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <LightBulbIcon className="h-6 w-6 mr-2 text-yellow-500" />
                    AI-Generated Insights
                    {tabLoading.insights && (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500 ml-2"></span>
                    )}
                  </h2>
                  <button
                    onClick={handleAnalyzeFootprint}
                    disabled={analysisLoading || tabLoading.insights}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {analysisLoading ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    ) : (
                      <SparklesIcon className="h-4 w-4 mr-2" />
                    )}
                    Generate New Insights
                  </button>
                </div>

                {tabLoading.insights ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mr-3"></div>
                    <span className="text-gray-600">Loading insights...</span>
                  </div>
                ) : (
                  <>
                    {/* Refresh Button */}
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={async () => {
                          setTabLoading(prev => ({ ...prev, insights: true }));
                          try {
                            const freshInsights = await api.getInsights(15);
                            setInsights(freshInsights || []);
                          } catch (error) {
                            console.error("Error refreshing insights:", error);
                          } finally {
                            setTabLoading(prev => ({ ...prev, insights: false }));
                          }
                        }}
                        disabled={tabLoading.insights}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center text-sm"
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Refresh Insights
                      </button>
                    </div>

                    {insights.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.map((insight, index) => (
                          <InsightCard
                            key={`insight-${insight.id}-${index}`}
                            insight={insight}
                            onLearnMore={handleLearnMore}
                            showDatasetCitation={false}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-12">
                        <ExclamationCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available yet</h3>
                        <p className="text-gray-600 mb-4">
                          Generate AI insights to understand your carbon footprint patterns and get personalized recommendations.
                        </p>
                        <button
                          onClick={handleAnalyzeFootprint}
                          disabled={analysisLoading}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto"
                        >
                          {analysisLoading ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          ) : (
                            <SparklesIcon className="h-4 w-4 mr-2" />
                          )}
                          Generate AI Insights
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "datasets" && (
              <EnhancedDatasetAnalysis loading={tabLoading.datasets} />
            )}

            {activeTab === "recommendations" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <SparklesIcon className="h-6 w-6 mr-2 text-blue-600" />
                  Personalized Recommendations
                  {tabLoading.recommendations && (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 ml-2"></span>
                  )}
                </h2>
                {tabLoading.recommendations ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                    <span className="text-gray-600">Loading recommendations...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.length > 0 ? (
                      recommendations.map((recommendation) => (
                        <RecommendationCard
                          key={recommendation.id}
                          recommendation={recommendation}
                        />
                      ))
                    ) : (
                      <div className="col-span-3 text-center text-gray-500 py-8">
                        <SparklesIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No recommendations available yet.</p>
                        <button
                          onClick={handleAnalyzeFootprint}
                          disabled={analysisLoading}
                          className="mt-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          Generate Recommendations
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
