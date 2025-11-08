const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Or your auth middleware
const { isTeacher } = require('../middleware/roleMiddleware'); // Or your role middleware

// --- UPDATED: Import all necessary functions ---
const {
    markAttendance,
    getClassAttendance,
    getStudentAttendanceHistory,
    getAttendanceReportForClass,     // <-- Add this
    getAttendanceReportForStudent      // <-- And this
} = require('../controllers/attendanceController');


// --- Existing Routes (No changes) ---
router.post('/mark', protect, isTeacher, markAttendance);
router.get('/class/:id', protect, getClassAttendance);
router.get('/student/:id', protect, getStudentAttendanceHistory);


// --- NEW REPORTING ROUTES ---
// This must be a teacher to access these analytics
router.get('/report/class/:classId', protect, isTeacher, getAttendanceReportForClass);
router.get('/report/class/:classId/student/:studentId', protect, isTeacher, getAttendanceReportForStudent);


module.exports = router;