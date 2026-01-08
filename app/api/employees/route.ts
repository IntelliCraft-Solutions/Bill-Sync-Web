import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkQuota } from '@/lib/usage-tracker'

const employeeSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

export async function GET(req: NextRequest) {
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

    const employees = await prisma.billingAccount.findMany({
      where: {
        adminId: adminId,
      },
      select: {
        id: true,
        username: true,
        employeeId: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            bills: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(employees)
  } catch (error: any) {
    console.error('Get employees error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant ID from session
    const tenantId = (session.user as any).tenantId
    
    // If no tenantId, try to get from user record
    let finalTenantId = tenantId
    let adminId = session.user.id

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

    // Get or create Admin record for this tenant (for backward compatibility)
    let admin = await prisma.admin.findFirst({
      where: { tenantId: finalTenantId },
    })

    if (!admin) {
      // Create Admin record linked to tenant
      const tenant = await prisma.tenant.findUnique({
        where: { id: finalTenantId },
      })
      
      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }

      admin = await prisma.admin.create({
        data: {
          businessName: tenant.name,
          email: tenant.email,
          password: '', // No password for email-only auth
          tenantId: finalTenantId,
        },
      })
    }

    adminId = admin.id

    // Check usage quota for users (cashiers)
    const quotaCheck = await checkQuota(finalTenantId, 'USERS', 1)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: quotaCheck.error || 'Free plan limit reached. Upgrade to continue.',
          usage: quotaCheck.usage,
          limit: quotaCheck.limit,
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { username, password } = employeeSchema.parse(body)

    const existingEmployee = await prisma.billingAccount.findUnique({
      where: { username },
    })

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate unique Employee ID (format: EMP-XXXXXX where XXXXXX is random alphanumeric)
    const generateEmployeeId = (): string => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding similar looking chars
      let employeeId = 'EMP-'
      for (let i = 0; i < 6; i++) {
        employeeId += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return employeeId
    }

    // Ensure unique employeeId
    let employeeId = generateEmployeeId()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.billingAccount.findUnique({
        where: { employeeId },
      })
      if (!existing) break
      employeeId = generateEmployeeId()
      attempts++
    }

    const employee = await prisma.billingAccount.create({
      data: {
        username,
        password: hashedPassword,
        employeeId: employeeId,
        adminId: adminId,
      },
      select: {
        id: true,
        username: true,
        employeeId: true,
        role: true,
        createdAt: true,
      },
    })

    // Usage is already incremented in checkQuota above

    return NextResponse.json(employee)
  } catch (error: any) {
    console.error('Create employee error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
