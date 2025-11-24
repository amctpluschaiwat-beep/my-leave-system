import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

const ReportsDashboard = ({ appUser }) => {
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // all, leave, ot
  const [showSummary, setShowSummary] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const months = [
    { value: 1, label: 'มกราคม' },
    { value: 2, label: 'กุมภาพันธ์' },
    { value: 3, label: 'มีนาคม' },
    { value: 4, label: 'เมษายน' },
    { value: 5, label: 'พฤษภาคม' },
    { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' },
    { value: 8, label: 'สิงหาคม' },
    { value: 9, label: 'กันยายน' },
    { value: 10, label: 'ตุลาคม' },
    { value: 11, label: 'พฤศจิกายน' },
    { value: 12, label: 'ธันวาคม' }
  ];

  useEffect(() => {
    // ตรวจสอบสิทธิ์ - Manager, HR, CEO, Commander
    if (appUser?.role !== 'Manager' && appUser?.role !== 'hr' && appUser?.role !== 'CEO' && appUser?.role !== 'commander') {
      setLoading(false);
      return;
    }

    // โหลดข้อมูล users
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      }
    });

    // โหลดข้อมูลการลา
    const leavesRef = ref(db, 'leaves');
    const unsubscribeLeaves = onValue(leavesRef, (snapshot) => {
      if (snapshot.exists()) {
        const leavesData = snapshot.val();
        const leavesList = Object.keys(leavesData).map(key => ({
          id: key,
          ...leavesData[key],
          type: 'leave'
        }));
        setLeaves(leavesList);
      } else {
        setLeaves([]);
      }
    });

    // โหลดข้อมูล OT
    const otRef = ref(db, 'overtimes');
    const unsubscribeOT = onValue(otRef, (snapshot) => {
      if (snapshot.exists()) {
        const otData = snapshot.val();
        const otList = Object.keys(otData).map(key => ({
          id: key,
          ...otData[key],
          type: 'ot'
        }));
        setOvertimes(otList);
      } else {
        setOvertimes([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLeaves();
      unsubscribeOT();
    };
  }, [appUser]);

  // รวมข้อมูล leaves + OT
  const allRecords = [...leaves, ...overtimes];

  // ฟังก์ชันดึงชื่อพนักงาน
  const getUserName = (userId) => {
    return users[userId]?.name || 'ไม่ระบุชื่อ';
  };

  // กรองข้อมูลตาม filters
  const filteredRecords = allRecords.filter(record => {
    // Filter by department
    if (selectedDepartment !== 'all' && record.userDepartment !== selectedDepartment) {
      return false;
    }
    
    // Filter by user
    if (selectedUser !== 'all' && record.userId !== selectedUser) {
      return false;
    }
    
    // Filter by type
    if (selectedType !== 'all' && record.type !== selectedType) {
      return false;
    }
    
    // Filter by year/month
    const recordDate = new Date(record.startDate || record.date);
    if (recordDate.getFullYear() !== selectedYear) {
      return false;
    }
    
    if (selectedMonth !== 'all' && recordDate.getMonth() + 1 !== parseInt(selectedMonth)) {
      return false;
    }
    
    return true;
  });

  // สถิติ
  const stats = {
    totalRecords: filteredRecords.length,
    totalLeaves: filteredRecords.filter(r => r.type === 'leave').length,
    totalOT: filteredRecords.filter(r => r.type === 'ot').length,
    pendingLeaves: filteredRecords.filter(r => r.type === 'leave' && r.status === 'pending').length,
    approvedLeaves: filteredRecords.filter(r => r.type === 'leave' && r.status === 'approved').length,
    pendingOT: filteredRecords.filter(r => r.type === 'ot' && r.status === 'pending').length,
    approvedOT: filteredRecords.filter(r => r.type === 'ot' && r.status === 'approved').length
  };

  // Export ข้อมูล
  const handleExport = () => {
    const exportData = filteredRecords.map(record => ({
      'ประเภท': record.type === 'leave' ? 'ลา' : 'OT',
      'ชื่อพนักงาน': getUserName(record.userId),
      'แผนก': record.userDepartment || '-',
      'ประเภทการลา/OT': record.leaveType || record.otType || '-',
      'วันที่เริ่ม': record.startDate || record.date,
      'วันที่สิ้นสุด': record.endDate || '-',
      'จำนวนวัน/ชั่วโมง': record.totalDays || record.otHours || '-',
      'สถานะ': record.status === 'approved' ? 'อนุมัติ' : record.status === 'pending' ? 'รอพิจารณา' : 'ปฏิเสธ',
      'ผู้อนุมัติ': record.reviewedBy || '-',
      'วันที่ยื่น': new Date(record.submittedAt).toLocaleDateString('th-TH')
    }));
    
    // สร้าง CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `รายงาน_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // สรุปรายบุคคล
  const getUserSummary = () => {
    const summary = {};
    filteredRecords.forEach(record => {
      const userId = record.userId;
      if (!summary[userId]) {
        summary[userId] = {
          name: users[userId]?.name || 'Unknown',
          department: users[userId]?.department || '-',
          totalLeaves: 0,
          totalOT: 0,
          approvedLeaves: 0,
          approvedOT: 0,
          pendingLeaves: 0,
          pendingOT: 0
        };
      }
      
      if (record.type === 'leave') {
        summary[userId].totalLeaves++;
        if (record.status === 'approved') summary[userId].approvedLeaves++;
        if (record.status === 'pending') summary[userId].pendingLeaves++;
      } else {
        summary[userId].totalOT++;
        if (record.status === 'approved') summary[userId].approvedOT++;
        if (record.status === 'pending') summary[userId].pendingOT++;
      }
    });
    
    return Object.values(summary);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 border border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '⏳ รอพิจารณา';
      case 'approved': return '✓ อนุมัติแล้ว';
      case 'rejected': return '✗ ปฏิเสธ';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูล Dashboard รายงาน...</p>
        </div>
      </div>
    );
  }

  if (appUser?.role !== 'Manager' && appUser?.role !== 'hr' && appUser?.role !== 'CEO' && appUser?.role !== 'commander') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-lg shadow-md max-w-md">
          <div className="flex items-center mb-4">
            <i className='bx bx-error-circle text-5xl text-red-500 mr-4'></i>
            <div>
              <h3 className="text-xl font-bold text-red-800">ไม่มีสิทธิ์เข้าถึง</h3>
              <p className="text-red-600 mt-2">หน้านี้สำหรับ Manager, HR, CEO และ Commander เท่านั้น</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 flex items-center tracking-wide">
          <i className='bx bx-bar-chart text-4xl mr-3 text-slate-700'></i>
          Dashboard รายงานทั้งหมด
        </h2>
        <p className="text-slate-600 mt-2 font-light ml-14">ข้อมูลการลาและ OT ของพนักงานทุกคนในระบบ</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="group bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl shadow-lg hover:shadow-xl border border-blue-200/50 transition-all duration-600 ease-in-out transform hover:scale-[1.01]">
          <p className="text-sm text-blue-700 font-semibold uppercase tracking-wide">รายการทั้งหมด</p>
          <p className="text-4xl font-bold text-blue-900 mt-3 tracking-tight">{stats.totalRecords}</p>
        </div>
        <div className="group bg-gradient-to-br from-sky-100 to-blue-100 p-6 rounded-2xl shadow-lg hover:shadow-xl border border-sky-300/50 transition-all duration-600 ease-in-out transform hover:scale-[1.01]">
          <p className="text-sm text-sky-700 font-semibold uppercase tracking-wide">การลา</p>
          <p className="text-4xl font-bold text-sky-900 mt-3 tracking-tight">{stats.totalLeaves}</p>
        </div>
        <div className="group bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl shadow-lg hover:shadow-xl border border-blue-200/50 transition-all duration-600 ease-in-out transform hover:scale-[1.01]">
          <p className="text-sm text-blue-700 font-semibold uppercase tracking-wide">OT</p>
          <p className="text-4xl font-bold text-blue-900 mt-3 tracking-tight">{stats.totalOT}</p>
        </div>
        <div className="group bg-gradient-to-br from-sky-100 to-blue-100 p-6 rounded-2xl shadow-lg hover:shadow-xl border border-sky-300/50 transition-all duration-600 ease-in-out transform hover:scale-[1.01]">
          <p className="text-sm text-sky-700 font-semibold uppercase tracking-wide">อนุมัติแล้ว</p>
          <p className="text-4xl font-bold text-sky-900 mt-3 tracking-tight">{stats.approvedLeaves + stats.approvedOT}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200/50">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center tracking-wide">
          <i className='bx bx-filter text-2xl mr-3 text-slate-700'></i>
          ตัวกรองข้อมูล
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">แผนก</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทุกแผนก</option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">พนักงาน</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทุกคน</option>
              {Object.keys(users).map(uid => (
                <option key={uid} value={uid}>{users[uid].name}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="leave">การลา</option>
              <option value="ot">OT</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ปี</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year + 543}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เดือน</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทุกเดือน</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end space-x-2">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg"
            >
              {showSummary ? 'รายละเอียด' : 'สรุปรายบุคคล'}
            </button>
            <button
              onClick={handleExport}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg flex items-center justify-center"
            >
              <i className='bx bx-download mr-2'></i>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Summary View */}
      {showSummary ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-slate-800">📊 สรุปรายบุคคล</h3>
          </div>
          
          {/* Rows per page selector */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">แสดง:</span>
              {[10, 50, 100].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setRowsPerPage(num);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    rowsPerPage === num
                      ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md scale-105'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:scale-105'
                  }`}
                >
                  {num}
                </button>
              ))}
              <span className="text-sm text-gray-600">รายการ</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อพนักงาน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">แผนก</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">การลา (ทั้งหมด)</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">อนุมัติ</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">รอพิจารณา</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">OT (ทั้งหมด)</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">อนุมัติ</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">รอพิจารณา</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  const summary = getUserSummary();
                  const startIndex = (currentPage - 1) * rowsPerPage;
                  const endIndex = startIndex + rowsPerPage;
                  const paginatedSummary = summary.slice(startIndex, endIndex);
                  
                  return paginatedSummary.map((user, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-indigo-600">{user.totalLeaves}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">{user.approvedLeaves}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-yellow-600">{user.pendingLeaves}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-orange-600">{user.totalOT}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">{user.approvedOT}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-yellow-600">{user.pendingOT}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {(() => {
            const summary = getUserSummary();
            return summary.length > 0 && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  แสดง {Math.min((currentPage - 1) * rowsPerPage + 1, summary.length)} - {Math.min(currentPage * rowsPerPage, summary.length)} จาก {summary.length} รายการ
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <i className='bx bx-chevron-left'></i>
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    หน้า {currentPage} / {Math.ceil(summary.length / rowsPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(summary.length / rowsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(summary.length / rowsPerPage)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage >= Math.ceil(summary.length / rowsPerPage)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <i className='bx bx-chevron-right'></i>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Detail View */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-slate-800">📋 รายละเอียดทั้งหมด ({filteredRecords.length} รายการ)</h3>
          </div>
          
          {/* Rows per page selector */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">แสดง:</span>
              {[10, 50, 100].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setRowsPerPage(num);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    rowsPerPage === num
                      ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md scale-105'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:scale-105'
                  }`}
                >
                  {num}
                </button>
              ))}
              <span className="text-sm text-gray-600">รายการ</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ประเภท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">พนักงาน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">แผนก</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายละเอียด</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      <i className='bx bx-inbox text-5xl text-gray-300 mb-2'></i>
                      <p>ไม่พบข้อมูล</p>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const startIndex = (currentPage - 1) * rowsPerPage;
                    const endIndex = startIndex + rowsPerPage;
                    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
                    
                    return paginatedRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.type === 'leave' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {record.type === 'leave' ? '📋 ลา' : '⏰ OT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getUserName(record.userId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.userDepartment || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {record.leaveType || record.otType || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.startDate || record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                          {getStatusText(record.status)}
                        </span>
                      </td>
                      </tr>
                    ));
                  })()
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredRecords.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                แสดง {Math.min((currentPage - 1) * rowsPerPage + 1, filteredRecords.length)} - {Math.min(currentPage * rowsPerPage, filteredRecords.length)} จาก {filteredRecords.length} รายการ
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <i className='bx bx-chevron-left'></i>
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  หน้า {currentPage} / {Math.ceil(filteredRecords.length / rowsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredRecords.length / rowsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(filteredRecords.length / rowsPerPage)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage >= Math.ceil(filteredRecords.length / rowsPerPage)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <i className='bx bx-chevron-right'></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
