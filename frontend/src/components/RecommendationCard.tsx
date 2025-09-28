import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  CheckCircleIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  HandThumbUpIcon,
  ClockIcon as PendingIcon,
} from '@heroicons/react/24/outline'

interface RecommendationCardProps {
  recommendation: {
    id: string
    title: string
    description: string
    impact: {
      carbon_reduction: number
      cost: number
      difficulty: string
    }
  }
  onAction?: (recommendationId: string, action: 'accept' | 'later' | 'reject') => void
}

const RecommendationCard = ({ recommendation, onAction }: RecommendationCardProps) => {
  const [actionTaken, setActionTaken] = useState<'accept' | 'later' | 'reject' | null>(null)
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCost = (cost: number) => {
    if (cost < 0) {
      return `Saves $${Math.abs(cost)}`
    }
    return `$${cost}`
  }

  const handleAction = (action: 'accept' | 'later' | 'reject') => {
    setActionTaken(action)
    onAction?.(recommendation.id, action)
  }

  const getActionStatus = () => {
    switch (actionTaken) {
      case 'accept':
        return {
          text: 'Accepted',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: HandThumbUpIcon
        }
      case 'later':
        return {
          text: 'Saved for Later',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: PendingIcon
        }
      case 'reject':
        return {
          text: 'Dismissed',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: XMarkIcon
        }
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="card border-l-4 border-l-primary-500"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {recommendation.title}
        </h3>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
            recommendation.impact.difficulty
          )}`}
        >
          {recommendation.impact.difficulty}
        </span>
      </div>

      <p className="text-gray-600 mb-4">{recommendation.description}</p>

      {/* Impact Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-green-100 rounded">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-green-600 font-medium">CO₂ Reduction</p>
              <p className="text-lg font-bold text-green-700 truncate">
                {recommendation.impact.carbon_reduction} kg
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-blue-100 rounded">
              <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-blue-600 font-medium">Cost Impact</p>
              <p className="text-lg font-bold text-blue-700 truncate">
                {formatCost(recommendation.impact.cost)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons or Status */}
      {actionTaken ? (
        <div className={`p-3 rounded-lg border flex items-center ${getActionStatus()?.color}`}>
          {getActionStatus()?.icon && (() => {
            const IconComponent = getActionStatus()!.icon;
            return <IconComponent className="h-5 w-5 mr-2" />;
          })()}
          <span className="font-medium">{getActionStatus()?.text}</span>
        </div>
      ) : (
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction('accept')}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            Accept
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction('later')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            Maybe Later
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction('reject')}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

export default RecommendationCard