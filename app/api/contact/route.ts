import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Send notification email to admin
    try {
      await sendContactFormNotification(name, email, subject, message);
    } catch (emailError) {
      console.error('Failed to send contact form notification:', emailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({ 
      success: true,
      message: 'Message sent successfully. We will get back to you soon!' 
    });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
