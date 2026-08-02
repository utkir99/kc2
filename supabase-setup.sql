-- ============================================================
-- Korean Class Management System - Supabase Database Setup (v2)
-- Ulsan Foreign Workers Support Center
-- Run this SQL in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Users table (admin accounts)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Groups/Classes table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  day_of_week TEXT DEFAULT '',
  class_time TEXT DEFAULT '',
  teacher_name TEXT DEFAULT '',
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

-- ============================================================
-- Disable Row Level Security (server uses service key)
-- ============================================================
ALTER TABLE users    DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups   DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Default admin account (password: admin123)
-- ============================================================
INSERT INTO users (username, password, name, role)
VALUES (
  'admin',
  '$2a$10$adDrQQVVHuVb1eUEgsL9WOpA/Ha5VDau5d/ubPV80BkaoklVen0yq',
  '관리자',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- Done!
-- ============================================================
