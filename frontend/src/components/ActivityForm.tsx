import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  TruckIcon,
  HomeIcon,
  FaceSmileIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface ActivityFormProps {
  onActivityAdded: (activity: any) => void
}

interface FormData {
  category: string
  type: string
  amount: number
  unit: string
  location?: string
}

const ActivityForm = ({ onActivityAdded }: ActivityFormProps) => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const categories = [
    {
      id: 'transportation',
      name: 'Transportation',
      icon: TruckIcon,
      color: 'bg-red-500',
      types: [
        { id: 'car_gasoline', name: 'Car (Gasoline)', unit: 'miles' },
        { id: 'car_electric', name: 'Car (Electric)', unit: 'miles' },
        { id: 'bus', name: 'Bus', unit: 'miles' },
        { id: 'train', name: 'Train', unit: 'miles' },
        { id: 'flight_domestic', name: 'Flight (Domestic)', unit: 'miles' },
      ]
    },
    {
      id: 'energy',
      name: 'Energy',
      icon: HomeIcon,
      color: 'bg-yellow-500',
      types: [
        { id: 'electricity', name: 'Electricity', unit: 'kwh' },
        { id: 'natural_gas', name: 'Natural Gas', unit: 'therms' },
        { id: 'heating_oil', name: 'Heating Oil', unit: 'gallons' },
      ]
    },
    {
      id: 'food',
      name: 'Food',
      icon: FaceSmileIcon,
      color: 'bg-green-500',
      types: [
        { id: 'beef', name: 'Beef', unit: 'lbs' },
        { id: 'chicken', name: 'Chicken', unit: 'lbs' },
        { id: 'fish', name: 'Fish', unit: 'lbs' },
        { id: 'vegetables', name: 'Vegetables', unit: 'lbs' },
        { id: 'dairy', name: 'Dairy', unit: 'lbs' },
      ]
    },
    {
      id: 'waste',
      name: 'Waste',
      icon: TrashIcon,
      color: 'bg-gray-500',
      types: [
        { id: 'landfill', name: 'Landfill', unit: 'lbs' },
        { id: 'recycling', name: 'Recycling', unit: 'lbs' },
        { id: 'composting', name: 'Composting', unit: 'lbs' },
      ]
    }
  ]

  const selectedCategoryData = categories.find(c => c.id === selectedCategory)

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // Mock calculation for demo
      const mockEmission = calculateMockEmission(data)

      const newActivity = {
        id: Date.now().toString(),
        ...data,
        carbon_emission: mockEmission,
        date: new Date().toISOString(),
        source: 'manual'
      }

      onActivityAdded(newActivity)
      reset()
      setSelectedCategory('')

      // Show success message (you can use toast here)
      console.log('Activity added successfully!')
    } catch (error) {
      console.error('Error adding activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMockEmission = (data: FormData): number => {
    // Mock emission factors for demo
    const factors: { [key: string]: { [key: string]: number } } = {
      transportation: {
        car_gasoline: 0.404,
        car_electric: 0.127,
        bus: 0.089,
        train: 0.048,
        flight_domestic: 0.385,
      },
      energy: {
        electricity: 0.92,
        natural_gas: 5.3,
        heating_oil: 10.15,
      },
      food: {
        beef: 26.61,
        chicken: 4.57,
        fish: 5.4,
        vegetables: 0.88,
        dairy: 9.9,
      },
      waste: {
        landfill: 0.57,
        recycling: -1.1,
        composting: -0.34,
      }
    }

    const categoryFactors = factors[data.category] || {}
    const emissionFactor = categoryFactors[data.type] || 1.0
    return Math.round(emissionFactor * data.amount * 100) / 100
  }

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`${category.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <category.icon className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium text-gray-900">{category.name}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Activity Form */}
      {selectedCategory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add {selectedCategoryData?.name} Activity
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input
              type="hidden"
              {...register('category')}
              value={selectedCategory}
            />

            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type
              </label>
              <select
                {...register('type', { required: 'Please select an activity type' })}
                className="input-field"
              >
                <option value="">Select type...</option>
                {selectedCategoryData?.types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  {...register('amount', {
                    required: 'Please enter an amount',
                    min: { value: 0.1, message: 'Amount must be greater than 0' }
                  })}
                  className="input-field"
                  placeholder="0.0"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <input
                  {...register('unit')}
                  className="input-field bg-gray-50"
                  value={selectedCategoryData?.types.find(t => t.id === selectedCategory)?.unit || ''}
                  readOnly
                />
              </div>
            </div>

            {/* Location (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                {...register('location')}
                className="input-field"
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  reset()
                  setSelectedCategory('')
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Calculating...</span>
                  </div>
                ) : (
                  'Add Activity'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  )
}

export default ActivityForm