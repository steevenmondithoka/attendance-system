// backend/controllers/userController.js
const User = require('../models/User'); 
const path = require('path');
const fs = require('fs');

exports.updateAvatar = async (req, res, next) => {
    // req.user is set by your 'protect' middleware
    if (!req.user || !req.file) {
        // This case should be handled by Multer's error or the route definition
        return res.status(400).json({ success: false, msg: 'No file uploaded or user not authenticated.' });
    }

    try {
        const user = await User.findById(req.user.id).select('+avatarUrl'); // Assuming avatarUrl exists and might be selected:false

        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found.' });
        }

        // 1. Delete old avatar file if it exists and is not a default/placeholder
        if (user.avatarUrl && !user.avatarUrl.startsWith('/default/')) {
            // Construct the absolute path to the old file
            const oldFilePath = path.join('public', user.avatarUrl);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath); // Delete the old file
            }
        }

        // 2. Update the user's avatarUrl in the database
        // The path should be relative to the public URL for serving
        const filePath = `/uploads/avatars/${req.file.filename}`; 
        user.avatarUrl = filePath;
        await user.save();
        
        // 3. Return the updated user object (EXCLUDE PASSWORD!)
        res.status(200).json({
            success: true,
            msg: 'Profile picture updated.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            }
        });

    } catch (err) {
        console.error("Error updating avatar:", err);
        res.status(500).json({ success: false, msg: 'Server error during avatar update.' });
    }
};