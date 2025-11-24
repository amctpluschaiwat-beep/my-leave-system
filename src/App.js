import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, db } from './config/firebase'; 

// Layout
import DashboardLayout from './layouts/DashboardLayout'; 

// Pages
import Login from './Pages/Login.js'; 
import Register from './Pages/Register.js';
import LoadingSpinner from './Pages/LoadingSpinner.js';

import Dashboard from './Pages/Dashboard';
import ReportsDashboard from './Pages/ReportsDashboard';
import ProfilePage from './Pages/ProfilePage'; 
import LeaveForm from './Pages/LeaveForm';
import OTForm from './Pages/OTForm';
import AdminPage from './Pages/AdminPage.js';
import PaySlipPage from './Pages/PaySlipPage.js';
import CompanyProfilePage from './Pages/CompanyProfilePage.js';
import PaySlipManagementPage from './Pages/PaySlipManagementPage.js';
import AllApprovalsPage from './components/AllApprovalsPage';
import EmployeeListPage from './Pages/EmployeeListPage';
import ButtonStyleComparison from './Pages/ButtonStyleComparison';
import ThemeComparison from './Pages/ThemeComparison';
import HolidayCalendar from './Pages/HolidayCalendar';
import SwapHolidayForm from './Pages/SwapHolidayForm';

