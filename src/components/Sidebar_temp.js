import React from 'react';
import newLogo from '../assets/my-new-logo.png'; 

const Sidebar = ({ appUser, setPage, currentPage }) => {

  if (!appUser) {
    return (
      <div className="sidebar w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white h-screen flex flex-col shadow-xl">
        <div className="p-4 border-b border-gray-700">
          <p className="text-sm font-medium">กำลงโหลดขอมลผใช...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white h-screen flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.4)] fixed left-0 top-0 overflow-y-auto border-r-2 border-gray-700/70"
         style={{ zIndex: 1000 }}>
      
      {/* --- สวนหว Logo --- */}
      <div className="flex items-center justify-between p-5 border-b border-gray-700/50 bg-gray-800/40 backdrop-blur-sm">
        <div className="flex flex-col items-start space-y-2">
          <div className="bg-white p-2 rounded-xl shadow-2xl border-2 border-green-400 transition-all duration-500 hover:scale-105 hover:shadow-green-500/50">
            <img 
              src={newLogo} 
              alt="Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-green-400">Human Resource</h1>
            <h1 className="text-sm font-bold tracking-wide text-green-400">Management System</h1>
          </div>
        </div>
      </div>

      {/* --- สวน User --- */}
      <div className="p-5 border-b border-gray-700/50 bg-gray-800/20">
        <div className="flex items-center space-x-3">
          <div className="bg-green-600/30 backdrop-blur-sm p-2.5 rounded-xl border border-green-500/50 transition-all duration-300 hover:scale-105">
            {appUser?.profileImageUrl ? (
               <img src={appUser.profileImageUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
            ) : (
               <i className='bx bxs-user text-xl'></i>
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{appUser?.name || 'ผใชงาน'}</p>
            <p className="text-xs text-gray-400 capitalize">
              {appUser?.role === 'pending_approval' ? 'รออนมต' : 
               appUser?.role === 'CEO' ? 'CEO' :
               appUser?.role === 'commander' ? 'Commander' :
               appUser?.role === 'Manager' ? 'Manager' :
               appUser?.role === 'hr' ? 'HR' :
               appUser?.role === 'admin' ? 'Admin' :
               appUser?.role === 'employee' ? 'พนกงาน' : 'ไมระบ'}
            </p>
          </div>
        </div>
      </div>

      {/* --- สวนเมนหลก --- */}
      <div className="flex-grow overflow-y-auto py-2">
        <nav className="px-4 py-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">เมนหลก</p>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
