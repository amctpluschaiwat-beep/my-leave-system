import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { ref, onValue, set } from 'firebase/database';

function CompanyProfilePage({ appUser }) {
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [companyData, setCompanyData] = useState({
        logoUrl: '',
        nameTH: 'บริษัท ทีพลัสวัน ลิสซิ่ง จำกัด',
        nameEN: 'TPLUSONE LEASING CO., LTD.',
        address: '1188 หมู่ 4 ตำบลสำโรงเหนือ อำเภอเมือง จังหวัดสมุทรปราการ 10270',
        taxId: '0115566019276',
        phone: '02-096-2677',
        email: 'humanresource.tplus@gmail.com'
    });
    const [formData, setFormData] = useState({...companyData});
    const [saveMessage, setShowMessage] = useState('');

    // Check if user has permission (CEO or commander)
    const hasPermission = appUser?.role === 'CEO' || appUser?.role === 'commander';

    useEffect(() => {
        const companyRef = ref(db, 'companyProfile');
        
        const unsubscribe = onValue(companyRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setCompanyData(data);
                setFormData(data);
            } else {
                // ถ้าไม่มีข้อมูล ใช้ default
                const defaultData = {
                    logoUrl: '',
                    nameTH: 'บริษัท ทีพลัสวัน ลิสซิ่ง จำกัด',
                    nameEN: 'TPLUSONE LEASING CO., LTD.',
                    address: '1188 หมู่ 4 ตำบลสำโรงเหนือ อำเภอเมือง จังหวัดสมุทรปราการ 10270',
                    taxId: '0115566019276',
                    phone: '02-096-2677',
                    email: 'humanresource.tplus@gmail.com'
                };
                setCompanyData(defaultData);
                setFormData(defaultData);
            }
            setLoading(false);
        }, (error) => {
            console.error('Error loading company profile:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            const companyRef = ref(db, 'companyProfile');
            await set(companyRef, formData);
            setCompanyData(formData);
            setEditing(false);
            setShowMessage('✅ บันทึกข้อมูลสำเร็จ!');
            setTimeout(() => setShowMessage(''), 3000);
        } catch (error) {
            console.error('Error saving company profile:', error);
            setShowMessage('❌ เกิดข้อผิดพลาดในการบันทึก');
            setTimeout(() => setShowMessage(''), 3000);
        }
    };

    const handleCancel = () => {
        setFormData({...companyData});
        setEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">กำลังโหลดข้อมูลโปรไฟล์ธุรกิจ...</p>
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
                    <p className="text-red-700">หน้านี้เข้าถึงได้เฉพาะ CEO และ Commander เท่านั้น</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="bg-white shadow-sm rounded-lg p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">ข้อมูลโปรไฟล์ธุรกิจ</h2>
                        <p className="text-gray-600 mt-1">จัดการข้อมูลบริษัทสำหรับเอกสารต่างๆ</p>
                    </div>
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <i className='bx bx-edit-alt text-xl'></i>
                            แก้ไขข้อมูล
                        </button>
                    )}
                </div>

                {/* Success Message */}
                {saveMessage && (
                    <div className={`mb-4 p-4 rounded-lg ${
                        saveMessage.includes('✅') ? 'bg-green-50 text-green-800 border border-green-300' : 'bg-red-50 text-red-800 border border-red-300'
                    }`}>
                        {saveMessage}
                    </div>
                )}

                {/* Company Logo */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <i className='bx bx-image mr-1'></i>
                        Logo บริษัท
                    </label>
                    <div className="flex items-center gap-4">
                        {formData.logoUrl ? (
                            <img src={formData.logoUrl} alt="Company Logo" className="w-24 h-24 object-contain border-2 border-gray-300 rounded-lg p-2" />
                        ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-2xl">T+1</span>
                            </div>
                        )}
                        {editing && (
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="logoUrl"
                                    value={formData.logoUrl}
                                    onChange={handleChange}
                                    placeholder="URL ของ Logo (เช่น https://example.com/logo.png)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">หากไม่ระบุ จะใช้ Logo เริ่มต้น</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Company Name TH */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ชื่อบริษัท (ไทย)
                    </label>
                    {editing ? (
                        <input
                            type="text"
                            name="nameTH"
                            value={formData.nameTH}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    ) : (
                        <p className="text-lg font-semibold text-gray-900">{companyData.nameTH}</p>
                    )}
                </div>

                {/* Company Name EN */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ชื่อบริษัท (English)
                    </label>
                    {editing ? (
                        <input
                            type="text"
                            name="nameEN"
                            value={formData.nameEN}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    ) : (
                        <p className="text-lg font-semibold text-gray-700">{companyData.nameEN}</p>
                    )}
                </div>

                {/* Address */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <i className='bx bx-map mr-1'></i>
                        ที่อยู่
                    </label>
                    {editing ? (
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    ) : (
                        <p className="text-gray-900">{companyData.address}</p>
                    )}
                </div>

                {/* Tax ID */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <i className='bx bx-id-card mr-1'></i>
                        เลขประจำตัวผู้เสียภาษี
                    </label>
                    {editing ? (
                        <input
                            type="text"
                            name="taxId"
                            value={formData.taxId}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    ) : (
                        <p className="text-gray-900 font-mono">{companyData.taxId}</p>
                    )}
                </div>

                {/* Phone */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <i className='bx bx-phone mr-1'></i>
                        เบอร์ติดต่อ
                    </label>
                    {editing ? (
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    ) : (
                        <p className="text-gray-900">{companyData.phone}</p>
                    )}
                </div>

                {/* Email */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <i className='bx bx-envelope mr-1'></i>
                        อีเมล
                    </label>
                    {editing ? (
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    ) : (
                        <p className="text-gray-900">{companyData.email}</p>
                    )}
                </div>

                {/* Action Buttons */}
                {editing && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={handleSave}
                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <i className='bx bx-save text-xl'></i>
                            บันทึกข้อมูล
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex-1 px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <i className='bx bx-x text-xl'></i>
                            ยกเลิก
                        </button>
                    </div>
                )}

                {/* Info Note */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <i className='bx bx-info-circle text-blue-600 text-xl mt-0.5'></i>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-800 mb-1">หมายเหตุ</p>
                            <p className="text-sm text-blue-700">
                                ข้อมูลนี้จะถูกใช้ในเอกสารต่างๆ เช่น สลิปเงินเดือน (PaySlip) และเอกสารอื่นๆ ในอนาคต
                            </p>
                            <p className="text-xs text-blue-600 mt-2">
                                เฉพาะ CEO และ Commander เท่านั้นที่สามารถแก้ไขข้อมูลนี้ได้
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CompanyProfilePage;
