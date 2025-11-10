// backend/routes/authRoutes.js

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { register, login, updatePassword, createTeacher } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// ======================================================================
// 🔐 1. AUTHENTICATION ROUTES
// ======================================================================

router.post('/register', register);
router.post('/login', login);
router.put('/update-password', protect, updatePassword);
router.post('/create-teacher', protect, isAdmin, createTeacher);

// ======================================================================
// ✉️ 2. FORGOT PASSWORD ROUTE (BREVO SMTP - Works on Render)
// ======================================================================

// ✅ Brevo (SendinBlue) SMTP Configuration
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // TLS over 587
  auth: {
    user: "9b3c09001@smtp-brevo.com", // Brevo login
    pass: "PynYKDh5MTCd2vNS",        // Brevo SMTP password
  },
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  let user;

  try {
    const { email } = req.body;
    user = await User.findOne({ email });

    if (!user) {
      // Return same response even if not found (security)
      return res.status(200).json({ msg: 'If an account with that email exists, a reset link has been sent.' });
    }

    // 1️⃣ Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2️⃣ Save token + expiry (1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save();

    // 3️⃣ Frontend reset link (update if frontend URL changes)
    const resetURL = `https://attendance-system-jotz.onrender.com/reset-password/${resetToken}`;

    // 4️⃣ Email content
    const mailOptions = {
      from: '"Attendance System" <noreply@attendance-system.com>',
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Hello ${user.name || 'User'},</h2>
        <p>You requested to reset your password.</p>
        <p>Click below to reset (valid for 1 hour):</p>
        <a href="${resetURL}" target="_blank">${resetURL}</a>
        <br><br>
        <p>If you didn’t request this, ignore this email.</p>
      `,
    };

    // 5️⃣ Send the email
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully to:', user.email);

    res.status(200).json({ msg: 'Password reset email sent successfully.' });

  } catch (err) {
    console.error('❌ Forgot Password Error:', err);

    // Rollback token if something failed before sending
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
    }

    res.status(500).json({ msg: 'Server error: Unable to send reset email.' });
  }
});

// ======================================================================
// 🔁 3. RESET PASSWORD ROUTE
// ======================================================================

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log('🔍 Received reset token:', token);

    // 1️⃣ Verify token validity
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      console.log('❌ Invalid or expired reset token');
      return res.status(400).json({ msg: 'Reset link is invalid or expired.' });
    }

    // 2️⃣ Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 3️⃣ Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    console.log('✅ Password reset successful for:', user.email);

    res.status(200).json({ msg: 'Password successfully reset. You can now log in.' });
  } catch (err) {
    console.error('❌ Reset Password Error:', err);
    res.status(500).json({ msg: 'Server error during password reset.' });
  }
});

module.exports = router;
