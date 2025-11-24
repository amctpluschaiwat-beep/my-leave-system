import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = ({ appUser, setPage, currentPage, children, onLogout }) => {
  
  const profileDescription = 'à¸›à¸£à¸°à¸§à¸±à¸•à¸´à¸žà¸™à¸±à¸à¸‡à¸²à¸™';
  const getPageTitle = (page) => {
    const pageProfile = 'profile';
    switch (page) {
      case 'dashboard':
        return 'TPLUS LEAVE SYSTEM';
      case 'reports_dashboard':
        return 'TPLUS LEAVE SYSTEM';
      case pageProfile:
        const profileTitle = profileDescription;
        return profileTitle;
      case 'payslip':
        return 'Pay Slip';
      case 'leave_form':
        return 'à¸¢à¸·à¹ˆà¸™à¸„à¸³à¸‚à¸­à¸¥à¸²';
      case 'ot_form':
        return 'à¸‚à¸­à¸—à¸³ OT';
      case 'ot_approval':
        return 'à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¸„à¸³à¸‚à¸­à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”';
      case 'employee_list':
        return 'à¸›à¸£à¸°à¸§à¸±à¸•à¸´à¸žà¸™à¸±à¸à¸‡à¸²à¸™';
      case 'admin':
        return 'à¸ˆà¸±à¸”à¸à¸²à¸£à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸‡à¸²à¸™';
      case 'company_profile':
        return 'à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹‚à¸›à¸£à¹„à¸Ÿà¸¥à¹Œà¸˜à¸¸à¸£à¸à¸´à¸ˆ';
      case 'payslip_management':
        return 'à¸ˆà¸±à¸”à¸à¸²à¸£ PaySlip';
      default:
        return 'à¸«à¸™à¹‰à¸²à¸«à¸¥à¸±à¸';
    }
  };
  
  const pageTitle = getPageTitle(currentPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex font-sans">
      
      <Sidebar appUser={appUser} setPage={setPage} currentPage={currentPage} />
      
      <div className="flex-grow ml-72 relative overflow-x-hidden">
        <Navbar pageTitle={pageTitle} appUser={appUser} onLogout={onLogout} />
        <main className="p-6 pb-20">
          {children}
        </main>
        
        {/* Footer - Copyright */}
        <footer className="fixed bottom-0 left-72 right-0 bg-white border-t border-blue-100 py-3 px-6 text-xs shadow-sm backdrop-blur-sm bg-white/95">
          
        </footer>

        {/* LINE Contact Button - Fixed at LEFT SIDE to avoid blocking content */}
        <a
          href="https://lin.ee/iVKM5Z4"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 left-6 bg-white text-green-600 p-3 rounded-full shadow-lg hover:shadow-2xl border-2 border-green-500 transition-all duration-300 hover:scale-110 z-40 group"
          title="à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸ˆà¹‰à¸²à¸‚à¸­à¸‡à¸£à¸°à¸šà¸šà¸œà¹ˆà¸²à¸™ LINE"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-blue-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl">
            LINE Support
          </span>
        </a>
      </div>
    </div>
  );
};

export default DashboardLayout;
