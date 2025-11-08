// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the directory exists
const uploadDir = path.join('public', 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set Storage Engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // Create a unique filename: user-ID-timestamp.ext
        // req.user.id is set by the 'protect' middleware
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Init Upload
const uploadAvatar = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5,000,000 bytes = 5MB
    fileFilter: (req, file, cb) => {
        // Check File Type
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports images (jpg/jpeg/png)!'));
    }
}).single('avatar'); // 'avatar' MUST match formData.append('avatar', ...) in the frontend

module.exports = (req, res, next) => {
    uploadAvatar(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Multer-specific errors (e.g., file size)
            return res.status(400).json({ success: false, msg: `Upload failed: ${err.code}. Max size is 5MB.` });
        } else if (err) {
            // Other errors (e.g., file filter)
            return res.status(400).json({ success: false, msg: err.message });
        }
        // Success
        next();
    });
};