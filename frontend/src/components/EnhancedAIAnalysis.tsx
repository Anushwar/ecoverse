import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BeakerIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";

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
  const chatSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when analysis starts
  useEffect(() => {
    if (analysisLoading && chatSectionRef.current) {
      chatSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [analysisLoading]);

  // Enhanced markdown cleaning function
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/#{1,6}\s+/g, "") // Remove headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove **bold**
      .replace(/\*(.*?)\*/g, "$1") // Remove *italic*
      .replace(/`(.*?)`/g, "$1") // Remove `code`
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove [links](url)
      .replace(/^[-*+]\s+/gm, "• ") // Convert - to bullet points
      .replace(/^\d+\.\s+/gm, "") // Remove numbered lists
      .replace(/>\s+/gm, "") // Remove blockquotes
      .replace(/~~(.*?)~~/g, "$1") // Remove ~~strikethrough~~
      .replace(/_{2,}(.*?)_{2,}/g, "$1") // Remove __underline__
      .replace(/\s{2,}/g, " ") // Normalize multiple spaces
      .trim();
  };

  // Enhanced recommendation extraction with deduplication
  const extractRecommendations = (text: string): string[] => {
    const lines = text.split("\n");
    const recommendations: string[] = []; // Use array instead of Set
    const seenRecommendations: string[] = []; // Track seen recommendations

    for (const line of lines) {
      const cleaned = line.trim();
      if (
        cleaned &&
        cleaned.length > 20 && // Minimum length check
        (cleaned.startsWith("•") ||
          cleaned.startsWith("-") ||
          cleaned.startsWith("*") ||
          /^\d+\./.test(cleaned) ||
          cleaned.toLowerCase().includes("recommend") ||
          cleaned.toLowerCase().includes("suggest") ||
          cleaned.toLowerCase().includes("consider") ||
          cleaned.toLowerCase().includes("try") ||
          cleaned.toLowerCase().includes("switch"))
      ) {
        const cleanRec = cleanMarkdown(cleaned.replace(/^[•\-*\d\.]\s*/, ""));
        if (
          cleanRec.length > 15 &&
          !cleanRec.toLowerCase().startsWith("analysis")
        ) {
          // Normalize recommendation for duplicate detection
          const normalized = cleanRec
            .toLowerCase()
            .replace(/[.,!?;]/g, "")
            .trim();

          // Check for similar recommendations (simple similarity check)
          const isDuplicate = seenRecommendations.some(
            (existing) =>
              normalized === existing ||
              (normalized.length > 30 &&
                existing.includes(normalized.slice(0, 30))) ||
              (existing.length > 30 &&
                normalized.includes(existing.slice(0, 30)))
          );

          if (!isDuplicate) {
            seenRecommendations.push(normalized);
            recommendations.push(cleanRec);
          }
        }
      }
    }
    return recommendations.slice(0, 5); // Limit to 5 recommendations
  };

  const displayRecommendations =
    geminiInsight?.recommendations ||
    (geminiInsight?.summary
      ? extractRecommendations(geminiInsight.summary)
      : []) ||
    (geminiInsight?.insights
      ? extractRecommendations(geminiInsight.insights)
      : []);

  return (
    <div
      ref={chatSectionRef}
      className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b">
        <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
          <ChatBubbleBottomCenterTextIcon className="h-6 w-6 mr-2 text-blue-600" />
          AI Analysis Chat
          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            Powered by Gemini
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
          <p className="text-gray-600">
            Generating comprehensive AI analysis...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments for detailed insights
          </p>
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
              {/* Main Analysis */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <LightBulbIcon className="h-5 w-5 mr-2 text-blue-600" />
                  AI Analysis & Insights
                </h4>
                <div className="prose prose-sm max-w-none">
                  <div className="text-gray-700 leading-relaxed space-y-4">
                    {(
                      geminiInsight.summary ||
                      geminiInsight.insights ||
                      "Analysis completed successfully."
                    )
                      .split("\n")
                      .filter((line) => line.trim())
                      .map((line, idx) => {
                        const cleanLine = cleanMarkdown(line);

                        if (!cleanLine) return null;

                        // Detect if it's a header (originally had ** or # or ###)
                        const isHeader =
                          line.includes("**") ||
                          line.startsWith("#") ||
                          line.includes("###") ||
                          line.includes("##") ||
                          (cleanLine.length < 50 &&
                            (cleanLine.toLowerCase().includes("analysis") ||
                              cleanLine.toLowerCase().includes("assessment") ||
                              cleanLine
                                .toLowerCase()
                                .includes("recommendation") ||
                              cleanLine.toLowerCase().includes("insight") ||
                              cleanLine.toLowerCase().includes("summary")));

                        return isHeader ? (
                          <h5
                            key={idx}
                            className="font-semibold text-gray-900 mt-4 mb-2 text-sm"
                          >
                            {cleanLine}
                          </h5>
                        ) : (
                          <p
                            key={idx}
                            className="text-gray-700 text-sm leading-relaxed"
                          >
                            {cleanLine}
                          </p>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Recommendations Section */}
              {displayRecommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                    Key Recommendations
                  </h4>
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 leading-relaxed space-y-2">
                      {displayRecommendations.slice(0, 5).map((rec, idx) => (
                        <p
                          key={idx}
                          className="text-gray-700 text-sm leading-relaxed flex items-start"
                        >
                          <span className="text-green-600 mr-2 mt-1 flex-shrink-0">
                            •
                          </span>
                          {cleanMarkdown(rec)}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Source Information */}
              {geminiInsight.source && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-2" />
                    Analysis powered by: {geminiInsight.source}
                  </p>
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
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 bg-gray-50 rounded-lg overflow-hidden"
                    >
                      <h5 className="font-semibold text-gray-900 mb-2">
                        Complete Raw Analysis
                      </h5>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                          {cleanMarkdown(
                            geminiInsight.summary ||
                              geminiInsight.insights ||
                              "No detailed analysis available."
                          )}
                        </p>
                      </div>
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
          <ChatBubbleBottomCenterTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            AI Analysis Ready
          </h4>
          <p className="text-gray-600 mb-4">
            Ask questions about your carbon footprint to get personalized
            insights and recommendations from Gemini AI.
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
