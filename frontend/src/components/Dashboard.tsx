import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  CalendarIcon,
  FireIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

interface DashboardProps {
  data: {
    total_emissions: number
    daily_average: number
    weekly_trend: string
    top_category: string
    insights_count: number
    recommendations_count: number
  }
  activities: any[]
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

const Dashboard = ({ data, activities }: DashboardProps) => {
  // Mock chart data
  const weeklyData = [
    { day: 'Mon', emissions: 8.2 },
    { day: 'Tue', emissions: 7.8 },
    { day: 'Wed', emissions: 9.1 },
    { day: 'Thu', emissions: 6.5 },
    { day: 'Fri', emissions: 8.8 },
    { day: 'Sat', emissions: 7.2 },
    { day: 'Sun', emissions: 6.9 },
  ]

  const categoryData = [
    { name: 'Transportation', value: 45, color: '#ef4444' },
    { name: 'Energy', value: 30, color: '#f59e0b' },
    { name: 'Food', value: 15, color: '#22c55e' },
    { name: 'Waste', value: 10, color: '#3b82f6' },
  ]

  const monthlyTrend = [
    { month: 'Jan', emissions: 280 },
    { month: 'Feb', emissions: 265 },
    { month: 'Mar', emissions: 255 },
    { month: 'Apr', emissions: 245 },
  ]

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-carbon-100 rounded-lg">
              <FireIcon className="h-6 w-6 text-carbon-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Emissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.total_emissions} <span className="text-sm text-gray-500">kg CO₂e</span>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Daily Average</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.daily_average} <span className="text-sm text-gray-500">kg CO₂e</span>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              data.weekly_trend === 'decreasing' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {data.weekly_trend === 'decreasing' ? (
                <TrendingDownIcon className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingUpIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Weekly Trend</p>
              <p className={`text-2xl font-bold capitalize ${
                data.weekly_trend === 'decreasing' ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.weekly_trend}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Category</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {data.top_category}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Emissions Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Emissions This Week
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} kg CO₂e`, 'Emissions']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar dataKey="emissions" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Emissions by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Monthly Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Emissions Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value) => [`${value} kg CO₂e`, 'Emissions']}
              labelStyle={{ color: '#374151' }}
            />
            <Line
              type="monotone"
              dataKey="emissions"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activities
        </h3>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {activity.category} - {activity.type.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-600">
                  {activity.amount} {activity.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-carbon-600">
                  {activity.carbon_emission.toFixed(1)} kg CO₂e
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard