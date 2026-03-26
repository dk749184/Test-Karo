# 🎓 AI-Based Online Examination System - Setup Guide

## XAMPP + MySQL Setup Instructions (Hindi + English)

---

## 📋 Prerequisites (पहले से होना चाहिए)

1. **XAMPP** installed on your computer
2. **Node.js** (for React frontend)
3. **Web Browser** (Chrome recommended)

---

## 🚀 Step-by-Step Setup

### Step 1: Start XAMPP (XAMPP शुरू करें)

1. Open **XAMPP Control Panel**
2. Click **Start** on **Apache**
3. Click **Start** on **MySQL**
4. Both should show green "Running" status

```
Apache  [Start] → Running ✅
MySQL   [Start] → Running ✅
```

---

### Step 2: Create Database (Database बनाएं)

1. Open browser and go to: **http://localhost/phpmyadmin**
2. Click on **"New"** in left sidebar
3. Enter database name: `exam_system`
4. Click **"Create"**

**OR Import SQL File:**

1. In phpMyAdmin, click on `exam_system` database
2. Click **"Import"** tab
3. Click **"Choose File"**
4. Select the file: `database/exam_system.sql`
5. Click **"Go"** at bottom

```
✅ Database created successfully!
```

---

### Step 3: Copy Backend Files (Backend files copy करें)

Copy the `backend` folder to XAMPP's htdocs directory:

**Windows:**
```
C:\xampp\htdocs\exam_system\backend\
```

**macOS:**
```
/Applications/XAMPP/htdocs/exam_system/backend/
```

Your folder structure should be:
```
htdocs/
└── exam_system/
    └── backend/
        ├── config.php
        ├── auth.php
        ├── exams.php
        ├── attempts.php
        ├── students.php
        └── email.php
```

---

### Step 4: Test Backend API (Backend test करें)

Open browser and go to:
```
http://localhost/exam_system/backend/exams.php?action=public
```

You should see JSON response:
```json
{
  "success": true,
  "data": [...]
}
```

If you see this, backend is working! ✅

---

### Step 5: Update Frontend API URL (Frontend में API URL बदलें)

Open file: `src/services/api.ts`

Change line 4:
```typescript
const API_BASE_URL = 'http://localhost/exam_system/backend';
```

Make sure this matches your XAMPP path.

---

### Step 6: Run Frontend (Frontend चलाएं)

In terminal/command prompt:

```bash
cd your-project-folder
npm install
npm run dev
```

Open browser: **http://localhost:5173**

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@demo.com | admin123 |
| **Student** | student@demo.com | student123 |

---

## ⚠️ Common Errors & Solutions

### Error 1: "Connection refused"
**Solution:** Make sure XAMPP Apache and MySQL are running

### Error 2: "Database not found"
**Solution:** Import the SQL file in phpMyAdmin

### Error 3: "CORS error"
**Solution:** The config.php already has CORS headers. Make sure you're using the correct URL.

### Error 4: "Access denied for user 'root'@'localhost'"
**Solution:** Open `backend/config.php` and check:
```php
define('DB_USER', 'root');  // Your MySQL username
define('DB_PASS', '');      // Your MySQL password (empty for default XAMPP)
```

---

## 📁 Complete File Structure

```
project/
├── database/
│   └── exam_system.sql          # MySQL database schema
│
├── backend/                      # PHP Backend (copy to htdocs)
│   ├── config.php               # Database configuration
│   ├── auth.php                 # Authentication API
│   ├── exams.php                # Exams CRUD API
│   ├── attempts.php             # Exam attempts API
│   ├── students.php             # Students management API
│   └── email.php                # Email sending API
│
├── src/                         # React Frontend
│   ├── components/              # UI components
│   ├── context/                 # Auth & Exam context
│   ├── pages/                   # All pages
│   ├── services/
│   │   ├── api.ts              # API service for MySQL
│   │   └── emailService.ts     # EmailJS service
│   └── App.tsx                  # Main app
│
└── SETUP_INSTRUCTIONS.md        # This file
```

---

## 🔧 Database Tables

| Table | Description |
|-------|-------------|
| `users` | Students & Admins |
| `exams` | All exams |
| `questions` | Exam questions |
| `exam_attempts` | Student exam attempts |
| `student_answers` | Student's answers |
| `email_logs` | Email history |
| `violation_logs` | Anti-cheating violations |
| `subjects` | Subject master |
| `topics` | Topic master |

---

## 📧 Email Setup (Optional)

The system uses **EmailJS** for sending emails from frontend.

Your EmailJS credentials in `src/services/emailService.ts`:
```typescript
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_5tsu68j',
  TEMPLATE_ID: 'template_lv8h1x1',
  PUBLIC_KEY: 'no9CR2LiwwEdtOcus',
  IS_CONFIGURED: true
};
```

---

## 🎯 Features Checklist

- ✅ Student Registration & Login
- ✅ Admin Dashboard
- ✅ Create Exam with AI Question Generation
- ✅ Public/Private Exams
- ✅ Exam Scheduling (Start/End Time)
- ✅ Enable/Disable Exams
- ✅ Anti-Cheating Module
- ✅ Tab Switch Detection
- ✅ Fullscreen Mode
- ✅ Auto-Submit on Violations
- ✅ Dynamic Watermark
- ✅ Email Confirmation
- ✅ Result Analytics
- ✅ Profile Management
- ✅ MySQL Database Integration

---

## 🆘 Need Help?

If you face any issues:

1. Check XAMPP is running
2. Check database exists
3. Check API URL is correct
4. Check browser console for errors (F12)

---

## 📝 For MCA Viva

Key points to explain:

1. **Architecture**: React Frontend + PHP Backend + MySQL Database
2. **Authentication**: JWT-based with password hashing
3. **Anti-Cheating**: Event listeners for tab switch, fullscreen, keyboard
4. **AI Questions**: Template-based generation with random values
5. **Email**: EmailJS for frontend email sending
6. **Security**: CORS, prepared statements, input sanitization

Good luck with your project! 🍀
