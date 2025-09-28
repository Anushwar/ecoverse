import { useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { useForm } from 'react-hook-form'
import {
  TruckIcon,
  HomeIcon,
  FaceSmileIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

interface FormData {
  category: string
  type: string
  amount: number
  unit: string
}

interface ActivityFormProps {
  onActivityAdded: (activity: any) => void
}

const EnhancedActivityForm = ({ onActivityAdded }: ActivityFormProps) => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>()

  const watchAmount = watch('amount')

  const categories = [
    {
      id: 'transportation',
      name: 'Transportation',
      icon: TruckIcon,
      color: 'bg-red-500',
      description: 'Track your daily commute and travel emissions',
      types: [
        {
          id: 'car_gasoline',
          name: 'Car (Gasoline)',
          unit: 'miles',
          description: 'Distance traveled by gasoline car',
          examples: 'Daily commute: 10-50 miles, Road trip: 100+ miles',
          factor: 0.411
        },
        {
          id: 'car_electric',
          name: 'Car (Electric)',
          unit: 'miles',
          description: 'Distance traveled by electric vehicle',
          examples: 'Daily commute: 10-50 miles, Long trip: 200+ miles',
          factor: 0.180
        },
        {
          id: 'bus',
          name: 'Public Bus',
          unit: 'miles',
          description: 'Distance traveled by public bus',
          examples: 'City bus: 5-20 miles, Long-distance: 50+ miles',
          factor: 0.089
        },
        {
          id: 'train',
          name: 'Train/Subway',
          unit: 'miles',
          description: 'Distance traveled by rail transport',
          examples: 'Metro: 5-15 miles, Intercity: 100+ miles',
          factor: 0.045
        },
        {
          id: 'airplane_domestic',
          name: 'Flight (Domestic)',
          unit: 'miles',
          description: 'Air travel distance within country',
          examples: 'Short flight: 200-500 miles, Cross-country: 2000+ miles',
          factor: 0.537
        },
        {
          id: 'bicycle',
          name: 'Bicycle',
          unit: 'miles',
          description: 'Zero-emission cycling distance',
          examples: 'Daily ride: 2-10 miles, Long ride: 20+ miles',
          factor: 0.000
        },
      ]
    },
    {
      id: 'energy',
      name: 'Energy',
      icon: HomeIcon,
      color: 'bg-yellow-500',
      description: 'Monitor your household energy consumption',
      types: [
        {
          id: 'electricity',
          name: 'Electricity',
          unit: 'kWh',
          description: 'Kilowatt-hours of electricity consumed',
          examples: 'Daily usage: 10-30 kWh, Monthly: 300-900 kWh',
          factor: 0.920
        },
        {
          id: 'natural_gas',
          name: 'Natural Gas',
          unit: 'therms',
          description: 'Therms of natural gas used for heating',
          examples: 'Daily heating: 1-5 therms, Monthly: 30-150 therms',
          factor: 11.7
        },
        {
          id: 'heating_oil',
          name: 'Heating Oil',
          unit: 'gallons',
          description: 'Gallons of heating oil consumed',
          examples: 'Weekly: 5-15 gallons, Monthly: 20-60 gallons',
          factor: 22.4
        },
      ]
    },
    {
      id: 'food',
      name: 'Food',
      icon: FaceSmileIcon,
      color: 'bg-green-500',
      description: 'Log your dietary choices and their impact',
      types: [
        {
          id: 'beef',
          name: 'Beef',
          unit: 'lbs',
          description: 'Pounds of beef consumed',
          examples: 'Burger: 0.25 lbs, Steak: 0.5-1 lbs',
          factor: 60.0
        },
        {
          id: 'chicken',
          name: 'Chicken',
          unit: 'lbs',
          description: 'Pounds of chicken consumed',
          examples: 'Breast: 0.5 lbs, Whole meal: 0.75 lbs',
          factor: 6.9
        },
        {
          id: 'fish',
          name: 'Fish/Seafood',
          unit: 'lbs',
          description: 'Pounds of fish or seafood consumed',
          examples: 'Fillet: 0.3-0.5 lbs, Whole fish: 1+ lbs',
          factor: 5.1
        },
        {
          id: 'dairy_milk',
          name: 'Dairy Milk',
          unit: 'liters',
          description: 'Liters of dairy milk consumed',
          examples: 'Glass: 0.25 liters, Daily intake: 0.5-1 liters',
          factor: 3.2
        },
        {
          id: 'vegetables',
          name: 'Vegetables',
          unit: 'lbs',
          description: 'Pounds of vegetables consumed',
          examples: 'Side dish: 0.2 lbs, Salad: 0.5 lbs',
          factor: 0.4
        },
      ]
    },
    {
      id: 'waste',
      name: 'Waste',
      icon: TrashIcon,
      color: 'bg-gray-500',
      description: 'Track your waste generation and disposal',
      types: [
        {
          id: 'landfill',
          name: 'Landfill Waste',
          unit: 'lbs',
          description: 'Pounds of waste sent to landfill',
          examples: 'Daily trash: 2-5 lbs, Weekly: 10-30 lbs',
          factor: 0.57
        },
        {
          id: 'recycling',
          name: 'Recycling',
          unit: 'lbs',
          description: 'Pounds of recyclable materials',
          examples: 'Weekly recycling: 5-15 lbs',
          factor: 0.0
        },
        {
          id: 'composting',
          name: 'Composting',
          unit: 'lbs',
          description: 'Pounds of organic waste composted',
          examples: 'Food scraps: 1-3 lbs/day, Yard waste: 5-10 lbs',
          factor: 0.1
        },
      ]
    }
  ]

  const selectedCategoryData = categories.find(c => c.id === selectedCategory)
  const selectedTypeData = selectedCategoryData?.types.find(t => t.id === selectedType)

  // Calculate estimated emissions
  const estimatedEmission = selectedTypeData && watchAmount
    ? (selectedTypeData.factor * watchAmount).toFixed(2)
    : '0.00'

  const onSubmit = async (data: FormData) => {
    if (!selectedTypeData) return

    setLoading(true)
    try {
      const result = await api.addActivity({
        category: data.category,
        type: data.type,
        amount: data.amount,
        unit: selectedTypeData.unit,
        date: new Date().toISOString(),
        location: 'US'
      })

      onActivityAdded(result)
      reset()
      setSelectedCategory('')
      setSelectedType('')
      setSuccess(true)

      // Reset success state after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error adding activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSelectedType('')
    setValue('category', categoryId)
    setValue('type', '')
    setValue('amount', 0)
  }

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    setValue('type', typeId)
    const typeData = selectedCategoryData?.types.find(t => t.id === typeId)
    if (typeData) {
      setValue('unit', typeData.unit)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg p-8 text-center"
      >
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Activity Added Successfully!</h3>
        <p className="text-gray-600 mb-4">Your carbon footprint has been updated with the new activity.</p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Add Another Activity
        </button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Carbon Activity</h2>
          <p className="text-gray-600">Track your daily activities to calculate your carbon footprint with real-time impact estimates.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Activity Category
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <category.icon className={`h-8 w-8 mb-2 ${
                    selectedCategory === category.id ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Type Selection */}
          {selectedCategoryData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <label className="block text-sm font-medium text-gray-700">
                Select Specific Activity Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCategoryData.types.map((type) => (
                  <motion.button
                    key={type.id}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Unit: {type.unit}</p>
                    <p className="text-xs text-blue-600 mt-1">{type.examples}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Amount Input */}
          {selectedTypeData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ({selectedTypeData.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('amount', {
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be greater than 0' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter ${selectedTypeData.unit}`}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedTypeData.examples}
                  </p>
                </div>

                {/* Real-time Impact Preview */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Estimated Carbon Impact
                  </label>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-gray-900">
                        {estimatedEmission}
                      </span>
                      <span className="text-sm text-gray-600">kg CO₂e</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      This estimate updates as you type
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          {selectedTypeData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4"
            >
              <button
                type="submit"
                disabled={loading || !watchAmount}
                className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding Activity...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Add Activity & Calculate Impact
                  </>
                )}
              </button>
            </motion.div>
          )}
        </form>

        {/* Information Section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">How we calculate emissions</h4>
              <p className="text-sm text-blue-800 mt-1">
                Our calculations use verified emission factors from EPA, IPCC, and other environmental agencies.
                Each activity type has specific factors to ensure accurate carbon footprint tracking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedActivityForm