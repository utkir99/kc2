-- ============================================================
-- Migration 2: simplified structure
-- Run once in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Groups: add schedule + teacher name columns
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS day_of_week TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS class_time  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS teacher_name TEXT DEFAULT '';

-- 2. Remove teacher login accounts (teachers no longer log in)
DELETE FROM users WHERE role = 'teacher';

-- 3. Drop unused tables (lessons / attendance / grades no longer used)
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS lessons;

-- 4. Drop old teacher link on groups
ALTER TABLE groups DROP COLUMN IF EXISTS teacher_id;

-- Done!
