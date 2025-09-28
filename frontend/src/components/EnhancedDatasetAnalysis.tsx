import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import InsightCard from './InsightCard';
import {
  CircleStackIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface DatasetSummary {
  datasets: Record<string, {
    records: number;
    columns: string[];
    size_mb: number;
  }>;
  total_insights: number;
  insight_categories: string[];
  citations: Record<string, string>;
}

interface DatasetInsights {
  [category: string]: Array<{
    title: string;
    description: string;
    data: Record<string, any>;
    confidence: number;
    source: string;
    type: string;
  }>;
}

interface EnhancedDatasetAnalysisProps {
  loading?: boolean;
}

const EnhancedDatasetAnalysis = ({ loading = false }: EnhancedDatasetAnalysisProps) => {
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);
  const [datasetInsights, setDatasetInsights] = useState<DatasetInsights>({});
  const [isLoading, setIsLoading] = useState(loading);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedInsight, setSelectedInsight] = useState<any>(null);

  useEffect(() => {
    loadDatasetData();
  }, []);

  const loadDatasetData = async () => {
    setIsLoading(true);
    try {
      const [summaryResult, insightsResult] = await Promise.all([
        api.getDatasetSummary(),
        api.getDatasetInsights(),
      ]);
      setDatasetSummary(summaryResult);
      setDatasetInsights(insightsResult || {});
    } catch (error) {
      console.error('Error loading dataset data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'carbon_emission':
        return ArrowTrendingUpIcon;
      case 'iot_carbon':
        return ChartBarIcon;
      case 'power_consumption':
        return ArrowTrendingDownIcon;
      default:
        return CircleStackIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'carbon_emission':
        return 'bg-red-500';
      case 'iot_carbon':
        return 'bg-blue-500';
      case 'power_consumption':
        return 'bg-green-500';
      default:
        return 'bg-purple-500';
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'carbon_emission':
        return 'Individual Carbon Footprint';
      case 'iot_carbon':
        return 'IoT Carbon Monitoring';
      case 'power_consumption':
        return 'Household Power Usage';
      default:
        return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getInsightSeverity = (confidence: number, type: string) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'info';
    if (confidence >= 0.5) return 'warning';
    return 'error';
  };

  const filteredInsights = selectedCategory === 'all'
    ? Object.entries(datasetInsights).flatMap(([category, insights]) =>
        insights.map(insight => ({ ...insight, category }))
      )
    : datasetInsights[selectedCategory] || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mr-3"></div>
        <span className="text-gray-600">Loading comprehensive dataset analysis...</span>
      </div>
    );
  }

  if (!datasetSummary) {
    return (
      <div className="text-center text-gray-500 py-12">
        <CircleStackIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No dataset analysis available</h3>
        <p className="text-gray-600 mb-4">
          Dataset analysis will load automatically when datasets are available.
        </p>
        <button
          onClick={loadDatasetData}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <CircleStackIcon className="h-6 w-6 mr-2 text-purple-600" />
          Global Dataset Analysis
          <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
            {datasetSummary.total_insights} insights
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CircleStackIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Datasets Loaded</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.keys(datasetSummary.datasets).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.values(datasetSummary.datasets).reduce((sum, dataset) => sum + dataset.records, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Data Size</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.values(datasetSummary.datasets).reduce((sum, dataset) => sum + dataset.size_mb, 0).toFixed(1)} MB
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">AI Insights</p>
                <p className="text-xl font-bold text-gray-900">
                  {datasetSummary.total_insights}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Filter by Dataset Category</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CircleStackIcon className="h-4 w-4 mr-2" />
            All Categories ({Object.values(datasetInsights).flatMap(insights => insights).length})
          </button>
          {Object.keys(datasetInsights).map((category) => {
            const Icon = getCategoryIcon(category);
            const colorClass = getCategoryColor(category);

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                  selectedCategory === category
                    ? `${colorClass} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {getCategoryDisplayName(category)} ({datasetInsights[category]?.length || 0})
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Dataset Insights Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {filteredInsights.length > 0 ? (
          filteredInsights.map((insight, idx) => (
            <InsightCard
              key={`${selectedCategory}-${idx}`}
              insight={{
                id: `${selectedCategory}-${idx}`,
                title: insight.title,
                message: insight.description,
                severity: getInsightSeverity(insight.confidence, insight.type),
                type: insight.type,
                confidence: insight.confidence,
                data: insight.data,
                source: insight.source,
                created_at: new Date().toISOString(),
              }}
              showDatasetCitation={true}
            />
          ))
        ) : (
          <div className="col-span-2 text-center text-gray-500 py-8">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No insights available for the selected category.</p>
          </div>
        )}
      </motion.div>

      {/* Dataset Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Dataset Details</h3>
        <div className="space-y-4">
          {Object.entries(datasetSummary.datasets).map(([name, details]) => (
            <div key={name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">
                  {getCategoryDisplayName(name)}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {details.records.toLocaleString()} records
                  </span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    {details.size_mb.toFixed(1)} MB
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Columns:</strong> {details.columns.length} attributes
              </p>
              <div className="text-xs text-gray-500">
                Key fields: {details.columns.slice(0, 5).join(', ')}
                {details.columns.length > 5 && ` +${details.columns.length - 5} more`}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Sources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Data Sources & Citations</h3>
        <div className="space-y-3">
          {Object.entries(datasetSummary.citations).map(([key, citation]) => {
            // Extract URL from citation text (format: "Description - URL")
            const urlMatch = citation.match(/(https?:\/\/[^\s]+)/);
            const url = urlMatch ? urlMatch[1] : citation;
            const description = citation.replace(/ - https?:\/\/[^\s]+/, '');

            return (
              <div key={key} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900 capitalize mb-1">
                  {getCategoryDisplayName(key)}
                </h4>
                <p className="text-gray-700 text-sm mb-2">{description}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm break-all inline-flex items-center"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                  View Dataset
                </a>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedDatasetAnalysis;