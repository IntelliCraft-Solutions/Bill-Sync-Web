import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '7')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get date range
    const end = new Date()
    const start = startDate && endDate
      ? new Date(startDate)
      : subDays(end, days - 1)

    // Sales data for the period
    const salesData = await prisma.bill.aggregate({
      where: {
        adminId: session.user.id,
        createdAt: {
          gte: startOfDay(start),
          lte: endOfDay(end),
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    })

    // Daily sales breakdown
    const salesByDay = []
    for (let i = 0; i < days; i++) {
      const date = subDays(end, days - 1 - i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const daySales = await prisma.bill.aggregate({
        where: {
          adminId: session.user.id,
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      })

      salesByDay.push({
        date: date.toISOString().split('T')[0],
        revenue: daySales._sum.totalAmount || 0,
        bills: daySales._count,
      })
    }

    // Top products
    const topProducts = await prisma.billItem.groupBy({
      by: ['name'],
      where: {
        bill: {
          adminId: session.user.id,
          createdAt: {
            gte: startOfDay(start),
            lte: endOfDay(end),
          },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc',
        },
      },
      take: 10,
    })

    // Employee performance
    const employeePerformance = await prisma.bill.groupBy({
      by: ['billingAccountId'],
      where: {
        adminId: session.user.id,
        createdAt: {
          gte: startOfDay(start),
          lte: endOfDay(end),
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    })

    const employeeData = await Promise.all(
      employeePerformance.map(async (emp) => {
        const employee = await prisma.billingAccount.findUnique({
          where: { id: emp.billingAccountId },
          select: { username: true },
        })
        return {
          name: employee?.username || 'Unknown',
          bills: emp._count,
          revenue: emp._sum.totalAmount || 0,
        }
      })
    )

    // Total counts
    const [totalProducts, totalEmployees] = await Promise.all([
      prisma.product.count({
        where: { adminId: session.user.id },
      }),
      prisma.billingAccount.count({
        where: { adminId: session.user.id },
      }),
    ])

    return NextResponse.json({
      totalRevenue: salesData._sum.totalAmount || 0,
      totalBills: salesData._count,
      totalProducts,
      totalEmployees,
      salesByDay,
      topProducts: topProducts.map(p => ({
        name: p.name,
        quantity: p._sum.quantity || 0,
        revenue: p._sum.totalPrice || 0,
      })),
      employeePerformance: employeeData,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
