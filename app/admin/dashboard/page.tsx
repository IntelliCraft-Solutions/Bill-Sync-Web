'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { TrendingUp, DollarSign, FileText, AlertTriangle } from 'lucide-react'

interface AnalyticsData {
  daily: { revenue: number; billCount: number }
  monthly: { revenue: number; billCount: number }
  yearly: { revenue: number; billCount: number }
  lowStockProducts: Array<{
    id: string
    name: string
    quantityInStock: number
    lowStockThreshold: number
  }>
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/overview')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{analytics?.daily.revenue.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics?.daily.billCount || 0} bills
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{analytics?.monthly.revenue.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics?.monthly.billCount || 0} bills
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yearly Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{analytics?.yearly.revenue.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics?.yearly.billCount || 0} bills
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {analytics?.lowStockProducts && analytics.lowStockProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {analytics.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        Stock: {product.quantityInStock} (Threshold: {product.lowStockThreshold})
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-orange-500 text-white text-sm font-medium rounded-full">
                      Low Stock
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin/inventory"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
            >
              <h3 className="font-medium text-gray-900">Manage Inventory</h3>
              <p className="text-sm text-gray-600 mt-1">Add or update products</p>
            </a>
            <a
              href="/admin/employees"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
            >
              <h3 className="font-medium text-gray-900">Manage Employees</h3>
              <p className="text-sm text-gray-600 mt-1">Add cashier accounts</p>
            </a>
            <a
              href="/admin/analytics"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
            >
              <h3 className="font-medium text-gray-900">View Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">Sales trends and reports</p>
            </a>
            <a
              href="/admin/reports"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
            >
              <h3 className="font-medium text-gray-900">Generate Reports</h3>
              <p className="text-sm text-gray-600 mt-1">Export PDF and CSV</p>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
