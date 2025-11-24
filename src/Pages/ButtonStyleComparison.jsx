import React, { useState } from 'react';

const ButtonStyleComparison = () => {
  const [selectedStyle, setSelectedStyle] = useState('style1');

  // 🎨 Style Options
  const styleOptions = {
    style1: {
      name: "แบบที่ 1: Corporate Blue (ไม่มีไล่สี)",
      description: "เข้มเหมือน Sidebar, ใช้สีเดียว, เรียบหรู",
      colors: {
        submit: "bg-blue-700 hover:bg-blue-800",
        export: "bg-green-600 hover:bg-green-700",
        import: "bg-green-600 hover:bg-green-700",
        delete: "bg-red-600 hover:bg-red-700",
        cancel: "bg-gray-500 hover:bg-gray-600",
        edit: "bg-sky-600 hover:bg-sky-700"
      }
    },
    style2: {
      name: "แบบที่ 2: Dark Professional (ไล่สีเข้ม)",
      description: "ไล่สีเข้มมาก, สีดำน้ำเงิน, ดูหรูหรา",
      colors: {
        submit: "bg-gradient-to-r from-blue-950 to-blue-900 hover:from-blue-900 hover:to-blue-800",
        export: "bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700",
        import: "bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700",
        delete: "bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700",
        cancel: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600",
        edit: "bg-gradient-to-r from-sky-700 to-sky-800 hover:from-sky-600 hover:to-sky-700"
      }
    },
    style3: {
      name: "แบบที่ 3: Modern Vibrant (ไล่สีสดใส)",
      description: "ไล่สีสว่าง, สดใส, ดูทันสมัย",
      colors: {
        submit: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
        export: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
        import: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
        delete: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
        cancel: "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600",
        edit: "bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
      }
    },
    style4: {
      name: "แบบที่ 4: Soft Pastel (สีพาสเทล)",
      description: "สีอ่อนนุ่มนวล, ไม่จ้า, ดูสบายตา",
      colors: {
        submit: "bg-blue-500 hover:bg-blue-600",
        export: "bg-green-500 hover:bg-green-600",
        import: "bg-green-500 hover:bg-green-600",
        delete: "bg-red-500 hover:bg-red-600",
        cancel: "bg-gray-400 hover:bg-gray-500",
        edit: "bg-sky-500 hover:bg-sky-600"
      }
    },
    style5: {
      name: "แบบที่ 5: High Contrast (ตัดกันสูง)",
      description: "สีเข้มมาก, ตัดกันชัด, อ่านง่าย",
      colors: {
        submit: "bg-blue-800 hover:bg-blue-900",
        export: "bg-green-700 hover:bg-green-800",
        import: "bg-green-700 hover:bg-green-800",
        delete: "bg-red-700 hover:bg-red-800",
        cancel: "bg-gray-600 hover:bg-gray-700",
        edit: "bg-sky-700 hover:bg-sky-800"
      }
    },
    style6: {
      name: "แบบที่ 6: Minimal Light (มินิมอลสว่าง)",
      description: "สีอ่อน, ขอบชัด, สไตล์มินิมัล",
      colors: {
        submit: "bg-blue-100 text-blue-800 border-2 border-blue-300 hover:bg-blue-200",
        export: "bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200",
        import: "bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200",
        delete: "bg-red-100 text-red-800 border-2 border-red-300 hover:bg-red-200",
        cancel: "bg-gray-100 text-gray-800 border-2 border-gray-300 hover:bg-gray-200",
        edit: "bg-sky-100 text-sky-800 border-2 border-sky-300 hover:bg-sky-200"
      }
    }
  };

  const currentStyle = styleOptions[selectedStyle];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-slate-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-blue-900 mb-2">🎨 Button Style Comparison</h1>
        <p className="text-blue-600">เลือกแบบที่ชอบ แล้วกด "Apply to System" เพื่อใช้งาน</p>
      </div>

      {/* Style Selector */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 mb-4">เลือกแบบที่ต้องการ:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(styleOptions).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setSelectedStyle(key)}
                className={`p-4 rounded-xl text-left transition-all duration-300 border-2 ${
                  selectedStyle === key
                    ? 'bg-blue-700 text-white border-blue-700 shadow-lg scale-105'
                    : 'bg-white text-blue-900 border-blue-200 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                <div className="font-bold mb-1">{style.name}</div>
                <div className={`text-sm ${selectedStyle === key ? 'text-blue-100' : 'text-blue-600'}`}>
                  {style.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Selection Display */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl shadow-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">✨ {currentStyle.name}</h2>
          <p className="text-blue-100">{currentStyle.description}</p>
        </div>
      </div>

      {/* Button Previews */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Submit Buttons */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg mr-3">Submit</span>
            ปุ่มส่งข้อมูล / บันทึก
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className={`${currentStyle.colors.submit} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg`}>
              บันทึกข้อมูล
            </button>
            <button className={`${currentStyle.colors.submit} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg`}>
              ส่งคำขอ
            </button>
            <button className={`${currentStyle.colors.submit} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg`}>
              ยืนยัน
            </button>
          </div>
        </div>

        {/* Export/Import Buttons */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
          <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg mr-3">Export/Import</span>
            ปุ่มนำเข้า / ส่งออก
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className={`${currentStyle.colors.export} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg flex items-center justify-center`}>
              <i className='bx bx-download mr-2 text-xl'></i>
              Export ข้อมูล
            </button>
            <button className={`${currentStyle.colors.import} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg flex items-center justify-center`}>
              <i className='bx bx-upload mr-2 text-xl'></i>
              Import ข้อมูล
            </button>
          </div>
        </div>

        {/* Delete/Cancel/Edit Buttons */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-lg mr-3">Actions</span>
            ปุ่มการทำงานอื่นๆ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className={`${currentStyle.colors.delete} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg`}>
              ลบข้อมูล
            </button>
            <button className={`${currentStyle.colors.cancel} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg`}>
              ยกเลิก
            </button>
            <button className={`${currentStyle.colors.edit} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg`}>
              แก้ไข
            </button>
          </div>
        </div>

        {/* Form Example */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <h3 className="text-xl font-bold text-blue-900 mb-6">📝 ตัวอย่างฟอร์มจริง</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">ชื่อ-นามสกุล</label>
              <input type="text" placeholder="กรอกชื่อ..." className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">อีเมล</label>
              <input type="email" placeholder="กรอกอีเมล..." className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
            </div>
            <div className="flex gap-3 pt-4">
              <button className={`flex-1 ${currentStyle.colors.submit} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg`}>
                บันทึก
              </button>
              <button className={`flex-1 ${currentStyle.colors.cancel} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-600 ease-in-out transform hover:scale-[1.01] shadow-md hover:shadow-lg`}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>

        {/* Color Code Reference */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-xl p-8 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-blue-900 mb-6">💻 รหัสสีสำหรับนักพัฒนา</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
            <div className="bg-white p-4 rounded-xl border border-blue-200">
              <div className="font-bold text-blue-900 mb-2">Submit:</div>
              <code className="text-blue-700">{currentStyle.colors.submit}</code>
            </div>
            <div className="bg-white p-4 rounded-xl border border-green-200">
              <div className="font-bold text-green-900 mb-2">Export/Import:</div>
              <code className="text-green-700">{currentStyle.colors.export}</code>
            </div>
            <div className="bg-white p-4 rounded-xl border border-red-200">
              <div className="font-bold text-red-900 mb-2">Delete:</div>
              <code className="text-red-700">{currentStyle.colors.delete}</code>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="font-bold text-gray-900 mb-2">Cancel:</div>
              <code className="text-gray-700">{currentStyle.colors.cancel}</code>
            </div>
            <div className="bg-white p-4 rounded-xl border border-sky-200">
              <div className="font-bold text-sky-900 mb-2">Edit:</div>
              <code className="text-sky-700">{currentStyle.colors.edit}</code>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">✅ พอใจแบบนี้แล้ว?</h3>
          <p className="text-green-100 mb-6">คัดลอกรหัสสีด้านบน แล้วบอกผมว่า "ใช้แบบที่ {selectedStyle.replace('style', '')}" จะแก้ไขให้ทั้งระบบทันที!</p>
          <button className="bg-white text-green-700 font-bold py-4 px-8 rounded-xl hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
            📋 คัดลอกรหัสสี
          </button>
        </div>
      </div>
    </div>
  );
};

export default ButtonStyleComparison;
