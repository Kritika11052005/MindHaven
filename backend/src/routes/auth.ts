import { Router } from "express";
import {register,login,logout,forgotPassword, resetPassword } from "../controllers/authController";
import { auth } from "../middleware/auth";
import { testEmailConfig, sendResetEmail, validateEmailConfig } from '../utils/emailService';
const router=Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", auth, (req, res) => {
    res.json({ user: req.user });
});
// Test endpoint - Fix the TypeScript error
router.post('/test-email-config', async (req, res) => {
  try {
    // 1. Validate environment variables
    validateEmailConfig();
    console.log('✅ Environment variables validated');

    // 2. Test email configuration
    const isValid = await testEmailConfig();
    if (!isValid) {
      return res.status(500).json({ 
        message: 'Email configuration is invalid' 
      });
    }

    // 3. Try sending a test email
    await sendResetEmail(
      'ananya.benjwal@gmail.com',
      `${process.env.FRONTEND_URL}/test-reset`,
      'Test User'
    );

    res.json({ 
      message: 'Test email sent successfully!',
      config: 'Valid'
    });

  } catch (error) {
    console.error('Test email failed:', error);
    
    // Fix TypeScript error by properly typing the error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error : { message: 'Unknown error' };
    
    res.status(500).json({ 
      message: 'Test failed',
      error: errorMessage,
      details: errorDetails
    });
  }
});
export default router;
