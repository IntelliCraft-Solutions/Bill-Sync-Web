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
  Loader2,
  X,
  RefreshCw,
  Ban
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'

interface Subscription {
  id: string
  status: string
  startDate: string
  endDate: string
  autoRenew?: boolean
  plan: {
    name: string
    displayName: string
    price: number
    features: string[]
    limits: any
  }
  payments?: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paymentId?: string
    orderId?: string
    createdAt: string
  }>
}

interface UsageRecord {
  metricType: string
  currentValue: number
  limitValue: number
}

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const { showSuccess, showError } = useToast()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageRecord[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const [showErrorBanner, setShowErrorBanner] = useState(false)
  const [errorBannerMessage, setErrorBannerMessage] = useState('')

  useEffect(() => {
    // Immediately fetch data
    fetchSubscriptionData(true)
    
    // Set up auto-refresh every 1 second for the first 20 seconds to catch webhook updates
    const refreshInterval = setInterval(() => {
      fetchSubscriptionData(false)
    }, 1000) // Refresh every second
    
    const timeout = setTimeout(() => {
      clearInterval(refreshInterval)
      console.log('[Subscription Page] Stopped auto-refresh after 20 seconds')
    }, 20000) // Run for 20 seconds
    
    return () => {
      clearInterval(refreshInterval)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    // Check for payment status messages
    const paymentStatus = searchParams.get('payment')
    
    if (paymentStatus === 'success') {
      // CRITICAL: First, try to sync subscription in case webhook failed
      // Get orderId from URL params if available, or from latest payment
      const syncSubscription = async () => {
        try {
          // Try to get orderId from URL or fetch latest payment
          const timestamp = Date.now()
          const subRes = await fetch(`/api/subscriptions?t=${timestamp}`, {
            cache: 'no-store',
          })
          if (subRes.ok) {
            const subData = await subRes.json()
            // Find latest SUCCESS payment without subscription
            if (subData.payments && Array.isArray(subData.payments)) {
              const latestSuccessPayment = subData.payments.find((p: any) => 
                p.status === 'SUCCESS' && !p.subscriptionId
              )
              if (latestSuccessPayment && latestSuccessPayment.orderId) {
                console.log('[Payment Success] Attempting to sync subscription for order:', latestSuccessPayment.orderId)
                await fetch('/api/payments/sync-subscription', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: latestSuccessPayment.orderId,
                  }),
                })
              }
            }
          }
        } catch (syncError) {
          console.error('[Payment Success] Sync error (non-critical):', syncError)
        }
      }
      
      // Call sync immediately
      syncSubscription()
      
      // CRITICAL: Implement aggressive polling to catch webhook updates
      // Webhook may take 1-5 seconds to process, so poll multiple times
      let pollCount = 0
      const maxPolls = 10 // Poll for up to 10 seconds
      
      const pollForUpdates = async () => {
        pollCount++
        console.log(`[Payment Success] Polling for updates (attempt ${pollCount}/${maxPolls})`)
        
        try {
          const timestamp = Date.now()
          const res = await fetch(`/api/subscriptions?t=${timestamp}&_=${timestamp + 1}&r=${timestamp + 2}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          })
          
          if (res.ok) {
            const subData = await res.json()
            console.log('[Payment Success] Subscription data:', {
              planName: subData.plan?.name,
              planId: subData.planId,
              displayName: subData.plan?.displayName,
              price: subData.plan?.price,
              paymentsCount: subData.payments?.length || 0
            })
            
            // Update state with fresh data
            setSubscription({ ...subData })
            if (subData.payments && Array.isArray(subData.payments)) {
              setPayments([...subData.payments])
            }
            
            // Check if plan has been upgraded (not FREE_TRIAL and price > 0)
            const isPaidPlan = subData.plan?.name !== 'FREE_TRIAL' && subData.plan?.price > 0
            
            if (isPaidPlan) {
              // Plan has been upgraded - show success and stop polling
              setShowSuccessBanner(true)
              window.history.replaceState({}, '', '/admin/settings/subscription')
              setTimeout(() => setShowSuccessBanner(false), 5000)
              return true // Stop polling
            } else if (pollCount < maxPolls) {
              // Plan not yet updated - continue polling
              setTimeout(pollForUpdates, 1000)
              return false
            } else {
              // Max polls reached, plan still not updated
              console.warn('[Payment Success] Max polls reached, plan may not have updated yet')
              return false
            }
          }
        } catch (error) {
          console.error('[Payment Success] Polling error:', error)
          if (pollCount < maxPolls) {
            setTimeout(pollForUpdates, 1000)
          }
        }
        
        return false
      }
      
      // Start polling immediately
      pollForUpdates()
    } else if (paymentStatus === 'pending' || paymentStatus === 'failed') {
      // Show error message for pending/failed payments
      setShowErrorBanner(true)
      setErrorBannerMessage(
        paymentStatus === 'pending' 
          ? 'Payment is pending. Your plan will remain unchanged. If money was deducted, it will be automatically refunded if payment fails.'
          : 'Payment failed. Your plan remains unchanged. If money was deducted, it will be automatically refunded within 5-7 business days.'
      )
      // Remove query param from URL
      window.history.replaceState({}, '', '/admin/settings/subscription')
      // Hide error message after 8 seconds
      setTimeout(() => {
        setShowErrorBanner(false)
        setErrorBannerMessage('')
      }, 8000)
    }
  }, [searchParams])

  const fetchSubscriptionData = async (forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) {
        setLoading(true)
      }
      // Force fresh data with cache-busting - use multiple timestamps to ensure no cache
      const timestamp1 = Date.now()
      const timestamp2 = Date.now() + 1
      const timestamp3 = Date.now() + 2
      const timestamp4 = Date.now() + 3
      
      const [subRes, usageRes] = await Promise.all([
        fetch(`/api/subscriptions?t=${timestamp1}&_=${timestamp2}&r=${timestamp3}&v=${timestamp4}`, { 
          cache: 'no-store',
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch(`/api/usage?t=${timestamp1}&_=${timestamp2}&r=${timestamp3}&v=${timestamp4}`, { 
          cache: 'no-store',
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      ])
      
      if (subRes.ok) {
        const subData = await subRes.json()
        console.log('[Frontend] Subscription data received:', {
          planName: subData.plan?.name,
          planId: subData.planId,
          displayName: subData.plan?.displayName,
          price: subData.plan?.price,
          status: subData.status,
          paymentsCount: subData.payments?.length || 0,
          planLimits: subData.plan?.limits
        })
        
        // CRITICAL: Always update subscription state - this ensures UI reflects latest plan
        // Force a state update even if data appears the same
        setSubscription({ ...subData })
        
        // Extract payments from subscription data - ensure we always set payments
        if (subData.payments && Array.isArray(subData.payments) && subData.payments.length > 0) {
          console.log('[Frontend] Payments received:', subData.payments.length, subData.payments.map((p: any) => ({
            id: p.id,
            amount: p.amount,
            status: p.status,
            createdAt: p.createdAt
          })))
          setPayments([...subData.payments]) // Create new array to force re-render
        } else {
          console.log('[Frontend] No payments in response, setting empty array')
          setPayments([])
        }
      } else {
        const errorData = await subRes.json().catch(() => ({}))
        console.error('[Frontend] Failed to fetch subscription:', subRes.status, errorData)
      }
      
      if (usageRes.ok) {
        const usageData = await usageRes.json()
        console.log('[Frontend] Usage data received:', usageData)
        setUsage(usageData)
      } else {
        const errorData = await usageRes.json().catch(() => ({}))
        console.error('[Frontend] Failed to fetch usage:', usageRes.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      if (forceRefresh) {
        setLoading(false)
      }
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

  const handleAutoRenewToggle = async () => {
    if (!subscription) return
    
    setUpdating(true)
    try {
      const response = await fetch('/api/subscriptions/auto-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          enabled: !subscription.autoRenew 
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        setSubscription({ ...subscription, autoRenew: updated.autoRenew })
        showSuccess('Auto-renewal setting updated successfully')
      } else {
        showError('Failed to update auto-renewal setting')
      }
    } catch (error) {
      console.error('Error updating auto-renewal:', error)
      showError('Failed to update auto-renewal setting')
    } finally {
      setUpdating(false)
    }
  }

  const [showCancelModal, setShowCancelModal] = useState(false)

  const handleCancelSubscription = () => {
    setShowCancelModal(true)
  }

  const handleCancelConfirm = async (type: 'renewal' | 'subscription') => {
    if (!subscription) return
    
    setUpdating(true)
    setShowCancelModal(false)
    
    try {
      if (type === 'renewal') {
        // Just disable auto-renewal
        const response = await fetch('/api/subscriptions/auto-renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ autoRenew: false })
        })

        if (response.ok) {
          const updated = await response.json()
          setSubscription({ ...subscription, autoRenew: false })
          showSuccess('Auto-renewal has been disabled. Your subscription will not renew automatically, but will remain active until the end of the current billing period.')
        } else {
          const error = await response.json()
          showError(error.error || 'Failed to disable auto-renewal')
        }
      } else {
        // Cancel subscription (disable auto-renew and mark for downgrade at end of period)
        const response = await fetch('/api/subscriptions/cancel', {
          method: 'POST',
        })

        if (response.ok) {
          const updated = await response.json()
          setSubscription({ ...subscription, autoRenew: false })
          showSuccess('Subscription cancelled successfully. Your plan will remain active until the end of the current billing period, then you will be downgraded to the Free Trial plan.')
        } else {
          const error = await response.json()
          showError(error.error || 'Failed to cancel subscription')
        }
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      showError('Failed to cancel subscription')
    } finally {
      setUpdating(false)
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Subscription & Usage</h1>
          <p className="text-gray-600 mt-2">Manage your plan and track your resource consumption</p>
        </div>

        {/* Error Banner for PENDING/FAILED payments */}
        {showErrorBanner && errorBannerMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 mb-1">Payment Issue</p>
              <p className="text-sm text-red-700">{errorBannerMessage}</p>
            </div>
            <button
              onClick={() => {
                setShowErrorBanner(false)
                setErrorBannerMessage('')
              }}
              className="text-red-500 hover:text-red-700 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {showSuccessBanner && subscription && subscription.plan.price > 0 && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-bold">Plan Upgraded Successfully!</p>
                <p className="text-sm">Your account has been upgraded to <strong>{subscription.plan.displayName}</strong> and you can now access all features. A confirmation email has been sent to your registered email address.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

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

                {subscription && subscription.plan.name !== 'FREE_TRIAL' && subscription.plan.price > 0 && subscription.status === 'ACTIVE' && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">Auto-renewal</p>
                        <p className="text-sm text-gray-600">
                          {subscription.autoRenew 
                            ? 'Your subscription will automatically renew' 
                            : 'Your subscription will not renew automatically'}
                        </p>
                      </div>
                      <button
                        onClick={handleAutoRenewToggle}
                        disabled={updating}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          subscription.autoRenew ? 'bg-primary-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            subscription.autoRenew ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={handleCancelSubscription}
                      disabled={updating}
                      className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Cancel Plan / Cancel Renewal
                    </button>
                  </div>
                )}

                {/* Show Upgrade button for FREE_TRIAL and STANDARD plans */}
                {(subscription?.plan.name === 'FREE_TRIAL' || 
                  (subscription?.plan.name === 'STANDARD' && subscription?.plan.price > 0) ||
                  subscription?.plan.price === 0 || 
                  subscription?.status !== 'ACTIVE') && (
                  <Link 
                    href="/checkout"
                    className="w-full mt-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    {subscription?.plan.name === 'FREE_TRIAL' || subscription?.plan.price === 0 
                      ? 'Upgrade Plan' 
                      : 'Upgrade to Professional'}
                  </Link>
                )}
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
                        <span className="text-sm font-bold text-black">
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

            {/* Billing History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Billing History</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-900">Date</th>
                      <th className="px-6 py-4 font-bold text-gray-900">Amount</th>
                      <th className="px-6 py-4 font-bold text-gray-900">Status</th>
                      <th className="px-6 py-4 font-bold text-gray-900 text-right">Payment ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments && payments.length > 0 ? (
                      payments.map((payment: any) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-700">
                            {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            ₹{payment.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              payment.status === 'SUCCESS' 
                                ? 'bg-green-100 text-green-700' 
                                : payment.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600 text-xs font-mono">
                            {payment.paymentId ? payment.paymentId.slice(0, 12) + '...' : payment.orderId?.slice(0, 12) + '...' || 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-6 py-4 text-gray-500" colSpan={4}>No recent transactions</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Subscription</h3>
            <p className="text-gray-600 mb-6">
              What would you like to cancel?
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleCancelConfirm('renewal')}
                disabled={updating}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="font-semibold text-gray-900">Cancel Auto-Renewal Only</div>
                <div className="text-sm text-gray-600 mt-1">
                  Disable automatic renewal. Your plan remains active until the end of the current billing period, then you'll be downgraded to Free Trial.
                </div>
              </button>
              
              <button
                onClick={() => handleCancelConfirm('subscription')}
                disabled={updating}
                className="w-full p-4 border-2 border-red-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="font-semibold text-red-600">Cancel Subscription</div>
                <div className="text-sm text-gray-600 mt-1">
                  Cancel your subscription. Your plan remains active until the end of the current billing period ({subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'end of period'}), then you'll be downgraded to Free Trial.
                </div>
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={updating}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
