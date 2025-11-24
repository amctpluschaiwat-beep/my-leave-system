import React, { useState } from 'react';
// ⬇️ 1. Import โลโก้ใหม่
import newLogo from '../assets/my-new-logo.png'; 
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

const Login = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setPage('loading'); 
    } catch (err) {
      if (err.code === 'auth/invalid-credential') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError('เกิดข้อผิดพลาดในการล็อกอิน');
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetSuccess(false);
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetSuccess(false);
      }, 3000);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('ไม่พบอีเมลนี้ในระบบ');
      } else {
        setError('เกิดข้อผิดพลาดในการส่งอีเมล');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-transparent"></div>
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/20 mb-6 transition-all duration-500 hover:scale-105 hover:rotate-2">
            <img 
              src={newLogo}
              alt="TPLUS Logo" 
              className="w-32 h-32 object-contain" 
            />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center tracking-wide">
            HRM Management System
          </h1>
          <p className="text-lg text-slate-300 text-center max-w-xs font-light">
            ระบบการจัดการพนักงานและเอกสาร
          </p>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center p-8 relative">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 w-full max-w-md border border-slate-200/50">
          
          <div className="flex justify-center mb-6 md:hidden">
            <img 
              src={newLogo}
              alt="TPLUS Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-6 tracking-wide">
            เข้าสู่ระบบ
          </h2>
          <p className="text-center text-slate-500 mb-8 font-light">
            กรุณาใช้อีเมลและรหัสผ่านของบริษัท
          </p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg transition-all duration-300" role="alert">
              <p className="font-bold">เกิดข้อผิดพลาด</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                อีเมล
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <i className='bx bx-envelope text-slate-400'></i> 
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-300 hover:border-slate-400"
                  placeholder="you@company.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <i className='bx bx-lock text-slate-400'></i>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-300 hover:border-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center disabled:opacity-50 text-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
              ) : (
                <>
                  <i className='bx bx-log-in mr-2'></i>
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-all duration-300 hover:underline"
            >
              <i className='bx bx-help-circle mr-1'></i>
              ลืมรหัสผ่าน?
            </button>
          </div>

          <div className="text-center mt-8">
            <span className="text-sm text-slate-600">ยังไม่มีบัญชี? </span>
            <button
              onClick={() => setPage('register')}
              className="text-sm text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 hover:scale-105 inline-block"
            >
              ลงทะเบียนที่นี่
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200/80 py-3 px-6 z-10">
          
        </footer>

        {/* LINE Contact Floating Button */}
        <a
          href="https://lin.ee/iVKM5Z4"
          target="_blank"
          rel="noopener noreferrer"
          className="group fixed bottom-16 right-8 bg-white hover:bg-green-50 text-green-600 p-4 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 z-50 border border-green-100"
        >
          <svg 
            className="w-6 h-6" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            ติดต่อผ่าน LINE
          </div>
        </a>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                <i className='bx bx-key text-3xl mr-2 text-blue-600'></i>
                ลืมรหัสผ่าน
              </h2>
              <p className="text-slate-600 mb-6">
                กรอกอีเมลของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้
              </p>

              {resetSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg">
                  <p className="font-bold flex items-center">
                    <i className='bx bx-check-circle mr-2'></i>
                    ส่งอีเมลสำเร็จ!
                  </p>
                  <p className="text-sm">กรุณาตรวจสอบอีเมลของคุณ</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">
                  <p className="font-bold">เกิดข้อผิดพลาด</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full border-2 border-slate-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="you@company.com"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'กำลังส่ง...' : 'ส่งอีเมล'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError('');
                      setResetEmail('');
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      
      </div>
    </div>
  );
};

export default Login;