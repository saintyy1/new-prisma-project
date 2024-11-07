import transporter from './nodemailerService.js';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Handle user login
let loginUserAsync = async (email, password) => {
    // Find the user by email and password
    const user = await prisma.user.findFirst({
        where: {
            email: email,
            password: password,
        },
    });

    // If user not found, return null or handle as necessary
    if (!user) {
        throw new Error('Invalid email or password');
    }

    return user; // Return the entire user object directly
};

// Function to verify user email with the provided verification code
const verifyUserEmailAsync = async (verificationCode) => {
    
    // Find the user with the provided verification code
    const user = await prisma.user.findFirst({
        where: {
            verificationCode: verificationCode, // Use the verification code to find the user
        },
    });

    // If no user found or already verified, return null
    if (!user || user.isVerified) {
        return null; // User not found or already verified 
    }

    // Update the user to set isVerified to true and clear the verification code
    const updatedUser = await prisma.user.update({
        where: {
            id: user.id, // Ensure this ID is a number
        },
        data: {
            isVerified: true,
            verificationCode: null, // Optionally clear the verification code after use
        },
    });

    return updatedUser;
};

// Function to send verification code email
let sendVerificationCodeAsync = async (email) => {
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update the user's verification code in the database
    const updatedUser = await prisma.user.update({
        where: { email: email },
        data: { verificationCode: verificationCode } // Use the generated verification code
    });

    let subject = 'Verify Your Email';
    let htmlContent = `
        <p>You requested an Email Verification.</p>
        <p>Click the link below to verify your email:</p>
        <p>Your verification code is: ${verificationCode}</p>
        <p>If you did not ask to verify your email, please ignore this email.</p>
        <p>Thanks,</p>
        <p>Your Idea app Team.</p>
    `;

    // Send the email
    transporter.sendMail(email, subject, htmlContent, true);

    return updatedUser;
};


// Forgot Password Function
let forgotPasswordAsync = async (email) => {
    // Check if the user exists
    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    if (!user) {
        throw new Error('User with this email does not exist');
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 900000); // Token expires in 15 minutes

    // Save the reset token and expiration in the database
    const updatedUser = await prisma.user.update({
        where: {
            email: email,
        },
        data: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetTokenExpires,
        },
    });

    // Create the reset link
    const resetLink = `http://127.0.0.1:5500/pages/public/verifyresetlink.html?token=${resetToken}&email=${email}`;
        
    let subject = 'Password Reset for IdeaTrack';
    let htmlContent = `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you did not ask to reset your password, please ignore this email.</p>
        <p>Thanks,</p>
        <p>Your Idea app Team.</p>
    `

    // Send the email
    transporter.sendMail(email, subject, htmlContent, true);

    return updatedUser;
};

let verifyPasswordAsync = async (email, token) => {
    // Check if the user exists
    const user = await prisma.user.findUnique({
        where: { email }
    });
    
    if (!user) {
        throw new Error('User not found');
    }

    // Check if the reset token is valid and not expired
    if (user.resetPasswordToken !== token) {
        throw new Error('Invalid token');
    }

    const now = new Date();
    if (user.resetPasswordExpires < now) {
        throw new Error('Reset password link has expired');
    }
    
    // Token is valid and not expired
    return { status: 'success', message: 'Token valid, redirect to reset password page' };
};


// Reset Password Function
const resetPasswordAsync = async (email, newPassword) => {
    // Update the user's password
    const updatedUser = await prisma.user.update({
        where: { email },
        data: { password: newPassword, resetPasswordToken: null, resetPasswordExpires: null }
    });

    return updatedUser;
};


const authController = {
    loginUserAsync,
    verifyUserEmailAsync,
    forgotPasswordAsync,
    sendVerificationCodeAsync,
    verifyPasswordAsync,
    resetPasswordAsync
}
export default authController;