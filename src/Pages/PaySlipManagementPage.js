import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { ref, onValue, push, set } from 'firebase/database';

function PaySlipManagementPage({ appUser }) {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('create'); // create, preview, dashboard, bank
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    
    // PaySlip Form Data
    const [payslipData, setPayslipData] = useState({
        month: '',
        year: new Date().getFullYear() + 543,
        payDate: '',
        baseSalary: 0,
        overtimePay: 0,
        allowance: 0,
        bonus: 0,
        socialSecurity: 0,
        tax: 0,
        loan: 0,
        deductions: 0,
        netPay: 0,
        notes: ''
    });

    // Bank Account Data
    const [bankData, setBankData] = useState({
        accountNumber: '',
        bankName: '',
        accountHolder: '',
        imageUrl: ''
    });

    // Check permission - Commander only
    const hasPermission = appUser?.role === 'commander';

    useEffect(() => {
        if (!hasPermission) {
            setLoading(false);
            return;
        }

        // Load employees
        const usersRef = ref(db, 'users');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const employeeList = Object.keys(usersData)
                    .map(uid => ({ uid, ...usersData[uid] }))
                    .filter(user => user.role !== 'pending_approval');
                setEmployees(employeeList);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [hasPermission]);

    // Calculate Net Pay
    useEffect(() => {
        const totalIncome = 
            parseFloat(payslipData.baseSalary || 0) + 
            parseFloat(payslipData.overtimePay || 0) + 
            parseFloat(payslipData.allowance || 0) + 
            parseFloat(payslipData.bonus || 0);
        
        const totalDeductions = 
            parseFloat(payslipData.socialSecurity || 0) + 
            parseFloat(payslipData.tax || 0) + 
            parseFloat(payslipData.loan || 0) + 
            parseFloat(payslipData.deductions || 0);
        
        const netPay = totalIncome - totalDeductions;
        
        setPayslipData(prev => ({ ...prev, netPay: netPay.toFixed(2) }));
    }, [payslipData.baseSalary, payslipData.overtimePay, payslipData.allowance, 
        payslipData.bonus, payslipData.socialSecurity, payslipData.tax, 
        payslipData.loan, payslipData.deductions]);

    const handleSavePayslip = async () => {
        if (!selectedEmployee) {
            alert('กรุณาเลือกพนักงาน');
            return;
        }

        if (!payslipData.month || !payslipData.year) {
            alert('กรุณาระบุเดือนและปี');
            return;
        }

        try {
            const payslipRef = ref(db, `payslips/${selectedEmployee.uid}`);
            await push(payslipRef, {
                ...payslipData,
                createdAt: new Date().toISOString(),
                createdBy: appUser.uid
            });
            
            alert('✅ บันทึก PaySlip สำเร็จ!');
            
            // Reset form
            setPayslipData({
                month: '',
                year: new Date().getFullYear() + 543,
                payDate: '',
                baseSalary: 0,
                overtimePay: 0,
                allowance: 0,
                bonus: 0,
                socialSecurity: 0,
                tax: 0,
                loan: 0,
                deductions: 0,
                netPay: 0,
                notes: ''
            });
            setShowPreviewModal(false);
        } catch (error) {
            console.error('Error saving payslip:', error);
            alert('❌ เกิดข้อผิดพลาด: ' + error.message);
        }
    };

    const handleSaveBankAccount = async () => {
        if (!selectedEmployee) {
            alert('กรุณาเลือกพนักงาน');
            return;
        }

        try {
            const bankRef = ref(db, `bankAccounts/${selectedEmployee.uid}`);
            await set(bankRef, {
                ...bankData,
                updatedAt: new Date().toISOString(),
                updatedBy: appUser.uid
            });
            
            alert('✅ บันทึกข้อมูลบัญชีธนาคารสำเร็จ!');
        } catch (error) {
            console.error('Error saving bank account:', error);
            alert('❌ เกิดข้อผิดพลาด: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    if (!hasPermission) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-300 rounded-lg p-12 text-center">
                    <i className='bx bx-lock-alt text-6xl text-red-500 mb-4'></i>
                    <h2 className="text-2xl font-bold text-red-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                    <p className="text-red-700">หน้านี้เข้าถึงได้เฉพาะ Commander เท่านั้น</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                    <i className='bx bx-money text-indigo-600 text-4xl mr-3'></i>
                    จัดการ PaySlip พนักงาน
                </h2>
                <p className="text-gray-600 mt-1">ระบบจัดการสลิปเงินเดือนและบัญชีธนาคาร (Commander Only)</p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`pb-4 px-4 font-medium transition-colors ${
                            activeTab === 'create'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className='bx bx-edit-alt mr-2'></i>
                        สร้าง PaySlip
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`pb-4 px-4 font-medium transition-colors ${
                            activeTab === 'dashboard'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className='bx bx-bar-chart mr-2'></i>
                        Dashboard จ่ายเงิน
                    </button>
                    <button
                        onClick={() => setActiveTab('bank')}
                        className={`pb-4 px-4 font-medium transition-colors ${
                            activeTab === 'bank'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className='bx bx-credit-card mr-2'></i>
                        จัดการบัญชีธนาคาร
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white shadow-sm rounded-lg">
                {/* สร้าง PaySlip Tab */}
                {activeTab === 'create' && (
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">สร้าง PaySlip รายบุคคล</h3>
                        
                        {/* Select Employee */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                เลือกพนักงาน
                            </label>
                            <select
                                value={selectedEmployee?.uid || ''}
                                onChange={(e) => {
                                    const emp = employees.find(emp => emp.uid === e.target.value);
                                    setSelectedEmployee(emp);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- เลือกพนักงาน --</option>
                                {employees.map(emp => (
                                    <option key={emp.uid} value={emp.uid}>
                                        {emp.name} - {emp.department || 'ไม่ระบุแผนก'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedEmployee && (
                            <>
                                {/* Employee Info */}
                                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <h4 className="font-semibold text-indigo-800 mb-2">ข้อมูลพนักงาน</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">ชื่อ:</span>
                                            <span className="ml-2 font-medium">{selectedEmployee.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">แผนก:</span>
                                            <span className="ml-2 font-medium">{selectedEmployee.department || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">ตำแหน่ง:</span>
                                            <span className="ml-2 font-medium">{selectedEmployee.position || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">อีเมล:</span>
                                            <span className="ml-2 font-medium">{selectedEmployee.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* PaySlip Form */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                        <i className='bx bx-edit text-2xl text-blue-600'></i>
                                        รายละเอียด PaySlip
                                    </h4>

                                    {/* ส่วนที่ 1: วันที่และงวด */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                เดือน <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={payslipData.month}
                                                onChange={(e) => setPayslipData({ ...payslipData, month: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            >
                                                <option value="">เลือกเดือน</option>
                                                <option value="มกราคม">มกราคม</option>
                                                <option value="กุมภาพันธ์">กุมภาพันธ์</option>
                                                <option value="มีนาคม">มีนาคม</option>
                                                <option value="เมษายน">เมษายน</option>
                                                <option value="พฤษภาคม">พฤษภาคม</option>
                                                <option value="มิถุนายน">มิถุนายน</option>
                                                <option value="กรกฎาคม">กรกฎาคม</option>
                                                <option value="สิงหาคม">สิงหาคม</option>
                                                <option value="กันยายน">กันยายน</option>
                                                <option value="ตุลาคม">ตุลาคม</option>
                                                <option value="พฤศจิกายน">พฤศจิกายน</option>
                                                <option value="ธันวาคม">ธันวาคม</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ปี <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={payslipData.year}
                                                onChange={(e) => setPayslipData({ ...payslipData, year: e.target.value })}
                                                placeholder="เช่น 2568"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                วันที่จ่าย <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={payslipData.payDate}
                                                onChange={(e) => setPayslipData({ ...payslipData, payDate: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            />
                                        </div>
                                    </div>

                                    {/* ส่วนที่ 2: รายได้ */}
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6 border border-green-200">
                                        <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <i className='bx bx-dollar-circle text-xl text-green-600'></i>
                                            รายได้
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    เงินเดือนพื้นฐาน <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={payslipData.baseSalary}
                                                    onChange={(e) => setPayslipData({ ...payslipData, baseSalary: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ค่า OT
                                                </label>
                                                <input
                                                    type="number"
                                                    value={payslipData.overtimePay}
                                                    onChange={(e) => setPayslipData({ ...payslipData, overtimePay: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ค่าเบี้ยเลี้ยง
                                                </label>
                                                <input
                                                    type="number"
                                                    value={payslipData.allowance}
                                                    onChange={(e) => setPayslipData({ ...payslipData, allowance: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    โบนัส
                                                </label>
                                                <input
                                                    type="number"
                                                    value={payslipData.bonus}
                                                    onChange={(e) => setPayslipData({ ...payslipData, bonus: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ส่วนที่ 3: รายการหัก */}
                                    <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 mb-6 border border-red-200">
                                        <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <i className='bx bx-minus-circle text-xl text-red-600'></i>
                                            รายการหัก
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ประกันสังคม
                                                </label>
                                                <input
                                                    type="number"
                                                    value={payslipData.socialSecurity}
                                                    onChange={(e) => setPayslipData({ ...payslipData, socialSecurity: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ภาษี
                                                </label>
                                                <input
                                                    type="number"
                                                    value={payslipData.tax}
                                                    onChange={(e) => setPayslipData({ ...payslipData, tax: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    เงินกู้/ยืม
                                                </label>
                                                <input
                                                    type="number"
                                                    value={payslipData.loan}
                                                    onChange={(e) => setPayslipData({ ...payslipData, loan: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    รายการหักอื่นๆ
                                                </label>
                                                <input
                                                    type="number"
                                                    value={payslipData.deductions}
                                                    onChange={(e) => setPayslipData({ ...payslipData, deductions: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* สรุปยอดรวม */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border-2 border-blue-300">
                                        <div className="flex justify-between items-center">
                                            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                                <i className='bx bx-calculator text-xl text-blue-600'></i>
                                                เงินรับสุทธิ (Net Pay)
                                            </h5>
                                            <div className="text-3xl font-bold text-blue-600">
                                                ฿{Number(payslipData.netPay).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* หมายเหตุ */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            หมายเหตุ
                                        </label>
                                        <textarea
                                            value={payslipData.notes}
                                            onChange={(e) => setPayslipData({ ...payslipData, notes: e.target.value })}
                                            placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                                            rows="3"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                                        ></textarea>
                                    </div>

                                    {/* ปุ่มบันทึกและดูตัวอย่าง */}
                                    <div className="flex gap-4 justify-end">
                                        <button
                                            onClick={() => setShowPreviewModal(true)}
                                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center gap-2"
                                        >
                                            <i className='bx bx-show text-xl'></i>
                                            ดูตัวอย่าง
                                        </button>
                                        <button
                                            onClick={handleSavePayslip}
                                            disabled={!payslipData.month || !payslipData.year || !payslipData.payDate || !payslipData.baseSalary}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <i className='bx bx-save text-xl'></i>
                                            บันทึก PaySlip
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Dashboard Tab - Placeholder */}
                {activeTab === 'dashboard' && (
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Dashboard จ่ายเงินเดือน</h3>
                        
                        {/* สถิติรวม */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium opacity-90">ยอดจ่ายรวมเดือนนี้</h4>
                                    <i className='bx bx-money text-3xl opacity-80'></i>
                                </div>
                                <p className="text-3xl font-bold">฿0.00</p>
                                <p className="text-xs mt-2 opacity-75">อัปเดตล่าสุด: วันนี้</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium opacity-90">จำนวนพนักงาน</h4>
                                    <i className='bx bx-user text-3xl opacity-80'></i>
                                </div>
                                <p className="text-3xl font-bold">{employees.length}</p>
                                <p className="text-xs mt-2 opacity-75">พนักงานทั้งหมด</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium opacity-90">PaySlip ที่ออกแล้ว</h4>
                                    <i className='bx bx-receipt text-3xl opacity-80'></i>
                                </div>
                                <p className="text-3xl font-bold">0</p>
                                <p className="text-xs mt-2 opacity-75">ในเดือนนี้</p>
                            </div>
                        </div>

                        {/* รายการจ่ายล่าสุด */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <i className='bx bx-history text-xl text-blue-600'></i>
                                รายการจ่ายล่าสุด
                            </h4>
                            <div className="text-center py-12 text-gray-400">
                                <i className='bx bx-file text-6xl mb-3'></i>
                                <p className="text-lg">ยังไม่มีรายการจ่ายเงิน</p>
                                <p className="text-sm mt-2">เริ่มต้นสร้าง PaySlip ในแท็บ "สร้าง PaySlip"</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bank Account Tab */}
                {activeTab === 'bank' && (
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">จัดการบัญชีธนาคาร</h3>
                        
                        {/* Select Employee */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                เลือกพนักงาน
                            </label>
                            <select
                                value={selectedEmployee?.uid || ''}
                                onChange={(e) => {
                                    const emp = employees.find(emp => emp.uid === e.target.value);
                                    setSelectedEmployee(emp);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- เลือกพนักงาน --</option>
                                {employees.map(emp => (
                                    <option key={emp.uid} value={emp.uid}>
                                        {emp.name} - {emp.department || 'ไม่ระบุแผนก'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedEmployee && (
                            <>
                                {/* Employee Info */}
                                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <h4 className="font-semibold text-indigo-800 mb-2">ข้อมูลพนักงาน</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">ชื่อ:</span>
                                            <span className="ml-2 font-medium">{selectedEmployee.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">แผนก:</span>
                                            <span className="ml-2 font-medium">{selectedEmployee.department || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Form */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                        <i className='bx bx-credit-card text-2xl text-blue-600'></i>
                                        ข้อมูลบัญชีธนาคาร
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ชื่อธนาคาร <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={bankData.bankName}
                                                onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            >
                                                <option value="">เลือกธนาคาร</option>
                                                <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</option>
                                                <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</option>
                                                <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</option>
                                                <option value="ธนาคารทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</option>
                                                <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                                                <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                                                <option value="ธนาคารเกียรตินาคินภัทร">ธนาคารเกียรตินาคินภัทร</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                เลขที่บัญชี <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={bankData.accountNumber}
                                                onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                                                placeholder="xxx-x-xxxxx-x"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ชื่อบัญชี <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={bankData.accountHolder}
                                                onChange={(e) => setBankData({ ...bankData, accountHolder: e.target.value })}
                                                placeholder="ชื่อผู้ถือบัญชี"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            />
                                        </div>
                                    </div>

                                    {/* ปุ่มบันทึก */}
                                    <div className="flex gap-4 justify-end">
                                        <button
                                            onClick={handleSaveBankAccount}
                                            disabled={!bankData.bankName || !bankData.accountNumber || !bankData.accountHolder}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <i className='bx bx-save text-xl'></i>
                                            บันทึกข้อมูลบัญชี
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <i className='bx bx-receipt text-2xl text-blue-600'></i>
                                ตัวอย่าง PaySlip
                            </h3>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {/* A5 Landscape PaySlip Preview */}
                            <div className="bg-white border-2 border-gray-300 rounded-lg p-8 mx-auto" style={{width: '297mm', maxWidth: '100%'}}>
                                {/* Header */}
                                <div className="border-b-2 border-gray-800 pb-4 mb-6">
                                    <h1 className="text-3xl font-bold text-center text-gray-800">PAYSLIP</h1>
                                    <p className="text-center text-gray-600 mt-1">ใบจ่ายเงินเดือน</p>
                                </div>

                                {/* Employee & Company Info */}
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h3 className="font-bold text-gray-800 mb-2">ข้อมูลพนักงาน</h3>
                                        <p className="text-sm"><span className="font-medium">ชื่อ:</span> {selectedEmployee?.name || '-'}</p>
                                        <p className="text-sm"><span className="font-medium">แผนก:</span> {selectedEmployee?.department || '-'}</p>
                                        <p className="text-sm"><span className="font-medium">ตำแหน่ง:</span> {selectedEmployee?.position || '-'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm"><span className="font-medium">เดือน:</span> {payslipData.month} {payslipData.year}</p>
                                        <p className="text-sm"><span className="font-medium">วันที่จ่าย:</span> {payslipData.payDate}</p>
                                    </div>
                                </div>

                                {/* Income & Deduction Table */}
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h3 className="font-bold text-green-700 mb-3 bg-green-50 p-2 rounded">รายได้</h3>
                                        <table className="w-full text-sm">
                                            <tbody>
                                                <tr className="border-b">
                                                    <td className="py-2">เงินเดือนพื้นฐาน</td>
                                                    <td className="text-right">฿{Number(payslipData.baseSalary).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="py-2">ค่า OT</td>
                                                    <td className="text-right">฿{Number(payslipData.overtimePay).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="py-2">ค่าเบี้ยเลี้ยง</td>
                                                    <td className="text-right">฿{Number(payslipData.allowance).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="py-2">โบนัส</td>
                                                    <td className="text-right">฿{Number(payslipData.bonus).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                </tr>
                                                <tr className="font-bold bg-green-50">
                                                    <td className="py-2">รวมรายได้</td>
                                                    <td className="text-right">฿{(Number(payslipData.baseSalary) + Number(payslipData.overtimePay) + Number(payslipData.allowance) + Number(payslipData.bonus)).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-red-700 mb-3 bg-red-50 p-2 rounded">รายการหัก</h3>
                                        <table className="w-full text-sm">
                                            <tbody>
                                                <tr className="border-b">
                                                    <td className="py-2">ประกันสังคม</td>
                                                    <td className="text-right">฿{Number(payslipData.socialSecurity).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="py-2">ภาษี</td>
                                                    <td className="text-right">฿{Number(payslipData.tax).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="py-2">เงินกู้/ยืม</td>
                                                    <td className="text-right">฿{Number(payslipData.loan).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="py-2">หักอื่นๆ</td>
                                                    <td className="text-right">฿{Number(payslipData.deductions).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                </tr>
                                                <tr className="font-bold bg-red-50">
                                                    <td className="py-2">รวมรายการหัก</td>
                                                    <td className="text-right">฿{(Number(payslipData.socialSecurity) + Number(payslipData.tax) + Number(payslipData.loan) + Number(payslipData.deductions)).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Net Pay */}
                                <div className="border-t-2 border-gray-800 pt-4 mb-6">
                                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                                        <h3 className="text-xl font-bold text-gray-800">เงินรับสุทธิ (Net Pay)</h3>
                                        <p className="text-3xl font-bold text-blue-600">฿{Number(payslipData.netPay).toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                    </div>
                                </div>

                                {/* Notes */}
                                {payslipData.notes && (
                                    <div className="mb-4">
                                        <h4 className="font-bold text-gray-800 mb-2">หมายเหตุ:</h4>
                                        <p className="text-sm text-gray-600">{payslipData.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex gap-4 justify-end">
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                                >
                                    ปิด
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                                >
                                    <i className='bx bx-printer text-xl'></i>
                                    พิมพ์
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaySlipManagementPage;
