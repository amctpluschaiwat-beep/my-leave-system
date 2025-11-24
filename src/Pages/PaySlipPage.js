import React, { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import LoadingSpinner from './LoadingSpinner.js';
import { addSamplePayslip } from '../utils/addSamplePayslip';

function PaySlipPage({ appUser }) {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [companyData, setCompanyData] = useState(null);
    const printRef = useRef();
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const uid = appUser?.uid;

    useEffect(() => {
        if (!uid) return;
        setLoading(true);
        
        const userSlipsRef = ref(db, `payslips/${uid}`);
        const companyRef = ref(db, 'companyProfile');

        const unsubscribeSlips = onValue(userSlipsRef, (snapshot) => {
            const data = snapshot.val();
            const loadedSlips = [];

            if (data) {
                Object.keys(data).forEach((key) => {
                    loadedSlips.push({ id: key, ...data[key] });
                });
            }
            
            loadedSlips.sort((a, b) => new Date(b.payDate) - new Date(a.payDate));
            setPayslips(loadedSlips);
            setLoading(false);
        });

        const unsubscribeCompany = onValue(companyRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setCompanyData(data);
            }
        });

        return () => {
            unsubscribeSlips();
            unsubscribeCompany();
        };
    }, [uid]);

    const handleViewDetail = (slip) => {
        setSelectedSlip(slip);
        setShowModal(true);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        const windowPrint = window.open('', '', 'width=800,height=600');
        windowPrint.document.write(`
            <html>
                <head>
                    <title>PaySlip - ${selectedSlip?.month} ${selectedSlip?.year}</title>
                    <style>
                        @page { 
                            size: A5 landscape; 
                            margin: 10mm;
                        }
                        body { 
                            font-family: 'Sarabun', 'Arial', sans-serif; 
                            padding: 0;
                            margin: 0;
                            font-size: 11pt;
                        }
                        .payslip-container { 
                            max-width: 210mm; 
                            margin: 0 auto;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 8px 0; 
                            font-size: 10pt;
                        }
                        th, td { 
                            border: 1px solid #333; 
                            padding: 4px 8px; 
                        }
                        th { 
                            background-color: #333; 
                            color: white; 
                            font-weight: bold; 
                        }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .font-semibold { font-weight: 600; }
                        .font-bold { font-weight: bold; }
                        .bg-gray-100 { background-color: #f3f4f6; }
                        .bg-green-50 { background-color: #f0fdf4; }
                        .text-green-700 { color: #15803d; }
                        @media print { 
                            button { display: none; }
                            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    <div class="payslip-container">${printContent.innerHTML}</div>
                </body>
            </html>
        `);
        windowPrint.document.close();
        windowPrint.focus();
        windowPrint.print();
        windowPrint.close();
    };

    const handleExportPDF = () => {
        alert('ฟีเจอร์ Export PDF กำลังพัฒนา - จะใช้ไลบรารี jsPDF หรือ html2pdf.js');
    };

    const handleSendEmail = () => {
        alert('ฟีเจอร์ส่ง Email กำลังพัฒนา - จะส่งผ่าน Backend API');
    };

    const handleDigitalSign = () => {
        alert('ฟีเจอร์ Digital Signature กำลังพัฒนา - จะบันทึกลายเซ็นดิจิทัล');
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0.00';
        return parseFloat(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleAddSampleData = async () => {
        if (window.confirm('คุณต้องการเพิ่มข้อมูล PaySlip ตัวอย่าง 3 เดือนใช่หรือไม่?')) {
            const success = await addSamplePayslip(uid);
            if (success) {
                alert('✅ เพิ่มข้อมูลตัวอย่างสำเร็จ!');
            } else {
                alert('❌ เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
            }
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-6">
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">สลิปเงินเดือน</h2>
                        <p className="text-gray-600 mt-1">รายการสลิปเงินเดือนของคุณ</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">พนักงาน</p>
                        <p className="font-semibold text-gray-800">{appUser?.name}</p>
                        <p className="text-sm text-gray-600">{appUser?.department}</p>
                    </div>
                </div>
                
                {payslips.length === 0 ? (
                    <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <i className='bx bx-file text-6xl text-gray-400 mb-4'></i>
                        <p className="text-gray-600 text-lg">ไม่พบข้อมูลสลิปเงินเดือน</p>
                        <p className="text-gray-500 text-sm mt-2">ข้อมูลจะปรากฏเมื่อแผนกบุคคลทำการออกสลิป</p>
                        <button
                            onClick={handleAddSampleData}
                            className="mt-6 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                        >
                            <i className='bx bx-plus-circle text-xl'></i>
                            เพิ่มข้อมูลตัวอย่าง (Demo)
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Rows per page selector */}
                        <div className="mb-4 flex items-center gap-2 pb-4 border-b border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">แสดง:</span>
                            {[10, 50, 100].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        setRowsPerPage(num);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        rowsPerPage === num
                                            ? 'bg-gray-800 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                            <span className="text-sm text-gray-600">รายการ</span>
                        </div>

                        {/* PaySlip List */}
                        <div className="space-y-3">
                            {(() => {
                                const startIndex = (currentPage - 1) * rowsPerPage;
                                const endIndex = startIndex + rowsPerPage;
                                const paginatedSlips = payslips.slice(startIndex, endIndex);
                                
                                return paginatedSlips.map((slip) => (
                                    <div 
                                        key={slip.id} 
                                        className="border border-gray-300 rounded-lg hover:shadow-md transition-shadow bg-white"
                                    >
                                        <div className="p-4 flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-white">
                                                        <i className='bx bx-receipt text-2xl'></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-gray-800">
                                                            งวดเดือน {slip.month} พ.ศ. {slip.year}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            วันที่จ่าย: {new Date(slip.payDate).toLocaleDateString('th-TH', { 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right mr-6">
                                                <p className="text-xs text-gray-500 mb-1">เงินเดือนสุทธิ</p>
                                                <p className="text-2xl font-bold text-green-700">
                                                    ฿{formatCurrency(slip.netPay)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleViewDetail(slip)}
                                                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                            >
                                                <i className='bx bx-show'></i>
                                                ดูรายละเอียด
                                            </button>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Pagination */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                แสดง {Math.min((currentPage - 1) * rowsPerPage + 1, payslips.length)} - {Math.min(currentPage * rowsPerPage, payslips.length)} จาก {payslips.length} รายการ
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        currentPage === 1
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    <i className='bx bx-chevron-left'></i>
                                </button>
                                <span className="px-4 py-2 text-sm text-gray-700 font-medium">
                                    หน้า {currentPage} / {Math.ceil(payslips.length / rowsPerPage)}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(payslips.length / rowsPerPage), prev + 1))}
                                    disabled={currentPage >= Math.ceil(payslips.length / rowsPerPage)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        currentPage >= Math.ceil(payslips.length / rowsPerPage)
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    <i className='bx bx-chevron-right'></i>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal - PaySlip Detail */}
            {showModal && selectedSlip && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-800">
                                สลิปเงินเดือน - {selectedSlip.month} {selectedSlip.year}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-800 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                            >
                                ×
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 bg-gray-50 border-b border-gray-200 flex gap-2 flex-wrap">
                            <button
                                onClick={handlePrint}
                                className="flex-1 min-w-[150px] px-4 py-3 bg-white border-2 border-gray-800 text-gray-800 rounded-lg font-medium hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <i className='bx bx-printer text-xl'></i>
                                พิมพ์
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex-1 min-w-[150px] px-4 py-3 bg-white border-2 border-gray-800 text-gray-800 rounded-lg font-medium hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <i className='bx bxs-file-pdf text-xl'></i>
                                Export PDF
                            </button>
                            <button
                                onClick={handleSendEmail}
                                className="flex-1 min-w-[150px] px-4 py-3 bg-white border-2 border-gray-800 text-gray-800 rounded-lg font-medium hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <i className='bx bx-envelope text-xl'></i>
                                ส่ง Email
                            </button>
                            <button
                                onClick={handleDigitalSign}
                                className="flex-1 min-w-[150px] px-4 py-3 bg-white border-2 border-gray-800 text-gray-800 rounded-lg font-medium hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <i className='bx bx-edit-alt text-xl'></i>
                                ลายเซ็นดิจิทัล
                            </button>
                        </div>

                        {/* PaySlip Content for Print */}
                        <div ref={printRef} className="p-6" style={{ maxWidth: '210mm', margin: '0 auto' }}>
                            {/* Company Header with Logo */}
                            <div className="border-b-2 border-gray-800 pb-4 mb-4">
                                <div className="flex items-start gap-4">
                                    {/* Logo */}
                                    {companyData?.logoUrl ? (
                                        <img src={companyData.logoUrl} alt="Logo" className="w-20 h-20 object-contain border border-gray-300 rounded flex-shrink-0" />
                                    ) : (
                                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-2xl">T+1</span>
                                        </div>
                                    )}
                                    {/* Company Info */}
                                    <div className="flex-1">
                                        <h1 className="text-xl font-bold text-gray-900">{companyData?.nameTH || 'บริษัท ทีพลัสวัน ลิสซิ่ง จำกัด'}</h1>
                                        <h2 className="text-base font-semibold text-gray-700">{companyData?.nameEN || 'TPLUSONE LEASING CO., LTD.'}</h2>
                                        <p className="text-xs text-gray-600 mt-1">{companyData?.address || '1188 หมู่ 4 ตำบลสำโรงเหนือ อำเภอเมือง จังหวัดสมุทรปราการ 10270'}</p>
                                        <p className="text-xs text-gray-600">เลขประจำตัวผู้เสียภาษี: {companyData?.taxId || '0115566019276'}</p>
                                        <p className="text-xs text-gray-600">โทร: {companyData?.phone || '02-096-2677'} | Email: {companyData?.email || 'humanresource.tplus@gmail.com'}</p>
                                    </div>
                                </div>
                                <h3 className="text-center text-lg font-bold text-gray-900 mt-3">ใบจ่ายเงินเดือน (PAY SLIP)</h3>
                            </div>

                            {/* Employee Info */}
                            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-300 text-sm">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">ชื่อ-นามสกุล (Name)</p>
                                    <p className="font-semibold text-gray-900">{appUser?.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">รหัสพนักงาน (Employee ID)</p>
                                    <p className="font-semibold text-gray-900">{appUser?.employeeId || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">แผนก (Department)</p>
                                    <p className="font-semibold text-gray-900">{appUser?.department || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">ตำแหน่ง (Position)</p>
                                    <p className="font-semibold text-gray-900">{appUser?.position || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">งวดเดือน (Period)</p>
                                    <p className="font-semibold text-gray-900">{selectedSlip.month} {selectedSlip.year}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">วันที่จ่าย (Pay Date)</p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(selectedSlip.payDate).toLocaleDateString('th-TH', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Income & Deduction Table */}
                            <div className="mb-4">
                                <table className="w-full border-collapse border border-gray-300 text-sm">
                                    <thead>
                                        <tr className="bg-gray-800 text-white">
                                            <th className="border border-gray-300 p-2 text-left">รายการ (Description)</th>
                                            <th className="border border-gray-300 p-2 text-right w-28">รายได้ (Income)</th>
                                            <th className="border border-gray-300 p-2 text-right w-28">รายหัก (Deduction)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-2">เงินเดือนประจำ (Base Salary)</td>
                                            <td className="border border-gray-300 p-2 text-right">{formatCurrency(selectedSlip.baseSalary || 0)}</td>
                                            <td className="border border-gray-300 p-2 text-right">-</td>
                                        </tr>
                                        {selectedSlip.overtimePay > 0 && (
                                            <tr>
                                                <td className="border border-gray-300 p-2">ค่าล่วงเวลา (Overtime)</td>
                                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(selectedSlip.overtimePay)}</td>
                                                <td className="border border-gray-300 p-2 text-right">-</td>
                                            </tr>
                                        )}
                                        {selectedSlip.allowance > 0 && (
                                            <tr>
                                                <td className="border border-gray-300 p-2">เบี้ยเลี้ยง/ค่าพาหนะ (Allowance)</td>
                                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(selectedSlip.allowance)}</td>
                                                <td className="border border-gray-300 p-2 text-right">-</td>
                                            </tr>
                                        )}
                                        {selectedSlip.bonus > 0 && (
                                            <tr>
                                                <td className="border border-gray-300 p-2">โบนัส (Bonus)</td>
                                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(selectedSlip.bonus)}</td>
                                                <td className="border border-gray-300 p-2 text-right">-</td>
                                            </tr>
                                        )}
                                        <tr className="bg-gray-100 font-semibold">
                                            <td className="border border-gray-300 p-2">รวมรายได้ (Total Income)</td>
                                            <td className="border border-gray-300 p-2 text-right">
                                                {formatCurrency(
                                                    (parseFloat(selectedSlip.baseSalary) || 0) + 
                                                    (parseFloat(selectedSlip.overtimePay) || 0) + 
                                                    (parseFloat(selectedSlip.allowance) || 0) + 
                                                    (parseFloat(selectedSlip.bonus) || 0)
                                                )}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-right">-</td>
                                        </tr>
                                        {selectedSlip.socialSecurity > 0 && (
                                            <tr>
                                                <td className="border border-gray-300 p-2">ประกันสังคม (Social Security)</td>
                                                <td className="border border-gray-300 p-2 text-right">-</td>
                                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(selectedSlip.socialSecurity)}</td>
                                            </tr>
                                        )}
                                        {selectedSlip.tax > 0 && (
                                            <tr>
                                                <td className="border border-gray-300 p-2">ภาษีหัก ณ ที่จ่าย (Tax Withholding)</td>
                                                <td className="border border-gray-300 p-2 text-right">-</td>
                                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(selectedSlip.tax)}</td>
                                            </tr>
                                        )}
                                        {selectedSlip.loan > 0 && (
                                            <tr>
                                                <td className="border border-gray-300 p-2">เงินกู้ยืม (Loan Deduction)</td>
                                                <td className="border border-gray-300 p-2 text-right">-</td>
                                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(selectedSlip.loan)}</td>
                                            </tr>
                                        )}
                                        {selectedSlip.deductions > 0 && (
                                            <tr>
                                                <td className="border border-gray-300 p-2">รายการหักอื่นๆ (Other Deductions)</td>
                                                <td className="border border-gray-300 p-2 text-right">-</td>
                                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(selectedSlip.deductions)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-gray-100 font-semibold">
                                            <td className="border border-gray-300 p-2">รวมรายการหัก (Total Deductions)</td>
                                            <td className="border border-gray-300 p-2 text-right">-</td>
                                            <td className="border border-gray-300 p-2 text-right">
                                                {formatCurrency(
                                                    (parseFloat(selectedSlip.socialSecurity) || 0) + 
                                                    (parseFloat(selectedSlip.tax) || 0) + 
                                                    (parseFloat(selectedSlip.loan) || 0) + 
                                                    (parseFloat(selectedSlip.deductions) || 0)
                                                )}
                                            </td>
                                        </tr>
                                        <tr className="bg-green-50 font-bold text-lg">
                                            <td className="border border-gray-400 p-4">เงินได้สุทธิ (Net Pay)</td>
                                            <td className="border border-gray-400 p-4 text-right text-green-700" colSpan="2">
                                                ฿{formatCurrency(selectedSlip.netPay)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Notes */}
                            {selectedSlip.notes && (
                                <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">หมายเหตุ (Notes):</p>
                                    <p className="text-sm text-gray-600">{selectedSlip.notes}</p>
                                </div>
                            )}

                            {/* Signatures */}
                            <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-300">
                                <div className="text-center">
                                    <div className="h-16 mb-2"></div>
                                    <div className="border-t border-gray-800 pt-2">
                                        <p className="font-semibold text-gray-900">ลงชื่อผู้จ่ายเงิน</p>
                                        <p className="text-sm text-gray-600">(Authorized Signature)</p>
                                        <p className="text-sm text-gray-600 mt-2">วันที่: _______________</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="h-16 mb-2"></div>
                                    <div className="border-t border-gray-800 pt-2">
                                        <p className="font-semibold text-gray-900">ลงชื่อผู้รับเงิน</p>
                                        <p className="text-sm text-gray-600">(Employee Signature)</p>
                                        <p className="text-sm text-gray-600 mt-2">วันที่: _______________</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
                                <p>เอกสารนี้ออกโดยระบบอัตโนมัติและมีผลใช้โดยไม่ต้องลงนามด้วยลายมือ</p>
                                <p>This document is system-generated and valid without handwritten signature.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaySlipPage;
