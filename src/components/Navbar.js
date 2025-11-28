// src/components/Navbar.jsx
import React from "react";

function Navbar({ appUser, onLogout, pageTitle, toggleSidebar }) {
  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-tplus-border shadow-sm sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
        
        {/* Left Section: Mobile Menu Button & Page Title */}
        <div className="flex items-center space-x-4">
          {/* Mobile Sidebar Toggle */}
          <button 
            className="lg:hidden text-slate-600 hover:text-tplus-orange"
            onClick={toggleSidebar}
          >
            <i className='bx bx-menu text-2xl'></i>
          </button>
          
          <h2 className="text-xl sm:text-2xl font-bold text-tplus-text tracking-tight">
            {pageTitle || 'HRM System'}
          </h2>
        </div>
        
        {/* User Info Section */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700">{appUser?.name}</p>
            <p className="text-xs text-gray-500 font-medium capitalize">
              {appUser?.role?.replace('_', ' ') || 'Employee'}
            </p>
          </div>
          {appUser?.profileImageUrl ? (
            <img 
              src={appUser.profileImageUrl} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-tplus-orange/50 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm border border-slate-300">
              <i className='bx bxs-user text-xl'></i>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

