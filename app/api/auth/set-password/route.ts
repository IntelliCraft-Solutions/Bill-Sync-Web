import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    })

    if (!user || !user.tenant) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Email not verified. Please verify your email first.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password.trim(), 10)

    // CRITICAL: Get or create Admin record - this ensures all registered users have Admin records
    let admin = await prisma.admin.findFirst({
      where: { 
        OR: [
          { tenantId: user.tenant.id },
          { email: user.email }
        ]
      },
    })

    if (admin) {
      // Update existing admin password and ensure tenantId is set
      await prisma.admin.update({
        where: { id: admin.id },
        data: { 
          password: hashedPassword,
          tenantId: user.tenant.id, // Ensure tenantId is set
          businessName: user.tenant.name, // Update business name from tenant
        },
      })
      console.log(`[Set Password] Updated Admin ${admin.id} for tenant ${user.tenant.id}`)
    } else {
      // Create new admin record
      admin = await prisma.admin.create({
        data: {
          businessName: user.tenant.name,
          email: user.email,
          password: hashedPassword,
          tenantId: user.tenant.id,
        },
      })
      console.log(`[Set Password] Created Admin ${admin.id} for tenant ${user.tenant.id}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
    })
  } catch (error: any) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
