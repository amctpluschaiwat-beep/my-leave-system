import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push } from 'firebase/database';
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
  const [holidayHistory, setHolidayHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
  
  const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  // Function to log history
  const logHolidayHistory = async (action, details) => {
    const historyRef = ref(db, `holidayHistory/${year}-${month + 1}`);
    const newLogEntry = {
      action, // 'set' or 'delete'
      ...details,
      timestamp: new Date().toISOString(),
      adminName: appUser.name,
    };
    await push(historyRef, newLogEntry);
  };
  
  // Get days in month
  function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek, year, month };
  };

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
      const holidayData = {
        employeeName: selectedEmployee.name,
        type: holidayType,
        reason: holidayReason,
        createdBy: appUser.uid,
        createdAt: new Date().toISOString()
      };
      await set(holidayRef, holidayData);
      
      // Log action
      await logHolidayHistory('set', { 
        employeeName: selectedEmployee.name, 
        date: dateStr, 
        type: holidayType 
      });
    }

    setSelectedDates([]);
    setShowConfirmModal(false);
    setHolidayReason('');
    alert(`จัดวันหยุดให้ ${selectedEmployee.name} จำนวน ${selectedDates.length} วัน สำเร็จ!`);
  };

  // Delete holiday
  const handleDeleteHoliday = async (dateStr, employeeUid, holidayType) => {
    if (window.confirm('ต้องการลบวันหยุดนี้?')) {
      const holidayRef = ref(db, `holidays/${selectedDepartment}/${dateStr}/${employeeUid}`);
      await remove(holidayRef);

      // Log action
      const employee = employees.find(e => e.uid === employeeUid);
      await logHolidayHistory('delete', { 
        employeeName: employee?.name || 'Unknown', 
        date: dateStr, 
        type: holidayType 
      });
    }
  };

  // Fetch holiday history for the current month
  const fetchHolidayHistory = () => {
    const historyRef = ref(db, `holidayHistory/${year}-${month + 1}`);
    onValue(historyRef, (snapshot) => {
      const history = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          history.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
      }
      setHolidayHistory(history.reverse()); // Show newest first
      setShowHistoryModal(true);
    });
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

  const isAdmin = appUser?.role === 'Manager' || appUser?.role === 'hr' || appUser?.role === 'commander';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-tplus-orange mb-6">
        <h1 className="text-2xl font-bold text-tplus-text">ปฏิทินวันหยุดพนักงาน</h1>
        <p className="text-slate-500 mt-1">จัดวันหยุดให้พนักงานแยกตามแผนก</p>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <>
          {/* Department Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-tplus-border">
            <h2 className="text-lg font-semibold text-tplus-text mb-4">1. เลือกแผนก</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    setSelectedDepartment(dept);
                    setSelectedEmployee(null);
                    setSelectedDates([]);
                  }}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    selectedDepartment === dept
                      ? 'bg-tplus-orange text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Employee Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-tplus-border">
            <h2 className="text-lg font-semibold text-tplus-text mb-4">2. เลือกพนักงาน</h2>
            {employees.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                {employees.map((emp) => (
                  <button
                    key={emp.uid}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setSelectedDates([]);
                    }}
                    className={`p-3 rounded-lg text-left transition-all duration-200 border-2 ${
                      selectedEmployee?.uid === emp.uid
                        ? 'bg-tplus-orange/10 border-tplus-orange text-tplus-orange'
                        : 'bg-white border-tplus-border hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">{emp.name}</div>
                    <div className="text-xs opacity-75">{emp.email}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <i className='bx bx-user-x text-5xl mb-2 text-slate-300'></i>
                <p>ไม่พบพนักงานในแผนกนี้</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Calendar Section */}
      <div className="bg-white rounded-xl shadow-sm border border-tplus-border">
          {/* Calendar Header */}
          <div className="p-4 sm:p-6 border-b border-tplus-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={previousMonth}
                  className="p-2 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <i className='bx bx-chevron-left text-2xl text-slate-600'></i>
                </button>
                
                <h2 className="text-xl font-bold text-tplus-text text-center flex-1">
                  {monthNames[month]} {year + 543}
                </h2>

                <button
                  onClick={nextMonth}
                  className="p-2 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <i className='bx bx-chevron-right text-2xl text-slate-600'></i>
                </button>
              </div>
              
              <button
                onClick={fetchHolidayHistory}
                className="text-sm bg-white border border-tplus-border text-slate-700 font-medium py-2 px-4 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <i className='bx bx-history'></i>
                ดูประวัติการแก้ไข
              </button>
            </div>
            {isAdmin && selectedEmployee && (
              <div className="mt-4 p-3 bg-tplus-orange/10 rounded-lg text-center">
                <p className="text-sm font-medium text-tplus-orange">
                  กำลังจัดวันหยุดให้: <span className="font-bold">{selectedEmployee.name}</span>
                </p>
              </div>
            )}
          </div>

          {/* Admin Controls inside calendar */}
          {isAdmin && selectedEmployee && (
            <div className="p-4 bg-slate-50/50 border-b border-tplus-border">
                <p className="text-sm font-semibold text-slate-700 mb-2">3. คลิกเลือกวัน และประเภทวันหยุด</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-slate-600">ประเภท:</span>
                      {holidayTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => setHolidayType(type)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            holidayType === type
                              ? 'bg-tplus-orange text-white'
                              : 'bg-white border border-tplus-border text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {selectedDates.length > 0 && (
                      <button
                        onClick={() => setShowConfirmModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                      >
                        <i className='bx bx-save'></i>
                        บันทึก ({selectedDates.length})
                      </button>
                    )}
                </div>
            </div>
          )}

          {/* Calendar Table */}
          <div className="p-2 sm:p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {dayNames.map((day, i) => (
                    <th key={i} className="p-2 text-sm font-medium text-center text-slate-500 border border-tplus-border">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const daysInMonthArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                  const blanks = Array.from({ length: startDayOfWeek }, () => null);
                  const cells = [...blanks, ...daysInMonthArray];
                  const rows = [];
                  let row = [];

                  cells.forEach((cell, i) => {
                    row.push(cell);
                    if ((i + 1) % 7 === 0) {
                      rows.push(row);
                      row = [];
                    }
                  });
                  if (row.length > 0) rows.push(row);

                  return rows.map((r, rowIndex) => (
                    <tr key={rowIndex}>
                      {r.map((day, dayIndex) => {
                        if (day === null) {
                          return <td key={`empty-${dayIndex}`} className="h-24 border border-tplus-border bg-slate-50/50"></td>;
                        }

                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSelected = selectedDates.includes(dateStr);
                        
                        // Find all holidays for this day
                        const holidaysForDay = Object.entries(holidays[dateStr] || {});

                        return (
                          <td 
                            key={day} 
                            onClick={() => isAdmin && toggleDateSelection(day)}
                            className={`h-24 p-1.5 border border-tplus-border align-top relative transition-colors ${
                              isSelected ? 'bg-tplus-orange/20' : 
                              isAdmin && selectedEmployee ? 'cursor-pointer hover:bg-slate-50' : ''
                            }`}
                          >
                            <div className={`text-sm font-medium ${new Date().toDateString() === new Date(year, month, day).toDateString() ? 'text-tplus-orange font-bold' : 'text-slate-600'}`}>
                              {day}
                            </div>
                            <div className="mt-1 space-y-1 text-xs">
                              {holidaysForDay.map(([uid, holiday]) => (
                                <div 
                                  key={uid}
                                  className={`p-1 rounded text-white flex justify-between items-center ${
                                    holiday.type === 'หยุด' ? 'bg-cyan-500' :
                                    holiday.type === 'WDF' ? 'bg-green-500' :
                                    holiday.type === 'ลาป่วย' ? 'bg-red-500' :
                                    'bg-purple-500'
                                  }`}
                                >
                                  <span>{employees.find(e => e.uid === uid)?.name || holiday.employeeName}</span>
                                  {isAdmin && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteHoliday(dateStr, uid, holiday.type);
                                      }}
                                      className="ml-1 opacity-75 hover:opacity-100"
                                    >
                                      <i className='bx bx-x-circle'></i>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
      </div>

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

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-tplus-border pb-4 mb-4">
              <h2 className="text-xl font-bold text-tplus-text">
                ประวัติการแก้ไข - {monthNames[month]} {year + 543}
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-full hover:bg-slate-100"
              >
                <i className='bx bx-x text-2xl text-slate-600'></i>
              </button>
            </div>
            <div className="overflow-y-auto">
              {holidayHistory.length > 0 ? (
                <ul className="space-y-3">
                  {holidayHistory.map(log => (
                    <li key={log.id} className="p-3 bg-slate-50 rounded-lg border border-tplus-border text-sm">
                      <p>
                        <strong className={log.action === 'set' ? 'text-green-600' : 'text-red-600'}>
                          {log.action === 'set' ? 'เพิ่ม' : 'ลบ'}
                        </strong>
                        วันหยุด <span className="font-semibold">{log.type}</span> ให้กับ <span className="font-semibold">{log.employeeName}</span>
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        โดย {log.adminName} เมื่อ {new Date(log.timestamp).toLocaleString('th-TH')}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-slate-500 py-8">ไม่มีประวัติการแก้ไขในเดือนนี้</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;
