'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Receipt, DollarSign, FileText } from 'lucide-react'
import Link from 'next/link'

interface Bill {
  id: string
  billNumber: number
  customerName: string
  totalAmount: number
  createdAt: string
}

export default function CashierDashboard() {
  const [bills, setBills] = useState<Bill[]>([])
  const [stats, setStats] = useState({ todayCount: 0, todayRevenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/billing')
      const data = await response.json()
      setBills(data.slice(0, 10))
      
      const today = new Date().toISOString().split('T')[0]
      const todayBills = data.filter((bill: Bill) => 
        bill.createdAt.startsWith(today)
      )
      
      setStats({
        todayCount: todayBills.length,
        todayRevenue: todayBills.reduce((sum: number, bill: Bill) => sum + bill.totalAmount, 0)
      })
    } catch (error) {
      console.error('Failed to fetch bills:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="CASHIER">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Cashier Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Bills</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{stats.todayRevenue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <Link
          href="/cashier/billing"
          className="block bg-primary-500 text-white rounded-xl p-6 hover:bg-primary-600 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Create New Bill</h3>
              <p className="text-primary-100 mt-1">Start billing for a customer</p>
            </div>
          </div>
        </Link>

        {/* Recent Bills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
          </div>
          <div className="overflow-x-auto">
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
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No bills yet. Create your first bill!
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
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
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
