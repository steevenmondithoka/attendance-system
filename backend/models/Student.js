const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    rollNo: {
        type: String,
        required: true,
        trim: true,
    },
    // --- NEW FIELDS ---
    year: {
        type: Number,
        required: [true, 'Please provide the student\'s academic year'],
        min: 1,
        max: 4, // Adjust as needed for your program length
    },
    department: {
        type: String,
        required: [true, 'Please provide the student\'s department'],
        uppercase: true, // Standardizes 'cse' to 'CSE'
        trim: true,
        enum: ['CSE', 'ECE','EEE', 'MECH', 'CIVIL', 'CHEM', 'META'], // Add all your valid department codes here
    },
});

// Optional but recommended: Create an index for faster lookups of students by year and department
StudentSchema.index({ year: 1, department: 1 });

module.exports = mongoose.model('Student', StudentSchema);