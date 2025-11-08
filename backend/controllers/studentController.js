const Student = require("../models/Student");
const Class = require("../models/Class");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const csv = require("csv-parser");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);


// --- NEW CONTROLLER FUNCTION (Ensure this is present) ---
/**
 * @desc    Get the profile of the currently logged-in student
 * @route   GET /api/students/me
 * @access  Private (Student)
 */
exports.getMyStudentProfile = async (req, res) => {
    try {
        // req.user.id is added by the 'protect' middleware
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Not authorized, user ID missing.' });
        }

        const student = await Student.findOne({ user: req.user.id }).select('-user');

        if (!student) {
            return res.status(404).json({ msg: 'Student profile not found.' });
        }

        res.status(200).json({ success: true, data: student });

    } catch (err) {
        console.error("Error in getMyStudentProfile:", err.message);
        res.status(500).json({ error: "Server error while fetching student profile." });
    }
};

/**
 * @desc    Get a single student's information
 * @route   GET /api/students/:id
 * @access  Private
 */
exports.getStudentInfo = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("user", "name email");
    if (!student) {
      return res.status(404).json({ success: false, msg: "Student not found" });
    }
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    console.error("Error in getStudentInfo:", err.message);
    res.status(500).json({ error: "Server error while fetching student data." });
  }
};

/**
 * @desc    Add a single student to a class
 * @route   POST /api/students/add/:classId
 * @access  Private (Teacher)
 */
exports.addStudentToClass = async (req, res) => {
  const { classId } = req.params;
  // --- MODIFIED: Destructure new fields from req.body ---
  const { name, email, rollNo, year, department } = req.body;

  // --- MODIFIED: Update validation ---
  if (!name || !email || !rollNo || !year || !department) {
    return res.status(400).json({ msg: "Please provide name, email, roll number, year, and department." });
  }

  try {
    const course = await Class.findById(classId);
    if (!course) {
      return res.status(404).json({ msg: "Class not found." });
    }

    let user = await User.findOne({ email });
    let student;

    if (user) {
      student = await Student.findOne({ user: user._id });
      if (!student) {
        // If user exists but not as a student, create the student profile
        student = new Student({ user: user._id, rollNo, year, department });
        await student.save();
      }
      if (course.students.includes(student._id)) {
        return res.status(400).json({ msg: "This student is already enrolled in this class." });
      }
    } else {
      const defaultPassword = "rgukt@123";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      user = new User({ name, email, password: hashedPassword, role: "student" });
      await user.save();

      // --- MODIFIED: Add year and department when creating a new student ---
      student = new Student({ user: user._id, rollNo, year, department });
      await student.save();

      await req.emitDashboardData();
    }

    course.students.push(student._id);
    await course.save();

    res.status(201).json({
      success: true,
      msg: `Student ${name} successfully enrolled in the class.`,
      // --- MODIFIED: Return new data in the response ---
      student: { id: student._id, name: user.name, email: user.email, rollNo: student.rollNo, year: student.year, department: student.department },
    });
  } catch (err) {
    console.error("Error in addStudentToClass:", err.message);
    // Provide more specific error for validation failures
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Server error while enrolling the student." });
  }
};

async function processStudentRow(row, index, course, processedEmails) {
    const normalizedRow = Object.keys(row).reduce((acc, key) => {
        acc[key.trim().toLowerCase()] = row[key];
        return acc;
    }, {});

    // --- MODIFIED: Get year and department from the row ---
    const { name, email, rollno, year, department } = normalizedRow;

    // --- MODIFIED: Update validation ---
    if (!name || !email || !rollno || !year || !department) {
        return { error: { row: index + 1, email: email || 'N/A', reason: "Missing required fields (name, email, rollNo, year, department)." } };
    }
    if (processedEmails.has(email)) {
        return { error: { row: index + 1, email, reason: "Duplicate email within the CSV file. Skipping." } };
    }
    processedEmails.add(email);
    try {
        let user = await User.findOne({ email });
        let student;
        if (user) {
            student = await Student.findOne({ user: user._id });
            if (!student) {
                // --- MODIFIED: Add year/dept when creating student for existing user ---
                student = new Student({ user: user._id, rollNo: rollno, year, department });
                await student.save();
            }
            if (course.students.includes(student._id)) {
                return { error: { row: index + 1, email, reason: "Student is already enrolled in this class." } };
            }
        } else {
            const defaultPassword = "rgukt@123";
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(defaultPassword, salt);
            user = new User({ name, email, password: hashedPassword, role: "student" });
            await user.save();

            // --- MODIFIED: Add year/dept when creating new user and student ---
            student = new Student({ user: user._id, rollNo: rollno, year, department });
            await student.save();
        }
        return { studentId: student._id };
    } catch (dbError) {
        // Catches validation errors from the schema (e.g., invalid department)
        return { error: { row: index + 1, email, reason: `Database error: ${dbError.message}` } };
    }
}
/**
 * @desc    Bulk register students from a CSV file using batch processing
 * @route   POST /api/students/bulk-register/:classId
 * @access  Private (Teacher)
 */
exports.bulkRegisterStudents = async (req, res) => {
    const { classId } = req.params;
    let filePath = req.file?.path;

    if (!filePath) {
        return res.status(400).json({ msg: "No file uploaded." });
    }

    try {
        const course = await Class.findById(classId);
        if (!course) {
            return res.status(404).json({ msg: "Class not found." });
        }
        if (course.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ msg: "You do not have permission to modify this class." });
        }

        const rows = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath).pipe(csv()).on('data', (data) => rows.push(data)).on('end', resolve).on('error', reject);
        });

        const studentsToEnroll = [];
        const errors = [];
        const processedEmails = new Set();
        const BATCH_SIZE = 20;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map((row, indexInBatch) => processStudentRow(row, i + indexInBatch, course, processedEmails));
            const results = await Promise.allSettled(batchPromises);
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    if (result.value.studentId) studentsToEnroll.push(result.value.studentId);
                    else if (result.value.error) errors.push(result.value.error);
                } else {
                    errors.push({ row: 'N/A', email: 'N/A', reason: `An unexpected error occurred: ${result.reason.message}` });
                }
            });
        }

        if (studentsToEnroll.length > 0) {
            await Class.updateOne({ _id: classId }, { $addToSet: { students: { $each: studentsToEnroll } } });
        }
        
        // --- REAL-TIME UPDATE TRIGGER ---
        // After the entire bulk process is complete, send a single update.
        if (studentsToEnroll.length > 0) {
            await req.emitDashboardData();
        }

        res.status(201).json({
            success: true,
            msg: `Bulk import complete. Processed ${rows.length} records.`,
            summary: `${studentsToEnroll.length} students enrolled successfully, ${errors.length} failed or were skipped.`,
            errors: errors,
        });

    } catch (err) {
        console.error("[Bulk Register] CRITICAL ERROR:", err.message);
        res.status(500).json({ error: "A critical server error occurred during the bulk registration process." });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try {
                await unlinkAsync(filePath);
            } catch (cleanupErr) {
                console.error("Error cleaning up uploaded file:", cleanupErr.message);
            }
        }
    }
};