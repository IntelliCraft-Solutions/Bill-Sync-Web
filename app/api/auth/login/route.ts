import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP, hashOTP, getOTPExpiry } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/email'
import { validateEmail } from '@/lib/email-validation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email
    const emailValidation = await validateEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || "The email isn't valid — please use a valid email address." },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      )
    }

    if (!user.tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Generate and store OTP
    const otp = generateOTP()
    const hashedOTP = await hashOTP(otp)
    const expiresAt = getOTPExpiry()

    await prisma.emailOTP.create({
      data: {
        tenantId: user.tenant.id,
        email,
        otp: hashedOTP,
        type: 'login',
        expiresAt,
      },
    })

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, 'login')
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send login code. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Login code sent to your email. Please check your inbox.',
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

