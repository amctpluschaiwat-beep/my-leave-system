import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../config/firebase';
import LoadingSpinner from './LoadingSpinner.js';

const ReportsDashboard = ({ appUser }) => {
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    totalOT: 0,
    pendingOT: 0,
    totalSwaps: 0,
    pendingSwaps: 0,
    totalUsers: 0,
  });

  const [allLeaves, setAllLeaves] = useState([]);
  const [allOTs, setAllOTs] = useState([]);
  const [allSwaps, setAllSwaps] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected

  // Fetch all data for stats and lists
  useEffect(() => {
    const leavesRef = ref(db, 'leaves');
    const otRef = ref(db, 'overtimes');
    const usersRef = ref(db, 'users');
    const swapsRef = ref(db, 'holidaySwaps');

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val() || {};
      setStats(prev => ({ ...prev, totalUsers: Object.keys(usersData).length }));
    });

    const unsubscribeLeaves = onValue(leavesRef, (snapshot) => {
      const leavesData = snapshot.val() || {};
      const leavesList = Object.keys(leavesData).map(key => ({ id: key, ...leavesData[key], requestType: 'Leave' }));
      setAllLeaves(leavesList);
      setStats(prev => ({ ...prev, totalLeaves: leavesList.length, pendingLeaves: leavesList.filter(l => l.status === 'pending').length }));
    });

    const unsubscribeOT = onValue(otRef, (snapshot) => {
      const otData = snapshot.val() || {};
      const otList = Object.keys(otData).map(key => ({ id: key, ...otData[key], requestType: 'OT' }));
      setAllOTs(otList);
      setStats(prev => ({ ...prev, totalOT: otList.length, pendingOT: otList.filter(o => o.status === 'pending').length }));
    });

    const unsubscribeSwaps = onValue(swapsRef, (snapshot) => {
      const swapsData = snapshot.val() || {};
      const swapsList = [];
      Object.keys(swapsData).forEach(uid => {
        Object.keys(swapsData[uid]).forEach(swapId => {
          swapsList.push({ id: swapId, uid: uid, ...swapsData[uid][swapId], requestType: 'Swap' });
        });
      });
      setAllSwaps(swapsList);
      setStats(prev => ({...prev, totalSwaps: swapsList.length, pendingSwaps: swapsList.filter(s => s.status === 'pending').length }));
    });

    // Combine loading states
    Promise.all([
      new Promise(resolve => onValue(leavesRef, () => resolve(), { onlyOnce: true })),
      new Promise(resolve => onValue(otRef, () => resolve(), { onlyOnce: true })),
      new Promise(resolve => onValue(usersRef, () => resolve(), { onlyOnce: true })),
      new Promise(resolve => onValue(swapsRef, () => resolve(), { onlyOnce: true })),
    ]).then(() => setLoading(false));

    return () => {
      unsubscribeLeaves();
      unsubscribeOT();
      unsubscribeUsers();
      unsubscribeSwaps();
    };
  }, []);

  const handleDeleteRequest = async (item) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำขอนี้ออกจากระบบอย่างถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      let itemRef;
      if (item.requestType === 'Leave') itemRef = ref(db, `leaves/${item.id}`);
      if (item.requestType === 'OT') itemRef = ref(db, `overtimes/${item.id}`);
      if (item.requestType === 'Swap') itemRef = ref(db, `holidaySwaps/${item.uid}/${item.id}`);
      
      try {
        await remove(itemRef);
        alert('ลบคำขอสำเร็จ!');
      } catch (error) {
        console.error("Error removing request: ", error);
        alert('เกิดข้อผิดพลาดในการลบคำขอ');
      }
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  const renderTable = (status) => {
    const combinedList = [...allLeaves, ...allOTs, ...allSwaps];
    const filteredList = combinedList
      .filter(item => item.status === status)
      .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-tplus-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-tplus-border">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ประเภท</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">พนักงาน</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">รายละเอียด</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">วันที่ยื่น</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">ลบ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-tplus-border">
              {filteredList.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">ไม่มีคำขอสถานะ '{status}'</td></tr>
              ) : (
                filteredList.map(item => (
                  <tr key={`${item.requestType}-${item.id}`} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(item.status)}`}>{item.requestType}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.userName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.requestType === 'Leave' && `${item.leaveType} (${item.startDate} to ${item.endDate})`}
                      {item.requestType === 'OT' && `${item.otType} (${item.startDate}: ${item.startTime}-${item.endTime})`}
                      {item.requestType === 'Swap' && `จาก ${item.originalDate} ไป ${item.swapDate}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(item.submittedAt || item.createdAt).toLocaleDateString('th-TH')}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDeleteRequest(item)} className="text-red-500 hover:text-red-700">
                        <i className='bx bx-trash'></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-tplus-orange">
        <h2 className="text-2xl font-bold text-tplus-text">Dashboard รายงานภาพรวม</h2>
        <p className="text-slate-500 mt-1">สรุปข้อมูลคำขอและผู้ใช้งานในระบบทั้งหมด</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-tplus-border">
          <p className="text-sm text-slate-500 font-medium uppercase">ผู้ใช้งานทั้งหมด</p>
          <p className="text-3xl font-bold text-tplus-text mt-2">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-tplus-border">
          <p className="text-sm text-slate-500 font-medium uppercase">คำขอทั้งหมด (ลา/OT/สลับ)</p>
          <p className="text-3xl font-bold text-tplus-text mt-2">{stats.totalLeaves + stats.totalOT + stats.totalSwaps}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200">
          <p className="text-sm text-yellow-700 font-medium uppercase">รออนุมัติ (ลา/OT/สลับ)</p>
          <p className="text-3xl font-bold text-yellow-800 mt-2">{stats.pendingLeaves + stats.pendingOT + stats.pendingSwaps}</p>
        </div>
      </div>
      
      {/* Tabs for request status */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending' ? 'border-tplus-orange text-tplus-orange' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            รออนุมัติ ({stats.pendingLeaves + stats.pendingOT + stats.pendingSwaps})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'approved' ? 'border-tplus-orange text-tplus-orange' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            อนุมัติแล้ว
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rejected' ? 'border-tplus-orange text-tplus-orange' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            ปฏิเสธแล้ว
          </button>
        </nav>
      </div>

      {/* Render table based on active tab */}
      {renderTable(activeTab)}

    </div>
  );
};

export default ReportsDashboard;
