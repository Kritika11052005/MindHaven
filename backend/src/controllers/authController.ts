import { Request, Response } from "express";
import { User } from "../models/User";
import { Session } from "../models/Session";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto";
import { sendResetEmail, validateEmailConfig } from "../utils/emailService";

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ message: "Name,email,and password are required." })

        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already in use" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword })
        await user.save();
        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
            message: "User registered successfully"
        })

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            message: "Server error",
            ...(process.env.NODE_ENV === 'development' && { 
                error: error instanceof Error ? error.message : 'Unknown error' 
            })
        });
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET as string,
            { expiresIn: "24h" }
        );

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        const session = new Session({
            userId: user._id,
            token,
            expiresAt,
            deviceInfo: req.headers["user-agent"],
        });
        await session.save();
        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
            token,
            message: "Login successful",
        })

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: "Server error",
            ...(process.env.NODE_ENV === 'development' && { 
                error: error instanceof Error ? error.message : 'Unknown error' 
            })
        });
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            await Session.deleteOne({ token });
        }
        res.json({ message: "Logged out successfully" })
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            message: "Server error",
            ...(process.env.NODE_ENV === 'development' && { 
                error: error instanceof Error ? error.message : 'Unknown error' 
            })
        });
    }
}

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        // Validate email config first
        validateEmailConfig();
        
        const { email } = req.body;
        console.log('📧 Forgot password request for:', email);

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log('❌ User not found for email:', email);
            // Don't reveal if user exists or not for security
            return res.status(200).json({
                message: "If an account exists, a reset link has been sent."
            });
        }

        console.log('✅ User found:', user.email, 'Name:', user.name);

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set token and expiration (15 minutes)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        console.log('✅ Reset token saved for user');

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        console.log('🔗 Reset URL created:', resetUrl);

        try {
            console.log('📤 Attempting to send email to:', user.email);
            const result = await sendResetEmail(user.email, resetUrl, user.name || 'User');
            console.log('✅ Email sent successfully!', result);
            
            res.status(200).json({
                message: "Password reset email sent successfully"
            });
        } catch (emailError) {
            const error = emailError as Error & {
                code?: string;
                command?: string;
                response?: string;
                responseCode?: number;
            };
            
            console.error('❌ Email send error details:', {
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode
            });

            // Clear reset token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            return res.status(500).json({
                message: "Email could not be sent",
                ...(process.env.NODE_ENV === 'development' && { 
                    error: error.message,
                    code: error.code 
                })
            });
        }
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            message: "Server error",
            ...(process.env.NODE_ENV === 'development' && { 
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                message: "Token and new password are required"
            });
        }

        // Hash the token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update user password and clear reset fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Clear all existing sessions for security
        await Session.deleteMany({ userId: user._id });

        res.status(200).json({
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            message: "Server error",
            ...(process.env.NODE_ENV === 'development' && { 
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        });
    }
};