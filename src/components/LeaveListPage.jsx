// LeaveListPage.jsx
import React, { useEffect, useState } from 'react';
import { db, auth } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { updateData } from '../utils/dbHelpers';
import { Button, Card, CardContent, Typography, Grid } from '@mui/material';

function LeaveListPage({ appUser }) {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const leavesRef = ref(db, 'leaves');
    const unsubscribe = onValue(leavesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const leavesArray = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      setLeaves(leavesArray);
    });
    return () => unsubscribe();
  }, []);

  if (!appUser || (appUser.role !== 'Manager' && appUser.role !== 'hr')) {
    return <Typography sx={{ m: 3 }}>คุณไม่มีสิทธิ์เข้าหน้านี้</Typography>;
  }

  const handleUpdateStatus = async (leaveId, newStatus) => {
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
    console.log('🔍 Debug - Updating path:', `leaves/${leaveId}`);
    console.log('🔍 Debug - Payload:', payload);

    try {
      await updateData(`leaves/${leaveId}`, payload);
      alert(`เปลี่ยนสถานะเป็น "${newStatus}" แล้ว`);
    } catch (err) {
      console.error('❌ Update Error:', err);
      console.error('❌ Error Code:', err.code);
      console.error('❌ Error Message:', err.message);
      alert('เกิดข้อผิดพลาด: ' + (err.message || err));
    }
  };

  return (
    <Grid container spacing={2} sx={{ p: 3 }}>
      {leaves.map((leave) => (
        <Grid item xs={12} md={6} key={leave.id}>
          <Card>
            <CardContent>
              <Typography variant="h6">{leave.userName}</Typography>
              <Typography variant="body2">ประเภท: {leave.leaveType}</Typography>
              <Typography variant="body2">วันที่: {leave.startDate} - {leave.endDate}</Typography>
              <Typography variant="body2">เหตุผล: {leave.reason}</Typography>
              <Typography variant="body2">สถานะ: {leave.status}</Typography>

              {leave.status === 'pending' && (
                <div style={{ marginTop: 10 }}>
                  <Button variant="contained" onClick={() => handleUpdateStatus(leave.id, 'approved')} sx={{ mr: 1 }}>อนุมัติ</Button>
                  <Button variant="contained" color="error" onClick={() => handleUpdateStatus(leave.id, 'rejected')}>ปฏิเสธ</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default LeaveListPage;