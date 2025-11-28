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
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-tplus-orange mb-6">
        <h1 className="text-2xl font-bold text-tplus-text">ยื่นคำขอลา</h1>
        <p className="text-slate-500 mt-1">กรอกข้อมูลการลาของคุณให้ครบถ้วนและถูกต้อง</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
          <div className="flex items-center">
            <i className='bx bx-error-circle text-2xl text-red-500 mr-3'></i>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-sm">
          <div className="flex items-center">
            <i className='bx bx-check-circle text-2xl text-green-500 mr-3'></i>
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-tplus-border">
        <div className="p-6 border-b border-tplus-border bg-slate-50/50">
          <h2 className="text-xl font-bold text-tplus-text flex items-center">
            <i className='bx bx-edit text-2xl mr-3 text-slate-600'></i>
            ฟอร์มยื่นคำขอลา
          </h2>
          <p className="text-slate-500 mt-1 text-sm">ผู้ยื่นคำขอ: {appUser?.name} ({appUser?.department})</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Leave Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              1. ประเภทการลา
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {leaveTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setLeaveType(type.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    leaveType === type.value
                      ? 'border-tplus-orange bg-tplus-orange/10 shadow-sm'
                      : 'border-tplus-border hover:border-tplus-orange/50 hover:bg-tplus-orange/5'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{type.icon}</span>
                    <span className={`font-medium ${leaveType === type.value ? 'text-tplus-orange' : 'text-slate-700'}`}>
                      {type.value}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                2. วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-tplus-border rounded-lg focus:border-tplus-orange focus:ring-1 focus:ring-tplus-orange transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                3. วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-tplus-border rounded-lg focus:border-tplus-orange focus:ring-1 focus:ring-tplus-orange transition-all"
                required
              />
            </div>
          </div>

          {/* Time Range (for half-day) */}
          {isHalfDayLeave() && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  เวลาเริ่มต้น (สำหรับลาครึ่งวัน)
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border border-tplus-border rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  เวลาสิ้นสุด (สำหรับลาครึ่งวัน)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border border-tplus-border rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Total Days Display */}
          {startDate && endDate && (
            <div className="bg-slate-50 p-4 rounded-lg border border-tplus-border">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">
                  รวมจำนวนวันลา
                </span>
                <span className="text-xl font-bold text-tplus-text">
                  {totalDays} วัน
                </span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              4. เหตุผลในการลา
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="กรุณาระบุเหตุผลในการลา..."
              className="w-full px-4 py-3 border border-tplus-border rounded-lg focus:border-tplus-orange focus:ring-1 focus:ring-tplus-orange transition-all resize-none"
              required
            />
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              5. แนบไฟล์ (ถ้ามี)
            </label>
            <div className="border-2 border-dashed border-tplus-border rounded-lg p-6 text-center hover:border-tplus-orange/50 transition-all">
              {!filePreview ? (
                <>
                  <i className='bx bx-cloud-upload text-4xl text-slate-400 mb-2'></i>
                  <p className="text-slate-500 text-sm mb-3">.png หรือ .jpeg (ไม่เกิน 5MB)</p>
                  <label className="inline-block bg-white hover:bg-slate-50 border border-tplus-border text-slate-700 font-semibold py-2 px-4 rounded-lg cursor-pointer transition-all text-sm">
                    <i className='bx bx-upload mr-2'></i>
                    เลือกไฟล์
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </>
              ) : (
                <div className="relative inline-block">
                  <img src={filePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm border border-tplus-border" />
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-all"
                  >
                    <i className='bx bx-x text-lg'></i>
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-2 truncate max-w-xs">
                    {attachedFile?.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white shadow-md transition-all duration-300 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-tplus-orange hover:bg-orange-600'
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
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border-l-4 border-tplus-orange">
        <h3 className="font-semibold text-tplus-text mb-2 flex items-center">
          <i className='bx bx-info-circle text-xl mr-2 text-tplus-orange'></i>
          ข้อมูลสำคัญ
        </h3>
        <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside">
          <li>คำขอลาจะถูกส่งไปยังผู้จัดการเพื่ออนุมัติ</li>
          <li>สำหรับการลาครึ่งวัน กรุณาระบุช่วงเวลาด้วย</li>
          <li>คุณสามารถตรวจสอบสถานะคำขอได้ที่หน้า Dashboard</li>
        </ul>
      </div>
    </div>
  );
}

export default LeaveForm;