function App() {
  const [page, setPage] = useState('loading'); 
  const [appUser, setAppUser] = useState(null);
  const [viewUserId, setViewUserId] = useState(null); // สำหรับดูโปรไฟล์คนอื่น 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // ดึงข้อมูล Role
          const roleRef = ref(db, 'roles/' + user.uid);
          const roleSnapshot = await get(roleRef);

          let userRole = null;
          
          if (roleSnapshot.exists()) {
            userRole = roleSnapshot.val();
          }
          
          // ดึงข้อมูลโปรไฟล์
          const userRef = ref(db, 'users/' + user.uid);
          const userSnapshot = await get(userRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            
            // ถ้าไม่มี Role ใน /roles/ ให้ใช้ role จาก userData
            const finalRole = userRole || userData.role || 'pending_approval';
            
            setAppUser({
              uid: user.uid,
              email: user.email,
              ...userData,
              role: finalRole
            });
            
            // จัดการการ redirect ตาม role
            if (finalRole === 'pending_approval') {
              // พนักงานที่รออนุมัติ - ให้เข้าระบบได้แต่มีข้อจำกัด
              setPage('profile');
            } else if (finalRole === 'CEO' || finalRole === 'commander') {
              // CEO และ Commander - ไปหน้า Dashboard รายงาน
              setPage('reports_dashboard');
            } else if (finalRole === 'Manager' || finalRole === 'hr' || finalRole === 'admin') {
              setPage('dashboard');
            } else if (finalRole === 'employee') {
              setPage('dashboard'); // Employee สามารถดู Dashboard ของตัวเองได้
            } else {
              // Role อื่นๆ
              setPage('profile');
            }
            
          } else {
            // ไม่พบข้อมูล user - สร้างข้อมูลเบื้องต้น
            const basicProfile = {
              email: user.email,
              name: user.displayName || 'ผู้ใช้งาน',
              role: 'pending_approval',
              createdAt: new Date().toISOString()
            };
            
            await set(ref(db, 'users/' + user.uid), basicProfile);
            
            setAppUser({
              uid: user.uid,
              ...basicProfile
            });
            
            setPage('profile');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
          setPage('login');
        }
      } else {
        setAppUser(null);
        setPage('login'); 
      }
    });

    return () => unsubscribe();
  }, []); 

  // Listen to hash changes for profile viewing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#profile_view/')) {
        const uid = hash.split('/')[1];
        setViewUserId(uid);
        setPage('profile_view');
      } else if (hash.startsWith('#profile/')) {
        const uid = hash.split('/')[1];
        setViewUserId(uid);
        setPage('profile');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []); 

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setAppUser(null);
      setPage('login');
    } catch (err) {
      console.error('Logout error:', err);
      alert('ออกจากระบบไม่สำเร็จ โปรดลองใหม่');
    }
  };

  const renderPage = () => {
    switch (page) {
      case 'loading':
        return <LoadingSpinner />;
      case 'login':
        return <Login setPage={setPage} />;
      case 'register':
        return <Register setPage={setPage} />;
      
      case 'dashboard':
      case 'reports_dashboard':
      case 'profile':
      case 'profile_view': // เพิ่ม case สำหรับดูโปรไฟล์คนอื่น
      case 'payslip':
      case 'leave_form':
      case 'ot_form':
      case 'ot_approval':
      case 'employee_list':
      case 'admin':
      case 'company_profile':
      case 'payslip_management':
      case 'button_styles': // เพิ่มหน้าเปรียบเทียบสีปุ่ม
      case 'theme_comparison': // เพิ่มหน้าเปรียบเทียบธีมทั้งหน้า
      case 'holiday_calendar': // เพิ่มหน้าปฏิทินวันหยุด
      case 'swap_holiday': // เพิ่มหน้าสลับวันหยุด 
        
        if (!appUser) {
          return <LoadingSpinner />;
        }
        
        // --- FIX 3: ตรรกะการแสดงผลหน้าตาม Role (ป้องกันอีกชั้น) ---
        // Manager และ HR มีสิทธิ์เข้าถึง HRM System
        const isAdmin = appUser.role === 'Manager' || appUser.role === 'hr' || appUser.role === 'CEO' || appUser.role === 'commander';
        const isHighLevel = appUser.role === 'CEO' || appUser.role === 'commander';
        const isPending = appUser.role === 'pending_approval';

        // ถ้าเป็นพนักงานรออนุมัติ แสดงข้อความแจ้งเตือน
        if (isPending) {
          return <DashboardLayout appUser={appUser} setPage={setPage} currentPage={'profile'} onLogout={handleLogout}>
            <div className="p-6">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-lg shadow-md">
                <div className="flex items-start">
                  <i className='bx bx-info-circle text-3xl mr-4'></i>
                  <div>
                    <h3 className="font-bold text-lg mb-2">บัญชีของคุณรออนุมัติ</h3>
                    <p className="mb-2">
                      ขอบคุณที่ลงทะเบียน! บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ
                    </p>
                    <p className="text-sm">
                      คุณสามารถดูและแก้ไขข้อมูลส่วนตัวได้ แต่ยังไม่สามารถใช้งานฟีเจอร์อื่นๆ ได้จนกว่าจะได้รับการอนุมัติ
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <ProfilePage appUser={appUser} />
              </div>
            </div>
          </DashboardLayout>
        }

        // ป้องกัน company_profile - เฉพาะ CEO และ Commander
        if (page === 'company_profile' && !isHighLevel) {
          return <DashboardLayout appUser={appUser} setPage={setPage} currentPage={'dashboard'} onLogout={handleLogout}>
            <Dashboard appUser={appUser} />
          </DashboardLayout>
        }

        // CEO และ Commander มีสิทธิ์เข้าถึงได้ทุกหน้า (unlimited access) - skip ทุก protection
        if (!isHighLevel) {
          // ถ้า Employee พยายามเปิดหน้า Admin, ให้เด้งไปหน้ายื่นลา
          if (page === 'admin' && !isAdmin) {
            return <DashboardLayout appUser={appUser} setPage={setPage} currentPage={'leave_form'} onLogout={handleLogout}>
              <LeaveForm appUser={appUser} />
            </DashboardLayout>
          }
          
          // Employee สามารถดู Dashboard ของตัวเองได้ (ไม่บล็อก)
          
          // ถ้า Employee พยายามเปิดหน้า EmployeeList, ให้เด้งไปหน้ายื่นลา
          if (page === 'employee_list' && !isAdmin) {
            return <DashboardLayout appUser={appUser} setPage={setPage} currentPage={'leave_form'} onLogout={handleLogout}>
              <LeaveForm appUser={appUser} />
            </DashboardLayout>
          }

          // ถ้า Employee พยายามเปิดหน้า OT Approval, ให้เด้งไปหน้ายื่นลา
          if (page === 'ot_approval' && !isAdmin) {
            return <DashboardLayout appUser={appUser} setPage={setPage} currentPage={'leave_form'} onLogout={handleLogout}>
              <LeaveForm appUser={appUser} />
            </DashboardLayout>
          }
        }

        return (
          <DashboardLayout 
            appUser={appUser} 
            setPage={setPage} 
            currentPage={page}
            onLogout={handleLogout}
          >
            {page === 'dashboard' && <Dashboard appUser={appUser} />}
            {page === 'reports_dashboard' && <ReportsDashboard appUser={appUser} />}
            {page === 'profile' && <ProfilePage appUser={appUser} viewUserId={viewUserId} />}
            {page === 'profile_view' && <ProfilePage appUser={appUser} viewUserId={viewUserId} viewMode={true} />}
            {page === 'payslip' && <PaySlipPage appUser={appUser} />}
            {page === 'leave_form' && <LeaveForm appUser={appUser} />}
            {page === 'ot_form' && <OTForm appUser={appUser} />}
            {page === 'ot_approval' && <AllApprovalsPage appUser={appUser} />}
            {page === 'employee_list' && <EmployeeListPage appUser={appUser} />}
            {page === 'admin' && <AdminPage appUser={appUser} />}
            {page === 'company_profile' && <CompanyProfilePage appUser={appUser} />}
            {page === 'payslip_management' && <PaySlipManagementPage appUser={appUser} />}
            {page === 'button_styles' && <ButtonStyleComparison />}
            {page === 'theme_comparison' && <ThemeComparison />}
            {page === 'holiday_calendar' && <HolidayCalendar appUser={appUser} />}
            {page === 'swap_holiday' && <SwapHolidayForm appUser={appUser} />}
          </DashboardLayout>
        );
        
      default:
        return <Login setPage={setPage} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;