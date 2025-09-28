import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'

interface InsightCardProps {
  insight: {
    id: string
    title: string
    message: string
    severity: string
    data?: Record<string, any>
    type?: string
    source?: string
    confidence?: number
  }
  onLearnMore?: (insight: any) => void
}

const InsightCard = ({ insight, onLearnMore }: InsightCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          bgColor: 'bg-green-50',
          borderColor: 'border-l-green-500',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
        }
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-l-yellow-500',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-900',
        }
      case 'error':
        return {
          icon: XCircleIcon,
          bgColor: 'bg-red-50',
          borderColor: 'border-l-red-500',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
        }
      case 'info':
      default:
        return {
          icon: InformationCircleIcon,
          bgColor: 'bg-blue-50',
          borderColor: 'border-l-blue-500',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
        }
    }
  }

  const config = getSeverityConfig(insight.severity)
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`${config.bgColor} ${config.borderColor} border-l-4 rounded-lg p-6 shadow-sm`}
    >
      <div className="flex items-start space-x-3">
        <div className={`${config.iconColor} flex-shrink-0`}>
          <IconComponent className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${config.titleColor} mb-2`}>
            {insight.title}
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {insight.message}
          </p>
        </div>
      </div>

      {/* Action area (could be expanded for specific insight types) */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            {insight.severity} Insight
          </span>
          <button className="text-sm text-gray-600 hover:text-gray-800 font-medium">
            Learn More →
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default InsightCard