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
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-tplus-orange">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-tplus-text">สลิปเงินเดือน</h2>
                        <p className="text-slate-500 mt-1">รายการสลิปเงินเดือนของคุณ</p>
                    </div>
                    <div className="text-left sm:text-right mt-4 sm:mt-0">
                        <p className="text-sm text-slate-500">พนักงาน</p>
                        <p className="font-semibold text-tplus-text">{appUser?.name}</p>
                        <p className="text-sm text-slate-500">{appUser?.department}</p>
                    </div>
                </div>
            </div>
            
            {payslips.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-tplus-border">
                    <i className='bx bx-file text-6xl text-slate-300 mb-4'></i>
                    <p className="text-tplus-text text-lg">ไม่พบข้อมูลสลิปเงินเดือน</p>
                    <p className="text-slate-500 text-sm mt-2">ข้อมูลจะปรากฏเมื่อแผนกบุคคลทำการออกสลิป</p>
                    <button
                        onClick={handleAddSampleData}
                        className="mt-6 px-5 py-2.5 bg-tplus-orange hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto shadow-sm"
                    >
                        <i className='bx bx-plus-circle text-lg'></i>
                        เพิ่มข้อมูลตัวอย่าง (Demo)
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-tplus-border">
                    {/* Rows per page selector */}
                    <div className="p-4 border-b border-tplus-border flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">แสดง:</span>
                            {[10, 50, 100].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => { setRowsPerPage(num); setCurrentPage(1); }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        rowsPerPage === num
                                            ? 'bg-tplus-orange text-white'
                                            : 'bg-white text-slate-700 border border-tplus-border hover:bg-slate-100'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                            <span className="text-sm text-slate-600">รายการ</span>
                        </div>
                        <div className="text-sm text-slate-600 font-medium">
                            หน้า {currentPage} / {Math.ceil(payslips.length / rowsPerPage) || 1}
                        </div>
                    </div>

                    {/* PaySlip List */}
                    <div className="divide-y divide-tplus-border">
                        {(() => {
                            const startIndex = (currentPage - 1) * rowsPerPage;
                            const endIndex = startIndex + rowsPerPage;
                            const paginatedSlips = payslips.slice(startIndex, endIndex);
                            
                            return paginatedSlips.map((slip) => (
                                <div 
                                    key={slip.id} 
                                    className="p-4 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-tplus-orange/10 rounded-lg flex items-center justify-center text-tplus-orange border border-tplus-orange/20">
                                                    <i className='bx bx-receipt text-2xl'></i>
                                                </div>
                                                <div>
                                                    <p className="text-md font-bold text-tplus-text">
                                                        งวดเดือน {slip.month} พ.ศ. {slip.year}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        วันที่จ่าย: {new Date(slip.payDate).toLocaleDateString('th-TH', { 
                                                            year: 'numeric', month: 'long', day: 'numeric' 
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-xs text-slate-500 mb-1">เงินเดือนสุทธิ</p>
                                            <p className="text-xl font-bold text-green-600">
                                                ฿{formatCurrency(slip.netPay)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleViewDetail(slip)}
                                            className="px-4 py-2 bg-white border border-tplus-border text-slate-700 rounded-lg font-medium transition-colors hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center gap-2 w-full sm:w-auto"
                                        >
                                            <i className='bx bx-show'></i>
                                            <span>ดูรายละเอียด</span>
                                        </button>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-tplus-border flex items-center justify-between flex-wrap gap-2">
                        <div className="text-sm text-slate-600">
                            แสดง {Math.min((currentPage - 1) * rowsPerPage + 1, payslips.length)} - {Math.min(currentPage * rowsPerPage, payslips.length)} จาก {payslips.length} รายการ
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-tplus-border text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                            >
                                <i className='bx bx-chevron-left'></i>
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(payslips.length / rowsPerPage), prev + 1))}
                                disabled={currentPage >= Math.ceil(payslips.length / rowsPerPage)}
                                className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-tplus-border text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                            >
                                <i className='bx bx-chevron-right'></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal - PaySlip Detail */}
            {showModal && selectedSlip && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-tplus-border p-6 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-tplus-text">
                                สลิปเงินเดือน - {selectedSlip.month} {selectedSlip.year}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-700 text-3xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 bg-slate-50/50 border-b border-tplus-border grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2.5 bg-white border border-tplus-border text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <i className='bx bx-printer text-lg'></i>
                                <span>พิมพ์</span>
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="px-4 py-2.5 bg-white border border-tplus-border text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <i className='bx bxs-file-pdf text-lg'></i>
                                <span>Export PDF</span>
                            </button>
                            <button
                                onClick={handleSendEmail}
                                className="px-4 py-2.5 bg-white border border-tplus-border text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <i className='bx bx-envelope text-lg'></i>
                                <span>ส่ง Email</span>
                            </button>
                            <button
                                onClick={handleDigitalSign}
                                className="px-4 py-2.5 bg-white border border-tplus-border text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <i className='bx bx-edit-alt text-lg'></i>
                                <span>ลายเซ็นดิจิทัล</span>
                            </button>
                        </div>

                        {/* PaySlip Content for Print */}
                        <div ref={printRef} className="p-6 text-tplus-text" style={{ maxWidth: '210mm', margin: '0 auto' }}>
                            {/* Company Header */}
                            <div className="border-b-2 border-slate-400 pb-4 mb-4">
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    {companyData?.logoUrl && (
                                        <img src={companyData.logoUrl} alt="Logo" className="w-20 h-20 object-contain border border-tplus-border rounded-md flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <h1 className="text-xl font-bold text-tplus-text">{companyData?.nameTH || 'บริษัท ทีพลัสวัน ลิสซิ่ง จำกัด'}</h1>
                                        <h2 className="text-base font-semibold text-slate-600">{companyData?.nameEN || 'TPLUSONE LEASING CO., LTD.'}</h2>
                                        <p className="text-xs text-slate-500 mt-1">{companyData?.address || '1188 หมู่ 4 ตำบลสำโรงเหนือ อำเภอเมือง จังหวัดสมุทรปราการ 10270'}</p>
                                        <p className="text-xs text-slate-500">เลขประจำตัวผู้เสียภาษี: {companyData?.taxId || '0115566019276'}</p>
                                    </div>
                                </div>
                                <h3 className="text-center text-lg font-bold text-tplus-text mt-3">ใบจ่ายเงินเดือน (PAY SLIP)</h3>
                            </div>

                            {/* Employee Info */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 pb-4 border-b border-tplus-border text-sm">
                                <div className="font-semibold text-slate-500">ชื่อ-นามสกุล:</div>
                                <div className="text-tplus-text">{appUser?.name || '-'}</div>
                                <div className="font-semibold text-slate-500">รหัสพนักงาน:</div>
                                <div className="text-tplus-text">{appUser?.employeeId || '-'}</div>
                                <div className="font-semibold text-slate-500">แผนก:</div>
                                <div className="text-tplus-text">{appUser?.department || '-'}</div>
                                <div className="font-semibold text-slate-500">ตำแหน่ง:</div>
                                <div className="text-tplus-text">{appUser?.position || '-'}</div>
                                <div className="font-semibold text-slate-500">งวดเดือน:</div>
                                <div className="text-tplus-text">{selectedSlip.month} {selectedSlip.year}</div>
                                <div className="font-semibold text-slate-500">วันที่จ่าย:</div>
                                <div className="text-tplus-text">
                                    {new Date(selectedSlip.payDate).toLocaleDateString('th-TH', { 
                                        year: 'numeric', month: 'long', day: 'numeric' 
                                    })}
                                </div>
                            </div>

                            {/* Income & Deduction Table */}
                            <div className="mb-4">
                                <table className="w-full border-collapse border border-tplus-border text-sm">
                                    <thead className="bg-slate-100">
                                        <tr className="text-left">
                                            <th className="border border-tplus-border p-2 font-semibold">รายการ</th>
                                            <th className="border border-tplus-border p-2 text-right font-semibold w-28">รายได้</th>
                                            <th className="border border-tplus-border p-2 text-right font-semibold w-28">รายหัก</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-tplus-border p-2">เงินเดือนประจำ</td>
                                            <td className="border border-tplus-border p-2 text-right">{formatCurrency(selectedSlip.baseSalary || 0)}</td>
                                            <td className="border border-tplus-border p-2 text-right">-</td>
                                        </tr>
                                        {selectedSlip.overtimePay > 0 && (
                                            <tr>
                                                <td className="border border-tplus-border p-2">ค่าล่วงเวลา</td>
                                                <td className="border border-tplus-border p-2 text-right">{formatCurrency(selectedSlip.overtimePay)}</td>
                                                <td className="border border-tplus-border p-2 text-right">-</td>
                                            </tr>
                                        )}
                                        {selectedSlip.allowance > 0 && (
                                            <tr>
                                                <td className="border border-tplus-border p-2">เบี้ยเลี้ยง/ค่าพาหนะ</td>
                                                <td className="border border-tplus-border p-2 text-right">{formatCurrency(selectedSlip.allowance)}</td>
                                                <td className="border border-tplus-border p-2 text-right">-</td>
                                            </tr>
                                        )}
                                        {selectedSlip.bonus > 0 && (
                                            <tr>
                                                <td className="border border-tplus-border p-2">โบนัส</td>
                                                <td className="border border-tplus-border p-2 text-right">{formatCurrency(selectedSlip.bonus)}</td>
                                                <td className="border border-tplus-border p-2 text-right">-</td>
                                            </tr>
                                        )}
                                        <tr className="bg-slate-50 font-semibold">
                                            <td className="border border-tplus-border p-2">รวมรายได้</td>
                                            <td className="border border-tplus-border p-2 text-right">
                                                {formatCurrency(
                                                    (parseFloat(selectedSlip.baseSalary) || 0) + 
                                                    (parseFloat(selectedSlip.overtimePay) || 0) + 
                                                    (parseFloat(selectedSlip.allowance) || 0) + 
                                                    (parseFloat(selectedSlip.bonus) || 0)
                                                )}
                                            </td>
                                            <td className="border border-tplus-border p-2 text-right">-</td>
                                        </tr>
                                        {selectedSlip.socialSecurity > 0 && (
                                            <tr>
                                                <td className="border border-tplus-border p-2">ประกันสังคม</td>
                                                <td className="border border-tplus-border p-2 text-right">-</td>
                                                <td className="border border-tplus-border p-2 text-right">{formatCurrency(selectedSlip.socialSecurity)}</td>
                                            </tr>
                                        )}
                                        {selectedSlip.tax > 0 && (
                                            <tr>
                                                <td className="border border-tplus-border p-2">ภาษีหัก ณ ที่จ่าย</td>
                                                <td className="border border-tplus-border p-2 text-right">-</td>
                                                <td className="border border-tplus-border p-2 text-right">{formatCurrency(selectedSlip.tax)}</td>
                                            </tr>
                                        )}
                                        {selectedSlip.loan > 0 && (
                                            <tr>
                                                <td className="border border-tplus-border p-2">เงินกู้ยืม</td>
                                                <td className="border border-tplus-border p-2 text-right">-</td>
                                                <td className="border border-tplus-border p-2 text-right">{formatCurrency(selectedSlip.loan)}</td>
                                            </tr>
                                        )}
                                        {selectedSlip.deductions > 0 && (
                                            <tr>
                                                <td className="border border-tplus-border p-2">รายการหักอื่นๆ</td>
                                                <td className="border border-tplus-border p-2 text-right">-</td>
                                                <td className="border border-tplus-border p-2 text-right">{formatCurrency(selectedSlip.deductions)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-slate-50 font-semibold">
                                            <td className="border border-tplus-border p-2">รวมรายการหัก</td>
                                            <td className="border border-tplus-border p-2 text-right">-</td>
                                            <td className="border border-tplus-border p-2 text-right">
                                                {formatCurrency(
                                                    (parseFloat(selectedSlip.socialSecurity) || 0) + 
                                                    (parseFloat(selectedSlip.tax) || 0) + 
                                                    (parseFloat(selectedSlip.loan) || 0) + 
                                                    (parseFloat(selectedSlip.deductions) || 0)
                                                )}
                                            </td>
                                        </tr>
                                        <tr className="bg-green-50 font-bold text-md">
                                            <td className="border border-tplus-border p-3">เงินได้สุทธิ</td>
                                            <td className="border border-tplus-border p-3 text-right text-green-700" colSpan="2">
                                                ฿{formatCurrency(selectedSlip.netPay)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Notes */}
                            {selectedSlip.notes && (
                                <div className="mb-6 p-3 bg-slate-50 border border-tplus-border rounded-md">
                                    <p className="text-sm font-semibold text-slate-700 mb-1">หมายเหตุ:</p>
                                    <p className="text-sm text-slate-600">{selectedSlip.notes}</p>
                                </div>
                            )}

                            {/* Signatures */}
                            <div className="grid grid-cols-2 gap-8 mt-12 pt-8">
                                <div className="text-center border-t border-tplus-border pt-2">
                                    <p className="font-semibold text-tplus-text text-sm">.................................................</p>
                                    <p className="text-sm text-slate-600 mt-1">(ผู้จ่ายเงิน)</p>
                                </div>
                                <div className="text-center border-t border-tplus-border pt-2">
                                    <p className="font-semibold text-tplus-text text-sm">.................................................</p>
                                    <p className="text-sm text-slate-600 mt-1">(ผู้รับเงิน)</p>
                                </div>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-8 text-center text-xs text-slate-400 border-t border-tplus-border pt-4">
                                <p>เอกสารนี้จัดทำโดยระบบคอมพิวเตอร์</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaySlipPage;
