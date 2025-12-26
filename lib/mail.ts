import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendWelcomeEmail(to: string, businessName: string) {
  const mailOptions = {
    from: `"Bill-Sync" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to Bill-Sync!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #6d28d9; text-align: center;">Welcome to Bill-Sync, ${businessName}!</h2>
        <p>Thank you for choosing Bill-Sync for your business management needs.</p>
        <p>Your account has been successfully created. You can now start managing your products, bills, and employees with ease.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/auth/signin" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Dashboard</a>
        </div>
        <p>If you have any questions, feel free to reply to this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2025 Bill-Sync. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
