// OTForm.js - ฟอร์มขอทำ OT (Overtime)
import React, { useState } from 'react';
import { pushData } from '../utils/dbHelpers';

const otTypes = [
  { value: 'OT ช่วงเช้า', icon: '🌅', color: 'orange' },
  { value: 'OT วันหยุด', icon: '📅', color: 'purple' }
];

function OTForm({ appUser }) {
  const [otType, setOtType] = useState(otTypes[0].value);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // คำนวณชั่วโมง OT
  const calculateOTHours = () => {
    if (!startTime || !endTime) return { totalMinutes: 0, displayText: '' };

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const totalMinutes = endTotalMin - startTotalMin;

    if (totalMinutes <= 0) {
      return { totalMinutes: 0, displayText: 'เวลาไม่ถูกต้อง' };
    }

    // ตามเกณฑ์ที่กำหนด
    if (otType === 'OT ช่วงเช้า') {
      // OT เช้า: ถ้า 30-60 นาที นับเป็นนาที, ถ้าเกิน 1 ชม. แสดงเป็น mm/hh/dd
      if (totalMinutes <= 60) {
        return { totalMinutes, displayText: `${totalMinutes} นาที` };
      } else {
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const days = Math.floor(hours / 24);
        const remainHours = hours % 24;
        
        if (days > 0) {
          return { totalMinutes, displayText: `${mins} นาที / ${remainHours} ชั่วโมง / ${days} วัน` };
        } else {
          return { totalMinutes, displayText: `${mins} นาที / ${hours} ชั่วโมง` };
        }
      }
    } else {
      // OT วันหยุด: นับเป็นชั่วโมง
      const hours = (totalMinutes / 60).toFixed(2);
      return { totalMinutes, displayText: `${hours} ชั่วโมง` };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError(''); 
    setSuccess('');

    if (!startDate || !endDate || !startTime || !endTime || !otType || !remark) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      setLoading(false);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
      setLoading(false);
      return;
    }

    const otCalculation = calculateOTHours();
    if (otCalculation.totalMinutes <= 0) {
      setError('เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด');
      setLoading(false);
      return;
    }

    const newOT = {
      userId: appUser.uid,
      userName: appUser.name || appUser.displayName || '',
      email: appUser.email || '',
      userDepartment: appUser.department || '',
      otType,
      startDate,
      endDate,
      startTime,
      endTime,
      totalMinutes: otCalculation.totalMinutes,
      otDisplay: otCalculation.displayText,
      remark,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    try {
      if (!appUser || !appUser.uid) {
        setError('ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่');
        setLoading(false);
        return;
      }

      await pushData('overtimes', newOT);
      setSuccess(`ส่งคำขอ OT สำเร็จ! รวม: ${otCalculation.displayText}`);
      
      // Reset form
      setStartDate(''); 
      setEndDate(''); 
      setStartTime(''); 
      setEndTime(''); 
      setRemark(''); 
      setOtType(otTypes[0].value);

      // Auto hide success message
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('OTForm push error:', err);
      setError('เกิดข้อผิดพลาดในการส่งคำขอ: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const otPreview = calculateOTHours();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full mb-4 shadow-lg">
            <i className='bx bx-time-five text-4xl text-white'></i>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
            ขอทำงานล่วงเวลา (OT)
          </h1>
          <p className="text-gray-600">กรอกข้อมูลการทำ OT ของคุณให้ครบถ้วน</p>
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
              <i className='bx bx-briefcase text-3xl mr-3'></i>
              ฟอร์มยื่นคำขอ OT
            </h2>
            <p className="text-blue-100 mt-1">ผู้ยื่นคำขอ: {appUser?.name} ({appUser?.department})</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* OT Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className='bx bx-category mr-2'></i>
                ประเภท OT
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {otTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setOtType(type.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      otType === type.value
                        ? 'border-sky-500 bg-sky-50 shadow-md scale-105'
                        : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{type.icon}</span>
                      <span className={`font-medium ${otType === type.value ? 'text-sky-700' : 'text-gray-700'}`}>
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

            {/* Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className='bx bx-time mr-2'></i>
                  เวลาเริ่มต้น
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className='bx bx-time-five mr-2'></i>
                  เวลาสิ้นสุด
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                  required
                />
              </div>
            </div>

            {/* OT Calculation Display */}
            {startTime && endTime && otPreview.displayText && (
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-6 rounded-xl border-2 border-sky-200 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center mr-4">
                      <i className='bx bx-stopwatch text-2xl text-white'></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">รวมเวลา OT</p>
                      <p className="text-2xl font-bold text-sky-600">{otPreview.displayText}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">ระบบคำนวณอัตโนมัติ</p>
                    <p className="text-sm text-gray-600 font-medium">{otType}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Remark */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className='bx bx-message-detail mr-2'></i>
                หมายเหตุ / เหตุผลในการทำ OT
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
                placeholder="กรุณาระบุเหตุผลในการทำ OT..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all resize-none"
                required
              />
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
                    ส่งคำขอ OT
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <i className='bx bx-info-circle text-xl mr-2 text-orange-500'></i>
            ข้อมูลสำคัญเกี่ยวกับ OT
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <i className='bx bx-check text-orange-500 mr-2 mt-0.5'></i>
              <strong>OT ช่วงเช้า:</strong> 30-60 นาที นับเป็นนาที, เกิน 1 ชม. แสดงเป็น นาที/ชม./วัน
            </li>
            <li className="flex items-start">
              <i className='bx bx-check text-orange-500 mr-2 mt-0.5'></i>
              <strong>OT วันหยุด:</strong> นับเป็นชั่วโมง (ทศนิยม 2 ตำแหน่ง)
            </li>
            <li className="flex items-start">
              <i className='bx bx-check text-orange-500 mr-2 mt-0.5'></i>
              คำขอจะถูกส่งไปยังผู้จัดการเพื่ออนุมัติ
            </li>
            <li className="flex items-start">
              <i className='bx bx-check text-orange-500 mr-2 mt-0.5'></i>
              ตรวจสอบสถานะคำขอได้ที่หน้า Dashboard
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default OTForm;
