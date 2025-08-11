// utils/emailService.ts
import nodemailer from 'nodemailer';

const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Add these for Gmail specifically
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
};

// Test email configuration
export const testEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

// Send reset password email - matching the function name used in authController
export const sendResetEmail = async (email: string, resetUrl: string, userName: string) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request - AI Therapist',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hi ${userName},</h2>
          <p>You requested a password reset for your AI Therapist account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
            Reset Password
          </a>
          <p><strong>This link will expire in 15 minutes.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            If the button doesn't work, copy and paste this link: ${resetUrl}
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
};

// Validate email environment variables
export const validateEmailConfig = () => {
  const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM', 'FRONTEND_URL'];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Email configuration variables validated');
};