import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { enabled } = body

    // Get tenant ID from session
    const tenantId = (session.user as any).tenantId
    
    let finalTenantId = tenantId

    if (!finalTenantId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { tenant: true },
      })
      
      if (user?.tenant) {
        finalTenantId = user.tenant.id
      } else {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }
    }

    // Get admin record
    const admin = await prisma.admin.findFirst({
      where: { tenantId: finalTenantId },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Update subscription auto-renew
    const subscription = await prisma.subscription.update({
      where: { adminId: admin.id },
      data: { autoRenew: enabled },
    })

    return NextResponse.json({ 
      success: true,
      autoRenew: subscription.autoRenew 
    })
  } catch (error: any) {
    console.error('Error updating auto-renewal:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

