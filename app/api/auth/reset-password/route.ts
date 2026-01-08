import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP } from '@/lib/otp'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otp, newPassword } = body

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // If newPassword is 'verify_only', just verify OTP without resetting password
    if (newPassword === 'verify_only') {
      // Find admin
      const admin = await prisma.admin.findUnique({
        where: { email: email.trim().toLowerCase() },
      })

      if (!admin) {
        return NextResponse.json(
          { error: 'Invalid email' },
          { status: 404 }
        )
      }

      // Get tenant ID (handle case where it might be null)
      let tenantId = admin.tenantId
      if (!tenantId) {
        const tenant = await prisma.tenant.findFirst({
          where: { email: admin.email },
        })
        if (tenant) {
          tenantId = tenant.id
        } else {
          return NextResponse.json(
            { error: 'Account configuration error. Please contact support.' },
            { status: 500 }
          )
        }
      }

      // Find valid OTP
      const emailOTP = await prisma.emailOTP.findFirst({
        where: {
          email: admin.email,
          type: 'password_reset',
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

      const isValid = await verifyOTP(otp, emailOTP.otp)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
      })
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 404 }
      )
    }

    // Get tenant ID (handle case where it might be null)
    let tenantId = admin.tenantId
    if (!tenantId) {
      // Try to find tenant by email
      const tenant = await prisma.tenant.findFirst({
        where: { email: admin.email },
      })
      if (tenant) {
        tenantId = tenant.id
        // Update admin with tenantId
        await prisma.admin.update({
          where: { id: admin.id },
          data: { tenantId },
        })
      } else {
        return NextResponse.json(
          { error: 'Account configuration error. Please contact support.' },
          { status: 500 }
        )
      }
    }

    // Find valid OTP
    const emailOTP = await prisma.emailOTP.findFirst({
      where: {
        email: admin.email,
        type: 'password_reset',
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

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10)

    // Update admin password
    await prisma.$transaction(async (tx) => {
      await tx.admin.update({
        where: { id: admin.id },
        data: { password: hashedPassword },
      })

      // Mark OTP as used
      await tx.emailOTP.update({
        where: { id: emailOTP.id },
        data: { used: true },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.',
    })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

