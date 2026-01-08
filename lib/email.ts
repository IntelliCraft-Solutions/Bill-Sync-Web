import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'intellicraft.solutions25@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'ispk yatc cnns wkoe',
  },
})

export async function sendOTPEmail(toEmail: string, otp: string, type: 'verification' | 'login' = 'verification') {
  const subject = type === 'verification' 
    ? 'Verify your BillSync account' 
    : 'Your BillSync login code'
  
  const text = type === 'verification'
    ? `Welcome to BillSync! Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
    : `Your login code for BillSync is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">${type === 'verification' ? 'Welcome to BillSync!' : 'Your Login Code'}</h2>
      <p>Your ${type === 'verification' ? 'verification' : 'login'} code is:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #6366f1; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
      <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: `"BillSync" <${process.env.EMAIL_USER || 'intellicraft.solutions25@gmail.com'}>`,
      to: toEmail,
      subject,
      text,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    throw new Error('Failed to send email')
  }
}

export async function sendWelcomeEmail(toEmail: string, name: string) {
  const text = `Welcome to BillSync, ${name}!\n\nYour free account has been created successfully. You can now start managing your billing and inventory.\n\nThank you for choosing BillSync!`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">Welcome to BillSync, ${name}!</h2>
      <p>Your free account has been created successfully. You can now start managing your billing and inventory.</p>
      <p>Thank you for choosing BillSync!</p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: `"BillSync" <${process.env.EMAIL_USER || 'intellicraft.solutions25@gmail.com'}>`,
      to: toEmail,
      subject: 'Welcome to BillSync!',
      text,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Welcome email send error:', error)
    throw new Error('Failed to send welcome email')
  }
}

export async function sendConfirmationEmail(toEmail: string, name: string) {
  const text = `Hi ${name},\n\nYour account has been successfully verified. You can now access all features of your BillSync account.\n\nGet started by visiting your dashboard.`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">Account Verified!</h2>
      <p>Hi ${name},</p>
      <p>Your account has been successfully verified. You can now access all features of your BillSync account.</p>
      <p>Get started by visiting your dashboard.</p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: `"BillSync" <${process.env.EMAIL_USER || 'intellicraft.solutions25@gmail.com'}>`,
      to: toEmail,
      subject: 'Account Verified - BillSync',
      text,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Confirmation email send error:', error)
    throw new Error('Failed to send confirmation email')
  }
}

