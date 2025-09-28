import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BeakerIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface GeminiInsight {
  summary: string;
  recommendations?: string[];
  insights?: string;
  source?: string;
}

interface EnhancedAIAnalysisProps {
  analysisQuestion: string;
  setAnalysisQuestion: (question: string) => void;
  onAnalyze: () => void;
  analysisLoading: boolean;
  geminiInsight: GeminiInsight | null;
}

const EnhancedAIAnalysis = ({
  analysisQuestion,
  setAnalysisQuestion,
  onAnalyze,
  analysisLoading,
  geminiInsight,
}: EnhancedAIAnalysisProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('summary');

  // Clean markdown formatting from text
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
      .replace(/`(.*?)`/g, '$1') // Remove `code`
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove [links](url)
      .replace(/^[-*+]\s+/gm, '• ') // Convert - to bullet points
      .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
      .trim();
  };

  // Parse structured content from Gemini response
  const parseStructuredContent = (text: string) => {
    const sections = {
      impact_assessment: '',
      recommendations: [] as string[],
      benchmarking: '',
      roadmap: '',
      raw_content: cleanMarkdown(text),
    };

    // Try to extract structured sections
    const impactMatch = text.match(/### 1\. IMPACT ASSESSMENT([\s\S]*?)### 2\./);
    if (impactMatch) sections.impact_assessment = cleanMarkdown(impactMatch[1].trim());

    const recommendationsMatch = text.match(/### 2\. ACTIONABLE RECOMMENDATIONS([\s\S]*?)### 3\./);
    if (recommendationsMatch) {
      const recText = recommendationsMatch[1];
      // Extract bullet points or numbered items
      const bullets = recText.match(/- \*\*(.*?)\*\*: (.*?)(?=\n- \*\*|$)/gs);
      if (bullets) {
        sections.recommendations = bullets.map(bullet => cleanMarkdown(bullet.replace(/- \*\*(.*?)\*\*: /, '$1: ')));
      }
    }

    const benchmarkingMatch = text.match(/### 3\. BENCHMARKING & TRENDS([\s\S]*?)### 4\./);
    if (benchmarkingMatch) sections.benchmarking = cleanMarkdown(benchmarkingMatch[1].trim());

    const roadmapMatch = text.match(/### 4\. IMPLEMENTATION ROADMAP([\s\S]*?)$/);
    if (roadmapMatch) sections.roadmap = cleanMarkdown(roadmapMatch[1].trim());

    return sections;
  };

  const structuredContent = geminiInsight ? parseStructuredContent(geminiInsight.summary || geminiInsight.insights || '') : null;

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'high':
        return ExclamationTriangleIcon;
      case 'medium':
        return InformationCircleIcon;
      case 'low':
        return CheckCircleIcon;
      default:
        return LightBulbIcon;
    }
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b">
        <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
          <BeakerIcon className="h-6 w-6 mr-2 text-blue-600" />
          AI Analysis with Gemini 2.5 Flash
          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            Enhanced
          </span>
        </h3>

        {/* Input Section */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Ask about your carbon footprint patterns, reduction strategies, or specific insights..."
              value={analysisQuestion}
              onChange={(e) => setAnalysisQuestion(e.target.value)}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === "Enter" && onAnalyze()}
            />
            <SparklesIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={onAnalyze}
            disabled={analysisLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center transition-all"
          >
            {analysisLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <BeakerIcon className="h-5 w-5 mr-2" />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {analysisLoading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating comprehensive AI analysis...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments for detailed insights</p>
        </div>
      )}

      {/* Analysis Results */}
      {geminiInsight && !analysisLoading && (
        <div className="p-6">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Quick Summary */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <LightBulbIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Summary
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {geminiInsight.summary?.split('\n')[0] || 'Analysis completed successfully.'}
                </p>
              </div>

              {/* Structured Content Tabs */}
              {structuredContent && (
                <div className="border rounded-lg">
                  {/* Tab Headers */}
                  <div className="flex border-b bg-gray-50 rounded-t-lg">
                    {[
                      { id: 'summary', name: 'Overview', icon: ChartBarIcon },
                      { id: 'impact', name: 'Impact Assessment', icon: ArrowTrendingUpIcon },
                      { id: 'recommendations', name: 'Recommendations', icon: CheckCircleIcon },
                      { id: 'roadmap', name: 'Implementation', icon: CalendarIcon },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center transition-colors ${
                          activeSection === tab.id
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <tab.icon className="h-4 w-4 mr-2" />
                        {tab.name}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-4 min-h-[200px]">
                    {activeSection === 'summary' && (
                      <div className="prose prose-sm max-w-none">
                        <div className="text-gray-700 leading-relaxed space-y-4">
                          {(geminiInsight.summary || geminiInsight.insights || 'No summary available.')
                            .split('\n')
                            .filter(line => line.trim())
                            .map((line, idx) => {
                              // Remove markdown formatting
                              const cleanLine = line
                                .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
                                .replace(/\*(.*?)\*/g, '$1')    // Remove *italic*
                                .replace(/^#{1,6}\s+/, '')      // Remove headers
                                .trim();

                              if (!cleanLine) return null;

                              // Detect if it's a header (originally had ** or #)
                              const isHeader = line.includes('**') || line.startsWith('#');

                              return isHeader ? (
                                <h4 key={idx} className="font-semibold text-gray-900 mt-4 mb-2">
                                  {cleanLine}
                                </h4>
                              ) : (
                                <p key={idx} className="text-gray-700">
                                  {cleanLine}
                                </p>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {activeSection === 'impact' && (
                      <div className="prose prose-sm max-w-none">
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h5 className="font-semibold text-yellow-900 mb-2">Impact Assessment</h5>
                          <p className="text-yellow-800 leading-relaxed whitespace-pre-line">
                            {structuredContent?.impact_assessment || 'Analyzing your carbon footprint impact based on the provided data. This section will show environmental impact calculations and comparisons with benchmarks.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeSection === 'recommendations' && (
                      <div className="space-y-3">
                        {structuredContent?.recommendations?.length > 0 ? (
                          structuredContent.recommendations.map((rec, idx) => (
                            <div key={idx} className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <div className="flex items-start">
                                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                                <p className="text-green-800 leading-relaxed">{rec}</p>
                              </div>
                            </div>
                          ))
                        ) : geminiInsight?.recommendations ? (
                          geminiInsight.recommendations.map((rec, idx) => (
                            <div key={idx} className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <div className="flex items-start">
                                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                                <p className="text-green-800 leading-relaxed">{rec}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-start">
                              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                              <div className="text-green-800 leading-relaxed">
                                <p className="font-medium mb-2">AI-Generated Recommendations:</p>
                                <ul className="space-y-1 text-sm">
                                  <li>• Monitor and reduce high-emission activities</li>
                                  <li>• Consider eco-friendly alternatives for transportation</li>
                                  <li>• Implement energy-saving practices at home</li>
                                  <li>• Track progress regularly to maintain improvements</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeSection === 'roadmap' && (
                      <div className="prose prose-sm max-w-none">
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h5 className="font-semibold text-purple-900 mb-2">Implementation Roadmap</h5>
                          <div className="text-purple-800 leading-relaxed">
                            {structuredContent?.roadmap ? (
                              <p className="whitespace-pre-line">{structuredContent.roadmap}</p>
                            ) : (
                              <div className="space-y-2">
                                <p className="font-medium">Suggested Implementation Timeline:</p>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Week 1-2:</strong> Baseline measurement and activity tracking setup</p>
                                  <p><strong>Week 3-4:</strong> Implement quick wins and low-hanging fruit improvements</p>
                                  <p><strong>Month 2:</strong> Begin medium-term changes and habit formation</p>
                                  <p><strong>Month 3+:</strong> Long-term sustainability practices and regular monitoring</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Expand Full Analysis */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUpIcon className="h-4 w-4 mr-1" />
                      Hide Full Analysis
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="h-4 w-4 mr-1" />
                      View Full Analysis
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 bg-gray-50 rounded-lg overflow-hidden"
                    >
                      <h5 className="font-semibold text-gray-900 mb-2">Complete Analysis</h5>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                          {cleanMarkdown(geminiInsight.summary || geminiInsight.insights || 'No detailed analysis available.')}
                        </p>
                      </div>

                      {geminiInsight.source && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Analysis by: {geminiInsight.source}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!geminiInsight && !analysisLoading && (
        <div className="p-8 text-center">
          <BeakerIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">AI Analysis Ready</h4>
          <p className="text-gray-600 mb-4">
            Ask questions about your carbon footprint to get personalized insights and recommendations from Gemini AI.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "How can I reduce my transportation emissions?",
              "What are my biggest carbon impact areas?",
              "Give me a 30-day reduction plan",
              "Compare my footprint to global averages",
            ].map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setAnalysisQuestion(suggestion)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAIAnalysis;