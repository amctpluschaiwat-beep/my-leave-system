// src/components/Navbar.jsx
import React from "react";

function Navbar({ appUser, onLogout, pageTitle }) {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm sticky top-0 z-40 transition-all duration-300">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{pageTitle || 'HRM System'}</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">ระบบจัดการทรัพยากรบุคคล</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">{appUser?.name}</p>
            <p className="text-xs text-gray-600 font-semibold">
              {appUser?.role === 'CEO' ? 'CEO' :
               appUser?.role === 'commander' ? 'Commander' :
               appUser?.role === 'Manager' ? 'Manager' :
               appUser?.role === 'hr' ? 'HR' :
               appUser?.role === 'admin' ? 'Admin' : 'พนักงาน'}
            </p>
          </div>
          {appUser?.profileImageUrl ? (
            <img 
              src={appUser.profileImageUrl} 
              alt="Profile" 
              className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-300/50 shadow-md transition-all duration-300 hover:ring-4 hover:ring-slate-400/50 hover:scale-110"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg">
              {appUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

