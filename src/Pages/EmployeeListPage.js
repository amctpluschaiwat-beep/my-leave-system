import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

const EmployeeListPage = ({ appUser }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [error, setError] = useState(null);

  // ตรวจสอบสิทธิ์การเข้าถึง - Manager, HR, CEO, Commander
  const hasAccess = appUser?.role === 'Manager' || appUser?.role === 'hr' || appUser?.role === 'CEO' || appUser?.role === 'commander';

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

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      setError('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      return;
    }

    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const usersData = snapshot.val();
            const employeesList = Object.keys(usersData)
              .map(uid => ({ uid, ...usersData[uid] }))
              .filter(user => !user.isDeleted && user.role !== 'pending_approval');
            setEmployees(employeesList);
          } else {
            setEmployees([]);
          }
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error fetching employees:', err);
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Firebase error:', error);
        setError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [hasAccess]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = 
      selectedDepartment === 'all' || emp.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const handleViewProfile = (employee) => {
    window.location.hash = `#profile/${employee.uid}`;
  };

  const handleExport = () => {
    const dataToExport = filteredEmployees.map(emp => ({
      'ชื่อ-นามสกุล': emp.name,
      'อีเมล': emp.email,
      'แผนก': emp.department || '-',
      'ตำแหน่ง': emp.position || '-',
      'รหัสพนักงาน': emp.employeeId || '-',
      'สิทธิ์': emp.role,
      'วันที่เข้าทำงาน': emp.createdAt || '-'
    }));
    
    console.log('Export data:', dataToExport);
    alert(`กำลัง Export ข้อมูล ${filteredEmployees.length} รายการ\n(ฟีเจอร์นี้จะพัฒนาต่อให้รองรับ Excel/PDF)`);
  };

  const getRoleBadge = (role) => {
    const badges = {
      'Manager': 'bg-purple-100 text-purple-800 border-purple-300',
      'hr': 'bg-blue-100 text-blue-800 border-blue-300',
      'admin': 'bg-red-100 text-red-800 border-red-300',
      'employee': 'bg-slate-100 text-slate-800 border-slate-300'
    };
    return badges[role] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getRoleText = (role) => {
    const roleTexts = {
      'Manager': '👔 Manager',
      'hr': '📋 HR',
      'admin': '⚙️ Admin',
      'employee': '👤 พนักงาน'
    };
    return roleTexts[role] || role;
  };

  // สถิติ
  const stats = {
    total: filteredEmployees.length,
    byDepartment: departments.map(dept => ({
      name: dept,
      count: filteredEmployees.filter(e => e.department === dept).length
    })),
    byRole: {
      manager: filteredEmployees.filter(e => e.role === 'Manager').length,
      hr: filteredEmployees.filter(e => e.role === 'hr').length,
      employee: filteredEmployees.filter(e => e.role === 'employee').length
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Access Denied
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-lg shadow-md max-w-md">
          <div className="flex items-center mb-4">
            <i className='bx bx-error-circle text-5xl text-red-500 mr-4'></i>
            <div>
              <h3 className="text-xl font-bold text-red-800">ไม่มีสิทธิ์เข้าถึง</h3>
              <p className="text-red-600 mt-2">
                หน้านี้สำหรับ Manager และ HR เท่านั้น
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error Display
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <i className='bx bx-error text-4xl text-red-500 mb-2'></i>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800">👥 ประวัติพนักงาน</h2>
        <p className="text-gray-600 mt-1">รายชื่อพนักงานทั้งหมดในระบบ</p>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">พนักงานทั้งหมด</p>
              {selectedDepartment !== 'all' && (
                <p className="text-xs text-gray-500 mt-1">{selectedDepartment}</p>
              )}
              <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.total}</p>
            </div>
            <i className='bx bx-group text-4xl text-indigo-500'></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Manager</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.byRole.manager}</p>
            </div>
            <i className='bx bx-briefcase text-4xl text-purple-500'></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">HR</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.byRole.hr}</p>
            </div>
            <i className='bx bx-id-card text-4xl text-blue-500'></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-6 rounded-lg shadow-md border-l-4 border-slate-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">พนักงานทั่วไป</p>
              <p className="text-3xl font-bold text-slate-600 mt-2">{stats.byRole.employee}</p>
            </div>
            <i className='bx bx-user text-4xl text-slate-500'></i>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">🔍 ค้นหา</label>
            <input
              type="text"
              placeholder="ชื่อ, อีเมล, รหัสพนักงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">🏢 กรองตามแผนก</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">ทุกแผนก ({employees.length})</option>
              {departments.map((dept, index) => {
                const count = employees.filter(e => e.department === dept).length;
                return <option key={index} value={dept}>{dept} ({count})</option>;
              })}
            </select>
          </div>

          {/* Export Button */}
          <div className="md:col-span-1 flex items-end">
            <button
              onClick={handleExport}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <i className='bx bx-download'></i>
              <span>Export ({filteredEmployees.length} รายการ)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  ตำแหน่ง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รหัสพนักงาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สิทธิ์
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className='bx bx-user-x text-5xl text-gray-300 mb-2'></i>
                      <p>ไม่พบข้อมูลพนักงาน</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {employee.profileImageUrl ? (
                          <img
                            src={employee.profileImageUrl}
                            alt="profile"
                            className="h-10 w-10 rounded-full mr-3 object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full mr-3 bg-slate-200 flex items-center justify-center">
                            <i className='bx bxs-user text-xl text-slate-500'></i>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                        {employee.department || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {employee.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {employee.employeeId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(employee.role)}`}>
                        {getRoleText(employee.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewProfile(employee)}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded-md text-sm font-medium transition-colors inline-flex items-center space-x-1"
                      >
                        <i className='bx bx-user-circle'></i>
                        <span>ดูโปรไฟล์</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Statistics */}
      {selectedDepartment === 'all' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">📊 สถิติพนักงานแยกตามแผนก</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.byDepartment
              .filter(dept => dept.count > 0)
              .map((dept, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <p className="text-sm text-gray-600 mb-1">{dept.name}</p>
                  <p className="text-2xl font-bold text-indigo-600">{dept.count} คน</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeListPage;
