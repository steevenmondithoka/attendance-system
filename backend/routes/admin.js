// backend/routes/admin.js

const express = require('express');
const router = express.Router();

// --- Import Middleware ---
// Assuming you have a 'protect' middleware for authentication in this file
const { protect } = require('../middleware/authMiddleware'); 
// Your existing admin middleware
const { isAdmin } = require('../middleware/adminMiddleware'); 

// --- Import Controller Functions ---
const { 
    getDetainedCount,
    getTeachersList,
    getStudentsList,
    getClassesList ,
    deleteTeacher
} = require('../controllers/adminController');

// --- Define Routes ---

// All routes in this file will first be protected by 'protect', then checked by 'isAdmin'
router.use(protect, isAdmin); 

router.route('/report/detained-count').get(getDetainedCount);
router.route('/teachers/list').get(getTeachersList);
router.route('/students/list').get(getStudentsList);
router.route('/classes/list').get(getClassesList);

// backend/routes/admin.js
// ... (imports)

// Add this line with your other routes:
router.route('/teachers/:id').delete(deleteTeacher);

// ... (exports)

module.exports = router;