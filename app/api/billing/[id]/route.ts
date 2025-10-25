import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let whereClause: any = { id: params.id }

    if (session.user.role === 'ADMIN') {
      whereClause.adminId = session.user.id
    } else if (session.user.role === 'CASHIER') {
      whereClause.billingAccountId = session.user.id
    }

    const bill = await prisma.bill.findFirst({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        billingAccount: {
          select: {
            username: true,
          },
        },
        admin: {
          select: {
            businessName: true,
          },
        },
      },
    })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    return NextResponse.json(bill)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
