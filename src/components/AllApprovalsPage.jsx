import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { db } from '../config/firebase';

const AllApprovalsPage = ({ appUser }) => {
  // States
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState({
    users: true,
    leaves: true,
    overtimes: true,
    swaps: true,
  });
  const [selectedItems, setSelectedItems] = useState({
    leaves: [],
    overtimes: [],
    swaps: []
  });
  const [activeTab, setActiveTab] = useState('leaves');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // รายชื่อแผนกทั้ง 9 แผนก
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

  const fetchData = async () => {
    try {
      // Fetch users first
      const usersSnapshot = await get(ref(db, 'users'));
      const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};
      setUsers(usersData);
      setLoading(prev => ({ ...prev, users: false }));

      // Prepare to fetch all data types
      const leavesRef = ref(db, 'leaves');
      const otRef = ref(db, 'overtimes');
      const swapsRef = ref(db, 'holidaySwaps');

      // Fetch leaves
      get(leavesRef).then(snapshot => {
        if (snapshot.exists()) {
          const leavesData = snapshot.val();
          const leavesList = Object.keys(leavesData).map(key => {
            const leave = leavesData[key];
            const userDept = usersData[leave.userId]?.department || '';
            return { id: key, ...leave, userDepartment: userDept };
          }).filter(leave => leave.status === 'pending');
          setLeaves(leavesList);
        }
        setLoading(prev => ({ ...prev, leaves: false }));
      }).catch(error => {
        console.error("Firebase leaves fetch error:", error);
        setLoading(prev => ({ ...prev, leaves: false }));
      });

      // Fetch OTs
      get(otRef).then(snapshot => {
        if (snapshot.exists()) {
          const otData = snapshot.val();
          const otList = Object.keys(otData).map(key => {
            const ot = otData[key];
            const userDept = usersData[ot.userId]?.department || '';
            return { id: key, ...ot, userDepartment: userDept };
          }).filter(ot => ot.status === 'pending');
          setOvertimes(otList);
        }
        setLoading(prev => ({ ...prev, overtimes: false }));
      }).catch(error => {
        console.error("Firebase overtimes fetch error:", error);
        setLoading(prev => ({ ...prev, overtimes: false }));
      });

      // Fetch Swaps
      get(swapsRef).then(snapshot => {
        if (snapshot.exists()) {
          const swapsData = snapshot.val();
          const swapsList = [];
          Object.keys(swapsData).forEach(uid => {
            const userSwaps = swapsData[uid];
            Object.keys(userSwaps).forEach(swapId => {
              const swap = userSwaps[swapId];
              const userDept = usersData[uid]?.department || '';
              if (swap.status === 'pending') {
                swapsList.push({ id: swapId, uid: uid, ...swap, userDepartment: userDept });
              }
            });
          });
          setSwaps(swapsList);
        }
        setLoading(prev => ({ ...prev, swaps: false }));
      }).catch(error => {
        console.error("Firebase swaps fetch error:", error);
        setLoading(prev => ({ ...prev, swaps: false }));
      });

    } catch (error) {
      console.error("Failed to fetch initial user data:", error);
      // If users fail to load, stop all loading states
      setLoading({ users: false, leaves: false, overtimes: false, swaps: false });
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  
  // Re-filter data when department changes, no need to re-fetch
  const filteredLeaves = leaves.filter(l => selectedDepartment === 'all' || l.userDepartment === selectedDepartment);
  const filteredOvertimes = overtimes.filter(o => selectedDepartment === 'all' || o.userDepartment === selectedDepartment);
  const filteredSwaps = swaps.filter(s => selectedDepartment === 'all' || s.userDepartment === selectedDepartment);


  // จัดการ Checkbox
  const handleCheckboxChange = (type, id) => {
    setSelectedItems(prev => ({
      ...prev,
      [type]: prev[type].includes(id)
        ? prev[type].filter(item => item !== id)
        : [...prev[type], id]
    }));
  };

  // เลือกทั้งหมด
  const handleSelectAll = (type) => {
    const dataMap = {
      leaves: filteredLeaves,
      overtimes: filteredOvertimes,
      swaps: filteredSwaps,
    };
    const allIds = dataMap[type].map(item => item.id);
    setSelectedItems(prev => ({
      ...prev,
      [type]: prev[type].length === allIds.length ? [] : allIds
    }));
  };

  // อนุมัติ/ปฏิเสธรายการที่เลือก
  const handleBulkAction = async (type, newStatus) => {
    const actionText = newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
    const selectedIds = selectedItems[type];
    
    if (selectedIds.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการ');
      return;
    }

    if (!window.confirm(`คุณต้องการ${actionText} ${selectedIds.length} รายการที่เลือกใช่หรือไม่?`)) {
      return;
    }

    try {
      let dbPath;
      if (type === 'leaves') dbPath = 'leaves';
      if (type === 'overtimes') dbPath = 'overtimes';
      if (type === 'swaps') dbPath = 'holidaySwaps'; // Path is different for swaps
      
      const updates = {};

      if (type === 'swaps') {
        selectedIds.forEach(id => {
          const swapItem = swaps.find(s => s.id === id);
          if (swapItem) {
            updates[`${dbPath}/${swapItem.uid}/${id}/status`] = newStatus;
            updates[`${dbPath}/${swapItem.uid}/${id}/reviewedBy`] = appUser.name;
            updates[`${dbPath}/${swapItem.uid}/${id}/reviewedAt`] = new Date().toISOString();
          }
        });
      } else {
        selectedIds.forEach(id => {
          updates[`${dbPath}/${id}/status`] = newStatus;
          updates[`${dbPath}/${id}/reviewedBy`] = appUser.name;
          updates[`${dbPath}/${id}/reviewedAt`] = new Date().toISOString();
        });
      }

      await update(ref(db), updates);
      
      // Manually refresh data after update
      fetchData(); 
      
      // รีเซ็ต selection
      setSelectedItems(prev => ({ ...prev, [type]: [] }));
      
      alert(`${actionText}สำเร็จ ${selectedIds.length} รายการ`);
    } catch (err) {
      console.error('Error:', err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // อนุมัติ/ปฏิเสธรายการเดี่ยว
  const handleSingleAction = async (type, item, newStatus) => {
    const actionText = newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
    
    if (!window.confirm(`คุณต้องการ${actionText}รายการนี้ใช่หรือไม่?`)) {
      return;
    }

    try {
      let itemRef;
      if (type === 'leaves') itemRef = ref(db, `leaves/${item.id}`);
      if (type === 'overtimes') itemRef = ref(db, `overtimes/${item.id}`);
      if (type === 'swaps') itemRef = ref(db, `holidaySwaps/${item.uid}/${item.id}`);

      await update(itemRef, {
        status: newStatus,
        reviewedBy: appUser.name,
        reviewedAt: new Date().toISOString(),
      });

      // Manually refresh data after update
      fetchData();
      
      alert(`${actionText}สำเร็จ`);
    } catch (err) {
      console.error('Error:', err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTable = (type, data) => {
    const isLeave = type === 'leaves';
    const isOT = type === 'overtimes';
    const isSwap = type === 'swaps';
    const selectedIds = selectedItems[type];

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 p-4 border-b border-indigo-200 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-900">
              เลือกแล้ว {selectedIds.length} รายการ
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction(type, 'approved')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ✓ อนุมัติที่เลือก
              </button>
              <button
                onClick={() => handleBulkAction(type, 'rejected')}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ✗ ปฏิเสธที่เลือก
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={() => handleSelectAll(type)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">พนักงาน</th>
                {isLeave && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ประเภท</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่ลา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เหตุผล</th>
                  </>
                )}
                {isOT && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ประเภท OT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เวลา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รวม</th>
                  </>
                )}
                {isSwap && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันหยุดเดิม</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่ขอสลับ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เหตุผล</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่ยื่น</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    ไม่มีรายการรออนุมัติ
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-indigo-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleCheckboxChange(type, item.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.userName}</div>
                      {item.userDepartment && (
                        <div className="text-xs text-gray-500">{item.userDepartment}</div>
                      )}
                    </td>
                    {isLeave && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.leaveType}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{item.startDate} ถึง {item.endDate}</div>
                          <div className="text-xs text-gray-500">({item.totalDays} วัน)</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-sm text-gray-700 truncate" title={item.reason}>{item.reason}</div>
                        </td>
                      </>
                    )}
                    {isOT && (
                       <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.otType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.startDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.startTime} - {item.endTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {item.otDisplay}
                          </span>
                        </td>
                      </>
                    )}
                    {isSwap && (
                       <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.originalDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.swapDate}</td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-sm text-gray-700 truncate" title={item.reason}>{item.reason}</div>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.submittedAt || item.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleSingleAction(type, item, 'approved')}
                          className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md text-sm transition-colors"
                        >
                          ✓ อนุมัติ
                        </button>
                        <button
                          onClick={() => handleSingleAction(type, item, 'rejected')}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm transition-colors"
                        >
                          ✗ ปฏิเสธ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const isLoading = Object.values(loading).some(status => status === true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800">📋 อนุมัติคำขอทั้งหมด</h2>
        <p className="text-gray-600 mt-1">จัดการคำขอลาและ OT ในที่เดียว</p>
      </div>

      {/* Department Filter */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">🏢 กรองตามแผนก:</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[250px]"
          >
            <option value="all">ทุกแผนก</option>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>{dept}</option>
            ))}
          </select>
          {selectedDepartment !== 'all' && (
            <button
              onClick={() => setSelectedDepartment('all')}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ✕ ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">การลา (รอพิจารณา)</p>
              {selectedDepartment !== 'all' && (
                <p className="text-xs text-gray-500 mt-1">{selectedDepartment}</p>
              )}
              <p className="text-3xl font-bold text-yellow-600 mt-2">{leaves.length}</p>
            </div>
            <i className='bx bx-calendar-x text-4xl text-yellow-500'></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">OT เช้า (รอพิจารณา)</p>
              {selectedDepartment !== 'all' && (
                <p className="text-xs text-gray-500 mt-1">{selectedDepartment}</p>
              )}
              <p className="text-3xl font-bold text-blue-600 mt-2">{overtimes.length}</p>
            </div>
            <i className='bx bx-time-five text-4xl text-blue-500'></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">สลับวันหยุด (รอพิจารณา)</p>
              {selectedDepartment !== 'all' && (
                <p className="text-xs text-gray-500 mt-1">{selectedDepartment}</p>
              )}
              <p className="text-3xl font-bold text-purple-600 mt-2">{swaps.length}</p>
            </div>
            <i className='bx bx-transfer text-4xl text-purple-500'></i>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`${
              activeTab === 'leaves'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            📝 การลาทั่วไป ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('overtimes')}
            className={`${
              activeTab === 'overtimes'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            🌅 OT ({overtimes.length})
          </button>
          <button
            onClick={() => setActiveTab('swaps')}
            className={`${
              activeTab === 'swaps'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            🔄 สลับวันหยุด ({swaps.length})
          </button>
        </nav>
      </div>

      {/* Table Content */}
      {activeTab === 'leaves' && renderTable('leaves', filteredLeaves)}
      {activeTab === 'overtimes' && renderTable('overtimes', filteredOvertimes)}
      {activeTab === 'swaps' && renderTable('swaps', filteredSwaps)}
    </div>
  );
};

export default AllApprovalsPage;
