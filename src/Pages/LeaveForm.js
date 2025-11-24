// LeaveForm.jsx
import React, { useState } from 'react';
import { pushData } from '../utils/dbHelpers';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

const leaveTypes = [
  { value: 'ลาป่วย (Sick Leave)', icon: '🤒', color: 'red' },
  { value: 'ลาป่วยครึ่งวัน (Sick Leave - Half Day)', icon: '🤒', color: 'red' },
  { value: 'ลากิจ (Personal Leave)', icon: '📋', color: 'blue' },
  { value: 'ลากิจครึ่งวัน (Personal Leave - Half Day)', icon: '📋', color: 'blue' },
  { value: 'ลาพักร้อน (Annual Leave)', icon: '🏖️', color: 'green' },
  { value: 'ลาพักร้อนครึ่งวัน (Annual Leave - Half Day)', icon: '🏖️', color: 'green' },
  { value: 'ลาคลอด (Maternity Leave)', icon: '👶', color: 'pink' }
];

function LeaveForm({ appUser }) {
  const [leaveType, setLeaveType] = useState(leaveTypes[0].value);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isHalfDayLeave = () => {
    return leaveType.includes('ครึ่งวัน');
  };

  const calcTotalDays = (s, e) => {
    if (!s || !e) return 0;
    
    if (isHalfDayLeave()) {
      return 0.5;
    }
    
    const diff = Math.ceil((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('กรุณาแนบไฟล์ .png หรือ .jpeg เท่านั้น');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setAttachedFile(file);
    setError('');

    // สร้าง preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (!startDate || !endDate || !reason || !leaveType) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      setLoading(false);
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
      setLoading(false);
      return;
    }

    const totalDays = calcTotalDays(startDate, endDate);

    try {
      if (!appUser || !appUser.uid) {
        setError('ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่');
        setLoading(false);
        return;
      }

      let attachmentURL = null;

      // อัปโหลดไฟล์ถ้ามี
      if (attachedFile) {
        const timestamp = Date.now();
        const fileExtension = attachedFile.name.split('.').pop();
        const fileName = `leaves/${appUser.uid}/${timestamp}.${fileExtension}`;
        const fileRef = storageRef(storage, fileName);
        
        await uploadBytes(fileRef, attachedFile);
        attachmentURL = await getDownloadURL(fileRef);
      }

      const newLeave = {
        userId: appUser.uid,
        userName: appUser.name || appUser.displayName || '',
        email: appUser.email || '',
        userDepartment: appUser.department || '',
        leaveType,
        startDate,
        endDate,
        startTime: startTime || null,
        endTime: endTime || null,
        totalDays,
        reason,
        attachmentURL: attachmentURL || null,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      await pushData('leaves', newLeave);
      setSuccess('ส่งคำขอลาสำเร็จ! กรุณารอการอนุมัติ');
      setStartDate(''); setEndDate(''); setStartTime(''); setEndTime(''); setReason(''); setLeaveType(leaveTypes[0].value);
      setAttachedFile(null); setFilePreview(null);
      
      // Auto hide success message
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('LeaveForm push error:', err);
      setError('เกิดข้อผิดพลาดในการส่งคำขอ: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const totalDays = calcTotalDays(startDate, endDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <i className='bx bx-calendar-check text-4xl text-white'></i>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            แจ้งลางาน
          </h1>
          <p className="text-gray-600">กรอกข้อมูลการลาของคุณให้ครบถ้วน</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md animate-shake">
            <div className="flex items-center">
              <i className='bx bx-error-circle text-2xl text-red-500 mr-3'></i>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-md animate-slide-in">
            <div className="flex items-center">
              <i className='bx bx-check-circle text-2xl text-green-500 mr-3'></i>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <i className='bx bx-edit text-3xl mr-3'></i>
              ฟอร์มยื่นคำขอลา
            </h2>
            <p className="text-blue-100 mt-1">ผู้ยื่นคำขอ: {appUser?.name} ({appUser?.department})</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Leave Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className='bx bx-list-ul mr-2'></i>
                ประเภทการลา
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {leaveTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setLeaveType(type.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      leaveType === type.value
                        ? 'border-sky-500 bg-sky-50 shadow-md scale-105'
                        : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{type.icon}</span>
                      <span className={`font-medium ${leaveType === type.value ? 'text-sky-700' : 'text-gray-700'}`}>
                        {type.value}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className='bx bx-calendar mr-2'></i>
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className='bx bx-calendar-check mr-2'></i>
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                  required
                />
              </div>
            </div>

            {/* Time Range (for half-day) */}
            {isHalfDayLeave() && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className='bx bx-time mr-2'></i>
                    เวลาเริ่มต้น (สำหรับลาครึ่งวัน)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className='bx bx-time-five mr-2'></i>
                    เวลาสิ้นสุด (สำหรับลาครึ่งวัน)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Total Days Display */}
            {startDate && endDate && (
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">
                    <i className='bx bx-calendar-alt mr-2'></i>
                    จำนวนวันลา
                  </span>
                  <span className="text-2xl font-bold text-sky-600">
                    {totalDays} วัน
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className='bx bx-message-detail mr-2'></i>
                เหตุผลในการลา
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="กรุณาระบุเหตุผลในการลา..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all resize-none"
                required
              />
            </div>

            {/* File Attachment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className='bx bx-image mr-2'></i>
                แนบไฟล์ภาพ (ถ้ามี)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-sky-400 transition-all">
                {!filePreview ? (
                  <div className="text-center">
                    <i className='bx bx-cloud-upload text-5xl text-gray-400 mb-2'></i>
                    <p className="text-gray-600 mb-3">อัปโหลดไฟล์ .png หรือ .jpeg (ไม่เกิน 5MB)</p>
                    <label className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-6 rounded-lg cursor-pointer transition-all">
                      <i className='bx bx-upload mr-2'></i>
                      เลือกไฟล์
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={filePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all"
                    >
                      <i className='bx bx-x text-xl'></i>
                    </button>
                    <p className="text-center text-sm text-gray-600 mt-2">
                      {attachedFile?.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-600 ease-in-out ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-700 hover:bg-blue-800 hover:shadow-2xl transform hover:scale-[1.01]'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <i className='bx bx-loader-alt animate-spin text-xl mr-2'></i>
                    กำลังส่งคำขอ...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <i className='bx bx-send text-xl mr-2'></i>
                    ส่งคำขอลา
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className='bx bx-info-circle text-xl mr-2 text-blue-500'></i>
            ข้อมูลสำคัญ
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <i className='bx bx-check text-green-500 mr-2 mt-0.5'></i>
              คำขอลาจะถูกส่งไปยังผู้จัดการเพื่ออนุมัติ
            </li>
            <li className="flex items-start">
              <i className='bx bx-check text-green-500 mr-2 mt-0.5'></i>
              สำหรับการลาครึ่งวัน กรุณาระบุช่วงเวลาด้วย
            </li>
            <li className="flex items-start">
              <i className='bx bx-check text-green-500 mr-2 mt-0.5'></i>
              คุณสามารถตรวจสอบสถานะคำขอได้ที่หน้า Dashboard
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LeaveForm;