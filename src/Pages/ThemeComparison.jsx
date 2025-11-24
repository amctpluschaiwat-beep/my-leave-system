import React, { useState } from 'react';

const ThemeComparison = () => {
  const [selectedTheme, setSelectedTheme] = useState('theme1');

  // 🎨 Theme Configurations (วิเคราะห์จากเว็บตัวอย่าง)
  const themes = {
    theme1: {
      name: "🎯 CONFER - Professional Corporate",
      description: "สไตล์องค์กรมืออาชีพ เน้นสีน้ำเงินเข้ม-ทอง ดูหรูหรา น่าเชื่อถือ",
      preview: "https://preview.colorlib.com/#confer",
      colors: {
        primary: "#1e3a8a", // Navy Blue
        secondary: "#f59e0b", // Amber/Gold
        accent: "#0ea5e9", // Sky Blue
        success: "#10b981", // Green
        danger: "#ef4444", // Red
        background: "#f8fafc", // Very Light Gray
        card: "#ffffff",
        text: "#1e293b"
      },
      style: {
        sidebar: "bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900",
        button: {
          primary: "bg-blue-900 hover:bg-blue-800 text-white shadow-lg",
          secondary: "bg-amber-500 hover:bg-amber-600 text-white shadow-md",
          success: "bg-green-600 hover:bg-green-700 text-white",
          danger: "bg-red-600 hover:bg-red-700 text-white"
        },
        card: "bg-white border border-blue-100 shadow-md hover:shadow-xl",
        input: "border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      }
    },
    theme2: {
      name: "💎 CRYPTOCURRENCY - Modern Vibrant",
      description: "สไตล์ทันสมัย สีสดใส เน้นม่วง-เขียว-ฟ้า เหมาะกับองค์กรไอที",
      preview: "https://preview.colorlib.com/#cryptocurrency",
      colors: {
        primary: "#7c3aed", // Purple
        secondary: "#10b981", // Green
        accent: "#06b6d4", // Cyan
        success: "#22c55e", // Bright Green
        danger: "#f43f5e", // Rose
        background: "#f9fafb",
        card: "#ffffff",
        text: "#111827"
      },
      style: {
        sidebar: "bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900",
        button: {
          primary: "bg-purple-600 hover:bg-purple-700 text-white shadow-lg",
          secondary: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md",
          success: "bg-green-500 hover:bg-green-600 text-white",
          danger: "bg-rose-500 hover:bg-rose-600 text-white"
        },
        card: "bg-white border border-purple-100 shadow-lg hover:shadow-2xl",
        input: "border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
      }
    },
    theme3: {
      name: "⚡ CRYPTIAN - Dark Tech Premium",
      description: "สไตล์เทคโนโลยี สีเข้มมาก เน้นดำ-ฟ้าไฟฟ้า-เขียวนีออน ดูโมเดิร์น",
      preview: "https://preview.colorlib.com/#cryptian",
      colors: {
        primary: "#0f172a", // Dark Blue/Black
        secondary: "#06b6d4", // Electric Cyan
        accent: "#6366f1", // Indigo
        success: "#14b8a6", // Teal
        danger: "#f97316", // Orange
        background: "#0f172a",
        card: "#1e293b",
        text: "#f1f5f9"
      },
      style: {
        sidebar: "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-cyan-500/20",
        button: {
          primary: "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/50",
          secondary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/50",
          success: "bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-teal-500/50",
          danger: "bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/50"
        },
        card: "bg-slate-800 border border-cyan-500/20 shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/30",
        input: "bg-slate-900 border-2 border-cyan-500/30 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 text-white"
      }
    },
    theme4: {
      name: "🏦 FINLONE - Banking Minimal",
      description: "สไตล์ธนาคาร มินิมอล สีน้ำเงินเข้ม-เทา-ทอง เรียบหรู Professional สุด",
      preview: "https://preview.colorlib.com/#finlone",
      colors: {
        primary: "#1e40af", // Deep Blue
        secondary: "#6b7280", // Gray
        accent: "#d97706", // Amber
        success: "#059669", // Emerald
        danger: "#dc2626", // Red
        background: "#fafaf9",
        card: "#ffffff",
        text: "#18181b"
      },
      style: {
        sidebar: "bg-gradient-to-b from-blue-950 to-slate-900 border-r-2 border-amber-600/30",
        button: {
          primary: "bg-blue-800 hover:bg-blue-700 text-white border border-blue-600 shadow-md",
          secondary: "bg-gray-700 hover:bg-gray-600 text-white border border-gray-500 shadow-sm",
          success: "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500",
          danger: "bg-red-700 hover:bg-red-600 text-white border border-red-600"
        },
        card: "bg-white border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300",
        input: "border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50"
      }
    },
    theme5: {
      name: "💳 CREDIT - Corporate Finance",
      description: "สไตล์การเงิน เน้นสีเขียว-ขาว-เทา สะอาด น่าเชื่อถือ มาตรฐานสากล",
      preview: "https://preview.colorlib.com/#credit",
      colors: {
        primary: "#065f46", // Dark Green
        secondary: "#047857", // Green
        accent: "#0891b2", // Cyan
        success: "#16a34a", // Green
        danger: "#b91c1c", // Dark Red
        background: "#f0fdf4",
        card: "#ffffff",
        text: "#064e3b"
      },
      style: {
        sidebar: "bg-gradient-to-b from-green-900 via-emerald-800 to-green-900 border-r-2 border-green-700",
        button: {
          primary: "bg-green-700 hover:bg-green-600 text-white shadow-lg",
          secondary: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-md",
          success: "bg-emerald-500 hover:bg-emerald-400 text-white",
          danger: "bg-red-700 hover:bg-red-600 text-white"
        },
        card: "bg-white border border-green-200 shadow-md hover:shadow-lg hover:border-green-300",
        input: "border-2 border-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-200 bg-green-50/30"
      }
    }
  };

  const currentTheme = themes[selectedTheme];
  const isDark = selectedTheme === 'theme3';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-blue-50 via-sky-50 to-slate-50'} p-8 transition-all duration-500`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className={`text-5xl font-bold mb-3 ${isDark ? 'text-white' : 'text-blue-900'}`}>
          🎨 Theme Comparison - เลือกธีมทั้งหน้า
        </h1>
        <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-blue-600'}`}>
          เลือกธีมที่ชอบ จะเห็นตัวอย่าง Sidebar, Cards, Buttons, Forms แบบเต็ม
        </p>
      </div>

      {/* Theme Selector */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className={`${isDark ? 'bg-slate-800 border-cyan-500/30' : 'bg-white border-blue-200'} rounded-2xl shadow-2xl p-6 border-2`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-blue-900'}`}>
            เลือกธีมที่ต้องการ:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => setSelectedTheme(key)}
                className={`p-5 rounded-xl text-left transition-all duration-300 border-2 ${
                  selectedTheme === key
                    ? key === 'theme3' 
                      ? 'bg-cyan-500 text-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/50 scale-105'
                      : 'bg-blue-700 text-white border-blue-600 shadow-lg scale-105'
                    : isDark
                    ? 'bg-slate-700 text-white border-slate-600 hover:border-cyan-500/50 hover:shadow-md'
                    : 'bg-white text-blue-900 border-blue-200 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                <div className="font-bold text-lg mb-2">{theme.name}</div>
                <div className={`text-sm ${selectedTheme === key ? (key === 'theme3' ? 'text-slate-800' : 'text-blue-100') : (isDark ? 'text-slate-300' : 'text-blue-600')}`}>
                  {theme.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Selection Display */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className={`${currentTheme.style.sidebar} rounded-2xl shadow-2xl p-8 text-white`}>
          <h2 className="text-3xl font-bold mb-3">✨ {currentTheme.name}</h2>
          <p className="text-lg opacity-90 mb-4">{currentTheme.description}</p>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(currentTheme.colors).map(([name, color]) => (
              <div key={name} className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                <div className="w-6 h-6 rounded-md mr-2 border-2 border-white/30" style={{ backgroundColor: color }}></div>
                <span className="text-sm font-mono">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Page Preview */}
      <div className="max-w-7xl mx-auto">
        <div className={`${isDark ? 'bg-slate-900' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden border ${isDark ? 'border-cyan-500/20' : 'border-blue-200'}`}>
          
          {/* Mock Layout with Sidebar + Content */}
          <div className="flex">
            {/* Sidebar Preview */}
            <div className={`w-72 ${currentTheme.style.sidebar} p-6 min-h-screen`}>
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`${selectedTheme === 'theme3' ? 'bg-cyan-500' : selectedTheme === 'theme5' ? 'bg-green-600' : 'bg-white'} p-3 rounded-xl shadow-lg`}>
                    <i className={`bx bx-building text-2xl ${selectedTheme === 'theme3' || selectedTheme === 'theme5' ? 'text-white' : 'text-blue-900'}`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">HRM SYSTEM</h3>
                    <p className="text-xs text-white/70">TPLUS</p>
                  </div>
                </div>
                
                {/* Menu Items */}
                <nav className="space-y-2">
                  {['Dashboard', 'ยื่นคำขอลา', 'ขอทำ OT', 'รายงาน', 'ตั้งค่า'].map((item, i) => (
                    <button
                      key={i}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                        i === 0 
                          ? selectedTheme === 'theme3'
                            ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/50'
                            : 'bg-white/20 backdrop-blur-sm text-white shadow-md'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <i className={`bx ${i === 0 ? 'bxs-dashboard' : 'bx-file'} mr-2`}></i>
                      {item}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content Area Preview */}
            <div className={`flex-1 p-8 ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-blue-50 to-sky-50'}`}>
              
              {/* Page Header */}
              <div className="mb-8">
                <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Dashboard ของฉัน
                </h1>
                <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  ยินดีต้อนรับเข้าสู่ระบบ HRM
                </p>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { icon: 'bx-file', label: 'คำขอทั้งหมด', value: '12', color: 'primary' },
                  { icon: 'bx-time', label: 'รอพิจารณา', value: '3', color: 'secondary' },
                  { icon: 'bx-check-circle', label: 'อนุมัติแล้ว', value: '9', color: 'success' }
                ].map((stat, i) => (
                  <div key={i} className={`${currentTheme.style.card} p-6 rounded-2xl transition-all duration-300`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-gray-600'} mb-1`}>
                          {stat.label}
                        </p>
                        <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className={`${
                        stat.color === 'primary' ? currentTheme.style.button.primary :
                        stat.color === 'secondary' ? currentTheme.style.button.secondary :
                        currentTheme.style.button.success
                      } p-4 rounded-2xl transition-transform duration-300 hover:scale-110`}>
                        <i className={`bx ${stat.icon} text-3xl`}></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Example */}
              <div className={`${currentTheme.style.card} p-8 rounded-2xl mb-8`}>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                  📝 ตัวอย่างฟอร์ม
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                      ประเภทการลา
                    </label>
                    <input
                      type="text"
                      placeholder="ลาป่วย, ลากิจ, ลาพักร้อน..."
                      className={`w-full px-4 py-3 rounded-xl ${currentTheme.style.input} transition-all`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                        วันที่เริ่มต้น
                      </label>
                      <input
                        type="date"
                        className={`w-full px-4 py-3 rounded-xl ${currentTheme.style.input} transition-all`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                        วันที่สิ้นสุด
                      </label>
                      <input
                        type="date"
                        className={`w-full px-4 py-3 rounded-xl ${currentTheme.style.input} transition-all`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                      เหตุผล
                    </label>
                    <textarea
                      rows={3}
                      placeholder="กรุณาระบุเหตุผล..."
                      className={`w-full px-4 py-3 rounded-xl ${currentTheme.style.input} transition-all resize-none`}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button className={`flex-1 ${currentTheme.style.button.primary} py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02]`}>
                      <i className='bx bx-save mr-2'></i>
                      บันทึกข้อมูล
                    </button>
                    <button className={`flex-1 ${currentTheme.style.button.success} py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02]`}>
                      <i className='bx bx-download mr-2'></i>
                      Export
                    </button>
                  </div>
                </div>
              </div>

              {/* Button Showcase */}
              <div className={`${currentTheme.style.card} p-8 rounded-2xl`}>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                  🎯 ตัวอย่างปุ่มทั้งหมด
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className={`${currentTheme.style.button.primary} py-3 px-5 rounded-xl font-semibold transition-all duration-300 hover:scale-105`}>
                    Primary
                  </button>
                  <button className={`${currentTheme.style.button.secondary} py-3 px-5 rounded-xl font-semibold transition-all duration-300 hover:scale-105`}>
                    Secondary
                  </button>
                  <button className={`${currentTheme.style.button.success} py-3 px-5 rounded-xl font-semibold transition-all duration-300 hover:scale-105`}>
                    Success
                  </button>
                  <button className={`${currentTheme.style.button.danger} py-3 px-5 rounded-xl font-semibold transition-all duration-300 hover:scale-105`}>
                    Danger
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className={`${currentTheme.style.button.success} rounded-2xl shadow-2xl p-8 text-center`}>
          <h3 className="text-3xl font-bold text-white mb-4">✅ ชอบธีมนี้แล้ว?</h3>
          <p className="text-white/90 text-lg mb-6">
            บอกผมว่า "ใช้ธีมที่ {selectedTheme.replace('theme', '')}" หรือ "ใช้ {currentTheme.name.split(' - ')[0]}" 
            <br />จะแก้ไขให้ทั้งระบบทันที!
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-gray-900 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              📋 คัดลอกรหัสสี
            </button>
            <button className="bg-white/20 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-xl hover:bg-white/30 transition-all duration-300 border-2 border-white/50 transform hover:scale-105">
              💾 ใช้ธีมนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeComparison;
