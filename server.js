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
  process.env.SUPABASE_URL || 'https://invalid.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Auth Middleware ----
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '세션이 만료되었습니다. 다시 로그인하세요.' });
  }
}

// ---- LOGIN ----
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '아이디와 비밀번호를 입력하세요' });

    const { data: user, error } = await supabase
      .from('users').select('*').eq('username', username).single();

    if (error || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name },
      JWT_SECRET, { expiresIn: '12h' }
    );
    res.json({ token, name: user.name, id: user.id });
  } catch (e) {
    res.status(500).json({ error: '서버 오류: ' + e.message });
  }
});

// ---- Change own password ----
app.put('/api/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: '모든 항목을 입력하세요' });
    if (newPassword.length < 6) return res.status(400).json({ error: '새 비밀번호는 6자 이상이어야 합니다' });

    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다' });
    }
    await supabase.from('users').update({ password: bcrypt.hashSync(newPassword, 10) }).eq('id', req.user.id);
    res.json({ message: '비밀번호가 변경되었습니다' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==== GROUPS ====

// All groups with student count
app.get('/api/groups', authenticate, async (req, res) => {
  try {
    const { data: groups, error } = await supabase
      .from('groups')
      .select('id, name, day_of_week, class_time, teacher_name, created_at')
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });

    const { data: students } = await supabase.from('students').select('id, group_id');
    const counts = {};
    (students || []).forEach(s => { if (s.group_id) counts[s.group_id] = (counts[s.group_id] || 0) + 1; });

    res.json((groups || []).map(g => ({ ...g, studentCount: counts[g.id] || 0 })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add group
app.post('/api/groups', authenticate, async (req, res) => {
  try {
    const { name, day_of_week, class_time, teacher_name } = req.body;
    if (!name) return res.status(400).json({ error: '반 이름을 입력하세요' });
    const { data, error } = await supabase
      .from('groups')
      .insert({ name, day_of_week: day_of_week || '', class_time: class_time || '', teacher_name: teacher_name || '' })
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update group
app.put('/api/groups/:id', authenticate, async (req, res) => {
  try {
    const { name, day_of_week, class_time, teacher_name } = req.body;
    const { error } = await supabase
      .from('groups')
      .update({ name, day_of_week, class_time, teacher_name })
      .eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: '수정되었습니다' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete group (students become unassigned)
app.delete('/api/groups/:id', authenticate, async (req, res) => {
  try {
    await supabase.from('students').update({ group_id: null }).eq('group_id', req.params.id);
    const { error } = await supabase.from('groups').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: '삭제되었습니다' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==== STUDENTS ====

// Students (optionally by group)
app.get('/api/students', authenticate, async (req, res) => {
  try {
    let q = supabase
      .from('students')
      .select('id, name, gender, visa_type, nationality, phone, address, group_id, created_at')
      .order('name', { ascending: true });
    if (req.query.group_id) q = q.eq('group_id', req.query.group_id);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add student
app.post('/api/students', authenticate, async (req, res) => {
  try {
    const { name, gender, visa_type, nationality, phone, address, group_id } = req.body;
    if (!name) return res.status(400).json({ error: '학생 이름을 입력하세요' });
    const { data, error } = await supabase
      .from('students')
      .insert({
        name,
        gender: gender || '',
        visa_type: visa_type || '',
        nationality: nationality || '',
        phone: phone || '',
        address: address || '',
        group_id: group_id || null
      })
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update student
app.put('/api/students/:id', authenticate, async (req, res) => {
  try {
    const { name, gender, visa_type, nationality, phone, address, group_id } = req.body;
    const { error } = await supabase
      .from('students')
      .update({ name, gender, visa_type, nationality, phone, address, group_id: group_id || null })
      .eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: '수정되었습니다' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete student
app.delete('/api/students/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase.from('students').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: '삭제되었습니다' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Start ----
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
