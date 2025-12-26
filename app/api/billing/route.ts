import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkUsageLimit, incrementUsage } from '@/lib/usage-tracker'

const billItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
})

const billSchema = z.object({
  customerName: z.string().min(1),
  billType: z.enum(['INVENTORY', 'CUSTOM']),
  items: z.array(billItemSchema).min(1),
  totalAmount: z.number().positive(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let whereClause: any = {}

    if (session.user.role === 'ADMIN') {
      whereClause.adminId = session.user.id
    } else if (session.user.role === 'CASHIER') {
      whereClause.billingAccountId = session.user.id
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        items: true,
        billingAccount: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bills)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'CASHIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminId = session.user.adminId!;

    // Check usage limit
    const usageCheck = await checkUsageLimit(adminId, 'BILLS');
    if (usageCheck.exceeded) {
      return NextResponse.json(
        { error: usageCheck.message },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = billSchema.parse(body)

    // Start a transaction to ensure data consistency
    const bill = await prisma.$transaction(async (tx) => {
      // Create the bill
      const newBill = await tx.bill.create({
        data: {
          customerName: data.customerName,
          billType: data.billType,
          totalAmount: data.totalAmount,
          billingAccountId: session.user.id,
          adminId: adminId,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          items: true,
        },
      })

      // Update inventory for INVENTORY type bills
      if (data.billType === 'INVENTORY') {
        for (const item of data.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                quantityInStock: {
                  decrement: item.quantity,
                },
              },
            })
          }
        }
      }

      return newBill
    })

    // Increment usage
    await incrementUsage(adminId, 'BILLS');

    return NextResponse.json(bill)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
