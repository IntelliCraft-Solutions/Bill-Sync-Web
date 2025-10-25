'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Download, FileText, Package, Receipt } from 'lucide-react'
import { generateInventoryPDF, generateSalesReportPDF } from '@/lib/pdf-generator'
import { generateInventoryCSV, generateSalesCSV, downloadCSV } from '@/lib/csv-generator'

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const handleInventoryPDF = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory')
      const products = await response.json()
      
      const doc = generateInventoryPDF(products, 'Your Business Name')
      doc.save(`inventory-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleInventoryCSV = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory')
      const products = await response.json()
      
      const csv = generateInventoryCSV(products)
      downloadCSV(csv, `inventory-${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error('Failed to generate CSV:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleSalesPDF = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      )
      const data = await response.json()
      
      const doc = generateSalesReportPDF(data, 'Your Business Name', dateRange.startDate, dateRange.endDate)
      doc.save(`sales-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleSalesCSV = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing')
      const bills = await response.json()
      
      const csv = generateSalesCSV(bills)
      downloadCSV(csv, `sales-${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error('Failed to generate CSV:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Export</h1>

        {/* Date Range Selector for Sales Reports */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Range for Sales Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inventory Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center gap-3 text-white">
                <Package className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-semibold">Inventory Report</h3>
                  <p className="text-blue-100 text-sm mt-1">Complete product inventory</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-600 text-sm">
                Export current inventory with stock levels, prices, and low stock alerts.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleInventoryPDF}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={handleInventoryCSV}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Sales Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-green-500 to-green-600">
              <div className="flex items-center gap-3 text-white">
                <Receipt className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-semibold">Sales Report</h3>
                  <p className="text-green-100 text-sm mt-1">Revenue and transaction data</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-600 text-sm">
                Export sales data with revenue, bills, and customer information for the selected date range.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleSalesPDF}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={handleSalesCSV}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📊 Report Information</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>PDF Reports:</strong> Formatted documents ready for printing or sharing</li>
            <li>• <strong>CSV Reports:</strong> Spreadsheet-compatible data for further analysis</li>
            <li>• <strong>Inventory Report:</strong> Current stock levels and product details</li>
            <li>• <strong>Sales Report:</strong> Transaction history for the selected date range</li>
          </ul>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="text-gray-900 font-medium">Generating report...</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
