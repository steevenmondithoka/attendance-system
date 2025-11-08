const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Student = require('../models/Student');


// Add these functions at the end of your attendanceController.js file

/**
 * @desc    Get a full attendance percentage report for all students in a class
 * @route   GET /api/attendance/report/class/:classId
 * @access  Private (Teacher)
 */
exports.getAttendanceReportForClass = async (req, res) => {
    try {
        const { classId } = req.params;

        // Find all attendance records for the entire class
        const allRecords = await Attendance.find({ classId }).select('records');
        
        const studentStats = new Map();

        // Loop through each day's attendance sheet
        allRecords.forEach(sheet => {
            sheet.records.forEach(record => {
                const studentId = record.studentId.toString();

                // Initialize stats for a student if not already present
                if (!studentStats.has(studentId)) {
                    studentStats.set(studentId, { present: 0, absent: 0, late: 0, total: 0 });
                }

                const stats = studentStats.get(studentId);
                stats.total++;
                if (record.status === 'Present') stats.present++;
                else if (record.status === 'Absent') stats.absent++;
                else if (record.status === 'Late') stats.late++;
            });
        });

        // Convert the map to the final report array
        const report = Array.from(studentStats.keys()).map(studentId => {
            const stats = studentStats.get(studentId);
            const percentage = stats.total > 0 ? (((stats.present + stats.late) / stats.total) * 100).toFixed(1) : 0;
            return {
                studentId,
                ...stats,
                percentage: parseFloat(percentage),
            };
        });

        res.status(200).json(report);

    } catch (err) {
        console.error("Error in getAttendanceReportForClass:", err.message);
        res.status(500).json({ error: "Server error while generating class report." });
    }
};


/**
 * @desc    Get an attendance percentage report for a single student in a class
 * @route   GET /api/attendance/report/class/:classId/student/:studentId
 * @access  Private (Teacher)
 */
exports.getAttendanceReportForStudent = async (req, res) => {
    try {
        const { classId, studentId } = req.params;

        // Find all attendance records for the class that include the specific student
        const allRecords = await Attendance.find({ classId, 'records.studentId': studentId }).select('records');

        let present = 0, absent = 0, late = 0, total = 0;

        allRecords.forEach(sheet => {
            const studentRecord = sheet.records.find(r => r.studentId.toString() === studentId);
            if (studentRecord) {
                total++;
                if (studentRecord.status === 'Present') present++;
                else if (studentRecord.status === 'Absent') absent++;
                else if (studentRecord.status === 'Late') late++;
            }
        });

        const percentage = total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0;

        res.status(200).json({
            studentId,
            present,
            absent,
            late,
            total,
            percentage: parseFloat(percentage),
        });

    } catch (err) {
        console.error("Error in getAttendanceReportForStudent:", err.message);
        res.status(500).json({ error: "Server error while generating student report." });
    }
};

// No changes are needed in this function.
exports.markAttendance = async (req, res) => {
    const { classId, date, records } = req.body;
    try {
        const course = await Class.findById(classId);
        if (!course || course.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to mark attendance for this class' });
        }
        
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({ classId, date: attendanceDate });
        if (attendance) {
            records.forEach(record => {
                const studentRecord = attendance.records.find(r => r.studentId.toString() === record.studentId);
                if (studentRecord) studentRecord.status = record.status;
                else attendance.records.push(record);
            });
            await attendance.save();
        } else {
            attendance = new Attendance({ classId, date: attendanceDate, records });
            await attendance.save();
        }
        
        res.status(201).json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// No changes are needed in this function.
exports.getClassAttendance = async (req, res) => {
    try {
        const aClass = await Class.findById(req.params.id);
        if (!aClass) return res.status(404).json({ msg: 'Class not found' });
        if (req.user.role === 'teacher' && aClass.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        
        const attendanceDate = new Date(req.query.date);
        attendanceDate.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({ classId: req.params.id, date: attendanceDate })
            .populate({
                path: 'records.studentId',
                model: 'Student',
                populate: { path: 'user', model: 'User', select: 'name' }
            });

        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Get attendance history for a student
// @route   GET /api/attendance/student/:id
// @access  Private
exports.getStudentAttendanceHistory = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.params.id });
        if (!student) {
            return res.status(404).json({ msg: 'Student record not found for this user.' });
        }
        if (req.user.role === 'student' && req.user.id !== req.params.id) {
             return res.status(403).json({ msg: 'Not authorized to view this attendance history' });
        }
        
        const attendanceHistory = await Attendance.find({ 'records.studentId': student._id })
            // --- THIS IS THE UPDATED PART ---
            .populate({ 
                path: 'classId', 
                select: 'name subject teacherId', // 1. Select the teacherId field from the Class
                populate: {
                    path: 'teacherId', // 2. Populate the teacherId
                    model: 'User',     // 3. From the User model
                    select: 'name'     // 4. And select only the name
                }
            })
            .sort({ date: -1 });

        const studentSpecificHistory = attendanceHistory.map(att => ({
            _id: att._id,
            date: att.date,
            classId: att.classId, // This now contains the populated teacher name
            records: att.records.filter(rec => rec.studentId.toString() === student._id.toString())
        }));
            
        res.json(studentSpecificHistory);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};