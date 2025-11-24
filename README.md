# TPLUS HRM/CRM System

ระบบจัดการงานพนักงานภายในบริษัท (HRM/CRM) ด้วย React + Firebase

## วิธีใช้งานเบื้องต้น

1. ติดตั้ง dependencies:

```powershell
npm install
```

1. รันเซิร์ฟเวอร์สำหรับพัฒนา:

```powershell
npm start
```

เปิด [http://localhost:3000](http://localhost:3000)

## การ Build สำหรับ Production

```powershell
npm run build
```

จะได้โฟลเดอร์ `build/` สำหรับนำไป deploy

## Deploy ขึ้น Netlify/Vercel

### Netlify (Manual)

1. สมัครบัญชีที่ [Netlify](https://netlify.com)
2. สร้าง Site ใหม่ เลือก repo นี้ หรืออัปโหลดโฟลเดอร์ `build/`
3. ตั้งค่า Build Settings:
   - Build command: `npm run build`
   - Publish directory: `build`
4. ตั้งค่า Environment Variables:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_DATABASE_URL`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`
5. กด Deploy

### GitHub Actions (Auto Deploy)

มีไฟล์ `.github/workflows/deploy.yml` สำหรับ deploy อัตโนมัติไป Netlify เมื่อ push ขึ้น branch `main`

**ขั้นตอนการตั้งค่า Secrets:**

1. ไปที่ Netlify > Site Settings > Site Details > คัดลอก **Site ID**
2. ไปที่ Netlify > User Settings > Applications > Personal Access Tokens > สร้าง **New Access Token**
3. ไปที่ GitHub repo > Settings > Secrets and variables > Actions > New repository secret
4. เพิ่ม secrets ทั้ง 2 ตัว:
   - `NETLIFY_AUTH_TOKEN` = token ที่ได้จากขั้นตอน 2
   - `NETLIFY_SITE_ID` = Site ID ที่ได้จากขั้นตอน 1

### Vercel

1. สมัครบัญชีที่ [Vercel](https://vercel.com)
2. Import repo นี้ หรืออัปโหลดโฟลเดอร์ `build/`
3. ตั้งค่า Environment Variables เช่นเดียวกับ Netlify (Firebase config)
4. Deploy

## การตั้งค่า Firebase

1. สร้าง Project ใน [Firebase Console](https://console.firebase.google.com)
2. เปิดใช้งาน **Realtime Database** และ **Authentication** (Email/Password)
3. กำหนด Security Rules ให้เหมาะสม (ดูตัวอย่างด้านล่าง)
4. ไปที่ Project Settings > คัดลอก Firebase config
5. สร้างไฟล์ `src/config/firebase.js` และใส่ config:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
```

## ตัวอย่าง Security Rules (Realtime Database)

คัดลอกและวางใน Firebase Console > Realtime Database > Rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "leaves": {
      ".read": "auth != null",
      "$leaveId": {
        ".write": "auth != null && (data.child('userId').val() === auth.uid || root.child('roles').child(auth.uid).val() === 'Manager' || root.child('roles').child(auth.uid).val() === 'hr')"
      }
    },
    "roles": {
      ".read": "auth != null && (root.child('roles').child(auth.uid).val() === 'Manager' || root.child('roles').child(auth.uid).val() === 'hr')",
      ".write": "auth != null && (root.child('roles').child(auth.uid).val() === 'Manager' || root.child('roles').child(auth.uid).val() === 'hr')"
    }
  }
}
```

## การทดสอบ

รัน test:

```powershell
npm test
```

---

## License

This project uses code from various sources. Please verify licenses before commercial use.

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
