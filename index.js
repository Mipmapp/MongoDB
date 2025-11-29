import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const SSAAM_API_KEY = process.env.JWT_SECRET || "SECRET_iKALAT_PALANG_NIMO";

// ========== MONGO CONNECTION ==========
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
.then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
})
.catch(err => console.error('MongoDB error:', err));


// ========== VALIDATION REGEX ==========
const STUDENT_ID_REGEX = /^[0-9]{2}-[A-Z]-[0-9]{5}$/;
const NAME_REGEX = /^[\p{L}\s'-]+$/u;

// ========== Student Schema ==========
const studentSchema = new mongoose.Schema({
    student_id: {
        type: String,
        required: true,
        unique: true,
        match: [STUDENT_ID_REGEX, "Invalid student_id format. Required: 12-A-12345"]
    },
    rfid_code: { type: String, default: "N/A" },
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


// ========== MASTER ADMIN Schema ==========
const masterSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

// Remove password
masterSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const Master = mongoose.model("Master", masterSchema);

// ========== AUTH MIDDLEWARE ==========
function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token)
        return res.status(401).json({ message: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, SSAAM_API_KEY);
        req.master = decoded;
        next();
    } catch {
        res.status(400).json({ message: "invalid token." });
    }
}

function studentAuth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token || token !== process.env.SSAAM_STUDENT_API_KEY) {
        return res.status(401).json({ message: "Unauthorized: Invalid key"});
    }

    next();
}

// =============================================================================
//                                 STUDENT ROUTES (Protected)
// =============================================================================

// GET all students with PAGINATION (Protected)
app.get('/apis/students', studentAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const students = await Student.find()
            .skip(skip)
            .limit(limit)
            .sort({ created_date: -1 });

        const total = await Student.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: students,
            pagination: {
                currentPage: page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new student (Protected)
app.post('/apis/students', studentAuth, async (req, res) => {
    const data = req.body;

    if (!STUDENT_ID_REGEX.test(data.student_id))
        return res.status(400).json({ message: "Invalid student_id format. Use 12-A-12345" });

    if (!NAME_REGEX.test(data.first_name) || !NAME_REGEX.test(data.last_name))
        return res.status(400).json({ message: "Names must contain letters only" });

    const full_name =
        `${data.first_name} ${data.middle_name || ""} ${data.last_name} ${data.suffix || ""}`
            .replace(/\s+/g, " ")
            .trim();

    try {
        const student = new Student({ ...data, full_name });
        const saved = await student.save();
        res.status(201).json(saved);
    } catch (err) {
        if (err.code === 11000)
            return res.status(400).json({ message: "Duplicate student_id" });

        res.status(400).json({ message: err.message });
    }
});

// UPDATE student (Protected)
app.put('/apis/students/:student_id', studentAuth, async (req, res) => {
    try {
        const updates = { ...req.body };
        delete updates.student_id;

        updates.first_name = updates.first_name?.trim();
        updates.middle_name = updates.middle_name?.trim();
        updates.last_name = updates.last_name?.trim();

        if (updates.first_name && !NAME_REGEX.test(updates.first_name))
            return res.status(400).json({ message: "Invalid first_name" });

        if (updates.last_name && !NAME_REGEX.test(updates.last_name))
            return res.status(400).json({ message: "Invalid last_name" });

        if (updates.first_name || updates.middle_name || updates.last_name || updates.suffix) {
            const first = updates.first_name || "";
            const mid = updates.middle_name || "";
            const last = updates.last_name || "";
            const suf = updates.suffix || "";
            updates.full_name = `${first} ${mid} ${last} ${suf}`.trim();
        }

        const updated = await Student.findOneAndUpdate(
            { student_id: req.params.student_id },
            updates,
            { new: true, runValidators: true, validateModifiedOnly: true }
        );

        if (!updated) return res.status(404).json({ message: "Student not found" });

        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE student (Protected)
app.delete('/apis/students/:student_id', studentAuth, async (req, res) => {
    try {
        const deleted = await Student.findOneAndDelete({ student_id: req.params.student_id });

        if (!deleted)
            return res.status(404).json({ message: "Student not found." });

        res.json({ message: "Student deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// =============================================================================
//                               STUDENT LOGIN ROUTE (NEW - POST INSTEAD OF GET)
// =============================================================================

// POST Student Login - Returns matching student data (no GET)
app.post('/apis/students/login', studentAuth, async (req, res) => {
    try {
        const { student_id, last_name } = req.body;

        if (!student_id || !last_name)
            return res.status(400).json({ message: "Student ID and Last Name required" });

        const student = await Student.findOne({ 
            student_id,
            last_name: { $regex: `^${last_name}$`, $options: 'i' }
        });

        if (!student)
            return res.status(400).json({ message: "Invalid Student ID or Last Name" });

        res.json({
            message: "Login successful",
            student
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// =============================================================================
//                               MASTER ADMIN ROUTES (Public)
// =============================================================================

// CREATE ADMIN
app.post('/apis/masters', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ message: "Username and password required" });

        const existing = await Master.findOne({ username });
        if (existing)
            return res.status(400).json({ message: "Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);

        const master = await Master.create({
            username,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Admin created successfully",
            master
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// LOGIN ADMIN
app.post("/apis/masters/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const master = await Master.findOne({ username });
        if (!master)
            return res.status(400).json({ message: "Invalid username or password" });

        const valid = await bcrypt.compare(password, master.password);
        if (!valid)
            return res.status(400).json({ message: "Invalid username or password" });

        const token = jwt.sign(
            { id: master._id, username: master.username },
            SSAAM_API_KEY,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            master
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// GET all admins (Protected)
app.get('/apis/masters', auth, async (req, res) => {
    try {
        const masters = await Master.find();
        res.json(masters);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
