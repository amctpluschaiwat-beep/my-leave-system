import React from 'react';

const LoadingSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-olive-600"></div>
    <p className="ml-4 text-olive-700 font-medium mt-4">กำลังโหลดข้อมูล...</p>
  </div>
);

export default LoadingSpinner;