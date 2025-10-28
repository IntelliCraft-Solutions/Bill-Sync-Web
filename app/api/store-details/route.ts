import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET store details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const storeDetails = await prisma.storeDetails.findUnique({
      where: { adminId: session.user.id }
    })

    return NextResponse.json({ storeDetails })
  } catch (error) {
    console.error('Error fetching store details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store details' },
      { status: 500 }
    )
  }
}

// PUT/UPDATE store details
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { storeName, address, phone, email, gstNumber, website, footerText, logo } = body

    if (!storeName) {
      return NextResponse.json(
        { error: 'Store name is required' },
        { status: 400 }
      )
    }

    // Upsert store details
    const storeDetails = await prisma.storeDetails.upsert({
      where: { adminId: session.user.id },
      update: {
        storeName,
        address,
        phone,
        email,
        gstNumber,
        website,
        footerText,
        logo,
      },
      create: {
        adminId: session.user.id,
        storeName,
        address,
        phone,
        email,
        gstNumber,
        website,
        footerText,
        logo,
      }
    })

    return NextResponse.json({
      message: 'Store details updated successfully',
      storeDetails
    })
  } catch (error) {
    console.error('Error updating store details:', error)
    return NextResponse.json(
      { error: 'Failed to update store details' },
      { status: 500 }
    )
  }
}
