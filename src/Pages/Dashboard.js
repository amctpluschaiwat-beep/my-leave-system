import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../config/firebase';

const Dashboard = ({ appUser }) => {
  const [myLeaves, setMyLeaves] = useState([]);
  const [myOvertimes, setMyOvertimes] = useState([]);
  const [mySwaps, setMySwaps] = useState([]);
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
        
        setMyOvertimes(userOT); // Set OT list for table display

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

    // Fetch Swap Holiday Requests
    const swapsRef = ref(db, 'holidaySwaps');
    const unsubscribeSwaps = onValue(swapsRef, (snapshot) => {
      if (snapshot.exists()) {
        const swapsData = snapshot.val();
        const userSwaps = Object.keys(swapsData)
          .map(id => ({ id, ...swapsData[id] }))
          .filter(swap => swap.userId === appUser.uid)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMySwaps(userSwaps);
      }
    });

    return () => {
      unsubscribeLeaves();
      unsubscribeOT();
      unsubscribeSwaps();
    };
  }, [appUser]);

  const handleCancelRequest = async (path, id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอนี้?')) {
      try {
        await remove(ref(db, `${path}/${id}`));
        alert('ยกเลิกคำขอสำเร็จ!');
      } catch (error) {
        console.error("Error removing request: ", error);
        alert('เกิดข้อผิดพลาดในการยกเลิกคำขอ');
      }
    }
  };

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
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-tplus-orange">
        <h2 className="text-2xl font-bold text-tplus-text">Dashboard ของฉัน</h2>
        <p className="text-slate-500 mt-1">สรุปข้อมูลภาพรวมของคุณ, {appUser?.name}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Leaves */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-tplus-border transition-all hover:shadow-md hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase">คำขอลาทั้งหมด</p>
              <p className="text-3xl font-bold text-tplus-text mt-2">{myStats.totalLeaves}</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
              <i className='bx bx-file text-2xl'></i>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Requests */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-tplus-border transition-all hover:shadow-md hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase">รอพิจารณา</p>
              <p className="text-3xl font-bold text-tplus-text mt-2">{myStats.pendingLeaves + myStats.pendingOT}</p>
            </div>
            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full">
              <i className='bx bx-time-five text-2xl'></i>
            </div>
          </div>
        </div>
        
        {/* Card 3: Approved Requests */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-tplus-border transition-all hover:shadow-md hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase">อนุมัติแล้ว</p>
              <p className="text-3xl font-bold text-tplus-text mt-2">{myStats.approvedLeaves + myStats.approvedOT}</p>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-full">
              <i className='bx bx-check-circle text-2xl'></i>
            </div>
          </div>
        </div>

        {/* Card 4: Total OT */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-tplus-border transition-all hover:shadow-md hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase">ขอทำ OT ทั้งหมด</p>
              <p className="text-3xl font-bold text-tplus-text mt-2">{myStats.totalOT}</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
              <i className='bx bxs-watch text-2xl'></i>
            </div>
          </div>
        </div>
      </div>

      {/* My Leave History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-tplus-border overflow-hidden">
        <div className="p-6 border-b border-tplus-border">
          <h3 className="text-xl font-bold text-tplus-text">ประวัติการลาของฉัน</h3>
          <p className="text-sm text-slate-500 mt-1">
            รายการคำขอลาทั้งหมด ({myLeaves.length} รายการ)
          </p>
        </div>

        {/* Rows per page selector - Simple version */}
        <div className="p-4 bg-slate-50/50 border-b border-tplus-border flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">แสดง:</span>
                {[10, 50, 100].map((num) => (
                    <button
                        key={num}
                        onClick={() => { setRowsPerPage(num); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            rowsPerPage === num
                                ? 'bg-tplus-orange text-white'
                                : 'bg-white text-slate-700 border border-tplus-border hover:bg-slate-100'
                        }`}
                    >
                        {num}
                    </button>
                ))}
                <span className="text-sm text-slate-600">รายการ</span>
            </div>
            <div className="text-sm text-slate-600">
                หน้า {currentPage} / {Math.ceil(myLeaves.length / rowsPerPage) || 1}
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-tplus-border">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ประเภทการลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  วันที่ลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  เหตุผล
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  วันที่ยื่น
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  ผู้อนุมัติ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-tplus-border">
              {myLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <i className='bx bx-inbox text-5xl text-slate-300 mb-2'></i>
                    <p>ยังไม่มีประวัติการลา</p>
                  </td>
                </tr>
              ) : (
                (() => {
                  const startIndex = (currentPage - 1) * rowsPerPage;
                  const endIndex = startIndex + rowsPerPage;
                  const paginatedLeaves = myLeaves.slice(startIndex, endIndex);
                  
                  return paginatedLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-tplus-text">{leave.leaveType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">
                          {leave.startDate} ถึง {leave.endDate}
                        </div>
                        <div className="text-xs text-slate-400">
                          ({leave.totalDays} วัน)
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate hidden md:table-cell" title={leave.reason}>
                        <div className="text-sm text-slate-600">
                          {leave.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">
                        {formatDate(leave.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(leave.status)}`}>
                          {getStatusText(leave.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">
                        {leave.reviewedBy || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {leave.status === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest('leaves', leave.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            ยกเลิก
                          </button>
                        )}
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
          <div className="p-4 bg-slate-50/50 border-t border-tplus-border flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-slate-600">
              แสดง {Math.min((currentPage - 1) * rowsPerPage + 1, myLeaves.length)} - {Math.min(currentPage * rowsPerPage, myLeaves.length)} จาก {myLeaves.length} รายการ
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-tplus-border text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <i className='bx bx-chevron-left'></i>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(myLeaves.length / rowsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(myLeaves.length / rowsPerPage)}
                className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-tplus-border text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <i className='bx bx-chevron-right'></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* My OT History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-tplus-border overflow-hidden">
        <div className="p-6 border-b border-tplus-border">
          <h3 className="text-xl font-bold text-tplus-text">ประวัติการขอทำ OT ของฉัน</h3>
          <p className="text-sm text-slate-500 mt-1">
            รายการคำขอทำ OT ทั้งหมด ({myOvertimes.length} รายการ)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-tplus-border">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ประเภท OT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">เวลา</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-tplus-border">
              {myOvertimes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-500">ยังไม่มีประวัติการขอทำ OT</td>
                </tr>
              ) : (
                myOvertimes.map((ot) => (
                  <tr key={ot.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-tplus-text">{ot.otType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ot.startDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ot.startTime} - {ot.endTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(ot.status)}`}>
                        {getStatusText(ot.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ot.status === 'pending' && (
                        <button
                          onClick={() => handleCancelRequest('overtimes', ot.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          ยกเลิก
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Swap Holiday History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-tplus-border overflow-hidden">
        <div className="p-6 border-b border-tplus-border">
          <h3 className="text-xl font-bold text-tplus-text">ประวัติการสลับวันหยุดของฉัน</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-tplus-border">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">วันหยุดเดิม</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">วันที่ขอสลับ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-tplus-border">
              {mySwaps.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-slate-500">ยังไม่มีประวัติการสลับวันหยุด</td>
                </tr>
              ) : (
                mySwaps.map((swap) => (
                  <tr key={swap.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{swap.originalDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{swap.swapDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(swap.status)}`}>
                        {getStatusText(swap.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {swap.status === 'pending' && (
                        <button
                          onClick={() => handleCancelRequest(`holidaySwaps/${appUser.uid}`, swap.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          ยกเลิก
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;