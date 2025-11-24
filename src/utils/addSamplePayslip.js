import { ref, set, push } from 'firebase/database';
import { db } from '../config/firebase';

export const addSamplePayslip = async (uid) => {
    try {
        const payslipsRef = ref(db, `payslips/${uid}`);
        
        // สร้าง PaySlip ตัวอย่าง 3 เดือน
        const samplePayslips = [
            {
                month: 'ตุลาคม',
                year: '2568',
                payDate: '2025-10-25',
                baseSalary: 35000,
                overtimePay: 3500,
                allowance: 2000,
                bonus: 0,
                socialSecurity: 750,
                tax: 2100,
                loan: 0,
                deductions: 0,
                netPay: 37650,
                notes: 'เงินเดือนประจำเดือนตุลาคม 2568'
            },
            {
                month: 'กันยายน',
                year: '2568',
                payDate: '2025-09-25',
                baseSalary: 35000,
                overtimePay: 2800,
                allowance: 2000,
                bonus: 5000,
                socialSecurity: 750,
                tax: 2800,
                loan: 1000,
                deductions: 500,
                netPay: 39750,
                notes: 'รวมโบนัสผลงานไตรมาส 3'
            },
            {
                month: 'สิงหาคม',
                year: '2568',
                payDate: '2025-08-25',
                baseSalary: 35000,
                overtimePay: 4200,
                allowance: 2000,
                bonus: 0,
                socialSecurity: 750,
                tax: 2450,
                loan: 1000,
                deductions: 0,
                netPay: 37000,
                notes: 'เงินเดือนประจำเดือนสิงหาคม 2568'
            }
        ];

        // บันทึกลง Firebase
        for (const slip of samplePayslips) {
            const newSlipRef = push(payslipsRef);
            await set(newSlipRef, slip);
        }

        console.log('✅ เพิ่มข้อมูล PaySlip ตัวอย่างสำเร็จ!');
        return true;
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการเพิ่มข้อมูล:', error);
        return false;
    }
};
