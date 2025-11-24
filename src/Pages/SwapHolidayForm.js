import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../config/firebase';

const SwapHolidayForm = ({ appUser }) => {
  const [employeeHolidays, setEmployeeHolidays] = useState({});
  const [selectedOriginalDate, setSelectedOriginalDate] = useState('');
  const [swapDate, setSwapDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load employee's holidays
  useEffect(() => {
    if (!appUser?.department) return;

    const holidaysRef = ref(db, `holidays/${appUser.department}`);
    const unsubscribe = onValue(holidaysRef, (snapshot) => {
      if (snapshot.exists()) {
        const allHolidays = snapshot.val();
        // Filter only this employee's holidays
        const myHolidays = {};
        Object.entries(allHolidays).forEach(([date, employees]) => {
          if (employees[appUser.uid]) {
            myHolidays[date] = employees[appUser.uid];
          }
        });
        setEmployeeHolidays(myHolidays);
      }
    });

    return () => unsubscribe();
  }, [appUser]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek, year, month };
  };

  const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // Check if date has holiday
  const isHolidayDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return employeeHolidays[dateStr];
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOriginalDate || !swapDate || !startTime || !endTime || !reason) {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    setLoading(true);

    try {
      // Save swap request
      const swapRef = ref(db, `holidaySwaps/${appUser.uid}/${Date.now()}`);
      await set(swapRef, {
        employeeName: appUser.name,
        department: appUser.department,
        originalDate: selectedOriginalDate,
        swapDate: swapDate,
        startTime: startTime,
        endTime: endTime,
        reason: reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      alert('ส่งคำขอสลับวันหยุดสำเร็จ! รอการอนุมัติจากผู้จัดการ');
      
      // Reset form
      setSelectedOriginalDate('');
      setSwapDate('');
      setStartTime('');
      setEndTime('');
      setReason('');
    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-900 mb-2 flex items-center">
          <i className='bx bx-transfer text-5xl mr-3 text-blue-700'></i>
          สลับวันหยุด
        </h1>
        <p className="text-blue-600">ขอสลับวันหยุดของคุณเป็นวันอื่น</p>
      </div>

      {/* Employee Info */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl shadow-xl p-6 text-white mb-8">
        <h2 className="text-2xl font-bold mb-2">ข้อมูลพนักงาน</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-blue-100 text-sm">ชื่อ - สกุล</p>
            <p className="text-xl font-semibold">{appUser?.name || 'ไม่ระบุ'}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">อีเมล</p>
            <p className="text-xl font-semibold">{appUser?.email || 'ไม่ระบุ'}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">แผนก</p>
            <p className="text-xl font-semibold">{appUser?.department || 'ไม่ระบุ'}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">📝 ข้อมูลการสลับวันหยุด</h2>

        <div className="space-y-6">
          {/* วันหยุดเดิม */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className='bx bx-calendar-minus mr-2 text-red-600'></i>
              วันหยุดเดิม
            </label>
            <div className="flex gap-3">
              <input
                type="date"
                value={selectedOriginalDate}
                onChange={(e) => setSelectedOriginalDate(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowCalendarModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-md"
              >
                <i className='bx bx-calendar mr-2'></i>
                เลือกจากปฏิทิน
              </button>
            </div>
            {selectedOriginalDate && employeeHolidays[selectedOriginalDate] && (
              <div className="mt-2 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm text-blue-900">
                  <i className='bx bx-info-circle mr-1'></i>
                  ประเภท: <span className="font-semibold">{employeeHolidays[selectedOriginalDate].type}</span>
                </p>
              </div>
            )}
          </div>

          {/* วันที่สลับ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className='bx bx-calendar-plus mr-2 text-green-600'></i>
              วันที่ต้องการสลับไป
            </label>
            <input
              type="date"
              value={swapDate}
              onChange={(e) => setSwapDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              required
            />
          </div>

          {/* เวลา */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className='bx bx-time mr-2'></i>
                เวลาเริ่มต้น
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className='bx bx-time mr-2'></i>
                เวลาสิ้นสุด
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                required
              />
            </div>
          </div>

          {/* เหตุผล */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className='bx bx-message-detail mr-2'></i>
              ระบุสาเหตุการสลับวันหยุด
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="กรุณาระบุเหตุผลในการขอสลับวันหยุด..."
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <i className='bx bx-loader-alt bx-spin mr-2'></i>
                  กำลังส่งคำขอ...
                </>
              ) : (
                <>
                  <i className='bx bx-send mr-2'></i>
                  ส่งคำขอสลับวันหยุด
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Holiday Instructions */}
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl shadow-lg p-6 mt-6 border border-blue-200">
        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
          <i className='bx bx-info-circle mr-2'></i>
          คำแนะนำ
        </h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <i className='bx bx-check text-green-500 mr-2 mt-0.5'></i>
            คุณสามารถเลือกวันหยุดเดิมจากปฏิทินวันหยุดของคุณ
          </li>
          <li className="flex items-start">
            <i className='bx bx-check text-green-500 mr-2 mt-0.5'></i>
            ระบุวันที่ต้องการสลับไป และช่วงเวลาที่ต้องการหยุด
          </li>
          <li className="flex items-start">
            <i className='bx bx-check text-green-500 mr-2 mt-0.5'></i>
            คำขอจะถูกส่งไปยังผู้จัดการเพื่อพิจารณาอนุมัติ
          </li>
          <li className="flex items-start">
            <i className='bx bx-check text-green-500 mr-2 mt-0.5'></i>
            สามารถเลือกวันที่ย้อนหลังได้ (สำหรับกรณีคีย์ข้อมูลย้อนหลัง)
          </li>
        </ul>
      </div>

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
              <i className='bx bx-calendar text-3xl mr-2 text-blue-700'></i>
              เลือกวันหยุดเดิมของคุณ
            </h2>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="bg-blue-100 hover:bg-blue-200 p-3 rounded-xl transition-all"
              >
                <i className='bx bx-chevron-left text-2xl text-blue-700'></i>
              </button>
              
              <h3 className="text-2xl font-bold text-blue-900">
                {monthNames[month]} {year + 543}
              </h3>

              <button
                onClick={nextMonth}
                className="bg-blue-100 hover:bg-blue-200 p-3 rounded-xl transition-all"
              >
                <i className='bx bx-chevron-right text-2xl text-blue-700'></i>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="mb-6">
              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map((day, i) => (
                  <div
                    key={i}
                    className={`text-center font-bold py-3 rounded-lg ${
                      i === 0 ? 'bg-red-100 text-red-700' : 
                      i === 6 ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells */}
                {[...Array(startDayOfWeek)].map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}

                {/* Days */}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const holiday = isHolidayDate(day);
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedOriginalDate === dateStr;

                  return (
                    <button
                      key={day}
                      onClick={() => {
                        if (holiday) {
                          setSelectedOriginalDate(dateStr);
                          setShowCalendarModal(false);
                        }
                      }}
                      disabled={!holiday}
                      className={`aspect-square p-2 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-lg scale-105'
                          : holiday
                          ? 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-500 cursor-pointer'
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="text-sm font-bold mb-1">{day}</div>
                      {holiday && (
                        <div className={`text-xs px-1 py-0.5 rounded ${
                          isSelected ? 'bg-white text-blue-700' : 'bg-red-600 text-white'
                        }`}>
                          {holiday.type}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowCalendarModal(false)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapHolidayForm;
