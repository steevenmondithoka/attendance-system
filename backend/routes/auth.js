const express = require('express');
const { register, login, updatePassword, createTeacher } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

const User = require('../models/User'); // Your Mongoose User model
const crypto = require('crypto'); // Built-in Node module
const nodemailer = require('nodemailer'); // Your email sending package
const bcrypt = require('bcryptjs');

const router = express.Router();

// Route for general user registration
router.post('/register', register);

// Route for logging in any user
router.post('/login', login);

// Route for updating password (requires login)
router.put('/update-password', protect, updatePassword);

// Example in your Express auth routes file (e.g., routes/auth.js)



// --- Nodemailer Setup (replace with your own details) ---
const transporter = nodemailer.createTransport({
    // Example for a common service like SendGrid, Mailgun, or using GMail SMTP
    service: 'Gmail', // or 'SendGrid', etc.
    auth: {
        user: 'ro200867@rguktong.ac.in', // Your verified email address
        pass: 'cqlm rcvs tbgo ifll' // Use an App Password, not your account password
    },
});
// --------------------------------------------------------

// @route   POST /api/auth/forgot-password
// @desc    Send password reset link to email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    let user; // <--- FIX: Declare 'user' in the function scope

    try {
        const { email } = req.body;
        user = await User.findOne({ email }); // <--- Assign value here

        if (!user) {
            // Security: Always return a success status even if user is not found
            return res.status(200).json({ msg: 'If a user with that email exists, a reset link has been sent.' });
        }

        // 1. Generate a unique reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // 2. Save the token and its expiration time (1 hour) to the user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
        await user.save();

        // 3. Create the reset URL (IMPORTANT: Replace 'http://localhost:3000' with your actual frontend domain)
        const resetURL = `https://attendance-system-five-lac.vercel.app/reset-password/${resetToken}`; 

        // 4. Construct and send the email
        const mailOptions = {
            to: user.email,
            from: 'noreply@yourdomain.com',
            subject: 'Password Reset Request',
            html: `<p>Please click the link to reset your password:</p><p><a href="${resetURL}">${resetURL}</a></p>`,
        };

        await transporter.sendMail(mailOptions);
        
        // Success response
        res.status(200).json({ msg: 'Password reset email sent successfully.' });

    } catch (err) {
        console.error('Forgot Password Error:', err);
        
        // Clear token fields if the failure happened BEFORE sending the email (e.g. database error)
        // or if we fail to send the email after setting the token.
        if (user) { 
             user.resetPasswordToken = undefined;
             user.resetPasswordExpire = undefined;
             await user.save();
        }
        // Send a generic 500 error to the frontend
        res.status(500).json({ msg: 'Server Error: Could not process the request.' });
    }
});
// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using the token
// @access  Public

// NOTE: nodemailer and crypto imports are also needed for the /forgot-password route
// const crypto = require('crypto');
// const nodemailer = require('nodemailer'); 
// const transporter = ... (Your nodemailer config)

// =================================================================
// ROUTE B: RESET PASSWORD
// =================================================================
// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using the token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        const resetToken = req.params.token;
        const { password } = req.body;

        // --- DEBUG LOGGING ---
        console.log('--- RESET PASSWORD DEBUG ---');
        console.log('Token received:', resetToken);
        console.log('Current time:', new Date(Date.now()));
        // ---------------------

        // 1. Find user by token AND check if the token is NOT expired
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            // $gt: greater than current time (i.e., not expired)
            resetPasswordExpire: { $gt: Date.now() } 
        });

        if (!user) {
            // --- DEBUG LOGGING ---
            const expiredUser = await User.findOne({ resetPasswordToken: resetToken });
            if (expiredUser) {
                console.log('Failure reason: Token expired or already used.');
                console.log('Expiration time in DB:', new Date(expiredUser.resetPasswordExpire));
            } else {
                 console.log('Failure reason: Token not found in DB.');
            }
            console.log('--- DEBUG END ---');
            // ---------------------
            
            // Return 400 status for an invalid/expired link
            return res.status(400).json({ msg: 'Password reset link is invalid or has expired.' });
        }

        console.log('Success: User found and token is valid.');
        console.log('--- DEBUG END ---');


        // 2. Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 3. Clear the reset token fields (MUST DO THIS so the link cannot be used again)
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        // 4. Save the updated user (with the new password)
        await user.save();

        res.status(200).json({ msg: 'Password successfully reset. You can now log in.' });

    } catch (err) {
        console.error('Reset Password Error:', err);
        // Ensure you return a 500 status on unexpected server error
        res.status(500).json({ msg: 'Server Error during password reset.' });
    }
});


// Make sure this file exports the router if it's imported elsewhere
// and that your other /auth routes are also included here.
// Route specifically for an admin to create a teacher (requires login + admin role)
router.post('/create-teacher', protect, isAdmin, createTeacher);

module.exports = router;