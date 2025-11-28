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
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-tplus-text">
            ขอทำงานล่วงเวลา (OT)
          </h1>
          <p className="text-slate-500 mt-1">กรอกข้อมูลการทำ OT ของคุณให้ครบถ้วน</p>
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
              <i className='bx bx-briefcase text-2xl mr-3 text-slate-600'></i>
              ฟอร์มยื่นคำขอ OT
            </h2>
            <p className="text-slate-500 mt-1 text-sm">ผู้ยื่นคำขอ: {appUser?.name} ({appUser?.department})</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* OT Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                1. ประเภท OT
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {otTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setOtType(type.value)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      otType === type.value
                        ? 'border-tplus-orange bg-tplus-orange/10 shadow-sm'
                        : 'border-tplus-border hover:border-tplus-orange/50 hover:bg-tplus-orange/5'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{type.icon}</span>
                      <span className={`font-medium ${otType === type.value ? 'text-tplus-orange' : 'text-slate-700'}`}>
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

            {/* Time Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  4. เวลาเริ่มต้น
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border border-tplus-border rounded-lg focus:border-tplus-orange focus:ring-1 focus:ring-tplus-orange transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  5. เวลาสิ้นสุด
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border border-tplus-border rounded-lg focus:border-tplus-orange focus:ring-1 focus:ring-tplus-orange transition-all"
                  required
                />
              </div>
            </div>

            {/* OT Calculation Display */}
            {startTime && endTime && otPreview.displayText && (
              <div className="bg-slate-50 p-4 rounded-lg border border-tplus-border">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-slate-600 font-medium">
                    รวมเวลา OT ({otType})
                  </span>
                  <span className="text-lg font-bold text-tplus-text">
                    {otPreview.displayText}
                  </span>
                </div>
              </div>
            )}

            {/* Remark */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                6. หมายเหตุ / เหตุผล
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
                placeholder="กรุณาระบุเหตุผลในการทำ OT..."
                className="w-full px-4 py-3 border border-tplus-border rounded-lg focus:border-tplus-orange focus:ring-1 focus:ring-tplus-orange transition-all resize-none"
                required
              />
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
                    ส่งคำขอ OT
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
            ข้อมูลสำคัญเกี่ยวกับ OT
          </h3>
          <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside">
            <li>
              <strong>OT ช่วงเช้า:</strong> 30-60 นาที นับเป็นนาที, เกิน 1 ชม. แสดงเป็น นาที/ชม./วัน
            </li>
            <li>
              <strong>OT วันหยุด:</strong> นับเป็นชั่วโมง (ทศนิยม 2 ตำแหน่ง)
            </li>
            <li>คำขอจะถูกส่งไปยังผู้จัดการเพื่ออนุมัติ</li>
            <li>ตรวจสอบสถานะคำขอได้ที่หน้า Dashboard</li>
          </ul>
        </div>
    </div>
  );
}

export default OTForm;
