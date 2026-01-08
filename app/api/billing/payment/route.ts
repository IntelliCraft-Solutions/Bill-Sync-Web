import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Update payment status for a bill
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { billId, paymentMethod, paymentId } = body

    if (!billId) {
      return NextResponse.json(
        { error: 'Bill ID is required' },
        { status: 400 }
      )
    }

    // Verify bill belongs to the cashier's admin
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { billingAccount: true },
    })

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    if (bill.billingAccountId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update bill payment status
    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod || 'ONLINE',
        paymentId: paymentId || null,
        paidAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      bill: updatedBill,
    })
  } catch (error: any) {
    console.error('Payment update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update payment status' },
      { status: 500 }
    )
  }
}

