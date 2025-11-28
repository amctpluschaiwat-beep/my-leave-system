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
    totalUsers: 0,
  });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingOTs, setPendingOTs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data for stats and pending lists
  useEffect(() => {
    const leavesRef = ref(db, 'leaves');
    const otRef = ref(db, 'overtimes');
    const usersRef = ref(db, 'users');

    const unsubscribeLeaves = onValue(leavesRef, (snapshot) => {
      const leavesData = snapshot.val() || {};
      const leavesList = Object.keys(leavesData).map(key => ({ id: key, ...leavesData[key] }));
      setStats(prev => ({ ...prev, totalLeaves: leavesList.length, pendingLeaves: leavesList.filter(l => l.status === 'pending').length }));
      setPendingLeaves(leavesList.filter(l => l.status === 'pending').sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
    });

    const unsubscribeOT = onValue(otRef, (snapshot) => {
      const otData = snapshot.val() || {};
      const otList = Object.keys(otData).map(key => ({ id: key, ...otData[key] }));
      setStats(prev => ({ ...prev, totalOT: otList.length, pendingOT: otList.filter(o => o.status === 'pending').length }));
      setPendingOTs(otList.filter(o => o.status === 'pending').sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
    });

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val() || {};
      setStats(prev => ({ ...prev, totalUsers: Object.keys(usersData).length }));
    });

    // Combine loading states
    Promise.all([
      new Promise(resolve => onValue(leavesRef, () => resolve(), { onlyOnce: true })),
      new Promise(resolve => onValue(otRef, () => resolve(), { onlyOnce: true })),
      new Promise(resolve => onValue(usersRef, () => resolve(), { onlyOnce: true })),
    ]).then(() => setLoading(false));

    return () => {
      unsubscribeLeaves();
      unsubscribeOT();
      unsubscribeUsers();
    };
  }, []);

  const handleDeleteRequest = async (path, id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำขอนี้ออกจากระบบอย่างถาวร?')) {
      try {
        await remove(ref(db, `${path}/${id}`));
        alert('ลบคำขอสำเร็จ!');
      } catch (error) {
        console.error("Error removing request: ", error);
        alert('เกิดข้อผิดพลาดในการลบคำขอ');
      }
    }
  };

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
          <p className="text-sm text-slate-500 font-medium uppercase">คำขอลาทั้งหมด</p>
          <p className="text-3xl font-bold text-tplus-text mt-2">{stats.totalLeaves}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-tplus-border">
          <p className="text-sm text-slate-500 font-medium uppercase">คำขอ OT ทั้งหมด</p>
          <p className="text-3xl font-bold text-tplus-text mt-2">{stats.totalOT}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200">
          <p className="text-sm text-yellow-700 font-medium uppercase">คำขอรออนุมัติ (รวม)</p>
          <p className="text-3xl font-bold text-yellow-800 mt-2">{stats.pendingLeaves + stats.pendingOT}</p>
        </div>
      </div>
      
      {/* Pending Leaves Table */}
      <div className="bg-white rounded-xl shadow-sm border border-tplus-border overflow-hidden">
        <div className="p-6 border-b border-tplus-border">
          <h3 className="text-xl font-bold text-tplus-text">คำขอลาที่รออนุมัติ ({pendingLeaves.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-tplus-border">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">พนักงาน</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ประเภท</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">วันที่ลา</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">วันที่ยื่น</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">ลบ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-tplus-border">
              {pendingLeaves.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">ไม่มีคำขอลาที่รออนุมัติ</td></tr>
              ) : (
                pendingLeaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">{leave.userName}</td>
                    <td className="px-6 py-4">{leave.leaveType}</td>
                    <td className="px-6 py-4">{leave.startDate} ถึง {leave.endDate}</td>
                    <td className="px-6 py-4">{new Date(leave.submittedAt).toLocaleDateString('th-TH')}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDeleteRequest('leaves', leave.id)} className="text-red-500 hover:text-red-700">
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

      {/* Pending OTs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-tplus-border overflow-hidden">
        <div className="p-6 border-b border-tplus-border">
          <h3 className="text-xl font-bold text-tplus-text">คำขอ OT ที่รออนุมัติ ({pendingOTs.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-tplus-border">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">พนักงาน</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ประเภท</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">เวลา</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">วันที่ยื่น</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">ลบ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-tplus-border">
              {pendingOTs.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-500">ไม่มีคำขอ OT ที่รออนุมัติ</td></tr>
              ) : (
                pendingOTs.map(ot => (
                  <tr key={ot.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">{ot.userName}</td>
                    <td className="px-6 py-4">{ot.otType}</td>
                    <td className="px-6 py-4">{ot.startDate}</td>
                    <td className="px-6 py-4">{ot.startTime} - {ot.endTime}</td>
                    <td className="px-6 py-4">{new Date(ot.submittedAt).toLocaleDateString('th-TH')}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDeleteRequest('overtimes', ot.id)} className="text-red-500 hover:text-red-700">
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
    </div>
  );
};

export default ReportsDashboard;
