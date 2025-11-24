import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../config/firebase';

const HolidayCalendar = ({ appUser }) => {
  const [selectedDepartment, setSelectedDepartment] = useState('พิจารณาและอนุมัติสัญญา');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [holidays, setHolidays] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [holidayType, setHolidayType] = useState('หยุด');
  const [holidayReason, setHolidayReason] = useState('');

  // 9 แผนก
  const departments = [
    'พิจารณาและอนุมัติสัญญา',
    'เร่งรัดหนี้สิน',
    'ธุรการและเอกสาร',
    'บริการลูกค้า',
    'Partime',
    'ฝ่ายกฎหมาย',
    'บัญชี',
    'CM',
    'ifin'
  ];

  const holidayTypes = ['หยุด', 'WDF', 'ลาป่วย', 'ลากิจ', 'ลา(1/2)'];

  // Load employees from Firebase
  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const employeesList = Object.entries(usersData)
          .filter(([, user]) => user.department === selectedDepartment)
          .map(([uid, user]) => ({
            uid,
            name: user.name || user.email,
            email: user.email,
            department: user.department
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'th'));
        
        setEmployees(employeesList);
      }
    });

    return () => unsubscribe();
  }, [selectedDepartment]);

  // Load holidays from Firebase
  useEffect(() => {
    const holidaysRef = ref(db, `holidays/${selectedDepartment}`);
    const unsubscribe = onValue(holidaysRef, (snapshot) => {
      if (snapshot.exists()) {
        setHolidays(snapshot.val());
      } else {
        setHolidays({});
      }
    });

    return () => unsubscribe();
  }, [selectedDepartment]);

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

  // Check if date has holiday for selected employee
  const getHolidayForDate = (day) => {
    if (!selectedEmployee) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays[dateStr]?.[selectedEmployee.uid];
  };

  // Toggle date selection
  const toggleDateSelection = (day) => {
    if (!selectedEmployee) {
      alert('กรุณาเลือกพนักงานก่อน');
      return;
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  // Save holidays for selected employee
  const handleSaveHolidays = async () => {
    if (selectedDates.length === 0) {
      alert('กรุณาเลือกวันที่');
      return;
    }

    for (const dateStr of selectedDates) {
      const holidayRef = ref(db, `holidays/${selectedDepartment}/${dateStr}/${selectedEmployee.uid}`);
      await set(holidayRef, {
        employeeName: selectedEmployee.name,
        type: holidayType,
        reason: holidayReason,
        createdBy: appUser.uid,
        createdAt: new Date().toISOString()
      });
    }

    setSelectedDates([]);
    setShowConfirmModal(false);
    setHolidayReason('');
    alert(`จัดวันหยุดให้ ${selectedEmployee.name} จำนวน ${selectedDates.length} วัน สำเร็จ!`);
  };

  // Delete holiday
  const handleDeleteHoliday = async (dateStr, employeeUid) => {
    if (window.confirm('ต้องการลบวันหยุดนี้?')) {
      const holidayRef = ref(db, `holidays/${selectedDepartment}/${dateStr}/${employeeUid}`);
      await remove(holidayRef);
    }
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const isAdmin = appUser?.role === 'Manager' || appUser?.role === 'hr' || appUser?.role === 'CEO' || appUser?.role === 'commander';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-900 mb-2 flex items-center">
          <i className='bx bx-calendar text-5xl mr-3 text-blue-700'></i>
          ปฏิทินวันหยุดพนักงาน
        </h1>
        <p className="text-blue-600">จัดวันหยุดให้พนักงานทีละคน แยกตามแผนกทั้ง 9 แผนก</p>
      </div>

      {/* Department Tabs */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
        <h2 className="text-lg font-bold text-blue-900 mb-4">1️⃣ เลือกแผนก:</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => {
                setSelectedDepartment(dept);
                setSelectedEmployee(null);
                setSelectedDates([]);
              }}
              className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedDepartment === dept
                  ? 'bg-blue-700 text-white shadow-lg scale-105'
                  : 'bg-blue-50 text-blue-900 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-400'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-green-100">
        <h2 className="text-lg font-bold text-green-900 mb-4">2️⃣ เลือกพนักงาน (1 คน):</h2>
        {employees.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
            {employees.map((emp) => (
              <button
                key={emp.uid}
                onClick={() => {
                  setSelectedEmployee(emp);
                  setSelectedDates([]);
                }}
                className={`px-4 py-3 rounded-xl font-medium text-left transition-all duration-300 ${
                  selectedEmployee?.uid === emp.uid
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-green-50 text-green-900 border-2 border-green-200 hover:bg-green-100 hover:border-green-400'
                }`}
              >
                <div className="font-semibold">{emp.name}</div>
                <div className="text-xs opacity-75">{emp.email}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className='bx bx-user-x text-6xl mb-3 text-gray-400'></i>
            <p>ไม่พบพนักงานในแผนกนี้</p>
          </div>
        )}
      </div>

      {selectedEmployee && (
        <>
          {/* Current Selection Info */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl shadow-xl p-6 text-white mb-6">
            <h3 className="text-2xl font-bold mb-2">✅ กำลังจัดวันหยุดให้:</h3>
            <p className="text-xl">{selectedEmployee.name}</p>
            <p className="text-green-100">แผนก: {selectedDepartment}</p>
            {selectedDates.length > 0 && (
              <p className="mt-2 text-green-100">เลือกแล้ว {selectedDates.length} วัน</p>
            )}
          </div>

          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-t-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={previousMonth}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <i className='bx bx-chevron-left text-2xl'></i>
              </button>
              
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-1">
                  {monthNames[month]} {year + 543}
                </h2>
                <p className="text-blue-100">3️⃣ คลิกที่วันที่ต้องการจัดวันหยุด (เลือกได้หลายวัน)</p>
              </div>

              <button
                onClick={nextMonth}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <i className='bx bx-chevron-right text-2xl'></i>
              </button>
            </div>

            {/* Holiday Type Selection */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-blue-100">ประเภท:</span>
              {holidayTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setHolidayType(type)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    holidayType === type
                      ? 'bg-white text-blue-700 shadow-lg'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {selectedDates.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <i className='bx bx-save mr-2'></i>
                  บันทึก {selectedDates.length} วัน
                </button>
              </div>
            )}
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-b-2xl shadow-xl p-6 border-x border-b border-blue-100">
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
              {/* Empty cells for days before month starts */}
              {[...Array(startDayOfWeek)].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}

              {/* Days of month */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const holiday = getHolidayForDate(day);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayOfWeek = new Date(year, month, day).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                const isSelected = selectedDates.includes(dateStr);

                return (
                  <button
                    key={day}
                    onClick={() => toggleDateSelection(day)}
                    disabled={!isAdmin}
                    className={`aspect-square p-2 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                      isSelected
                        ? 'bg-gradient-to-br from-yellow-200 to-amber-200 border-yellow-500 shadow-lg scale-105'
                        : holiday
                        ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300 hover:border-red-500'
                        : isToday
                        ? 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-500 shadow-md'
                        : isWeekend
                        ? 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`text-right text-sm font-bold mb-1 ${
                      isSelected ? 'text-yellow-900' :
                      holiday ? 'text-red-700' :
                      isToday ? 'text-blue-700' :
                      isWeekend ? 'text-gray-500' :
                      'text-gray-700'
                    }`}>
                      {day}
                    </div>

                    {isSelected && (
                      <div className="text-center">
                        <i className='bx bx-check-circle text-2xl text-yellow-700'></i>
                      </div>
                    )}

                    {holiday && !isSelected && (
                      <div className="space-y-1">
                        <div className={`text-white text-xs px-2 py-1 rounded-lg font-semibold ${
                          holiday.type === 'หยุด' ? 'bg-cyan-500' :
                          holiday.type === 'WDF' ? 'bg-green-600' :
                          holiday.type === 'ลาป่วย' ? 'bg-red-600' :
                          'bg-purple-600'
                        }`}>
                          {holiday.type}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHoliday(dateStr, selectedEmployee.uid);
                            }}
                            className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1 rounded transition-colors"
                          >
                            <i className='bx bx-trash'></i>
                          </button>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
              <i className='bx bx-save text-3xl mr-2 text-blue-700'></i>
              ยืนยันการบันทึก
            </h2>

            <div className="mb-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
                <p className="text-blue-900 font-semibold">พนักงาน: {selectedEmployee.name}</p>
                <p className="text-blue-700">ประเภท: {holidayType}</p>
                <p className="text-blue-700">จำนวน: {selectedDates.length} วัน</p>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                เหตุผล/หมายเหตุ (ถ้ามี)
              </label>
              <textarea
                value={holidayReason}
                onChange={(e) => setHolidayReason(e.target.value)}
                rows={3}
                placeholder="เช่น ลาป่วย, ลากิจส่วนตัว, วันหยุดพิเศษ..."
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveHolidays}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <i className='bx bx-check mr-2'></i>
                ยืนยัน
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <i className='bx bx-x mr-2'></i>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;
