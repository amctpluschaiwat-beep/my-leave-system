import React, { useState } from 'react';
import { ref, push, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';
import LoadingSpinner from './LoadingSpinner.js';

// รายการประเภทการลา (คุณสามารถเพิ่ม/แก้ไขได้)
const leaveTypes = [
  "ลาป่วย",
  "ลากิจ",
  "ลาพักร้อน",
  "ลาคลอด",
  "ลาบวช",
  "ลาอื่นๆ"
];

const LeaveFormPage = ({ appUser }) => {
  // States สำหรับเก็บค่าในฟอร์ม
  const [leaveType, setLeaveType] = useState(leaveTypes[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ฟังก์ชันคำนวณจำนวนวัน
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const date1 = new Date(start);
    const date2 = new Date(end);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60));
    return (diffDays / 24) + 1; // +1 เพื่อรวมวันเริ่มต้น
  };

  const totalDays = calculateDays(startDate, endDate);

  // ฟังก์ชันเมื่อกดยื่นคำขอ
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!leaveType || !startDate || !endDate || !reason) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      setLoading(false);
      return;
    }
    if (totalDays <= 0) {
      setError('วันที่สิ้นสุดต้องอยู่หลังวันที่เริ่มต้น');
      setLoading(false);
      return;
    }

    // เตรียมข้อมูลที่จะบันทึกลง Firebase
    const leaveRequestData = {
      userId: appUser.uid, // UID ของคนที่ลา
      userName: appUser.name, // ชื่อของคนที่ลา
      leaveType: leaveType,
      startDate: startDate,
      endDate: endDate,
      totalDays: totalDays,
      reason: reason,
      status: 'pending', // สถานะเริ่มต้น: รอดำเนินการ
      submittedAt: serverTimestamp() // เวลาที่กดส่ง
    };

    try {
      // อ้างอิงไปที่ 'leaves' collection
      const leavesRef = ref(db, 'leaves');
      // .push() จะสร้าง ID ใหม่ (เช่น -Nq..._abc) ให้กับการลาครั้งนี้
      await push(leavesRef, leaveRequestData);
      
      setSuccess('ยื่นคำขอลาสำเร็จ!');
      // เคลียร์ฟอร์ม
      setLeaveType(leaveTypes[0]);
      setStartDate('');
      setEndDate('');
      setReason('');

    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h3 className="text-2xl font-semibold text-olive-800 mb-6">
        แบบฟอร์มยื่นคำขอลา
      </h3>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ประเภทการลา */}
        <div>
          <label className="block text-sm font-medium text-gray-700">ประเภทการลา</label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full border border-gray-300 rounded-md py-2 px-4 mt-1 focus:outline-none focus:ring-2 focus:ring-olive-500"
          >
            {leaveTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* วันที่ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ตั้งแต่วันที่</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-4 mt-1 focus:outline-none focus:ring-2 focus:ring-olive-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ถึงวันที่</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-4 mt-1 focus:outline-none focus:ring-2 focus:ring-olive-500"
            />
          </div>
        </div>

        {/* จำนวนวัน (แสดงผลอัตโนมัติ) */}
        {totalDays > 0 && (
          <div className="p-3 bg-gray-50 rounded-md text-center">
            <span className="text-gray-700 font-medium">จำนวนวันลาทั้งหมด: </span>
            <span className="text-olive-600 font-bold text-lg">{totalDays} วัน</span>
          </div>
        )}

        {/* เหตุผล */}
        <div>
          <label className="block text-sm font-medium text-gray-700">เหตุผลประกอบการลา</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="4"
            className="w-full border border-gray-300 rounded-md py-2 px-4 mt-1 focus:outline-none focus:ring-2 focus:ring-olive-500"
            placeholder="โปรดระบุเหตุผล..."
          ></textarea>
        </div>

        {/* ปุ่ม Submit */}
        <div className="text-right">
          <button
            type="submit"
            disabled={loading}
            className="bg-olive-600 hover:bg-olive-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : 'ยื่นคำขอ'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveFormPage;