# 📘 Student Registration API — README

This project is a simple REST API built with **Node.js**, **Express**, and **MongoDB Atlas**.
It manages **Students**, **Users**, **Programs**, and **Courses** using CRUD operations.

---

## 🟢 How to Run the Server

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```
PORT=8000
```

3. Start the server:

```bash
node index.js
```

If successful, you should see:

```
Connected to MongoDB Atlas
Server running at http://localhost:8000
```

---

# 📌 BASE URL

```
http://localhost:8000
```

---

# 📘 STUDENTS API

## 1️⃣ GET ALL STUDENTS

**GET** `/students`

**Usage in Postman:**

* Method: **GET**
* URL: `http://localhost:8000/students`

---

## 2️⃣ CREATE NEW STUDENT

**POST** `/students`

### 📝 Required Body (JSON)

```json
{
  "student_id": "2025-001",
  "rfid_code": "RF123456",
  "first_name": "Juan",
  "middle_name": "Santos",
  "last_name": "Dela Cruz",
  "suffix": "Jr.",
  "year_level": "Grade 11",
  "course": "ICT",
  "program": "Academic Track",
  "created_by": "Admin1",
  "photo": "image_url_here"
}
```

### 📌 Postman Setup:

* Select **POST**
* URL: `http://localhost:8000/students`
* Go to **Body → raw → JSON**
* Paste the JSON

---

## 3️⃣ UPDATE STUDENT

**PUT** `/students/:id`

Example URL:

```
http://localhost:8000/students/67429b81f48e80f87bb93741
```

Body example:

```json
{
  "year_level": "Grade 12",
  "course": "HUMSS"
}
```

---

## 4️⃣ DELETE STUDENT

**DELETE** `/students/:id`

Example:

```
http://localhost:8000/students/67429b81f48e80f87bb93741
```

---

# 🧍 USERS API

## GET USERS

```
GET /users
```

## CREATE USER

```
POST /users
```

Body example:

```json
{
  "rfid_code": "RF123456",
  "user_type": "admin"
}
```

---

# 🏫 PROGRAMS API

## GET PROGRAMS

```
GET /api/programs
```

## CREATE PROGRAM

```
POST /api/programs
```

Body:

```json
{
  "program_code": "STEM",
  "description": "Science, Technology, Engineering, Mathematics"
}
```

---

# 📚 COURSES API

## GET COURSES

```
GET /courses
```

## POST COURSE

```
POST /courses
```

Body:

```json
{
  "course_code": "ICT",
  "description": "Information & Communications Technology"
}
```

---

# ❗ COMMON ERRORS

| Error                    | Meaning                |
| ------------------------ | ---------------------- |
| 400 Duplicate student_id | Student already exists |
| 400 Duplicate rfid_code  | RFID already used      |
| 404 Student not found    | Wrong ID or deleted    |

---

# ✔ Tips for Postman

### 🔹 Always use **raw → JSON** for POST/PUT

### 🔹 Ensure MongoDB Atlas network access allows your IP

### 🔹 Restart the server after code changes
