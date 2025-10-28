import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET store details for cashiers
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let adminId = session.user.id

    // If user is a cashier, get their admin's ID
    if (session.user.role === 'CASHIER') {
      const cashier = await prisma.billingAccount.findUnique({
        where: { id: session.user.id },
        select: { adminId: true }
      })
      
      if (!cashier) {
        return NextResponse.json(
          { error: 'Cashier not found' },
          { status: 404 }
        )
      }
      
      adminId = cashier.adminId
    }

    // Fetch store details for the admin
    const storeDetails = await prisma.storeDetails.findUnique({
      where: { adminId }
    })

    return NextResponse.json({ storeDetails })
  } catch (error) {
    console.error('Error fetching store info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store info' },
      { status: 500 }
    )
  }
}
