import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push } from 'firebase/database';
import { db } from '../config/firebase';

const HolidayCalendar = ({ appUser }) => {
  // --- 1. Security & Initial Config ---
  const isAdmin = ['Manager', 'hr', 'commander'].includes(appUser?.role);

  const [selectedDepartment, setSelectedDepartment] = useState(
    isAdmin ? 'พิจารณาและอนุมัติสัญญา' : (appUser?.department || 'พิจารณาและอนุมัติสัญญา')
  );
  
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

  // Force reset department for non-admins
  useEffect(() => {
    if (!isAdmin && appUser?.department) {
      setSelectedDepartment(appUser.department);
    }
  }, [appUser, isAdmin]);

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
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // --- 2. Data Fetching ---
  useEffect(() => {
    if (!selectedDepartment) return;

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

  useEffect(() => {
    if (!selectedDepartment) return;

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

  // --- 3. Calendar Logic Helpers ---
  function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    return { daysInMonth, startDayOfWeek, year, month };
  };

  // Helper Function: สร้าง Array ของสัปดาห์เพื่อนำไป Loop แสดงผล (แก้ปัญหา Syntax Error ใน JSX)
  const generateCalendarWeeks = () => {
    const { daysInMonth, startDayOfWeek } = getDaysInMonth(currentMonth);
    const weeks = [];
    let currentWeek = Array(startDayOfWeek).fill(null); // เติมค่าว่างสำหรับวันก่อนวันที่ 1
    
    for (let day = 1; day <= daysInMonth; day++) {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }
    
    // เติมช่องว่างให้เต็มสัปดาห์สุดท้าย
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }
    return weeks;
  };

  // --- 4. Action Handlers ---
  const logHolidayHistory = async (action, details) => {
    if (!isAdmin) return;
    try {
      const { year, month } = getDaysInMonth(currentMonth);
      const historyRef = ref(db, `holidayHistory/${year}-${month + 1}`);
      await push(historyRef, {
        action,
        ...details,
        timestamp: new Date().toISOString(),
        adminName: appUser?.name || 'Admin',
      });
    } catch (err) {
      console.error("Log failed:", err);
    }
  };

  const toggleDateSelection = (day) => {
    if (!isAdmin) return;
    if (!selectedEmployee) {
      alert('กรุณาเลือกพนักงานก่อน');
      return;
    }
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSelectedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
  };

  const handleSaveHolidays = async () => {
    if (!isAdmin) return alert('คุณไม่มีสิทธิ์บันทึกข้อมูล');
    if (selectedDates.length === 0) return alert('กรุณาเลือกวันที่');

    try {
      for (const dateStr of selectedDates) {
        const holidayRef = ref(db, `holidays/${selectedDepartment}/${dateStr}/${selectedEmployee.uid}`);
        await set(holidayRef, {
          employeeName: selectedEmployee.name,
          type: holidayType,
          reason: holidayReason,
          createdBy: appUser.uid,
          createdAt: new Date().toISOString()
        });
        await logHolidayHistory('set', { employeeName: selectedEmployee.name, date: dateStr, type: holidayType });
      }
      setSelectedDates([]);
      setShowConfirmModal(false);
      setHolidayReason('');
      alert(`บันทึกข้อมูลสำเร็จ`);
    } catch (error) {
      console.error("Save Error:", error);
      alert('บันทึกไม่สำเร็จ');
    }
  };

  const handleDeleteHoliday = async (dateStr, employeeUid, type) => {
    if (!isAdmin) return;
    if (window.confirm('ต้องการลบวันหยุดนี้?')) {
      try {
        const holidayRef = ref(db, `holidays/${selectedDepartment}/${dateStr}/${employeeUid}`);
        await remove(holidayRef);
        const emp = employees.find(e => e.uid === employeeUid);
        await logHolidayHistory('delete', { employeeName: emp?.name || 'Unknown', date: dateStr, type });
      } catch (error) {
        alert('ลบไม่สำเร็จ');
      }
    }
  };

  const fetchHolidayHistory = () => {
    const { year, month } = getDaysInMonth(currentMonth);
    const historyRef = ref(db, `holidayHistory/${year}-${month + 1}`);
    onValue(historyRef, (snapshot) => {
      const history = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => history.push({ id: child.key, ...child.val() }));
      }
      setHolidayHistory(history.reverse());
      setShowHistoryModal(true);
    });
  };

  const { year, month } = getDaysInMonth(currentMonth);
  const calendarWeeks = generateCalendarWeeks(); // สร้างข้อมูลปฏิทินเตรียมไว้

  // --- 5. Render ---
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-tplus-orange mb-6">
        <h1 className="text-2xl font-bold text-tplus-text">ปฏิทินวันหยุดพนักงาน</h1>
        <p className="text-slate-500 mt-1">
          {isAdmin ? 'จัดการวันหยุดพนักงาน (Admin Mode)' : `ปฏิทินแผนก: ${selectedDepartment}`}
        </p>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-tplus-border">
            <h2 className="text-lg font-semibold text-tplus-text mb-4">1. เลือกแผนก</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => { setSelectedDepartment(dept); setSelectedEmployee(null); setSelectedDates([]); }}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${selectedDepartment === dept ? 'bg-tplus-orange text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-tplus-border">
            <h2 className="text-lg font-semibold text-tplus-text mb-4">2. เลือกพนักงาน</h2>
            {employees.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                {employees.map((emp) => (
                  <button
                    key={emp.uid}
                    onClick={() => { setSelectedEmployee(emp); setSelectedDates([]); }}
                    className={`p-3 rounded-lg text-left border-2 transition-all ${selectedEmployee?.uid === emp.uid ? 'bg-tplus-orange/10 border-tplus-orange text-tplus-orange' : 'bg-white border-tplus-border hover:bg-slate-50'}`}
                  >
                    <div className="font-semibold text-sm">{emp.name}</div>
                  </button>
                ))}
              </div>
            ) : <p className="text-slate-500 text-center py-4">ไม่พบพนักงาน</p>}
          </div>
        </>
      )}

      {/* Calendar Section */}
      <div className="bg-white rounded-xl shadow-sm border border-tplus-border">
        {/* Calendar Toolbar */}
        <div className="p-4 sm:p-6 border-b border-tplus-border flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-100 rounded"><i className='bx bx-chevron-left text-2xl'></i></button>
            <h2 className="text-xl font-bold text-tplus-text w-40 text-center">{monthNames[month]} {year + 543}</h2>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-100 rounded"><i className='bx bx-chevron-right text-2xl'></i></button>
          </div>
          <button onClick={fetchHolidayHistory} className="text-sm border px-3 py-2 rounded hover:bg-slate-50 flex gap-2 items-center"><i className='bx bx-history'></i> ประวัติ</button>
        </div>

        {/* Action Panel (Admin) */}
        {isAdmin && selectedEmployee && (
            <div className="p-4 bg-slate-50/50 border-b border-tplus-border">
                <p className="text-sm font-semibold mb-2">3. เลือกวันและบันทึก</p>
                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {holidayTypes.map(type => (
                            <button key={type} onClick={() => setHolidayType(type)} className={`px-3 py-1 text-sm rounded border ${holidayType === type ? 'bg-tplus-orange text-white' : 'bg-white'}`}>{type}</button>
                        ))}
                    </div>
                    {selectedDates.length > 0 && (
                        <button onClick={() => setShowConfirmModal(true)} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                           <i className='bx bx-save'></i> บันทึก ({selectedDates.length})
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* Calendar Grid Table */}
        <div className="p-2 overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
                <thead>
                    <tr>{dayNames.map(d => <th key={d} className="border p-2 text-slate-500 text-sm bg-slate-50">{d}</th>)}</tr>
                </thead>
                <tbody>
                    {calendarWeeks.map((week, weekIndex) => (
                        <tr key={weekIndex}>
                            {week.map((day, dayIndex) => {
                                if (!day) return <td key={`empty-${dayIndex}`} className="h-24 border bg-slate-50/30"></td>;
                                
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isSelected = selectedDates.includes(dateStr);
                                const dayHolidays = holidays[dateStr] ? Object.entries(holidays[dateStr]) : [];
                                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                                return (
                                    <td 
                                        key={day} 
                                        onClick={() => toggleDateSelection(day)}
                                        className={`h-24 border p-1 align-top relative transition-colors ${isSelected ? 'bg-orange-100' : (isAdmin && selectedEmployee ? 'cursor-pointer hover:bg-slate-50' : '')}`}
                                    >
                                        <div className={`text-sm ${isToday ? 'text-tplus-orange font-bold' : ''}`}>{day}</div>
                                        <div className="flex flex-col gap-1 mt-1">
                                            {dayHolidays.map(([uid, h]) => (
                                                <div key={uid} className={`text-[10px] px-1 rounded text-white flex justify-between items-center ${
                                                    h.type === 'หยุด' ? 'bg-cyan-500' : h.type === 'WDF' ? 'bg-green-500' : h.type === 'ลาป่วย' ? 'bg-red-500' : 'bg-purple-500'
                                                }`}>
                                                    <span className="truncate max-w-[80px]">{employees.find(e => e.uid === uid)?.name || h.employeeName}</span>
                                                    {isAdmin && <i onClick={(e) => { e.stopPropagation(); handleDeleteHoliday(dateStr, uid, h.type); }} className='bx bx-x cursor-pointer hover:text-black'></i>}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-blue-900">ยืนยันการบันทึก</h3>
                <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800">
                    <p>พนักงาน: <strong>{selectedEmployee?.name}</strong></p>
                    <p>ประเภท: <strong>{holidayType}</strong></p>
                    <p>จำนวน: <strong>{selectedDates.length} วัน</strong></p>
                </div>
                <textarea value={holidayReason} onChange={e => setHolidayReason(e.target.value)} className="w-full border p-2 rounded mb-4" placeholder="ระบุเหตุผล (ถ้ามี)..." rows={3} />
                <div className="flex gap-2">
                    <button onClick={handleSaveHolidays} className="flex-1 bg-blue-600 text-white py-2 rounded">ยืนยัน</button>
                    <button onClick={() => setShowConfirmModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded">ยกเลิก</button>
                </div>
            </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-bold">ประวัติการแก้ไข</h3>
                    <button onClick={() => setShowHistoryModal(false)}><i className='bx bx-x text-2xl'></i></button>
                </div>
                <div className="overflow-y-auto flex-1">
                    {holidayHistory.length === 0 ? <p className="text-center text-gray-500">ไม่มีประวัติ</p> : (
                        <ul className="space-y-2">
                            {holidayHistory.map(h => (
                                <li key={h.id} className="text-sm p-3 bg-slate-50 border rounded">
                                    <span className={h.action === 'set' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{h.action === 'set' ? 'เพิ่ม' : 'ลบ'} {h.type}</span>
                                    <span className="mx-1">ให้</span><b>{h.employeeName}</b>
                                    <div className="text-xs text-gray-400 mt-1">โดย {h.adminName} เมื่อ {new Date(h.timestamp).toLocaleString('th-TH')}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;