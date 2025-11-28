import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
.then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
})
.catch(err => console.error('MongoDB error:', err));


// ========= VALIDATION REGEX =========

// Student ID format: 12-A-12345
const STUDENT_ID_REGEX = /^[0-9]{2}-[A-Z]-[0-9]{5}$/;

// Names must contain letters + spaces only
const NAME_REGEX = /^[A-Za-z ]+$/;


// ========= Student Schema =========
const studentSchema = new mongoose.Schema({
    student_id: { 
        type: String, 
        required: true, 
        unique: true,
        match: [STUDENT_ID_REGEX, "Invalid student_id format. Required: 12-A-12345"]
    },
    rfid_code: { type: String, required: true }, // no longer unique
    full_name: { type: String },
    first_name: { 
        type: String, 
        required: true,
        match: [NAME_REGEX, "First name must contain letters only"] 
    },
    middle_name: { 
        type: String,
        match: [NAME_REGEX, "Middle name must contain letters only"],
        default: ""
    },
    last_name: { 
        type: String, 
        required: true,
        match: [NAME_REGEX, "Last name must contain letters only"] 
    },
    suffix: { type: String },
    year_level: { type: String, required: true },
    school_year: { type: String, required: true },
    program: { type: String, required: true },
    photo: { type: String },
    semester: { type: String, required: true },
    email: { type: String },
    created_date: { type: Date, default: Date.now }
});

const Student = mongoose.model("Student", studentSchema);


// ========= Routes =========

// GET all students
app.get('/apis/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// POST new student
app.post('/apis/students', async (req, res) => {
    const data = req.body;

    // Manual validation
    if (!STUDENT_ID_REGEX.test(data.student_id)) {
        return res.status(400).json({ message: "Invalid student_id format. Use 12-A-12345" });
    }

    if (!NAME_REGEX.test(data.first_name) || !NAME_REGEX.test(data.last_name)) {
        return res.status(400).json({ message: "Names must contain letters only" });
    }

    const full_name = `${data.first_name} ${data.middle_name || ""} ${data.last_name} ${data.suffix || ""}`.trim();

    try {
        const student = new Student({ ...data, full_name });
        const saved = await student.save();
        res.status(201).json(saved);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Duplicate student_id" });
        }
        res.status(400).json({ message: err.message });
    }
});


// PUT update student
app.put('/apis/students/:student_id', async (req, res) => {
    try {
        const updates = { ...req.body };

        // Trim name fields
        updates.first_name = updates.first_name?.trim();
        updates.middle_name = updates.middle_name?.trim();
        updates.last_name = updates.last_name?.trim();
        updates.suffix = updates.suffix?.trim();

        // Validate names
        if (updates.first_name && !NAME_REGEX.test(updates.first_name))
            return res.status(400).json({ message: "Invalid first_name" });
        if (updates.last_name && !NAME_REGEX.test(updates.last_name))
            return res.status(400).json({ message: "Invalid last_name" });

        // Validate student ID format
        if (updates.student_id && !STUDENT_ID_REGEX.test(updates.student_id))
            return res.status(400).json({ message: "Invalid student_id format. Use 12-A-12345" });

        // Auto-update full_name
        if (updates.first_name || updates.middle_name || updates.last_name || updates.suffix) {
            const first = updates.first_name || "";
            const mid = updates.middle_name || "";
            const last = updates.last_name || "";
            const suf = updates.suffix || "";
            updates.full_name = `${first} ${mid} ${last} ${suf}`.replace(/\s+/g, " ").trim();
        }

        const updated = await Student.findOneAndUpdate(
            { student_id: req.params.student_id },
            updates,
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(404).json({ message: "Student not found" });

        res.json(updated);

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Duplicate student_id" });
        }
        res.status(400).json({ message: err.message });
    }
});


// DELETE student
app.delete('/apis/students/:student_id', async (req, res) => {
    try {
        const deleted = await Student.findOneAndDelete({ student_id: req.params.student_id });

        if (!deleted) {
            return res.status(404).json({ message: "Student not found." });
        }

        res.json({ message: "Student deleted successfully." });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
