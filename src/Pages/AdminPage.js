import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../config/firebase';
import LoadingSpinner from './LoadingSpinner.js';

const AdminPage = ({ appUser }) => {
  // States สำหรับ User Management
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchUser, setSearchUser] = useState('');

  // States สำหรับ Approved Leaves History
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [loadingApprovedLeaves, setLoadingApprovedLeaves] = useState(true);

  // States สำหรับข้อความ
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // --- 1. ดึงข้อมูลผู้ใช้ (Users) ---
  useEffect(() => {
    const usersRef = ref(db, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.keys(usersData)
          .map(uid => ({
            uid: uid,
            ...usersData[uid]
          }))
          .filter(user => !user.isDeleted); // กรองเฉพาะผู้ใช้ที่ยังไม่ถูกลบ
        setUsers(usersList);
      } else {
        setUsers([]);
      }
      setLoadingUsers(false);
    }, (err) => {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: " + err.message);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. ดึงข้อมูลการลาที่อนุมัติแล้ว ---
  useEffect(() => {
    const leavesRef = ref(db, 'leaves');
    const unsubscribe = onValue(leavesRef, (snapshot) => {
      if (snapshot.exists()) {
        const leavesData = snapshot.val();
        const approvedList = Object.keys(leavesData)
          .map(key => ({
            id: key,
            ...leavesData[key]
          }))
          .filter(leave => leave.status === 'approved')
          .sort((a, b) => (b.reviewedAt || b.submittedAt || 0) - (a.reviewedAt || a.submittedAt || 0));
        setApprovedLeaves(approvedList);
      } else {
        setApprovedLeaves([]);
      }
      setLoadingApprovedLeaves(false);
    }, (err) => {
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลการลา: " + err.message);
      setLoadingApprovedLeaves(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 3. ฟังก์ชันจัดการ Role ผู้ใช้ ---
  const handleUpdateRole = async (uid, newRole) => {
    if (!window.confirm(`คุณต้องการเปลี่ยนสิทธิ์ของผู้ใช้นี้เป็น ${newRole} ใช่หรือไม่?`)) return;
    setSuccess(''); setError('');
    const userRef = ref(db, `users/${uid}`);
    try {
      await update(userRef, { role: newRole });
      setSuccess('อัปเดตสิทธิ์ผู้ใช้สำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('อัปเดตสิทธิ์ผู้ใช้ล้มเหลว: ' + err.message);
    }
  };

  // --- 4. ฟังก์ชันจัดการ แผนก ---
  const handleUpdateDepartment = async (uid, newDepartment) => {
    setSuccess(''); setError('');
    const userRef = ref(db, `users/${uid}`);
    try {
      await update(userRef, { department: newDepartment });
      setSuccess('อัปเดตแผนกสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('อัปเดตแผนกล้มเหลว: ' + err.message);
    }
  };

  // --- 5. ฟังก์ชันดูโปรไฟล์ผู้ใช้ ---
  const handleViewProfile = (user) => {
    window.location.hash = `#profile_view/${user.uid}`;
  };

  // --- 6. ฟังก์ชันลบผู้ใช้ ---
  const handleDeleteUser = async (uid, userName) => {
    if (!window.confirm(`คุณต้องการลบผู้ใช้ "${userName}" ใช่หรือไม่?\n\n⚠️ การลบจะไม่สามารถกู้คืนได้!`)) return;
    
    setSuccess(''); setError('');
    const userRef = ref(db, `users/${uid}`);
    try {
      await update(userRef, { 
        isDeleted: true,
        deletedAt: Date.now(),
        deletedBy: appUser.name
      });
      setSuccess(`ลบผู้ใช้ "${userName}" สำเร็จ!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('ลบผู้ใช้ล้มเหลว: ' + err.message);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Manager':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'hr':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'employee':
        return 'bg-slate-100 text-slate-800 border border-slate-300';
      case 'pending_approval':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'admin':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  // --- 6. ฟังก์ชัน Format Date ---
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loadingUsers || loadingApprovedLeaves) {
    return <LoadingSpinner />;
  }

  // --- 7. Filter Users ---
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-medium">เกิดข้อผิดพลาด</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded">
          <p className="font-medium">✓ สำเร็จ</p>
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* === ตารางที่ 1: จัดการผู้ใช้งาน === */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-2xl font-semibold text-slate-800">
              👥 จัดการผู้ใช้งาน
            </h3>
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อหรืออีเมล..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  อีเมล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ตำแหน่ง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  แผนก
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สิทธิ์
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการสิทธิ์
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    ไม่พบผู้ใช้ที่ค้นหา
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={user.profileImageUrl || 'https://via.placeholder.com/40'}
                        alt="profile"
                        className="h-10 w-10 rounded-full mr-3 object-cover"
                      />
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.position || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.department || ''}
                      onChange={(e) => handleUpdateDepartment(user.uid, e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                      disabled={user.uid === appUser?.uid}
                    >
                      <option value="">-- เลือกแผนก --</option>
                      {departments.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {user.uid === appUser?.uid && (
                      <div className="text-xs text-gray-500 mt-1">(คุณเอง)</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {user.role === 'pending_approval' ? '⏳ รออนุมัติ' : 
                       user.role === 'Manager' ? '👔 Manager' : 
                       user.role === 'hr' ? '📋 HR' : '👤 Employee'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {user.role === 'pending_approval' ? (
                      <button 
                        onClick={() => handleUpdateRole(user.uid, 'employee')}
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors shadow-sm"
                      >
                        ✓ อนุมัติเป็น Employee
                      </button>
                    ) : (
                      <select 
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.uid, e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        disabled={user.uid === appUser?.uid}
                      >
                        <option value="employee">Employee</option>
                        <option value="hr">HR</option>
                        <option value="Manager">Manager</option>
                      </select>
                    )}
                    {user.uid === appUser?.uid && (
                      <div className="text-xs text-gray-500 mt-1">(คุณเอง)</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex space-x-2 justify-center">
                      <button
                        onClick={() => handleViewProfile(user)}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-sm transition-colors"
                        title="ดูโปรไฟล์"
                      >
                        <i className='bx bx-user-circle'></i> ดูโปรไฟล์
                      </button>
                      {user.uid !== appUser?.uid && (
                        <button
                          onClick={() => handleDeleteUser(user.uid, user.name)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm transition-colors"
                          title="ลบผู้ใช้"
                        >
                          <i className='bx bx-trash'></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* === ตารางที่ 2: ประวัติการลาที่อนุมัติ === */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-semibold text-slate-800">
            ✅ ประวัติการลาที่อนุมัติแล้ว
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            รายการคำขอลาที่ได้รับการอนุมัติทั้งหมด ({approvedLeaves.length} รายการ)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  พนักงาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  แผนก
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภทการลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่ลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เหตุผล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้อนุมัติ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่อนุมัติ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedLeaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className='bx bx-check-circle text-5xl text-gray-300 mb-2'></i>
                      <p>ยังไม่มีรายการอนุมัติ</p>
                    </div>
                  </td>
                </tr>
              ) : (
                approvedLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{leave.userName}</div>
                      <div className="text-xs text-gray-500">{leave.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                        {leave.userDepartment || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{leave.leaveType}</span>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <i className='bx bx-user-check text-green-600 mr-2'></i>
                        <span className="text-sm text-gray-700">{leave.reviewedBy || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(leave.reviewedAt)}
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

export default AdminPage;