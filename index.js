import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const app = express();
dotenv.config();

const PORT = 8000;

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

app.get('/', (req, res) => {
    res.send('SSAAM Registration System API is running');
});

// ===============================
// MODELS
// ===============================

const studentSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true },
    rfid_code: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    first_name: { type: String, required: true },
    middle_name: { type: String },
    last_name: { type: String, required: true },
    suffix: { type: String },
    year_level: { type: String, required: true },
    course: { type: String, required: true },
    program: { type: String, required: true },
    photo: { type: String },
    created_by: { type: String, required: true },
    created_date: { type: Date, default: Date.now }
});


const Student = mongoose.model('Student', studentSchema);

// ===============================
// ROUTES
// ===============================

// Mangita ug students
// --- STUDENTS ---
app.get('/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Diri e register ang student
// POST new student
app.post('/students', async (req, res) => {
    const {
        student_id,
        rfid_code,
        first_name,
        middle_name,
        last_name,
        year_level,
        suffix,
        course,
        program,
        created_by,
        photo // optional
    } = req.body;

    // Validate required fields
    if (!student_id || !rfid_code || !last_name || !first_name || !year_level || !course || !program || !created_by) {
        return res.status(400).json({ message: "Please fill in all required fields." });
    }

    try {
        // Create student
        const full_name = first_name + (middle_name ? ' ' + middle_name + ' ' : ' ') + last_name + (suffix ? ` ${suffix}` : '');
        const student = new Student({
            student_id,
            rfid_code,
            full_name,
            first_name,
            middle_name,
            last_name,
            suffix,
            year_level,
            course,
            program,
            created_by,
            photo
        });

        const newStudent = await student.save();
        res.status(201).json(newStudent);
    } catch (err) {
        if (err.code === 11000) {
            // Handle duplicate student_id or rfid_code
            return res.status(400).json({ message: "Student ID or RFID code already registered." });
        }
        res.status(400).json({ message: err.message });
    }
});

// Diri editon and student data
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

// Diri idelete ang student
app.delete('/students/:id', async (req, res) => {
    try {
        const deleted = await Student.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Student not found." });
        res.json({ message: "Student deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =============================== //
//  DIRI SATA KUTOB SA REGISTER   //
// ============================== //