import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

interface InsightCardProps {
  insight: {
    id: string;
    title: string;
    message: string;
    severity: string;
    data?: Record<string, any>;
    type?: string;
    source?: string;
    confidence?: number;
    created_at?: string;
  };
  onLearnMore?: (insight: any) => void;
  showDatasetCitation?: boolean;
}

const InsightCard = ({
  insight,
  onLearnMore,
  showDatasetCitation = false,
}: InsightCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "success":
        return {
          icon: CheckCircleIcon,
          bgColor: "bg-green-50",
          borderColor: "border-l-green-500",
          iconColor: "text-green-600",
          titleColor: "text-green-900",
          textColor: "text-green-800",
        };
      case "warning":
        return {
          icon: ExclamationTriangleIcon,
          bgColor: "bg-yellow-50",
          borderColor: "border-l-yellow-500",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-900",
          textColor: "text-yellow-800",
        };
      case "error":
        return {
          icon: XCircleIcon,
          bgColor: "bg-red-50",
          borderColor: "border-l-red-500",
          iconColor: "text-red-600",
          titleColor: "text-red-900",
          textColor: "text-red-800",
        };
      case "info":
      default:
        return {
          icon: InformationCircleIcon,
          bgColor: "bg-blue-50",
          borderColor: "border-l-blue-500",
          iconColor: "text-blue-600",
          titleColor: "text-blue-900",
          textColor: "text-blue-800",
        };
    }
  };

  const config = getSeverityConfig(insight.severity);
  const Icon = config.icon;

  const handleLearnMore = () => {
    if (onLearnMore) {
      onLearnMore(insight);
    } else {
      // Default "learn more" behavior - expand details
      setIsExpanded(!isExpanded);
    }
  };

  const formatDataValue = (key: string, value: any): string => {
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return JSON.stringify(value, null, 2);
    }

    if (typeof value === "number") {
      // Format percentages and emissions nicely
      if (
        key.toLowerCase().includes("percentage") ||
        key.toLowerCase().includes("percent")
      ) {
        return `${value.toFixed(1)}%`;
      }
      if (
        key.toLowerCase().includes("emission") ||
        key.toLowerCase().includes("co2")
      ) {
        return `${value.toFixed(2)} kg CO2e`;
      }
      return value.toFixed(2);
    }

    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`${config.bgColor} ${config.borderColor} border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start">
        <Icon className={`${config.iconColor} h-5 w-5 mt-1 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <h4
              className={`${config.titleColor} font-semibold text-sm leading-tight`}
            >
              {insight.title}
              {showDatasetCitation && insight.source && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                  <SparklesIcon className="w-3 h-3 mr-1" />
                  Dataset Insight
                </span>
              )}
            </h4>
            {insight.confidence && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {Math.round(insight.confidence * 100)}% confidence
              </span>
            )}
          </div>

          <div className={`${config.textColor} text-sm mt-2`}>
            <p className="leading-relaxed">{insight.message}</p>

            {/* Dataset citation */}
            {showDatasetCitation && insight.source && (
              <div className="mt-2 p-2 bg-white/50 rounded border text-xs">
                <p className="font-medium text-purple-700">Data Source:</p>
                <p className="text-gray-600">{insight.source}</p>
              </div>
            )}

            {/* Expandable details */}
            <AnimatePresence>
              {isExpanded &&
                insight.data &&
                Object.keys(insight.data).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="mt-4 pt-4 border-t border-gray-200 bg-white/30 rounded-md p-3"
                  >
                    <div className="space-y-2">

                      {/* Display additional data */}
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(insight.data)
                          .filter(
                            ([key]) => key !== "analysis" && key !== "raw_data"
                          )
                          .slice(0, 8) // Show more items
                          .map(([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between items-start py-1 border-b border-gray-100 last:border-b-0"
                            >
                              <span className="font-medium text-xs text-gray-600 capitalize flex-shrink-0 mr-3">
                                {key
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                              <span className="text-xs text-gray-800 text-right break-words">
                                {formatDataValue(key, value)}
                              </span>
                            </div>
                          ))}
                      </div>

                      {/* Additional metadata */}
                      {(insight.type || insight.confidence) && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          {insight.type && (
                            <div className="flex justify-between py-1">
                              <span className="font-medium text-xs text-gray-600">
                                Insight Type:
                              </span>
                              <span className="text-xs text-gray-800 capitalize">
                                {insight.type.replace(/_/g, ' ')}
                              </span>
                            </div>
                          )}
                          {insight.confidence && (
                            <div className="flex justify-between py-1">
                              <span className="font-medium text-xs text-gray-600">
                                Confidence:
                              </span>
                              <span className="text-xs text-gray-800">
                                {Math.round(insight.confidence * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-2">
            <div className="flex items-center gap-2">
              {/* Learn More / Show Details button */}
              {insight.data && Object.keys(insight.data).length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center text-xs text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 rounded-md px-2 py-1 hover:bg-white/50"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUpIcon className="h-4 w-4 mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="h-4 w-4 mr-1" />
                      View Details
                    </>
                  )}
                </button>
              )}

              {/* Timestamp for mobile */}
              {insight.created_at && (
                <span className="text-xs text-gray-500 sm:hidden">
                  {new Date(insight.created_at).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Timestamp for desktop */}
              {insight.created_at && (
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {new Date(insight.created_at).toLocaleDateString()}
                </span>
              )}

              {/* AI Analysis action */}
              {onLearnMore && (
                <button
                  onClick={handleLearnMore}
                  className="flex items-center text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-md px-3 py-1 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                >
                  <SparklesIcon className="w-3 h-3 mr-1" />
                  AI Analysis
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InsightCard;
