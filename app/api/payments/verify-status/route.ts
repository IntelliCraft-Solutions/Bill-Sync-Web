import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orderId, paymentId, signature } = body

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    // Verify signature
    const body_signature = orderId + '|' + paymentId
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body_signature.toString())
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Fetch payment status from Razorpay
    let razorpayPayment
    try {
      razorpayPayment = await razorpay.payments.fetch(paymentId)
    } catch (err: any) {
      console.error('Failed to fetch payment from Razorpay:', err)
      return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
    }

    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: { orderId },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Determine status
    const isSuccess = razorpayPayment.status === 'captured' || razorpayPayment.status === 'authorized'
    const finalStatus = isSuccess ? 'SUCCESS' : (razorpayPayment.status === 'failed' ? 'FAILED' : 'PENDING')

    // Update payment in database if status changed
    if (payment.status !== finalStatus) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: finalStatus,
          paymentId: paymentId,
          razorpaySignature: signature,
          // If payment failed/pending but money was deducted, mark for refund
          refundRequested: !isSuccess && payment.status === 'PENDING' ? true : undefined,
        },
      })
    }

    return NextResponse.json({
      status: finalStatus,
      paymentId: paymentId,
      orderId: orderId,
      amount: razorpayPayment.amount / 100, // Convert from paise
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
