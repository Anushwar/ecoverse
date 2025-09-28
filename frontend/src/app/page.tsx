"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, AnalysisResponse, DatasetInsight } from "../services/api";
import Dashboard from "../components/Dashboard";
import ActivityForm from "../components/ActivityForm";
import RecommendationCard from "../components/RecommendationCard";
import InsightCard from "../components/InsightCard";
import {
  ChartBarIcon,
  PlusIcon,
  LightBulbIcon,
  SparklesIcon,
  BeakerIcon,
  CircleStackIcon,
  ExclamationCircleIcon,
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

    // Refresh dashboard
    try {
      const newDashboard = await api.getDashboardData();
      setDashboardData(newDashboard);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
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

      // Update insights and recommendations with new data
      if (analysis.insights) {
        setInsights((prev) => [...analysis.insights, ...prev].slice(0, 20));
      }
      if (analysis.recommendations) {
        setRecommendations((prev) =>
          [...analysis.recommendations, ...prev].slice(0, 15)
        );
      }
    } catch (error) {
      console.error("Error analyzing footprint:", error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleLearnMore = async (insight: any) => {
    // Open detailed analysis for the insight
    if (insight.type === "dataset") {
      // For dataset insights, show source information
      alert(
        `This insight is based on real-world data from: ${insight.source}\\n\\nWould you like to run a detailed analysis?`
      );
    } else {
      // For AI insights, trigger a new analysis
      setAnalysisQuestion(`Tell me more about: ${insight.title}`);
      await handleAnalyzeFootprint();
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
              onClick={() => setActiveTab(tab.id)}
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
              <div>
                {dashboardData && activities && (
                  <Dashboard data={dashboardData} activities={activities} />
                )}

                {/* Quick Analysis Section */}
                <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BeakerIcon className="h-5 w-5 mr-2 text-blue-600" />
                    AI Analysis with Gemini
                  </h3>

                  <div className="flex space-x-4 mb-4">
                    <input
                      type="text"
                      placeholder="Ask about your carbon footprint..."
                      value={analysisQuestion}
                      onChange={(e) => setAnalysisQuestion(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleAnalyzeFootprint()
                      }
                    />
                    <button
                      onClick={handleAnalyzeFootprint}
                      disabled={analysisLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {analysisLoading ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      ) : (
                        <>
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          Analyze
                        </>
                      )}
                    </button>
                  </div>

                  {analysisResponse?.gemini_insight && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        AI Analysis Result:
                      </h4>
                      <p className="text-blue-800 mb-2">
                        {analysisResponse.gemini_insight.summary}
                      </p>
                      {analysisResponse.gemini_insight.recommendations && (
                        <ul className="text-sm text-blue-700 list-disc list-inside">
                          {analysisResponse.gemini_insight.recommendations
                            .slice(0, 3)
                            .map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "activities" && (
              <ActivityForm onActivityAdded={handleActivityAdded} />
            )}

            {activeTab === "insights" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  AI-Generated Insights
                </h2>

                {/* Personal Insights */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    Personal Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.length > 0 ? (
                      insights.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onLearnMore={handleLearnMore}
                        />
                      ))
                    ) : (
                      <div className="col-span-2 text-center text-gray-500 py-8">
                        <ExclamationCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No personal insights available yet.</p>
                        <button
                          onClick={handleAnalyzeFootprint}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Generate AI Analysis
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dataset Insights */}
                {analysisResponse?.dataset_insights &&
                  analysisResponse.dataset_insights.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                        <CircleStackIcon className="h-5 w-5 mr-2 text-purple-600" />
                        Dataset-Based Insights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysisResponse.dataset_insights.map(
                          (insight, idx) => (
                            <InsightCard
                              key={idx}
                              insight={{
                                id: `dataset-${idx}`,
                                title: insight.title,
                                message: insight.description,
                                severity: "info",
                                type: insight.type,
                                confidence: insight.confidence,
                                data: insight.data,
                                source: insight.source,
                              }}
                              onLearnMore={handleLearnMore}
                              showDatasetCitation={true}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {activeTab === "datasets" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <CircleStackIcon className="h-6 w-6 mr-2 text-purple-600" />
                  Real Dataset Analysis
                </h2>

                {datasetSummary && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Dataset Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900">
                          Datasets Loaded
                        </h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {Object.keys(datasetSummary.datasets || {}).length}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900">
                          Total Insights
                        </h4>
                        <p className="text-2xl font-bold text-green-600">
                          {datasetSummary.total_insights || 0}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900">
                          Categories
                        </h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {datasetSummary.insight_categories?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Dataset Citations */}
                    {datasetSummary.citations && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Data Sources:
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(datasetSummary.citations).map(
                            ([key, citation]: [string, any]) => (
                              <div
                                key={key}
                                className="text-sm bg-gray-50 p-3 rounded"
                              >
                                <p className="font-medium capitalize">
                                  {key.replace(/_/g, " ")}:
                                </p>
                                <a
                                  href={citation}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 break-all"
                                >
                                  {citation}
                                </a>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Global Dataset Insights */}
                {Object.entries(datasetInsights).map(([category, insights]) => (
                  <div
                    key={category}
                    className="bg-white rounded-lg shadow-lg p-6"
                  >
                    <h3 className="text-lg font-semibold mb-4 capitalize text-purple-900">
                      {category.replace(/_/g, " ")} Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.slice(0, 4).map((insight, idx) => (
                        <InsightCard
                          key={`${category}-${idx}`}
                          insight={{
                            id: `${category}-${idx}`,
                            title: insight.title,
                            message: insight.description,
                            severity: "info",
                            type: insight.type,
                            confidence: insight.confidence,
                            data: insight.data,
                            source: insight.source,
                          }}
                          showDatasetCitation={true}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "recommendations" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Personalized Recommendations
                </h2>
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
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        Generate Recommendations
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
