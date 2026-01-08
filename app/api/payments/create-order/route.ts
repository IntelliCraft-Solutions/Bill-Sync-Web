import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { tenant: true },
    })

    if (!user || !user.tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Validate Razorpay keys
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Create Razorpay order
    // Generate short receipt ID (max 40 chars for Razorpay)
    const timestamp = Date.now().toString().slice(-10) // Last 10 digits
    const tenantShort = user.tenant.id.slice(0, 8) // First 8 chars of tenant ID
    const receipt = `RCP_${tenantShort}_${timestamp}` // Max length: 3 + 1 + 8 + 1 + 10 = 23 chars
    
    let order
    try {
      order = await razorpay.orders.create({
        amount: Math.round(plan.price * 100), // Convert to paise (monthly amount)
      currency: plan.currency || 'INR',
        receipt: receipt,
      notes: {
        tenantId: user.tenant.id,
        planId: plan.id,
        planName: plan.name,
      },
    })
    } catch (razorpayError: any) {
      console.error('Razorpay order creation error:', razorpayError)
      return NextResponse.json(
        { error: razorpayError.error?.description || 'Failed to create payment order. Please try again.' },
        { status: 500 }
      )
    }

    // Store order in database
    await prisma.payment.create({
      data: {
        tenantId: user.tenant.id,
        amount: plan.price,
        currency: plan.currency || 'INR',
        status: 'PENDING',
        paymentMethod: 'RAZORPAY',
        orderId: order.id,
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}
