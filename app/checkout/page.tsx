'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'
import Script from 'next/script'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [planId, setPlanId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [availablePlans, setAvailablePlans] = useState<any[]>([])
  const [currentPlan, setCurrentPlan] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const planParam = searchParams.get('plan')
    if (planParam) {
      setPlanId(planParam)
    }
    fetchSubscriptionAndPlans()
  }, [searchParams])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?redirect=/checkout${planId ? `?plan=${planId}` : ''}`)
    }
  }, [status, planId, router])

  const fetchSubscriptionAndPlans = async () => {
    try {
      setError('') // Clear previous errors
      
      // Fetch current subscription to determine available plans
      const subRes = await fetch('/api/subscriptions')
      let planName = 'FREE_TRIAL'
      let subscription: any = null
      
      if (subRes.ok) {
        subscription = await subRes.json()
        planName = subscription?.plan?.name?.toUpperCase() || 'FREE_TRIAL'
        // Handle legacy plan names - if STANDARD with price 0, it's actually FREE_TRIAL
        if (planName === 'STANDARD' && subscription?.plan?.price === 0) {
          planName = 'FREE_TRIAL'
        }
        setCurrentPlan(planName)
      } else {
        console.error('Failed to fetch subscription:', subRes.status, subRes.statusText)
      }

      // Fetch all plans
      const plansRes = await fetch('/api/subscriptions/plans')
      
      if (!plansRes.ok) {
        const errorData = await plansRes.json().catch(() => ({}))
        console.error('Failed to fetch plans:', plansRes.status, errorData)
        setError('Failed to load plans. Please try again.')
        setLoading(false)
        return
      }

      const plans = await plansRes.json()
      
      if (!Array.isArray(plans) || plans.length === 0) {
        console.error('No plans returned from API')
        setError('No plans available. Please contact support.')
        setLoading(false)
        return
      }
      
      // Filter plans based on current plan
      let filteredPlans: any[] = []
      
      // Determine user's actual plan
      const isFreePlan = planName === 'FREE_TRIAL' || 
                        planName === 'FREE' || 
                        (planName === 'STANDARD' && subscription?.plan?.price === 0)
      
      if (isFreePlan) {
        // User is on FREE_TRIAL - show STANDARD and PROFESSIONAL
        filteredPlans = plans.filter((p: any) => 
          p.name === 'STANDARD' || p.name === 'PROFESSIONAL'
        )
      } else if (planName === 'STANDARD') {
        // User is on STANDARD (paid) - show only PROFESSIONAL
        filteredPlans = plans.filter((p: any) => p.name === 'PROFESSIONAL')
      } else if (planName === 'PROFESSIONAL') {
        // User is on PROFESSIONAL - no upgrades available
        filteredPlans = []
        } else {
        // Default: show STANDARD and PROFESSIONAL (fallback)
        filteredPlans = plans.filter((p: any) => 
          p.name === 'STANDARD' || p.name === 'PROFESSIONAL'
        )
      }

      if (filteredPlans.length === 0) {
        setError('No upgrade plans available for your current subscription.')
        setLoading(false)
        return
      }

      setAvailablePlans(filteredPlans)

      // If planId is provided, select that plan
      if (planId) {
        const plan = filteredPlans.find((p: any) => 
          p.name.toUpperCase() === planId.toUpperCase() ||
          p.displayName.toUpperCase() === planId.toUpperCase()
        )
        if (plan) {
          setSelectedPlan(plan)
        } else if (filteredPlans.length > 0) {
          // Default to first available plan
          setSelectedPlan(filteredPlans[0])
        }
      } else if (filteredPlans.length > 0) {
        // Default to first available plan
        setSelectedPlan(filteredPlans[0])
      }
    } catch (err: any) {
      console.error('Error fetching plans:', err)
      setError(err.message || 'Failed to load plan details. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (planToPay?: any) => {
    const plan = planToPay || selectedPlan
    if (!plan || !session) return

    setProcessing(true)
    setError('')

    try {
      // Create Razorpay order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      // Initialize Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'BillSync',
        description: `${plan.displayName} Plan`,
        order_id: data.orderId,
        handler: async function (response: any) {
          // Verify payment status before redirecting
          try {
            const verifyRes = await fetch('/api/payments/verify-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            })
            
            const verifyData = await verifyRes.json()
            
            if (verifyData.status === 'SUCCESS') {
          // Payment successful - webhook will handle subscription activation
          router.push('/admin/settings/subscription?payment=success')
            } else if (verifyData.status === 'PENDING') {
              // Payment pending - show error
              setError('Payment is pending. Your plan will be upgraded once payment is confirmed. If money was deducted, it will be automatically refunded if payment fails.')
              setProcessing(false)
              router.push('/admin/settings/subscription?payment=pending')
            } else {
              // Payment failed
              setError('Payment failed. If money was deducted, it will be automatically refunded within 5-7 business days.')
              setProcessing(false)
              router.push('/admin/settings/subscription?payment=failed')
            }
          } catch (err) {
            console.error('Payment verification error:', err)
            // Still redirect but with pending status
            router.push('/admin/settings/subscription?payment=pending')
          }
        },
        prefill: {
          name: session.user?.name || '',
          email: session.user?.email || '',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function() {
            setProcessing(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err: any) {
      setError(err.message || 'Payment initialization failed')
      setProcessing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  if (error && !selectedPlan && availablePlans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/admin/settings/subscription')}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600"
          >
            Back to Subscription
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
            <p className="text-gray-600 mb-8">Review your plan and proceed to payment</p>

            {availablePlans.length > 1 ? (
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`bg-gray-50 rounded-xl p-6 border-2 cursor-pointer transition-all ${
                      selectedPlan?.id === plan.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{plan.displayName}</h2>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">₹{plan.price}</div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.features && Array.isArray(plan.features) && plan.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
                ))}
              </div>
            ) : selectedPlan ? (
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.displayName}</h2>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">₹{selectedPlan.price}</div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>
                <ul className="space-y-2">
                  {selectedPlan.features && Array.isArray(selectedPlan.features) && selectedPlan.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/admin/settings/subscription')}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayment()}
                disabled={processing || !selectedPlan}
                className="flex-1 py-3 px-6 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Proceed to Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

