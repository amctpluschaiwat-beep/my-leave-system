import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../config/firebase'; 

const Register = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [dob, setDob] = useState('');
  const [department, setDepartment] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // รายชื่อแผนกทั้ง 9 แผนก
  const departments = [
    'พิจารณาและอนุมัติสัญญา',
    'เร่งรัดหนี้สิน',
    'ธุรการและเอกสาร',
    'บริการลูกค้า',
    'Partime',
    'ฝ่ายกฏหมาย',
    'บัญชี',
    'CM',
    'ifin'
  ];

  // --- Logic การลงทะเบียน (เหมือนเดิมทุกประการ) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    if (nationalId.length !== 13) {
      setError('เลขบัตรประชาชนต้องมี 13 หลัก');
      return;
    }
    if (!department) {
      setError('กรุณาเลือกแผนก');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userProfile = {
        email: user.email,
        name: fullName,
        nationalId: nationalId,
        dob: dob,
        department: department,
        role: 'pending_approval', 
        profileEditedTimes: 0,
        createdAt: new Date().toISOString(), 
        position: '',
        employeeId: '',
        profileImageUrl: ''
      };
      
      await set(ref(db, 'users/' + user.uid), userProfile);

      alert('ลงทะเบียนสำเร็จ! กรุณารอผู้ดูแลระบบอนุมัติบัญชีของคุณ');
      setPage('login'); 

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานแล้ว');
      } else {
        console.error(err);
        setError('เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- ⬇️ ส่วน JSX ที่ปรับแต่งสีแล้ว ⬇️ ---
  return (
    // ⬇️ 1. เปลี่ยนสีพื้นหลังเป็น slate-100
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 p-4">
      {/* ⬇️ 2. ปรับขนาดกล่องให้กว้างขึ้นเล็กน้อย และเพิ่มเงา/ความโค้งมน */}
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* ⬇️ 3. เปลี่ยนสีหัวข้อเป็น slate-800 */}
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">
          ลงทะเบียนพนักงานใหม่
        </h2>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg" role="alert">
            <p className="font-bold">เกิดข้อผิดพลาด</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล (ที่ตรงกับฐานข้อมูล)</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล (สำหรับ Login)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัตรประชาชน (13 หลัก)</label>
              <input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} required maxLength="13"
                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วัน/เดือน/ปี เกิด</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">แผนก <span className="text-red-500">*</span></label>
              <select 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
                required
                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- กรุณาเลือกแผนก --</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            // ⬇️ 5. เปลี่ยนสีปุ่ม bg-olive-600 เป็น indigo
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center disabled:opacity-50 mt-6 text-lg"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
            ) : (
              <>
                <i className='bx bx-user-plus mr-2'></i>
                <span>ลงทะเบียน</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-sm text-gray-600">มีบัญชีอยู่แล้ว? </span>
          <button
            onClick={() => setPage('login')}
            // ⬇️ 6. เปลี่ยนสีลิงก์ text-olive-600 เป็น indigo
            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            กลับไปล็อกอิน
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;