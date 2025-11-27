import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'; // ✅ Import cors

const app = express();
dotenv.config();

// Enable CORS so frontend on localhost can call this API
app.use(cors()); // ✅ Allow all origins by default

// Parse JSON
app.use(express.json());

// Use environment variables for PORT and MongoDB URI
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
.catch((err) => console.error('MongoDB connection error:', err));

// ===== Routes =====
app.get('/', (req, res) => {
    res.send('SSAAM Registration System API is running');
});

// ===== Student Model =====
const studentSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true },
    rfid_code: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    first_name: { type: String, required: true },
    middle_name: { type: String },
    last_name: { type: String, required: true },
    suffix: { type: String },
    year_level: { type: String, required: true },
    school_year: { type: String, required: true },
    program: { type: String, required: true },
    photo: { type: String },
    semester: { type: String, required: true },
    email: { type: String.apply, required: true },
    created_date: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// ===== Student Routes =====
app.get('/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/students', async (req, res) => {
    const {
        student_id,
        rfid_code,
        first_name,
        middle_name,
        last_name,
        year_level,
        school_year,
        suffix,
        program,
        photo,
        semester,
        email
    } = req.body;

    if (!student_id || !semester || !rfid_code || !last_name || !first_name || !year_level || !school_year || !program) {
        return res.status(400).json({ message: "Please fill in all required fields." });
    }

    try {
        const full_name = first_name + (middle_name ? ' ' + middle_name + ' ' : ' ') + last_name + (suffix ? ` ${suffix}` : '');
        const student = new Student({
            student_id,
            rfid_code,
            full_name,
            first_name,
            middle_name,
            last_name,
            year_level,
            school_year,
            suffix,
            program,
            photo,
            semester,
            email
        });

        const newStudent = await student.save();
        res.status(201).json(newStudent);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Student ID or RFID code already registered." });
        }
        res.status(400).json({ message: err.message });
    }
});

app.put('/students/:id', async (req, res) => {
    try {
        const updated = await Student.findByIdAndUpdate(req.params.rfid_code, req.body, { new: true, runValidators: true });
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
        const deleted = await Student.findByIdAndDelete(req.params.rfid_code);
        if (!deleted) return res.status(404).json({ message: "Student not found." });
        res.json({ message: "Student deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
