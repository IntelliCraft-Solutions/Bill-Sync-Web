import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP } from '@/lib/otp'
import { createTenantSchema } from '@/lib/tenant-schema'
import { sendConfirmationEmail, sendWelcomeEmail, sendFreePlanActivationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
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

    // Find valid OTP
    const emailOTP = await prisma.emailOTP.findFirst({
      where: {
        email,
        type: 'verification',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!emailOTP) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, emailOTP.otp)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Mark OTP as used
    await prisma.emailOTP.update({
      where: { id: emailOTP.id },
      data: { used: true },
    })

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    })

    // CRITICAL: Ensure Admin record exists for this tenant
    // This ensures all verified users have Admin records even if password setup is skipped
    let admin = await prisma.admin.findFirst({
      where: { 
        OR: [
          { tenantId: user.tenant.id },
          { email: user.email }
        ]
      },
    })

    if (!admin) {
      // Create Admin record with empty password (will be set during password setup)
      admin = await prisma.admin.create({
        data: {
          businessName: user.tenant.name,
          email: user.email,
          password: '', // Empty password - will be set during password setup
          tenantId: user.tenant.id,
        },
      })
      console.log(`[Verify] Created Admin ${admin.id} for tenant ${user.tenant.id} during email verification`)
    } else if (!admin.tenantId) {
      // Update existing admin to link to tenant
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          tenantId: user.tenant.id,
          businessName: user.tenant.name,
        },
      })
      console.log(`[Verify] Updated Admin ${admin.id} to link to tenant ${user.tenant.id}`)
    }

    // Create tenant schema if not exists
    try {
      await createTenantSchema(user.tenant.id, user.tenant.schemaName)
    } catch (schemaError) {
      console.error('Schema creation error:', schemaError)
      // Continue even if schema creation fails (might already exist)
    }

    // Send confirmation emails
    try {
      await sendConfirmationEmail(email, user.tenant.name)
      await sendWelcomeEmail(email, user.tenant.name)
      
      // Send activation email for free plan
      if (user.tenant.plan === 'free') {
        await sendFreePlanActivationEmail(email, user.tenant.name)
      }
    } catch (emailError) {
      console.error('Email send error:', emailError)
      // Don't fail verification if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Your account is now active.',
      tenantId: user.tenant.id,
    })
  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

