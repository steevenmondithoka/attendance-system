const express = require('express');
const multer = require('multer');

// --- UPDATED: Make sure getMyStudentProfile is imported ---
const {
    addStudentToClass,
    getStudentInfo,
    bulkRegisterStudents,
    getMyStudentProfile // <-- Ensure this is listed here
} = require('../controllers/studentController');

// It's common practice to have middleware in its own directory
const { protect } = require('../middleware/authMiddleware');
const { isTeacher } = require('../middleware/roleMiddleware');

const router = express.Router();

// Configure multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// --- NEW ROUTE ---
// @route   GET /api/students/me
// @desc    Get the profile of the currently logged-in student
// @access  Private (Student)
// This route MUST be placed *before* the '/:id' route.
router.get('/me', protect, getMyStudentProfile);


// --- EXISTING ROUTES ---

// Route to add a single student to a class
// POST /api/students/add/:classId
router.post('/add/:classId', protect, isTeacher, addStudentToClass);

// Route to bulk register students from a CSV file
// POST /api/students/bulk-register/:classId
router.post('/bulk-register/:classId', protect, isTeacher, upload.single('file'), bulkRegisterStudents);

// Route to get information for a single student by their ID
// GET /api/students/:id
// This dynamic route must come *after* specific routes like '/me'.
router.get('/:id', protect, getStudentInfo);

module.exports = router;