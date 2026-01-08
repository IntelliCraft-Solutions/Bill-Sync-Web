import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant ID from session
    const tenantId = (session.user as any).tenantId
    
    // Get Admin record for this tenant
    let adminId = session.user.id

    if (!tenantId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { tenant: true },
      })
      
      if (user?.tenant) {
        const admin = await prisma.admin.findFirst({
          where: { tenantId: user.tenant.id },
        })
        if (admin) {
          adminId = admin.id
        }
      }
    } else {
      const admin = await prisma.admin.findFirst({
        where: { tenantId },
      })
      if (admin) {
        adminId = admin.id
      }
    }

    // Verify the employee belongs to this admin before deleting
    const employee = await prisma.billingAccount.findFirst({
      where: {
        id: params.id,
        adminId: adminId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.billingAccount.delete({
      where: {
        id: params.id,
      },
    })

    // Note: We don't decrement usage quota on deletion
    // The quota is reset monthly, so deletion just frees up the slot

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
