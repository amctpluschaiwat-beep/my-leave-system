import React, { useState, useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
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
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedUser, setSelectedUser] = useState('all');
  const [usersList, setUsersList] = useState([]);

  // ใช้ get เพื่อดึงข้อมูลแบบ one-time fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. ดึงข้อมูล Users
        const usersSnapshot = await get(ref(db, 'users'));
        const usersData = usersSnapshot.val() || {};
        const userCount = Object.keys(usersData).length;
        
        // Prepare users list for filter
        const usersArray = Object.keys(usersData).map(key => ({
            id: key,
            name: usersData[key].name || usersData[key].email
        })).sort((a, b) => a.name.localeCompare(b.name));
        setUsersList(usersArray);

        // 2. ดึงข้อมูล Leaves
        const leavesSnapshot = await get(ref(db, 'leaves'));
        const leavesData = leavesSnapshot.val() || {};
        const leavesList = Object.keys(leavesData).map(key => ({ 
          id: key, 
          ...leavesData[key], 
          requestType: 'Leave' 
        }));
        
        // 3. ดึงข้อมูล OT
        const otSnapshot = await get(ref(db, 'overtimes'));
        const otData = otSnapshot.val() || {};
        const otList = Object.keys(otData).map(key => ({ 
          id: key, 
          ...otData[key], 
          requestType: 'OT' 
        }));

        // 4. ดึงข้อมูล Swaps
        const swapsSnapshot = await get(ref(db, 'holidaySwaps'));
        const swapsData = swapsSnapshot.val() || {};
        const swapsList = [];
        
        Object.keys(swapsData).forEach(uid => {
          const userSwaps = swapsData[uid];
          if (userSwaps) {
            Object.keys(userSwaps).forEach(swapId => {
              swapsList.push({ 
                id: swapId, 
                uid: uid, 
                userName: usersData[uid]?.name || 'Unknown',
                userDepartment: usersData[uid]?.department || '-',
                ...userSwaps[swapId], 
                requestType: 'Swap' 
              });
            });
          }
        });

        // Update state
        setAllLeaves(leavesList);
        setAllOTs(otList);
        setAllSwaps(swapsList);
        
        setStats({
          totalUsers: userCount,
          totalLeaves: leavesList.length,
          pendingLeaves: leavesList.filter(l => l.status === 'pending').length,
          totalOT: otList.length,
          pendingOT: otList.filter(o => o.status === 'pending').length,
          totalSwaps: swapsList.length,
          pendingSwaps: swapsList.filter(s => s.status === 'pending').length
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(`ไม่สามารถโหลดข้อมูลได้: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
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
        alert('เกิดข้อผิดพลาดในการลบคำขอ: ' + error.message);
      }
    }
  };

  const exportToCSV = () => {
    const combinedList = [...allLeaves, ...allOTs, ...allSwaps];
    const filteredList = combinedList
      .filter(item => (activeTab === 'all' || (item.status ? item.status.toLowerCase() : '') === activeTab.toLowerCase()))
      .filter(item => selectedUser === 'all' || item.uid === selectedUser || item.userId === selectedUser);

    const headers = ['Type', 'Name', 'Department', 'Details', 'Date Submitted', 'Status'];
    const rows = filteredList.map(item => {
        let details = '';
        if (item.requestType === 'Leave') details = `${item.leaveType} (${item.startDate} - ${item.endDate})`;
        else if (item.requestType === 'OT') details = `${item.otType} (${item.startDate} ${item.startTime}-${item.endTime})`;
        else if (item.requestType === 'Swap') details = `Swap ${item.originalDate} -> ${item.swapDate}`;
        
        return [
            item.requestType,
            `"${item.userName || '-'}"`,
            `"${item.userDepartment || '-'}"`,
            `"${details}"`,
            new Date(item.submittedAt || item.createdAt).toLocaleDateString('th-TH'),
            item.status
        ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `report_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTable = (status) => {
    const combinedList = [...allLeaves, ...allOTs, ...allSwaps];
    const filteredList = combinedList
      .filter(item => (item.status ? item.status.toLowerCase() : '') === status.toLowerCase())
      .filter(item => selectedUser === 'all' || item.uid === selectedUser || item.userId === selectedUser)
      .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-tplus-border overflow-hidden">
        <div className="p-4 border-b border-tplus-border bg-slate-50 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">กรองตามพนักงาน:</span>
                <select 
                    value={selectedUser} 
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-tplus-orange"
                >
                    <option value="all">ทั้งหมด</option>
                    {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
            <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
            >
                <i className='bx bxs-file-export'></i> Export CSV
            </button>
        </div>
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
                  <tr key={`${item.requestType}-${item.id}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
                            item.requestType === 'Leave' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            item.requestType === 'OT' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                            {item.requestType}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                        {item.userName}
                        <div className="text-xs text-slate-400 font-normal">{item.userDepartment}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.requestType === 'Leave' && (
                          <div>
                              <span className="font-semibold text-blue-600">{item.leaveType}</span>
                              <br/>
                              <span className="text-xs">{item.startDate} ถึง {item.endDate} ({item.totalDays} วัน)</span>
                          </div>
                      )}
                      {item.requestType === 'OT' && (
                          <div>
                              <span className="font-semibold text-purple-600">{item.otType}</span>
                              <br/>
                              <span className="text-xs">{item.startDate} ({item.startTime}-{item.endTime})</span>
                          </div>
                      )}
                      {item.requestType === 'Swap' && (
                          <div>
                              <span className="font-semibold text-orange-600">สลับวันหยุด</span>
                              <br/>
                              <span className="text-xs">เดิม {item.originalDate} &rarr; ใหม่ {item.swapDate}</span>
                          </div>
                      )}
                      {item.reason && <div className="text-xs text-slate-400 mt-1 italic line-clamp-1" title={item.reason}>"{item.reason}"</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(item.submittedAt || item.createdAt).toLocaleDateString('th-TH', {
                            year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                        })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDeleteRequest(item)} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                        title="ลบรายการถาวร"
                      >
                        <i className='bx bx-trash text-lg'></i>
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <i className='bx bx-error text-4xl text-red-500 mb-2'></i>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-tplus-orange">
        <h2 className="text-2xl font-bold text-tplus-text">Dashboard รายงานภาพรวม</h2>
        <p className="text-slate-500 mt-1">สรุปข้อมูลคำขอและผู้ใช้งานในระบบทั้งหมด (สำหรับผู้ดูแลระบบ)</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-tplus-border">
          <p className="text-sm text-slate-500 font-medium uppercase">ผู้ใช้งานทั้งหมด</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-tplus-text mt-2">{stats.totalUsers}</p>
            <i className='bx bxs-user-detail text-3xl text-slate-200'></i>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-tplus-border">
          <p className="text-sm text-slate-500 font-medium uppercase">คำขอทั้งหมด</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-tplus-text mt-2">{stats.totalLeaves + stats.totalOT + stats.totalSwaps}</p>
            <i className='bx bx-folder-open text-3xl text-slate-200'></i>
          </div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200">
          <p className="text-sm text-yellow-700 font-medium uppercase">รออนุมัติรวม</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-yellow-800 mt-2">{stats.pendingLeaves + stats.pendingOT + stats.pendingSwaps}</p>
            <i className='bx bx-time-five text-3xl text-yellow-300'></i>
          </div>
        </div>
        {/* Card แสดงแยกย่อย */}
        <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200">
           <div className="text-xs text-blue-800 space-y-1">
             <div className="flex justify-between"><span>ลา:</span> <strong>{stats.pendingLeaves}</strong></div>
             <div className="flex justify-between"><span>OT:</span> <strong>{stats.pendingOT}</strong></div>
             <div className="flex justify-between"><span>สลับ:</span> <strong>{stats.pendingSwaps}</strong></div>
           </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'pending' ? 'border-tplus-orange text-tplus-orange' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            รออนุมัติ ({stats.pendingLeaves + stats.pendingOT + stats.pendingSwaps})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'approved' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            อนุมัติแล้ว
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'rejected' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            ปฏิเสธแล้ว
          </button>
        </nav>
      </div>

      {/* Render table */}
      {renderTable(activeTab)}

    </div>
  );
};

export default ReportsDashboard;