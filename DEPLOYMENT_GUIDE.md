# 🚀 คู่มือการ Deploy ระบบจัดการลาและ PaySlip

## 📋 สารบัญ
1. [เตรียมความพร้อมก่อน Deploy](#เตรียมความพร้อมก่อน-deploy)
2. [Build Production](#build-production)
3. [Deploy ด้วย Firebase Hosting](#deploy-ด้วย-firebase-hosting)
4. [ตั้งค่า Firebase Security Rules](#ตั้งค่า-firebase-security-rules)
5. [Optimize Performance](#optimize-performance)

---

## 🔧 เตรียมความพร้อมก่อน Deploy

### 1. ตรวจสอบ Environment Variables
```bash
# ตรวจสอบไฟล์ .env หรือ config
# ⚠️ อย่า commit ไฟล์ .env ขึ้น GitHub!
```

### 2. อัปเดต Firebase Config
ตรวจสอบไฟล์ `src/config/firebase.js` ให้ตรงกับ production config

### 3. ติดตั้ง Firebase Tools (ถ้ายังไม่มี)
```bash
npm install -g firebase-tools
firebase login
```

---

## 🏗️ Build Production

### 1. Clean Build
```bash
# ลบโฟลเดอร์ build เก่า (ถ้ามี)
Remove-Item -Recurse -Force .\build -ErrorAction SilentlyContinue

# Build ใหม่
npm run build
```

### 2. ทดสอบ Build ในเครื่อง
```bash
# ติดตั้ง serve (ถ้ายังไม่มี)
npm install -g serve

# รัน production build
serve -s build -p 3001
```

เปิดเบราว์เซอร์ที่ `http://localhost:3001` และทดสอบทุก feature

---

## 🔥 Deploy ด้วย Firebase Hosting

### 1. Initialize Firebase (ครั้งแรกเท่านั้น)
```bash
firebase init hosting
```

เลือกตัวเลือกดังนี้:
- **Public directory**: `build`
- **Configure as single-page app**: `Yes`
- **Set up automatic builds with GitHub**: `No` (หรือ Yes ถ้าต้องการ CI/CD)
- **Overwrite index.html**: `No`

### 2. Deploy
```bash
firebase deploy --only hosting
```

### 3. เช็ค URL
หลัง deploy เสร็จ จะได้ URL แบบนี้:
```
https://your-project-name.web.app
https://your-project-name.firebaseapp.com
```

### 4. ตั้งค่า Custom Domain (ตัวเลือก)
```bash
firebase hosting:channel:deploy production
```

---

## 🔒 ตั้งค่า Firebase Security Rules

### Database Rules (`database.rules.json`)
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'commander' || root.child('users').child(auth.uid).child('role').val() === 'CEO'"
      }
    },
    "leaves": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "overtimes": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "payslips": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'commander'",
        ".write": "root.child('users').child(auth.uid).child('role').val() === 'commander'"
      }
    },
    "bankAccounts": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'commander'",
        ".write": "root.child('users').child(auth.uid).child('role').val() === 'commander'"
      }
    },
    "companyProfile": {
      ".read": "auth != null",
      ".write": "root.child('users').child(auth.uid).child('role').val() === 'commander' || root.child('users').child(auth.uid).child('role').val() === 'CEO'"
    }
  }
}
```

Deploy Security Rules:
```bash
firebase deploy --only database
```

---

## ⚡ Optimize Performance

### 1. Enable Compression
Firebase Hosting ใช้ gzip compression อัตโนมัติ

### 2. Cache Policy
แก้ไฟล์ `firebase.json`:
```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/static/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=7200"
          }
        ]
      }
    ]
  }
}
```

### 3. Optimize Images
```bash
# ใช้ tools เช่น imagemin หรือ squoosh.app
# เพื่อบีบอัดรูปภาพก่อน deploy
```

### 4. Code Splitting
React จะทำ code splitting อัตโนมัติใน production build

---

## 📊 Monitor Performance

### Firebase Performance Monitoring
```bash
# ติดตั้ง
npm install firebase

# เพิ่มใน src/index.js
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

### Google Analytics
เพิ่ม tracking code ใน `public/index.html`

---

## 🔄 การอัปเดต (Re-deploy)

```bash
# 1. Pull code ล่าสุดจาก Git
git pull origin main

# 2. ติดตั้ง dependencies (ถ้ามี)
npm install

# 3. Build ใหม่
npm run build

# 4. Deploy
firebase deploy --only hosting

# 5. ตรวจสอบเว็บไซต์
```

---

## ⚠️ Checklist ก่อน Deploy

- [ ] ทดสอบทุก feature ในเครื่อง
- [ ] ตรวจสอบ console.log ทั้งหมด (ลบออกหรือใช้ environment variable)
- [ ] ตรวจสอบ Firebase config
- [ ] ตรวจสอบ Security Rules
- [ ] สำรองข้อมูล Database (Export JSON)
- [ ] ทดสอบใน production build ก่อน deploy
- [ ] แจ้งทีมงานเกี่ยวกับ downtime (ถ้ามี)
- [ ] เตรียม rollback plan

---

## 🆘 Troubleshooting

### ปัญหา: Build ล้มเหลว
```bash
# ลบ node_modules และติดตั้งใหม่
Remove-Item -Recurse -Force .\node_modules
npm install
npm run build
```

### ปัญหา: Deploy ล้มเหลว
```bash
# ตรวจสอบ Firebase login
firebase logout
firebase login

# ลอง deploy อีกครั้ง
firebase deploy --only hosting
```

### ปัญหา: 404 Error หลัง deploy
ตรวจสอบ `firebase.json` ให้มี rewrite rule:
```json
{
  "rewrites": [
    {
      "source": "**",
      "destination": "/index.html"
    }
  ]
}
```

---

## 📞 Support

หากพบปัญหาในการ Deploy:
1. ตรวจสอบ Firebase Console → Hosting → Logs
2. ตรวจสอบ Browser Console สำหรับ error
3. ตรวจสอบ Network tab ใน Developer Tools

---

## 🎯 Next Steps หลัง Deploy

1. **ตั้งค่า Custom Domain** (ถ้าต้องการ)
2. **เพิ่ม SSL Certificate** (Firebase จัดการให้อัตโนมัติ)
3. **ตั้งค่า Email/SMS Notifications**
4. **เพิ่ม Error Tracking** (เช่น Sentry)
5. **ตั้งค่า Backup Schedule** สำหรับ Database

---

**สร้างโดย:** ระบบ HRM - TPLUSONE LEASING CO., LTD.
**วันที่:** พฤศจิกายน 2568
