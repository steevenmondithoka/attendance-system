const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false, // This is a good security practice - password won't be returned by default
    },
    role: {
        type: String,
        // --- THIS IS THE FIX ---
        // Added 'admin' to the list of possible roles.
        enum: ['student', 'teacher', 'admin'],
        default: 'student',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
       avatarUrl: {
        type: String,
        default: '/default/avatar.png', // A placeholder or default image path
        select: false, // Prevents sending it by default on login/get user, but we explicitly select it in the controller
    },
     resetPasswordToken: String,
    resetPasswordExpire: Date,
});

module.exports = mongoose.model('User', UserSchema);