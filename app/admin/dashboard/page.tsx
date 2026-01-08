'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { TrendingUp, DollarSign, FileText, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

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

interface Bill {
  id: string
  billNumber: number
  customerName: string
  totalAmount: number
  createdAt: string
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [billsLoading, setBillsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const billsPerPage = 5

  useEffect(() => {
    fetchAnalytics()
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/billing')
      if (response.ok) {
        const data = await response.json()
        // Bills are already sorted by createdAt desc from API
        setBills(data)
      }
    } catch (error) {
      console.error('Failed to fetch bills:', error)
    } finally {
      setBillsLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/overview')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const data = await response.json()
      
      // Ensure data has the expected structure
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Set analytics with default values if any are missing
      setAnalytics({
        daily: data.daily || { revenue: 0, billCount: 0 },
        monthly: data.monthly || { revenue: 0, billCount: 0 },
        yearly: data.yearly || { revenue: 0, billCount: 0 },
        lowStockProducts: data.lowStockProducts || [],
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      // Set default values on error
      setAnalytics({
        daily: { revenue: 0, billCount: 0 },
        monthly: { revenue: 0, billCount: 0 },
        yearly: { revenue: 0, billCount: 0 },
        lowStockProducts: [],
      })
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{analytics?.daily?.revenue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics?.daily?.billCount || 0} bills
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
                  ₹{analytics?.monthly?.revenue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics?.monthly?.billCount || 0} bills
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
                  ₹{analytics?.yearly?.revenue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics?.yearly?.billCount || 0} bills
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

        {/* Recent Bills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
          </div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {billsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No bills yet.
                    </td>
                  </tr>
                ) : (
                  bills
                    .slice((currentPage - 1) * billsPerPage, currentPage * billsPerPage)
                    .map((bill) => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          #{bill.billNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {bill.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ₹{bill.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {new Date(bill.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {billsLoading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : bills.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No bills yet.</div>
            ) : (
              bills
                .slice((currentPage - 1) * billsPerPage, currentPage * billsPerPage)
                .map((bill) => (
                  <div key={bill.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">#{bill.billNumber}</p>
                        <p className="text-sm text-gray-600">{bill.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{bill.totalAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(bill.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
          {/* Pagination */}
          {bills.length > billsPerPage && (
            <div className="p-4 sm:p-6 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * billsPerPage + 1} to {Math.min(currentPage * billsPerPage, bills.length)} of {bills.length} bills
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700 px-3">
                  Page {currentPage} of {Math.ceil(bills.length / billsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(bills.length / billsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(bills.length / billsPerPage)}
                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

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
