'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ChevronRight,
  Package,
  FileText,
  Users,
  Database,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  id: string
  status: string
  startDate: string
  endDate: string
  plan: {
    name: string
    displayName: string
    price: number
    features: string[]
    limits: any
  }
}

interface UsageRecord {
  metricType: string
  currentValue: number
  limitValue: number
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const [subRes, usageRes] = await Promise.all([
        fetch('/api/subscriptions'),
        fetch('/api/usage')
      ])
      
      if (subRes.ok) setSubscription(await subRes.json())
      if (usageRes.ok) setUsage(await usageRes.json())
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'PRODUCTS': return Package
      case 'BILLS': return FileText
      case 'CASHIER_ACCOUNTS': return Users
      case 'STORAGE': return Database
      default: return AlertCircle
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription & Usage</h1>
          <p className="text-gray-600 mt-2">Manage your plan and track your resource consumption</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Current Plan</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {subscription?.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{subscription?.plan.displayName}</h2>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">₹{subscription?.plan.price}</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Included Features</h3>
                <ul className="space-y-3">
                  {subscription?.plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full mt-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4 fill-current" />
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Resource Usage</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {['PRODUCTS', 'BILLS', 'CASHIER_ACCOUNTS', 'STORAGE'].map((metric) => {
                  const record = usage.find(r => r.metricType === metric)
                  const current = record?.currentValue || 0
                  const limit = record?.limitValue || subscription?.plan.limits[metric === 'CASHIER_ACCOUNTS' ? 'cashierAccounts' : metric === 'BILLS' ? 'billsPerMonth' : metric.toLowerCase()] || 0
                  const Icon = getMetricIcon(metric)
                  const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100)
                  
                  return (
                    <div key={metric} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Icon className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">{metric.replace('_', ' ')}</span>
                        </div>
                        <span className="text-sm font-bold">
                          {current} / {limit === -1 ? '∞' : limit}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${limit === -1 ? 0 : percentage}%` }}
                        />
                      </div>
                      {limit !== -1 && percentage > 80 && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Approaching limit. Consider upgrading.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Billing History Placeholder */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Billing History</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-900">Date</th>
                      <th className="px-6 py-4 font-bold text-gray-900">Amount</th>
                      <th className="px-6 py-4 font-bold text-gray-900">Status</th>
                      <th className="px-6 py-4 font-bold text-gray-900 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-6 py-4 text-gray-500" colSpan={4}>No recent transactions</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
