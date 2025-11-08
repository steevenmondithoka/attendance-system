// backend/controllers/adminController.js

const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance"); // Ensure you have this model

/**
 * Helper function to calculate a student's overall attendance percentage.
 * This is a heavy operation and should be optimized in a production system.
 */
const calculateOverallPercentage = async (studentId) => {
    // Find ALL attendance records where this student is present
    const records = await Attendance.find({ 
        "records.studentId": studentId 
    });

    if (!records || records.length === 0) {
        return 100.0; // Default to 100% if no records exist
    }

    let totalClassesAttended = 0;
    let presentOrLateCount = 0;

    // Loop through each attendance document (each represents a class session)
    records.forEach(attendanceDoc => {
        // Find the specific student's record within that session
        const studentRecord = attendanceDoc.records.find(
            rec => rec.studentId.toString() === studentId.toString()
        );

        if (studentRecord) {
            totalClassesAttended++;
            if (studentRecord.status === 'Present' || studentRecord.status === 'Late') {
                presentOrLateCount++;
            }
        }
    });

    const overallPercentage = totalClassesAttended > 0 ? ((presentOrLateCount / totalClassesAttended) * 100) : 100.0;
    return parseFloat(overallPercentage);
};

// --- API Logic for Admin Routes ---

// 1. GET Detained Count
exports.getDetainedCount = async (req, res, next) => {
    try {
        const allStudents = await Student.find().select('_id');
        let detainedCount = 0;

        for (const student of allStudents) {
            const percentage = await calculateOverallPercentage(student._id);
            if (percentage < 75) {
                detainedCount++;
            }
        }

        res.status(200).json({
            success: true,
            count: detainedCount
        });

    } catch (error) {
        console.error("Error calculating detained count:", error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

// 2. GET Teachers List with Classes
exports.getTeachersList = async (req, res, next) => {
    try {
        const teachers = await User.find({ role: 'teacher' }).select('name email');
        
        const teachersWithClasses = await Promise.all(teachers.map(async (teacher) => {
            const classes = await Class.find({ teacherId: teacher._id }).select('name subject');
            return {
                _id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                classes: classes || []
            };
        }));

        res.status(200).json(teachersWithClasses);
    } catch (error) {
        console.error("Error fetching teachers list:", error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

// 3. GET Students List with Overall Attendance Percentage
exports.getStudentsList = async (req, res, next) => {
    try {
        const students = await Student.find()
            .populate('user', 'name email')
            .select('rollNo department year');

        const studentsWithAttendance = await Promise.all(students.map(async (student) => {
            const overallPercentage = await calculateOverallPercentage(student._id);
            
            return {
                _id: student._id,
                name: student.user ? student.user.name : 'N/A',
                email: student.user ? student.user.email : 'N/A',
                rollNo: student.rollNo,
                department: student.department,
                year: student.year,
                overallPercentage: overallPercentage.toFixed(1)
            };
        }));

        res.status(200).json(studentsWithAttendance);
    } catch (error) {
        console.error("Error fetching students list:", error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

// 4. GET Classes List
exports.getClassesList = async (req, res, next) => {
    try {
        const classes = await Class.find()
            .populate('teacherId', 'name')
            .select('name subject students');

        const classesList = classes.map(cls => ({
            _id: cls._id,
            name: cls.name,
            subject: cls.subject,
            teacherName: cls.teacherId ? cls.teacherId.name : 'N/A',
            studentCount: cls.students.length
        }));

        res.status(200).json(classesList);
    } catch (error) {
        console.error("Error fetching classes list:", error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

// backend/controllers/adminController.js

// ... (imports)

// --- 5. DELETE Teacher ---
exports.deleteTeacher = async (req, res, next) => {
    const teacherId = req.params.id;

    try {
        // --- 1. Find and Delete the User Record ---
        // We find the user first to ensure they are a teacher and to check for existence
        const teacherUser = await User.findOne({ _id: teacherId, role: 'teacher' });

        if (!teacherUser) {
            console.warn(`Attempt to delete non-existent or non-teacher user with ID: ${teacherId}`);
            return res.status(404).json({ success: false, msg: 'Teacher not found or user is not a teacher.' });
        }
        
        // Final Deletion
        await User.deleteOne({ _id: teacherId });

        // --- 2. Dependency Cleanup (Crucial) ---
        // A. Remove the teacher reference from all classes they taught
        const classUpdateResult = await Class.updateMany(
            { teacherId: teacherId },
            { $unset: { teacherId: 1 } } // Safest: removes the field entirely
        );
        
        console.log(`Cleanup: Removed teacher ID from ${classUpdateResult.modifiedCount} classes.`);

        // --- 3. Success Response ---
        res.status(200).json({ 
            success: true, 
            msg: `Teacher ${teacherUser.name} deleted successfully.`,
            deletedUserId: teacherId
        });

    } catch (error) {
        console.error(`CRITICAL ERROR during teacher deletion (ID: ${teacherId}):`, error);
        res.status(500).json({ success: false, error: "A critical server error occurred during deletion." });
    }
};
// ... (rest of your adminController.js)