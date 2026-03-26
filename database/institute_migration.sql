-- =============================================
-- INSTITUTE FEATURE - SUPABASE MIGRATION
-- AI-Based Online Examination System
-- =============================================
--
-- HOW TO USE:
-- 1. Supabase Dashboard open karein → SQL Editor
-- 2. Yeh poora SQL copy karein
-- 3. Paste karein aur "Run" click karein
--
-- NOTE: Yeh existing data ko delete NAHI karega.
--       Sirf nayi columns aur changes add karega.
-- =============================================


-- =============================================
-- STEP 1: users table mein nayi columns add karo
-- =============================================

-- Institute ka naam (e.g., "IIT Hyderabad")
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS institute_name VARCHAR(255);

-- Institute ka unique code (e.g., "IIT001")
-- Students is code se apne institute se linked hote hain
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS institute_code VARCHAR(50);

-- Student ke roll number ki tarah, student ka institute code store hoga yahan
-- (Yeh already existed, but agar nahi hai toh add hoga)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS student_institute_code VARCHAR(50);


-- =============================================
-- STEP 2: role column ka CHECK constraint update karo
-- 'institute' role allow karo
-- =============================================

-- Pehle purana constraint drop karo
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

-- Naya constraint add karo jo 'institute' bhi allow kare
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('student', 'admin', 'institute'));


-- =============================================
-- STEP 3: Demo institute user add karo
-- =============================================

INSERT INTO users (
  email,
  password_hash,
  name,
  role,
  institute_name,
  institute_code,
  department
)
VALUES (
  'institute@demo.com',
  'institute123',
  'Demo Institute',
  'institute',
  'Demo Institute of Technology',
  'DIT001',
  'Administration'
)
ON CONFLICT (email) DO NOTHING;


-- =============================================
-- STEP 4: student_institute_code column rename fix
-- (Agar aap ne pehle institute_code column already add kiya tha
--  students ke liye, toh yeh handle karta hai)
-- =============================================

-- Students ke liye ek alag column: unka registered institute code
-- Yeh woh code hai jo student ne registration mein daala tha
COMMENT ON COLUMN users.student_institute_code
  IS 'Institute code entered by student during registration. Links student to an institute.';

COMMENT ON COLUMN users.institute_code
  IS 'Unique code of the institute account. Used to identify the institute.';

COMMENT ON COLUMN users.institute_name
  IS 'Full name of the institute (only for institute role users).';


-- =============================================
-- STEP 5: Helpful indexes add karo (performance)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_institute_code
  ON users(institute_code);

CREATE INDEX IF NOT EXISTS idx_users_student_institute_code
  ON users(student_institute_code);

CREATE INDEX IF NOT EXISTS idx_users_role
  ON users(role);


-- =============================================
-- STEP 6: Verify karo — yeh query chalao
-- Sab theek hai toh results dikhenge
-- =============================================

-- Yeh query chalake check karo:
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- =============================================
-- MIGRATION COMPLETE!
-- Ab aap institute accounts create kar sakte ho.
-- =============================================
