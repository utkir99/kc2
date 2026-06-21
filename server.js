require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'ulsan_korean_class_secret_2024';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Auth Middleware ----
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please login again.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// ---- LOGIN ----
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Enter username and password' });

    const { data: user, error } = await supabase
      .from('users').select('*').eq('username', username).single();

    if (error || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET, { expiresIn: '12h' }
    );
    res.json({ token, role: user.role, name: user.name, id: user.id });
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// ==== ADMIN API ====

// Get all teachers
app.get('/api/admin/teachers', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data: teachers } = await supabase
      .from('users').select('id, username, name, created_at').eq('role', 'teacher').order('created_at', { ascending: false });

    const result = await Promise.all((teachers || []).map(async t => {
      const { count: groupCount } = await supabase.from('groups').select('*', { count: 'exact', head: true }).eq('teacher_id', t.id);
      const { data: groupIds } = await supabase.from('groups').select('id').eq('teacher_id', t.id);
      const ids = (groupIds || []).map(g => g.id);
      let studentCount = 0;
      if (ids.length > 0) {
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).in('group_id', ids);
        studentCount = count || 0;
      }
      return { ...t, groupCount: groupCount || 0, studentCount };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add teacher
app.post('/api/admin/teachers', authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password || !name) return res.status(400).json({ error: 'Fill all fields' });

    const hashed = bcrypt.hashSync(password, 10);
    const { data, error } = await supabase
      .from('users').insert({ username, password: hashed, name, role: 'teacher' }).select().single();

    if (error) return res.status(400).json({ error: 'Username already in use' });
    res.json({ id: data.id, message: `Teacher '${name}' added successfully` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Change teacher password
app.put('/api/admin/teachers/:id/password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Enter new password' });
    const hashed = bcrypt.hashSync(password, 10);
    await supabase.from('users').update({ password: hashed }).eq('id', req.params.id).eq('role', 'teacher');
    res.json({ message: 'Password changed successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete teacher
app.delete('/api/admin/teachers/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await supabase.from('users').delete().eq('id', req.params.id).eq('role', 'teacher');
    res.json({ message: 'Teacher deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// All groups (admin)
app.get('/api/admin/groups', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data: groups } = await supabase
      .from('groups').select('*, users(name)').order('created_at', { ascending: false });

    const result = await Promise.all((groups || []).map(async g => {
      const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('group_id', g.id);
      return { ...g, id: g.id, teacherName: g.users?.name, studentCount: count || 0 };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// All students (admin)
app.get('/api/admin/students', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data: students } = await supabase
      .from('students')
      .select('*, groups(name, users(name))')
      .order('created_at', { ascending: false });

    const result = (students || []).map(s => ({
      ...s, id: s.id,
      group_name: s.groups?.name || null,
      teacher_name: s.groups?.users?.name || null
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add student (admin)
app.post('/api/admin/students', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, visa_type, address, gender, nationality, phone, group_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Student name is required' });

    const { data, error } = await supabase
      .from('students').insert({
        name, visa_type: visa_type || null, address: address || null,
        gender: gender || null, nationality: nationality || null,
        phone: phone || null, group_id: group_id || null
      }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id, message: `Student '${name}' added successfully` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Edit student (admin)
app.put('/api/admin/students/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, visa_type, address, gender, nationality, phone, group_id } = req.body;
    await supabase.from('students').update({
      name, visa_type: visa_type || null, address: address || null,
      gender: gender || null, nationality: nationality || null,
      phone: phone || null, group_id: group_id || null
    }).eq('id', req.params.id);
    res.json({ message: 'Student updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete student (admin)
app.delete('/api/admin/students/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await supabase.from('students').delete().eq('id', req.params.id);
    res.json({ message: 'Student deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin stats
app.get('/api/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [{ count: teachers }, { count: groups }, { count: students }, { count: lessons }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabase.from('groups').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
    ]);
    res.json({ teachers: teachers || 0, groups: groups || 0, students: students || 0, lessons: lessons || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Teacher's students (admin view)
app.get('/api/admin/teachers/:id/students', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data: groups } = await supabase.from('groups').select('id, name').eq('teacher_id', req.params.id);
    const ids = (groups || []).map(g => g.id);
    if (!ids.length) return res.json([]);
    const { data: students } = await supabase.from('students').select('*').in('group_id', ids);
    const result = (students || []).map(s => ({
      ...s, groupName: groups.find(g => g.id === s.group_id)?.name
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==== TEACHER API ====

// My groups
app.get('/api/teacher/groups', authenticate, async (req, res) => {
  try {
    const { data: groups } = await supabase
      .from('groups').select('*').eq('teacher_id', req.user.id).order('created_at', { ascending: false });

    const result = await Promise.all((groups || []).map(async g => {
      const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('group_id', g.id);
      return { ...g, student_count: count || 0 };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create group
app.post('/api/teacher/groups', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Enter group name' });
    const { data } = await supabase.from('groups').insert({ name, teacher_id: req.user.id }).select().single();
    res.json({ id: data.id, message: `Group '${name}' created` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete group
app.delete('/api/teacher/groups/:id', authenticate, async (req, res) => {
  try {
    const { data: group } = await supabase.from('groups').select('id').eq('id', req.params.id).eq('teacher_id', req.user.id).single();
    if (!group) return res.status(403).json({ error: 'Access denied' });
    await supabase.from('groups').delete().eq('id', req.params.id);
    res.json({ message: 'Group deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Group students
app.get('/api/teacher/groups/:id/students', authenticate, async (req, res) => {
  try {
    const { data: group } = await supabase.from('groups').select('*').eq('id', req.params.id).eq('teacher_id', req.user.id).single();
    if (!group) return res.status(403).json({ error: 'Access denied' });
    const { data: students } = await supabase.from('students').select('*').eq('group_id', req.params.id).order('name');
    res.json({ group, students: students || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Group lessons
app.get('/api/teacher/groups/:id/lessons', authenticate, async (req, res) => {
  try {
    const { data: group } = await supabase.from('groups').select('id').eq('id', req.params.id).eq('teacher_id', req.user.id).single();
    if (!group) return res.status(403).json({ error: 'Access denied' });
    const { data: lessons } = await supabase.from('lessons').select('*').eq('group_id', req.params.id).order('lesson_date', { ascending: false });
    res.json(lessons || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add lesson
app.post('/api/teacher/lessons', authenticate, async (req, res) => {
  try {
    const { group_id, lesson_date, title } = req.body;
    const { data: group } = await supabase.from('groups').select('id').eq('id', group_id).eq('teacher_id', req.user.id).single();
    if (!group) return res.status(403).json({ error: 'Access denied' });
    if (!lesson_date) return res.status(400).json({ error: 'Enter lesson date' });
    const { data } = await supabase.from('lessons').insert({ group_id, lesson_date, title: title || null }).select().single();
    res.json({ id: data.id, message: 'Lesson added' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete lesson
app.delete('/api/teacher/lessons/:id', authenticate, async (req, res) => {
  try {
    const { data: lesson } = await supabase.from('lessons').select('*, groups(teacher_id)').eq('id', req.params.id).single();
    if (!lesson || lesson.groups.teacher_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    await supabase.from('lessons').delete().eq('id', req.params.id);
    res.json({ message: 'Lesson deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Lesson records (attendance + grades)
app.get('/api/teacher/lessons/:id/records', authenticate, async (req, res) => {
  try {
    const { data: lesson } = await supabase.from('lessons').select('*, groups(teacher_id, name)').eq('id', req.params.id).single();
    if (!lesson || lesson.groups.teacher_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const { data: students } = await supabase.from('students').select('*').eq('group_id', lesson.group_id).order('name');
    const { data: attRecords } = await supabase.from('attendance').select('*').eq('lesson_id', req.params.id);
    const { data: gradeRecords } = await supabase.from('grades').select('*').eq('lesson_id', req.params.id);

    const records = (students || []).map(s => ({
      ...s,
      present: attRecords?.find(a => a.student_id === s.id)?.present ?? null,
      score: gradeRecords?.find(g => g.student_id === s.id)?.score ?? null
    }));

    res.json({ lesson, records });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Save attendance
app.post('/api/teacher/lessons/:id/attendance', authenticate, async (req, res) => {
  try {
    const { data: lesson } = await supabase.from('lessons').select('*, groups(teacher_id)').eq('id', req.params.id).single();
    if (!lesson || lesson.groups.teacher_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const { student_id, present } = req.body;
    await supabase.from('attendance').upsert(
      { lesson_id: req.params.id, student_id, present },
      { onConflict: 'lesson_id,student_id' }
    );
    res.json({ message: 'Attendance saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Save grade
app.post('/api/teacher/lessons/:id/grade', authenticate, async (req, res) => {
  try {
    const { data: lesson } = await supabase.from('lessons').select('*, groups(teacher_id)').eq('id', req.params.id).single();
    if (!lesson || lesson.groups.teacher_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const { student_id, score } = req.body;
    if (score < 0 || score > 100) return res.status(400).json({ error: 'Score must be 0-100' });

    await supabase.from('grades').upsert(
      { lesson_id: req.params.id, student_id, score },
      { onConflict: 'lesson_id,student_id' }
    );
    res.json({ message: 'Grade saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Student stats
app.get('/api/student/:id/stats', authenticate, async (req, res) => {
  try {
    const { data: student } = await supabase.from('students').select('*').eq('id', req.params.id).single();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { data: attRecords } = await supabase.from('attendance').select('*').eq('student_id', req.params.id);
    const { data: gradeRecords } = await supabase.from('grades').select('*').eq('student_id', req.params.id);

    const total = attRecords?.length || 0;
    const presentCount = attRecords?.filter(a => a.present === true).length || 0;
    const avgScore = gradeRecords?.length
      ? Math.round(gradeRecords.reduce((s, g) => s + g.score, 0) / gradeRecords.length)
      : null;

    res.json({ student, att: { total, present_count: presentCount }, avgScore, gradeData: gradeRecords || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});

module.exports = app;
