# 🚀 GitHub → Supabase → Vercel Deploy Qilish Qo'llanmasi
### 울산 외국인 근로자 지원센터 - 한국어 수업 관리 시스템

---

## 📋 Umumiy tartib

```
1. GitHub → kod yuklash
2. Supabase → database yaratish
3. Vercel → saytni internet'ga chiqarish
```

Taxminiy vaqt: **30-40 daqiqa**

---

## ✅ BOSQICH 1 — GitHub'ga yuklash

### 1.1 GitHub account ochish
1. https://github.com saytiga kiring
2. **Sign Up** bosing → email, username, parol kiriting
3. Email tasdiqlang

### 1.2 Yangi repository yaratish
1. GitHub'da yuqori o'ngda **+** tugmasini bosing → **New repository**
2. Quyidagilarni to'ldiring:
   - **Repository name:** `korean-class`
   - **Description:** `Korean Language Class Management System`
   - **Public** yoki **Private** tanlang (Private tavsiya etiladi)
3. **Create repository** bosing

### 1.3 Kompyuterga Git o'rnatish
1. https://git-scm.com saytidan Git yuklab oling
2. O'rnating (barcha sozlamalar default)
3. CMD (command prompt) oching va tekshiring:
   ```
   git --version
   ```

### 1.4 Kodni GitHub'ga yuklash
CMD da `korean-class` papkasiga o'ting va quyidagi buyruqlarni ketma-ket bajaring:

```bash
# 1. Git sozlash (bir marta)
git config --global user.email "sizning@email.com"
git config --global user.name "Sizning Ismingiz"

# 2. Repository boshlash
git init

# 3. Barcha fayllarni qo'shish
git add .

# 4. Birinchi commit
git commit -m "Initial commit - Korean class management system"

# 5. GitHub bilan bog'lash (repository URL ni almashtiring)
git remote add origin https://github.com/SIZNING_USERNAME/korean-class.git

# 6. Yuklash
git branch -M main
git push -u origin main
```

> ⚠️ `SIZNING_USERNAME` o'rniga o'z GitHub username'ingizni yozing

### 1.5 Tekshirish
GitHub'da `korean-class` repository'ni oching — fayllar ko'rinishi kerak ✅

---

## ✅ BOSQICH 2 — Supabase (Database)

### 2.1 Supabase account ochish
1. https://supabase.com saytiga kiring
2. **Start your project** → GitHub account bilan kiring (osonroq)

### 2.2 Yangi project yaratish
1. **New project** bosing
2. To'ldiring:
   - **Organization:** Default (sizning username)
   - **Project name:** `korean-class`
   - **Database Password:** Kuchli parol kiriting — **SAQLANG!**
   - **Region:** `Southeast Asia (Singapore)` — Korea'ga eng yaqin
3. **Create new project** bosing
4. ~2 daqiqa kutib turing (project yaratiladi)

### 2.3 Database jadvallarini yaratish
1. Supabase dashboard'da chap menuda **SQL Editor** bosing
2. **New query** bosing
3. `supabase-setup.sql` faylini oching (loyiha papkasida bor)
4. Ichidagi barcha SQL matnini ko'chirib SQL Editor'ga joylashtiring
5. **Run** (yoki F5) bosing
6. Pastda `Success` xabari chiqishi kerak ✅

### 2.4 API kalitlarini olish
1. Chap menuda **Project Settings** (tishli g'ildirak) → **API** bosing
2. Quyidagilarni nusxalab oling:
   - **Project URL** → `https://xxxx.supabase.co` formatida
   - **service_role** key (Secret bo'limida) → uzun JWT token

> ⚠️ `service_role` key — maxfiy! Hech kimga bermang, GitHub'ga yuklamang!

---

## ✅ BOSQICH 3 — Vercel (Deploy)

### 3.1 Vercel account ochish
1. https://vercel.com saytiga kiring
2. **Sign Up** → **Continue with GitHub** (GitHub account bilan kiring)
3. GitHub'ni Vercel bilan bog'lashga ruxsat bering

### 3.2 Loyihani import qilish
1. Vercel dashboard'da **Add New Project** bosing
2. GitHub repository'lar ro'yxatida `korean-class` ni toping
3. **Import** bosing

### 3.3 Environment Variables qo'shish (ENG MUHIM QADAM!)
Framework Preset: **Other** tanlang
Keyin **Environment Variables** bo'limida 3 ta o'zgaruvchi qo'shing:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | Supabase'dan olgan Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase'dan olgan service_role key |
| `JWT_SECRET` | O'zingiz o'ylab topgan maxfiy so'z (masalan: `mySecret2024abc`) |

Har birini qo'shish uchun: **Name** → **Value** → **Add**

### 3.4 Deploy
1. **Deploy** tugmasini bosing
2. 2-3 daqiqa kuting
3. ✅ `Congratulations!` xabari chiqadi
4. Vercel sizga URL beradi, masalan: `https://korean-class-abc123.vercel.app`

---

## ✅ BOSQICH 4 — Tekshirish

1. Vercel bergan URL'ni brauzerda oching
2. Login sahifasi chiqishi kerak
3. Kiring: **admin** / **admin123**
4. Dashboard ko'rinishi kerak ✅

---

## 🔄 Kelajakda yangilash

Kodda o'zgartirish qilsangiz, faqat shu 3 ta buyruq:

```bash
git add .
git commit -m "Update: nimani o'zgartirganingiz"
git push
```

Vercel GitHub'ni kuzatib turadi va avtomatik qayta deploy qiladi (1-2 daqiqa).

---

## ❓ Muammolar va yechimlar

**Login ishlamayapti:**
→ Supabase'da `supabase-setup.sql` to'g'ri ishga tushirilganini tekshiring
→ Vercel'da Environment Variables to'g'ri kiritilganini tekshiring

**"Database error" chiqayapti:**
→ `SUPABASE_URL` va `SUPABASE_SERVICE_KEY` ni qayta tekshiring
→ Supabase project'i "Paused" bo'lib qolmaganini tekshiring (bepul plan)

**Supabase bepul plan limiti:**
→ 500 MB storage, 50,000 ta so'rov/oy — kichik markaz uchun yetarli
→ Agar loyiha 1 hafta ishlatilmasa, Supabase uni "pause" qilishi mumkin
→ Har hafta kamida bir marta kirishingiz tavsiya etiladi

---

## 📞 Texnik ma'lumotlar

| Komponent | Texnologiya | Narx |
|-----------|-------------|------|
| Hosting | Vercel | Bepul |
| Database | Supabase (PostgreSQL) | Bepul |
| Code | GitHub | Bepul |
| Umumiy | | **Bepul** ✅ |
