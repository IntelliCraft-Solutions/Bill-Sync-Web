import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Check if store details are complete
export async function GET(req: NextRequest) {
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

    // Fetch store details
    const storeDetails = await prisma.storeDetails.findUnique({
      where: { adminId }
    })

    if (!storeDetails) {
      return NextResponse.json({
        isValid: false,
        message: 'Store details not found. Please ask the owner to fill all business details first.',
        missingFields: ['storeName', 'address']
      })
    }

    // Check required fields
    const requiredFields = ['storeName', 'address']
    const missingFields: string[] = []

    if (!storeDetails.storeName || storeDetails.storeName.trim() === '') {
      missingFields.push('storeName')
    }
    if (!storeDetails.address || storeDetails.address.trim() === '') {
      missingFields.push('address')
    }

    if (missingFields.length > 0) {
      return NextResponse.json({
        isValid: false,
        message: 'Please ask the owner to fill all business details (Business Name and Address) first.',
        missingFields
      })
    }

    return NextResponse.json({
      isValid: true,
      storeDetails
    })
  } catch (error) {
    console.error('Error validating store details:', error)
    return NextResponse.json(
      { error: 'Failed to validate store details' },
      { status: 500 }
    )
  }
}

