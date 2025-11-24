import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;

// Use your MongoDB Atlas URL
const MONGO_URI = 'mongodb+srv://SSAAMReg:uFLm2a3PHfpmUEUC@cluster0.bnwy9iy.mongodb.net/dbconnect?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.error('Error connecting to MongoDB Atlas:', err);
});

const userSchema = new mongoose.Schema({
    name: String,
    age: String
});

const User = mongoose.model('User', userSchema);

app.use(express.json());

// GET users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST users
app.post('/users', async (req, res) => {
    const user = new User({
        name: req.body.name,
        age: req.body.age
    });
    
    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});