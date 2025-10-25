import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)
    const startOfThisMonth = startOfMonth(today)
    const endOfThisMonth = endOfMonth(today)
    const startOfThisYear = startOfYear(today)
    const endOfThisYear = endOfYear(today)

    // Daily sales
    const dailySales = await prisma.bill.aggregate({
      where: {
        adminId: session.user.id,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    })

    // Monthly sales
    const monthlySales = await prisma.bill.aggregate({
      where: {
        adminId: session.user.id,
        createdAt: {
          gte: startOfThisMonth,
          lte: endOfThisMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    })

    // Yearly sales
    const yearlySales = await prisma.bill.aggregate({
      where: {
        adminId: session.user.id,
        createdAt: {
          gte: startOfThisYear,
          lte: endOfThisYear,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    })

    // Low stock products - using raw query to compare fields
    const lowStockProducts = await prisma.$queryRaw`
      SELECT id, name, "quantityInStock", "lowStockThreshold"
      FROM "Product"
      WHERE "adminId" = ${session.user.id}
      AND "quantityInStock" <= "lowStockThreshold"
      ORDER BY "quantityInStock" ASC
      LIMIT 10
    `

    return NextResponse.json({
      daily: {
        revenue: dailySales._sum.totalAmount || 0,
        billCount: dailySales._count,
      },
      monthly: {
        revenue: monthlySales._sum.totalAmount || 0,
        billCount: monthlySales._count,
      },
      yearly: {
        revenue: yearlySales._sum.totalAmount || 0,
        billCount: yearlySales._count,
      },
      lowStockProducts,
    })
  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
