import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

const Dashboard = ({ appUser }) => {
  const [myLeaves, setMyLeaves] = useState([]);
  const [myStats, setMyStats] = useState({ 
    totalLeaves: 0,
    pendingLeaves: 0, 
    approvedLeaves: 0,
    totalOT: 0,
    pendingOT: 0,
    approvedOT: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (!appUser) return;

    // ดึงข้อมูลการลาของตัวเอง
    const leavesRef = ref(db, 'leaves');
    const unsubscribeLeaves = onValue(leavesRef, (snapshot) => {
      if (snapshot.exists()) {
        const leavesData = snapshot.val();
        const allLeavesList = Object.keys(leavesData).map(key => ({
          id: key,
          ...leavesData[key]
        }));

        // กรองเฉพาะของตัวเอง
        const userLeaves = allLeavesList
          .filter(leave => leave.userId === appUser.uid)
          .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        
        setMyLeaves(userLeaves);
        
        // คำนวณสถิติของตัวเอง
        setMyStats(prev => ({
          ...prev,
          totalLeaves: userLeaves.length,
          pendingLeaves: userLeaves.filter(l => l.status === 'pending').length,
          approvedLeaves: userLeaves.filter(l => l.status === 'approved').length
        }));
      } else {
        setMyLeaves([]);
      }
    });

    // ดึงข้อมูล OT ของตัวเอง
    const otRef = ref(db, 'overtimes');
    const unsubscribeOT = onValue(otRef, (snapshot) => {
      if (snapshot.exists()) {
        const otData = snapshot.val();
        const allOTList = Object.keys(otData).map(key => ({
          id: key,
          ...otData[key]
        }));

        const userOT = allOTList
          .filter(ot => ot.userId === appUser.uid)
          .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        
        setMyStats(prev => ({
          ...prev,
          totalOT: userOT.length,
          pendingOT: userOT.filter(o => o.status === 'pending').length,
          approvedOT: userOT.filter(o => o.status === 'approved').length
        }));
      } else {
        setMyStats(prev => ({
          ...prev,
          totalOT: 0,
          pendingOT: 0,
          approvedOT: 0
        }));
      }
      setLoading(false);
    });

    return () => {
      unsubscribeLeaves();
      unsubscribeOT();
    };
  }, [appUser]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
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

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">📊 Dashboard ของฉัน</h2>
          <p className="text-gray-600 mt-1">สรุปข้อมูลการลาและ OT ของคุณ {appUser?.name}</p>
        </div>
      </div>

      {/* Statistics Cards - ข้อมูลของตัวเอง */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl shadow-lg hover:shadow-xl border border-blue-200/50 transition-all duration-600 ease-in-out transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-semibold tracking-wide uppercase">คำขอลาทั้งหมด</p>
              <p className="text-xs text-blue-600 mt-1 font-light">ของฉัน</p>
              <p className="text-4xl font-bold text-blue-900 mt-3 tracking-tight">{myStats.totalLeaves}</p>
            </div>
            <div className="bg-blue-700 text-white p-4 rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-600">
              <i className='bx bx-file text-3xl'></i>
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-sky-50 to-blue-100 p-6 rounded-2xl shadow-lg hover:shadow-xl border border-sky-300/50 transition-all duration-600 ease-in-out transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-sky-700 font-semibold tracking-wide uppercase">รอพิจารณา</p>
              <p className="text-xs text-sky-600 mt-1 font-light">ลา + OT</p>
              <p className="text-4xl font-bold text-sky-900 mt-3 tracking-tight">{myStats.pendingLeaves + myStats.pendingOT}</p>
            </div>
            <div className="bg-sky-600 text-white p-4 rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-600">
              <i className='bx bx-time text-3xl'></i>
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl shadow-lg hover:shadow-xl border border-blue-200/50 transition-all duration-600 ease-in-out transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-semibold tracking-wide uppercase">อนุมัติแล้ว</p>
              <p className="text-xs text-blue-600 mt-1 font-light">ลา + OT</p>
              <p className="text-4xl font-bold text-blue-900 mt-3 tracking-tight">{myStats.approvedLeaves + myStats.approvedOT}</p>
            </div>
            <div className="bg-blue-700 text-white p-4 rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-600">
              <i className='bx bx-check-circle text-3xl'></i>
            </div>
          </div>
        </div>
      </div>

      {/* My Leave History */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center tracking-wide">
            <i className='bx bx-calendar text-3xl mr-3 text-slate-700'></i>
            ประวัติการลาของฉัน
          </h3>
          <p className="text-sm text-slate-600 mt-2 font-light ml-11">
            รายการคำขอลาทั้งหมดของคุณ ({myLeaves.length} รายการ)
          </p>
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
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-600 ease-in-out transform ${
                  rowsPerPage === num
                    ? 'bg-blue-700 text-white shadow-md hover:bg-blue-800'
                    : 'bg-white text-blue-900 border border-blue-300 hover:bg-blue-50 hover:border-blue-400 hover:scale-[1.01]'
                }`}
              >
                {num}
              </button>
            ))}
            <span className="text-sm text-gray-600">รายการ</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ประเภทการลา
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  วันที่ลา
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  เหตุผล
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  วันที่ยื่น
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ผู้อนุมัติ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className='bx bx-inbox text-5xl text-gray-300 mb-2'></i>
                      <p>ยังไม่มีประวัติการลา</p>
                      <p className="text-sm mt-1">คุณยังไม่เคยยื่นคำขอลา</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (() => {
                  const startIndex = (currentPage - 1) * rowsPerPage;
                  const endIndex = startIndex + rowsPerPage;
                  const paginatedLeaves = myLeaves.slice(startIndex, endIndex);
                  
                  return paginatedLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50 transition-all duration-300 hover:shadow-md border-b border-slate-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{leave.leaveType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {leave.startDate} ถึง {leave.endDate}
                        </div>
                        <div className="text-xs text-gray-500">
                          ({leave.totalDays} วัน)
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-700 truncate" title={leave.reason}>
                          {leave.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(leave.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(leave.status)}`}>
                          {getStatusText(leave.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {leave.reviewedBy || '-'}
                      </td>
                    </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {myLeaves.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600 font-medium">
              แสดง {Math.min((currentPage - 1) * rowsPerPage + 1, myLeaves.length)} - {Math.min(currentPage * rowsPerPage, myLeaves.length)} จาก {myLeaves.length} รายการ
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-600 ease-in-out transform ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-900 border border-blue-300 hover:bg-blue-50 hover:scale-[1.01] shadow-sm hover:shadow-md'
                }`}
              >
                <i className='bx bx-chevron-left'></i>
              </button>
              <span className="px-4 py-2 text-sm text-blue-900 font-semibold">
                หน้า {currentPage} / {Math.ceil(myLeaves.length / rowsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(myLeaves.length / rowsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(myLeaves.length / rowsPerPage)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-600 ease-in-out transform ${
                  currentPage >= Math.ceil(myLeaves.length / rowsPerPage)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-900 border border-blue-300 hover:bg-blue-50 hover:scale-[1.01] shadow-sm hover:shadow-md'
                }`}
              >
                <i className='bx bx-chevron-right'></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats - My Leaves Only */}
      {myLeaves.length > 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200/50 shadow-lg">
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center tracking-wide">
            <i className='bx bx-bar-chart text-2xl mr-2 text-slate-700'></i>
            สถิติการลาของฉัน
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md hover:scale-105">
              <p className="text-3xl font-bold text-slate-800">{myLeaves.length}</p>
              <p className="text-xs text-slate-600 mt-1 font-semibold uppercase tracking-wide">ทั้งหมด</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md hover:scale-105">
              <p className="text-3xl font-bold text-slate-800">
                {myLeaves.filter(l => l.status === 'pending').length}
              </p>
              <p className="text-xs text-slate-600 mt-1 font-semibold uppercase tracking-wide">รอพิจารณา</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md hover:scale-105">
              <p className="text-3xl font-bold text-slate-800">
                {myLeaves.filter(l => l.status === 'approved').length}
              </p>
              <p className="text-xs text-slate-600 mt-1 font-semibold uppercase tracking-wide">อนุมัติ</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md hover:scale-105">
              <p className="text-3xl font-bold text-slate-800">
                {myLeaves.filter(l => l.status === 'rejected').length}
              </p>
              <p className="text-xs text-slate-600 mt-1 font-semibold uppercase tracking-wide">ปฏิเสธ</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;