import React from 'react';
import { auth } from '../config/firebase';

const Sidebar = ({ appUser, setPage, currentPage, isSidebarOpen, setIsSidebarOpen }) => {

  if (!appUser) {
    return (
      <div className="sidebar w-72 bg-white text-tplus-text h-screen flex flex-col shadow-lg border-r border-tplus-border">
        <div className="p-4 border-b border-tplus-border">
          <p className="text-sm font-medium">กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    auth.signOut();
  };

  const navigateTo = (pageName) => {
    setPage(pageName);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const getLinkClassName = (pageName) => {
    const isActive = currentPage === pageName;
    const baseStyle = 'nav-link flex items-center space-x-3 p-3 rounded-xl mb-2 w-full transition-all duration-300';

    if (isActive) {
      return `${baseStyle} bg-tplus-orange/10 text-tplus-orange font-semibold shadow-sm border border-tplus-orange/20`;
    }

    return `${baseStyle} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/30 z-[999]"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`sidebar w-72 bg-white text-tplus-text h-screen flex flex-col shadow-lg fixed left-0 top-0 overflow-y-auto border-r border-tplus-border transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}
        style={{ zIndex: 1000 }}
      >
        <div className="flex flex-col items-center justify-center p-5 border-b border-tplus-border bg-white">
            <img src="/favicon.ico" alt="Logo" className="w-16 h-16 object-contain mb-2" />
            <div className="text-center">
              <h1 className="text-sm font-bold tracking-wide text-tplus-orange">Human Resource</h1>
              <h1 className="text-sm font-bold tracking-wide text-tplus-orange">Management System</h1>
            </div>
        </div>

        <div className="p-5 border-b border-tplus-border bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-200 p-2.5 rounded-xl border border-slate-300">
              {appUser?.profileImageUrl ? (
                <img src={appUser.profileImageUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <i className='bx bxs-user text-xl text-slate-500'></i>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{appUser?.name || 'ผู้ใช้งาน'}</p>
              <p className="text-xs text-slate-500 capitalize">
                {appUser?.role === 'pending_approval'
                  ? 'รออนุมัติ'
                  : appUser?.role === 'CEO'
                  ? 'CEO'
                  : appUser?.role === 'commander'
                  ? 'Commander'
                  : appUser?.role === 'Manager'
                  ? 'Manager'
                  : appUser?.role === 'hr'
                  ? 'HR'
                  : appUser?.role === 'admin'
                  ? 'Admin'
                  : appUser?.role === 'employee'
                  ? 'พนักงาน'
                  : 'ไม่ระบุ'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto py-2">
          <nav className="px-4 py-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">เมนูหลัก</p>

            {appUser?.role !== 'pending_approval' && (
              <button type="button" onClick={() => navigateTo('dashboard')} className={getLinkClassName('dashboard')}>
                <i className='bx bxs-dashboard text-xl'></i>
                <span>Dashboard</span>
              </button>
            )}

            <button type="button" onClick={() => navigateTo('holiday_calendar')} className={getLinkClassName('holiday_calendar')}>
              <i className='bx bx-calendar text-xl'></i>
              <span>📅 ปฏิทินวันหยุด</span>
            </button>

            <button type="button" onClick={() => navigateTo('swap_holiday')} className={getLinkClassName('swap_holiday')}>
              <i className='bx bx-transfer text-xl'></i>
              <span>🔄 สลับวันหยุด</span>
            </button>

            {appUser?.role !== 'pending_approval' && (
              <>
                <button type="button" onClick={() => navigateTo('leave_form')} className={getLinkClassName('leave_form')}>
                  <i className='bx bxs-file-plus text-xl'></i>
                  <span>ยื่นคำขอลา</span>
                </button>

                <button type="button" onClick={() => navigateTo('ot_form')} className={getLinkClassName('ot_form')}>
                  <i className='bx bxs-time-five text-xl'></i>
                  <span>ขอทำ OT</span>
                </button>
              </>
            )}

            <p className="text-xs text-slate-400 uppercase tracking-wider mt-6 mb-2">ข้อมูลส่วนตัว</p>

            <button type="button" onClick={() => navigateTo('profile')} className={getLinkClassName('profile')}>
              <i className='bx bxs-user-detail text-xl'></i>
              <span>ประวัติพนักงาน</span>
            </button>

            <button type="button" onClick={() => navigateTo('payslip')} className={getLinkClassName('payslip')}>
              <i className='bx bxs-wallet text-xl'></i>
              <span>Pay Slip</span>
            </button>

            {(appUser?.role === 'Manager' || appUser?.role === 'hr' || appUser?.role === 'CEO' || appUser?.role === 'commander') && (
              <>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-6 mb-2">HRM System</p>

                <button type="button" onClick={() => navigateTo('reports_dashboard')} className={getLinkClassName('reports_dashboard')}>
                  <i className='bx bxs-bar-chart-alt-2 text-xl'></i>
                  <span>Dashboard รายงาน</span>
                </button>

                <button type="button" onClick={() => navigateTo('employee_list')} className={getLinkClassName('employee_list')}>
                  <i className='bx bxs-group text-xl'></i>
                  <span>ประวัติพนักงาน</span>
                </button>

                <button type="button" onClick={() => navigateTo('admin')} className={getLinkClassName('admin')}>
                  <i className='bx bxs-cog text-xl'></i>
                  <span>จัดการผู้ใช้งาน</span>
                </button>

                <button type="button" onClick={() => navigateTo('ot_approval')} className={getLinkClassName('ot_approval')}>
                  <i className='bx bxs-check-circle text-xl'></i>
                  <span>อนุมัติคำขอทั้งหมด</span>
                </button>
              </>
            )}

            {(appUser?.role === 'CEO' || appUser?.role === 'commander') && (
              <>
                <button type="button" onClick={() => navigateTo('company_profile')} className={getLinkClassName('company_profile')}>
                  <i className='bx bxs-building-house text-xl'></i>
                  <span>ข้อมูลโปรไฟล์ธุรกิจ</span>
                </button>
              </>
            )}

            {appUser?.role === 'commander' && (
              <>
                <button type="button" onClick={() => navigateTo('payslip_management')} className={getLinkClassName('payslip_management')}>
                  <i className='bx bx-money text-xl'></i>
                  <span>จัดการ PaySlip</span>
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-5 border-t border-tplus-border bg-white">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 border border-red-600"
          >
            <i className='bx bx-log-out text-lg'></i>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
































