export async function sendContactFormNotification(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  const adminEmail = process.env.ADMIN_EMAIL || 'intellicraft.solutions25@gmail.com'
  
  const text = `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">New Contact Form Submission</h2>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Subject:</strong> ${subject}</p>
      </div>
      <div style="background: #ffffff; padding: 20px; border-left: 4px solid #6366f1; margin: 20px 0;">
        <h3 style="margin-top: 0;">Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        You can reply directly to this email to respond to ${name}.
      </p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: `"BillSync Contact Form" <${process.env.EMAIL_USER || 'intellicraft.solutions25@gmail.com'}>`,
      to: adminEmail,
      replyTo: email, // Allow replying directly to the user
      subject: `Contact Form: ${subject}`,
      text,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Contact form notification send error:', error)
    throw new Error('Failed to send contact form notification')
  }
}

export async function sendInvoiceEmail(
  toEmail: string,
  name: string,
  planName: string,
  amount: number,
  currency: string,
  paymentId: string,
  orderId: string
) {
  const text = `Dear ${name},\n\nThank you for your purchase!\n\nPlan: ${planName}\nAmount: ${currency} ${amount}\nPayment ID: ${paymentId}\nOrder ID: ${orderId}\n\nYour account has been activated and you can now access all features.\n\nThank you for choosing BillSync!`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">Payment Successful - Account Activated!</h2>
      <p>Dear ${name},</p>
      <p>Thank you for your purchase! Your account has been successfully activated.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #6366f1;">Invoice Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Plan:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${currency} ${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Payment ID:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; font-size: 12px;">${paymentId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Order ID:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${orderId}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #065f46;"><strong>✓ Your account has been activated!</strong></p>
        <p style="margin: 5px 0 0 0; color: #065f46;">You can now access all features of your ${planName} plan.</p>
      </div>
      
      <p>Thank you for choosing BillSync!</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        This is an automated invoice. Please keep this email for your records.
      </p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: `"BillSync" <${process.env.EMAIL_USER || 'intellicraft.solutions25@gmail.com'}>`,
      to: toEmail,
      subject: `Invoice - ${planName} Plan - BillSync`,
      text,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Invoice email send error:', error)
    throw new Error('Failed to send invoice email')
  }
}

export async function sendFreePlanActivationEmail(toEmail: string, name: string) {
  const text = `Dear ${name},\n\nYour free BillSync account has been successfully activated!\n\nYou can now:\n- Manage up to 10 products\n- Create up to 15 bills per month\n- Access basic reports\n- Get email support\n\nGet started by visiting your dashboard.\n\nThank you for choosing BillSync!`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">Account Activated - Welcome to BillSync!</h2>
      <p>Dear ${name},</p>
      <p>Your free BillSync account has been successfully activated!</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #6366f1;">Your Free Plan Includes:</h3>
        <ul style="line-height: 1.8;">
          <li>Manage up to 10 products</li>
          <li>Create up to 15 bills per month</li>
          <li>Access basic reports</li>
          <li>Email support</li>
        </ul>
      </div>
      
      <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #065f46;"><strong>✓ Your account is ready to use!</strong></p>
        <p style="margin: 5px 0 0 0; color: #065f46;">Get started by visiting your dashboard.</p>
      </div>
      
      <p>Thank you for choosing BillSync!</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Need more features? Upgrade to Pro or Premium plan anytime from your dashboard.
      </p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: `"BillSync" <${process.env.EMAIL_USER || 'intellicraft.solutions25@gmail.com'}>`,
      to: toEmail,
      subject: 'Account Activated - Welcome to BillSync!',
      text,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Free plan activation email send error:', error)
    throw new Error('Failed to send activation email')
  }
}

export async function sendUpgradeSuccessEmail(
  toEmail: string,
  name: string,
  planName: string,
  amount: number,
  currency: string,
  paymentId: string,
  orderId: string,
  autoRenew: boolean = true
) {
  const text = `Dear ${name},\n\nCongratulations! Your plan has been successfully upgraded to ${planName}!\n\nPlan: ${planName}\nAmount: ${currency} ${amount}\nPayment ID: ${paymentId}\nOrder ID: ${orderId}\nAuto-renewal: ${autoRenew ? 'Enabled' : 'Disabled'}\n\nYour account has been upgraded and you can now access all features of your new plan.\n\nThank you for choosing BillSync!`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">Plan Upgraded Successfully!</h2>
      <p>Dear ${name},</p>
      <p>Congratulations! Your plan has been successfully upgraded to <strong>${planName}</strong>!</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #6366f1;">Upgrade Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Plan:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${currency} ${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Payment ID:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; font-size: 12px;">${paymentId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Order ID:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; font-size: 12px;">${orderId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Auto-renewal:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${autoRenew ? '✓ Enabled' : '✗ Disabled'}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #065f46;"><strong>✓ Your account has been upgraded!</strong></p>
        <p style="margin: 5px 0 0 0; color: #065f46;">You can now access all features of your ${planName} plan.</p>
      </div>
      
      <p>Thank you for choosing BillSync!</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        You can manage your subscription, auto-renewal, and cancellation settings from your dashboard.
      </p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: `"BillSync" <${process.env.EMAIL_USER || 'intellicraft.solutions25@gmail.com'}>`,
      to: toEmail,
      subject: `Plan Upgraded - ${planName} Plan - BillSync`,
      text,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Upgrade success email send error:', error)
    throw new Error('Failed to send upgrade success email')
  }
}

