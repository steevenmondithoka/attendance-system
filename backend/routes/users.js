// backend/routes/users.js
const express = require('express');
const router = express.Router();
// Import your middleware
const uploadAvatar = require('../middleware/uploadMiddleware'); 
const { protect } = require('../middleware/authMiddleware'); 
// Import your controller
const { updateAvatar } = require('../controllers/userController'); 
// ... other imports

// The protect middleware runs first to authenticate the user
// The uploadAvatar middleware runs next to process the file and handle errors
router.route('/avatar')
    .put(protect, uploadAvatar, updateAvatar); 
    
// ... export router