import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP } from '@/lib/otp'
import { signIn } from 'next-auth/react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 400 }
      )
    }

    // Find valid OTP
    const emailOTP = await prisma.emailOTP.findFirst({
      where: {
        email,
        type: 'login',
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

    // Return success - client will handle NextAuth signin
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      tenantId: user.tenant.id,
      email: user.email,
    })
  } catch (error: any) {
    console.error('Login verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

