import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;

const MONGO_URI = `mongodb+srv://SSAAMReg:uFLm2a3PHfpmUEUC@cluster0.bnwy9iy.mongodb.net/dbconnect?retryWrites=true&w=majority`

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
})
.catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());

// ===============================
// MODELS
// ===============================

const studentSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true },
    rfid_code: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    year_level: { type: String, required: true },
    course: { type: String, required: true },
    program: { type: String, required: true },
    photo: { type: String },
    created_by: { type: String, required: true },
    created_date: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

const userSchema = new mongoose.Schema({
    rfid_code: { type: String, required: true, unique: true },
    user_type: { type: String, enum: ['admin', 'student', 'medpub'], required: true }
});

const User = mongoose.model('User', userSchema);

const programSchema = new mongoose.Schema({
    program_code: { type: String, required: true, unique: true },
    description: { type: String, required: true }
});

const Program = mongoose.model('Program', programSchema);

const courseSchema = new mongoose.Schema({
    course_code: { type: String, required: true, unique: true },
    description: { type: String, required: true }
});

const Course = mongoose.model('Course', courseSchema);

// ===============================
// ROUTES
// ===============================

// --- STUDENTS ---
app.get('/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/students', async (req, res) => {
    try {
        const student = await Student.create(req.body);
        res.status(201).json(student);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Duplicate student_id or rfid_code." });
        }
        res.status(400).json({ message: err.message });
    }
});

app.put('/students/:id', async (req, res) => {
    try {
        const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: "Student not found." });
        res.json(updated);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Duplicate student_id or rfid_code after update." });
        }
        res.status(400).json({ message: err.message });
    }
});

app.delete('/students/:id', async (req, res) => {
    try {
        const deleted = await Student.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Student not found." });
        res.json({ message: "Student deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- USERS ---
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/users', async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Duplicate rfid_code." });
        }
        res.status(400).json({ message: err.message });
    }
});

app.put('/users/:id', async (req, res) => {
    try {
        const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: "User not found." });
        res.json(updated);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Duplicate rfid_code." });
        res.status(400).json({ message: err.message });
    }
});

app.delete('/users/:id', async (req, res) => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "User not found." });
        res.json({ message: "User deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- PROGRAMS ---
app.get('/programs', async (req, res) => {
    try {
        const programs = await Program.find();
        res.json(programs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/programs', async (req, res) => {
    try {
        const program = await Program.create(req.body);
        res.status(201).json(program);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Duplicate program_code." });
        res.status(400).json({ message: err.message });
    }
});

app.put('/programs/:id', async (req, res) => {
    try {
        const updated = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: "Program not found." });
        res.json(updated);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Duplicate program_code." });
        res.status(400).json({ message: err.message });
    }
});

app.delete('/programs/:id', async (req, res) => {
    try {
        const deleted = await Program.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Program not found." });
        res.json({ message: "Program deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- COURSES ---
app.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/courses', async (req, res) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json(course);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Duplicate course_code." });
        res.status(400).json({ message: err.message });
    }
});

app.put('/courses/:id', async (req, res) => {
    try {
        const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: "Course not found." });
        res.json(updated);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Duplicate course_code." });
        res.status(400).json({ message: err.message });
    }
});

app.delete('/courses/:id', async (req, res) => {
    try {
        const deleted = await Course.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Course not found." });
        res.json({ message: "Course deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
