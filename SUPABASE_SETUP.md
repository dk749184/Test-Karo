# 🗄️ Supabase Cloud Database Setup Guide

## Why Supabase?
- ✅ **100% FREE** (500MB storage)
- ✅ No server setup required
- ✅ Works directly from browser
- ✅ Data permanently saved in cloud
- ✅ No XAMPP/PHP needed

---

## 🚀 Step-by-Step Setup (10 Minutes)

### Step 1: Create Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with **GitHub** (recommended) or Email
4. Click **"New Project"**
5. Fill details:
   - **Name:** `exam-system`
   - **Database Password:** Choose strong password (save it!)
   - **Region:** Select nearest to you (e.g., Mumbai)
6. Click **"Create new project"**
7. Wait 2-3 minutes for project to be created

---

### Step 2: Create Database Tables

1. In Supabase Dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open file `database/supabase_schema.sql` from this project
4. Copy ALL the SQL code
5. Paste in Supabase SQL Editor
6. Click **"Run"** button
7. You should see: **"Success. No rows returned"**

**Tables created:**
- `users` - Students & Admins
- `exams` - All exams
- `questions` - Exam questions
- `question_bank` - Saved questions
- `exam_attempts` - Student attempts
- `student_answers` - Each answer
- `email_logs` - Email records
- `violation_logs` - Anti-cheating logs

---

### Step 3: Get API Keys

1. In Supabase Dashboard, click **"Settings"** (gear icon, bottom left)
2. Click **"API"** in the sidebar
3. Copy these two values:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```

**anon/public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx...
```

---

### Step 4: Update Code

1. Open file: `src/lib/supabase.ts`
2. Find these lines:

```typescript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Replace with your values:

```typescript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...';
```

4. Save the file

---

### Step 5: Rebuild & Run

```bash
npm run build
```

---

## ✅ Done!

Your app is now connected to Supabase Cloud Database!

**Default Login:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Student | student@demo.com | student123 |

---

## 📊 View Your Data

1. Go to Supabase Dashboard
2. Click **"Table Editor"** (left sidebar)
3. See all your tables and data
4. You can add/edit/delete records directly

---

## 🔧 Troubleshooting

### Error: "Supabase not configured"
- Check if you updated `src/lib/supabase.ts` correctly
- Make sure you ran `npm run build` after updating

### Error: "Permission denied"
- Go to Supabase → SQL Editor
- Run the RLS policies from the schema file

### Error: "Table not found"
- Make sure you ran the complete SQL schema
- Check Table Editor to see if tables exist

---

## 💡 Tips

1. **View Data:** Supabase Dashboard → Table Editor
2. **Run Queries:** Supabase Dashboard → SQL Editor
3. **API Logs:** Supabase Dashboard → API → Logs
4. **Free Limits:** 500MB storage, unlimited API calls

---

## 📱 Features Working with Supabase

| Feature | Status |
|---------|--------|
| Student Registration | ✅ Saves to cloud |
| Student Login | ✅ Verified from cloud |
| Admin Login | ✅ Role-based access |
| Create Exam | ✅ Saves to cloud |
| Question Bank | ✅ Saves to cloud |
| Take Exam | ✅ Attempt saved |
| Anti-Cheating Logs | ✅ Violations logged |
| Results | ✅ Fetched from cloud |
| Email Logs | ✅ Stored in cloud |

---

## 🎓 For MCA Viva

**What is Supabase?**
- Open-source Firebase alternative
- PostgreSQL database with REST API
- Built-in authentication
- Real-time subscriptions

**Why cloud database?**
- No server maintenance
- Accessible from anywhere
- Auto backups
- Scalable

**Database used:**
- PostgreSQL (via Supabase)
- REST API for data access
- Row Level Security (RLS) for protection
