-- ============================================================
-- Korean Class Management System - Supabase Database Setup
-- Ulsan Foreign Workers Support Center
-- Run this SQL in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Users table (admin + teachers)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Groups/Classes table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  visa_type TEXT,
  address TEXT,
  gender TEXT,
  nationality TEXT,
  phone TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  lesson_date TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(lesson_id, student_id)
);

-- 6. Grades table
CREATE TABLE IF NOT EXISTS grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  UNIQUE(lesson_id, student_id)
);

-- ============================================================
-- Disable Row Level Security (server uses service key)
-- ============================================================
ALTER TABLE users      DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups     DISABLE ROW LEVEL SECURITY;
ALTER TABLE students   DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons    DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades     DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Default admin account (password: admin123)
-- bcrypt hash of 'admin123' with 10 rounds
-- ============================================================
INSERT INTO users (username, password, name, role)
VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lkEq',
  '관리자',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- Done! Tables created successfully.
-- ============================================================
