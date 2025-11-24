// OTListPage.jsx - หน้าอนุมัติ OT สำหรับ Manager/HR
import React, { useEffect, useState } from 'react';
import { db, auth } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { updateData } from '../utils/dbHelpers';
import { Button, Card, CardContent, Typography, Chip, Alert, Grid } from '@mui/material';

function OTListPage({ appUser }) {
  const [overtimes, setOvertimes] = useState([]);

  useEffect(() => {
    const otRef = ref(db, 'overtimes');
    const unsubscribe = onValue(otRef, (snapshot) => {
      const data = snapshot.val() || {};
      const otArray = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      // เรียงตามวันที่ส่งล่าสุด
      otArray.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setOvertimes(otArray);
    });
    return () => unsubscribe();
  }, []);

  // ตรวจสอบสิทธิ์
  if (!appUser || (appUser.role !== 'Manager' && appUser.role !== 'hr')) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        คุณไม่มีสิทธิ์เข้าหน้านี้ (เฉพาะ Manager และ HR)
      </Alert>
    );
  }

  const handleUpdateStatus = async (otId, newStatus) => {
    if (!appUser) {
      alert('ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่');
      return;
    }

    const payload = {
      status: newStatus,
      approverId: appUser.uid || null,
      approvedAt: new Date().toISOString()
    };

    console.log('🔍 Debug - User:', appUser);
    console.log('🔍 Debug - Auth User:', auth.currentUser);
    console.log('🔍 Debug - Updating path:', `overtimes/${otId}`);
    console.log('🔍 Debug - Payload:', payload);

    try {
      await updateData(`overtimes/${otId}`, payload);
      alert(`เปลี่ยนสถานะเป็น "${newStatus}" แล้ว`);
    } catch (err) {
      console.error('❌ Update Error:', err);
      console.error('❌ Error Code:', err.code);
      console.error('❌ Error Message:', err.message);
      alert('เกิดข้อผิดพลาด: ' + (err.message || err));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'รออนุมัติ';
      case 'approved': return 'อนุมัติ';
      case 'rejected': return 'ปฏิเสธ';
      default: return status;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        รายการขอทำ OT ทั้งหมด
      </Typography>

      {overtimes.length === 0 && (
        <Alert severity="info">ยังไม่มีรายการขอทำ OT</Alert>
      )}

      <Grid container spacing={2}>
        {overtimes.map((ot) => (
          <Grid item xs={12} md={6} key={ot.id}>
            <Card elevation={2}>
              <CardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <Typography variant="h6" component="div">
                    {ot.userName}
                  </Typography>
                  <Chip 
                    label={getStatusText(ot.status)} 
                    color={getStatusColor(ot.status)} 
                    size="small"
                  />
                </div>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📧 {ot.email}
                </Typography>

                <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {ot.otType}
                </Typography>

                <Typography variant="body2" sx={{ mt: 1 }}>
                  📅 <strong>วันที่:</strong> {ot.startDate} ถึง {ot.endDate}
                </Typography>

                <Typography variant="body2" sx={{ mt: 1 }}>
                  🕐 <strong>เวลา:</strong> {ot.startTime} - {ot.endTime}
                </Typography>

                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                  <strong>รวมเวลา OT:</strong> {ot.otDisplay || 'ไม่ระบุ'}
                </Alert>

                <Typography variant="body2" sx={{ mt: 1 }}>
                  💬 <strong>หมายเหตุ:</strong> {ot.remark}
                </Typography>

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                  ส่งคำขอเมื่อ: {new Date(ot.submittedAt).toLocaleString('th-TH')}
                </Typography>

                {ot.status === 'pending' && (
                  <div style={{ marginTop: 16, display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={() => handleUpdateStatus(ot.id, 'approved')}
                      size="small"
                    >
                      ✓ อนุมัติ
                    </Button>
                    <Button 
                      variant="contained" 
                      color="error" 
                      onClick={() => handleUpdateStatus(ot.id, 'rejected')}
                      size="small"
                    >
                      ✗ ปฏิเสธ
                    </Button>
                  </div>
                )}

                {ot.status !== 'pending' && ot.approvedAt && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {getStatusText(ot.status)}เมื่อ: {new Date(ot.approvedAt).toLocaleString('th-TH')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default OTListPage;
