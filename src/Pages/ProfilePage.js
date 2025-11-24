import React, { useState, useEffect } from 'react';
import { ref as dbRef, update, onValue, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase';
import LoadingSpinner from './LoadingSpinner.js';

const ProfilePage = ({ appUser, viewUserId, viewMode = false }) => {
  
  // ถ้าเป็น viewMode ให้โหลดข้อมูลของคนที่เลือก
  const targetUserId = viewMode ? viewUserId : auth.currentUser?.uid;
  const [targetUser, setTargetUser] = useState(null);
  
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canEdit, setCanEdit] = useState(true);
  
  // เอกสารแนบใหม่
  const [idCardFile, setIdCardFile] = useState(null);
  const [educationFiles, setEducationFiles] = useState([]);
  const [workHistoryFile, setWorkHistoryFile] = useState(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  
  // URLs ของเอกสารที่อัพโหลดแล้ว
  const [documents, setDocuments] = useState({
    idCardUrl: null,
    educationUrls: [],
    workHistoryUrl: null
  });

  useEffect(() => {
    if (viewMode && targetUserId) {
      // โหลดข้อมูลของ user ที่เลือก
      const userRef = dbRef(db, `users/${targetUserId}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setTargetUser({ uid: targetUserId, ...userData });
          setPosition(userData.position || '');
          setDepartment(userData.department || '');
          setCanEdit(false); // HR/Manager ไม่สามารถแก้ไขได้
        }
      });
    } else if (appUser) {
      setTargetUser(appUser);
      setPosition(appUser.position || '');
      setDepartment(appUser.department || '');
      setCanEdit((appUser.profileEditedTimes ?? 0) === 0);
    }
  }, [appUser, viewMode, targetUserId]);

  // ดึงข้อมูลเอกสารจาก Firebase
  useEffect(() => {
    if (!targetUserId) return;
    
    const userDocRef = dbRef(db, `users/${targetUserId}/documents`);
    const unsubscribe = onValue(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDocuments({
          idCardUrl: data.idCardUrl || null,
          educationUrls: data.educationUrls || [],
          workHistoryUrl: data.workHistoryUrl || null
        });
      }
    });
    
    return () => unsubscribe();
  }, [targetUserId]);

  if (!targetUser) {
    return <LoadingSpinner />; 
  }

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      setError('กรุณาเลือกไฟล์รูปภาพก่อน');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');

    const filePath = `profile_images/${auth.currentUser.uid}/profile.jpg`;
    const sRef = storageRef(storage, filePath);

    try {
      await uploadBytes(sRef, imageFile);
      const downloadURL = await getDownloadURL(sRef);
      
      const userRef = dbRef(db, 'users/' + auth.currentUser.uid);
      await update(userRef, {
        profileImageUrl: downloadURL
      });

      setSuccess('อัปโหลดรูปโปรไฟล์สำเร็จ!');
      // ⬇️ ใช้ alert() ไม่ดี แต่โค้ดเดิมมี เลยคงไว้
      alert('อัปโหลดรูปสำเร็จ! รูปจะอัปเดตในครั้งถัดไปที่ล็อกอิน');
      
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการอัปโหลดรูป');
    } finally {
      setUploading(false);
      setImageFile(null);
    }
  };
  
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      setError('คุณแก้ไขข้อมูลโปรไฟล์ได้เพียงครั้งเดียว');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    const userRef = dbRef(db, 'users/' + auth.currentUser.uid);

    try {
      await update(userRef, {
        position: position,
        department: department,
        profileEditedTimes: 1 
      });
      setSuccess('บันทุกข้อมูลสำเร็จ!');
      setCanEdit(false);
      alert('บันทึกข้อมูลสำเร็จ!');
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // อัพโหลดบัตรประชาชน
  const handleUploadIdCard = async () => {
    if (!idCardFile) {
      setError('กรุณาเลือกไฟล์บัตรประชาชน');
      return;
    }
    
    setUploadingDocs(true);
    setError('');
    setSuccess('');
    
    try {
      const filePath = `employee_documents/${auth.currentUser.uid}/id_card.jpg`;
      const sRef = storageRef(storage, filePath);
      await uploadBytes(sRef, idCardFile);
      const downloadURL = await getDownloadURL(sRef);
      
      const docRef = dbRef(db, `users/${auth.currentUser.uid}/documents`);
      await update(docRef, { idCardUrl: downloadURL });
      
      setSuccess('อัพโหลดบัตรประชาชนสำเร็จ!');
      setIdCardFile(null);
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการอัพโหลดบัตรประชาชน');
    } finally {
      setUploadingDocs(false);
    }
  };

  // อัพโหลดเอกสารการศึกษา (สูงสุด 10 ไฟล์)
  const handleUploadEducation = async () => {
    if (educationFiles.length === 0) {
      setError('กรุณาเลือกไฟล์เอกสารการศึกษา');
      return;
    }
    
    if (documents.educationUrls.length + educationFiles.length > 10) {
      setError('สามารถอัพโหลดเอกสารการศึกษาได้สูงสุด 10 ไฟล์');
      return;
    }
    
    setUploadingDocs(true);
    setError('');
    setSuccess('');
    
    try {
      const uploadPromises = Array.from(educationFiles).map(async (file, index) => {
        const timestamp = Date.now();
        const filePath = `employee_documents/${auth.currentUser.uid}/education/${timestamp}_${index}.jpg`;
        const sRef = storageRef(storage, filePath);
        await uploadBytes(sRef, file);
        return await getDownloadURL(sRef);
      });
      
      const newUrls = await Promise.all(uploadPromises);
      const allUrls = [...documents.educationUrls, ...newUrls];
      
      const docRef = dbRef(db, `users/${auth.currentUser.uid}/documents`);
      await update(docRef, { educationUrls: allUrls });
      
      setSuccess(`อัพโหลดเอกสารการศึกษา ${newUrls.length} ไฟล์สำเร็จ!`);
      setEducationFiles([]);
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการอัพโหลดเอกสารการศึกษา');
    } finally {
      setUploadingDocs(false);
    }
  };

  // อัพโหลดประวัติการทำงาน
  const handleUploadWorkHistory = async () => {
    if (!workHistoryFile) {
      setError('กรุณาเลือกไฟล์ประวัติการทำงาน');
      return;
    }
    
    setUploadingDocs(true);
    setError('');
    setSuccess('');
    
    try {
      const filePath = `employee_documents/${auth.currentUser.uid}/work_history.pdf`;
      const sRef = storageRef(storage, filePath);
      await uploadBytes(sRef, workHistoryFile);
      const downloadURL = await getDownloadURL(sRef);
      
      const docRef = dbRef(db, `users/${auth.currentUser.uid}/documents`);
      await update(docRef, { workHistoryUrl: downloadURL });
      
      setSuccess('อัพโหลดประวัติการทำงานสำเร็จ!');
      setWorkHistoryFile(null);
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการอัพโหลดประวัติการทำงาน');
    } finally {
      setUploadingDocs(false);
    }
  };

  // ลบเอกสารการศึกษา
  const handleDeleteEducationDoc = async (index) => {
    if (!window.confirm('ต้องการลบเอกสารนี้หรือไม่?')) return;
    
    try {
      const newUrls = documents.educationUrls.filter((_, i) => i !== index);
      const docRef = dbRef(db, `users/${auth.currentUser.uid}/documents`);
      await update(docRef, { educationUrls: newUrls });
      setSuccess('ลบเอกสารสำเร็จ!');
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการลบเอกสาร');
    }
  };

  return (
    <div className="space-y-6">
      {/* แสดง Banner ถ้าเป็นโหมดดูโปรไฟล์คนอื่น */}
      {viewMode && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <p className="text-blue-800 font-medium">
            <i className='bx bx-info-circle mr-2'></i>
            กำลังดูโปรไฟล์ของ: <strong>{targetUser?.name}</strong>
          </p>
        </div>
      )}

      {/* ส่วนโปรไฟล์และข้อมูลพื้นฐาน */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          
          <img 
            src={targetUser?.profileImageUrl || 'https://via.placeholder.com/150'}
            alt="Profile"
            // ⬇️ เปลี่ยนสีเส้นขอบเป็น indigo
            className="w-40 h-40 rounded-full mx-auto object-cover mb-4 border-4 border-indigo-200"
          />
          
          {/* ⬇️ เปลี่ยนสี text เป็น slate */}
          <h3 className="text-xl font-semibold text-slate-800">{targetUser?.name}</h3>
          <p className="text-gray-600">{targetUser?.email}</p>
          
          <hr className="my-4" />
          
          {!viewMode && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อัปโหลดรูปโปรไฟล์ใหม่
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                // ⬇️ เปลี่ยนสีปุ่มอัปโหลดไฟล์
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {imageFile && <p className="text-xs text-gray-500 mt-2">{imageFile.name}</p>}
              <button
                onClick={handleUploadImage}
                disabled={uploading || !imageFile}
                // ⬇️ เปลี่ยนสีปุ่มอัปโหลด
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all mt-4 disabled:opacity-50"
              >
                {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป'}
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="md:col-span-2">
        <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-lg shadow-md">
          {/* ⬇️ เปลี่ยนสี text เป็น slate */}
          <h3 className="text-xl font-semibold text-slate-800 mb-6">
            ประวัติพนักงาน
          </h3>
          
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
          
          {!canEdit && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
              <strong>หมายเหตุ:</strong> คุณได้ทำการแก้ไขและบันทึกข้อมูลครั้งแรกไปแล้ว หากต้องการแก้ไขอีก กรุณาติดต่อ HR
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ... (ส่วน input ที่ readOnly เหมือนเดิม) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-500">ชื่อ-นามสกุล</label>
              <input type="text" value={targetUser?.name} readOnly className="w-full border-gray-200 bg-gray-100 rounded-md py-2 px-4 mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">อีเมล</label>
              <input type="email" value={targetUser?.email} readOnly className="w-full border-gray-200 bg-gray-100 rounded-md py-2 px-4 mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">เลขบัตรประชาชน</label>
              <input type="text" value={targetUser?.nationalId || '-'} readOnly className="w-full border-gray-200 bg-gray-100 rounded-md py-2 px-4 mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">วันเกิด</label>
              <input type="date" value={targetUser?.dob} readOnly className="w-full border-gray-200 bg-gray-100 rounded-md py-2 px-4 mt-1" />
            </div>
            
            <hr className="md:col-span-2 my-2" />
            
            <div>
              <label className="block text-sm font-medium text-gray-700">ตำแหน่งงาน</label>
              <input 
                type="text" 
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={!canEdit || loading}
                // ⬇️ เปลี่ยนสี focus
                className="w-full border border-gray-300 rounded-md py-2 px-4 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">แผนก</label>
              <input 
                type="text" 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={!canEdit || loading}
                // ⬇️ เปลี่ยนสี focus
                className="w-full border border-gray-300 rounded-md py-2 px-4 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100" 
              />
            </div>
          </div>
          
          {!viewMode && (
            <div className="text-right mt-6">
              <button
                type="submit"
                disabled={!canEdit || loading}
                // ⬇️ เปลี่ยนสีปุ่ม Save
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล (1 ครั้ง)'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>

      {/* ส่วนเอกสารแนบ */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center">
          <i className='bx bx-file text-3xl mr-2 text-indigo-600'></i>
          เอกสารแนบ
        </h3>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* บัตรประชาชน */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <i className='bx bx-id-card text-xl mr-2 text-blue-600'></i>
              บัตรประชาชน
            </h4>
            
            {documents.idCardUrl ? (
              <div className="mb-3">
                <img 
                  src={documents.idCardUrl} 
                  alt="ID Card" 
                  className="w-full h-40 object-cover rounded-lg border border-gray-300 mb-2"
                />
                <a 
                  href={documents.idCardUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm flex items-center"
                >
                  <i className='bx bx-link-external mr-1'></i>
                  ดูเอกสาร
                </a>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-3">ยังไม่ได้อัพโหลด</p>
            )}

            {!viewMode && (
              <>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setIdCardFile(e.target.files[0])}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-2"
                />
                {idCardFile && <p className="text-xs text-gray-500 mb-2">{idCardFile.name}</p>}
                <button
                  onClick={handleUploadIdCard}
                  disabled={uploadingDocs || !idCardFile}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {uploadingDocs ? 'กำลังอัพโหลด...' : 'อัพโหลด'}
                </button>
              </>
            )}
          </div>

          {/* ประวัติการทำงาน */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <i className='bx bx-briefcase text-xl mr-2 text-green-600'></i>
              ประวัติการทำงาน
            </h4>
            
            {documents.workHistoryUrl ? (
              <div className="mb-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                  <i className='bx bx-file-blank text-3xl text-green-600'></i>
                  <p className="text-sm text-gray-700 mt-1">เอกสารอัพโหลดแล้ว</p>
                </div>
                <a 
                  href={documents.workHistoryUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline text-sm flex items-center"
                >
                  <i className='bx bx-link-external mr-1'></i>
                  ดูเอกสาร
                </a>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-3">ยังไม่ได้อัพโหลด</p>
            )}

            {!viewMode && (
              <>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => setWorkHistoryFile(e.target.files[0])}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 mb-2"
                />
                {workHistoryFile && <p className="text-xs text-gray-500 mb-2">{workHistoryFile.name}</p>}
                <button
                  onClick={handleUploadWorkHistory}
                  disabled={uploadingDocs || !workHistoryFile}
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {uploadingDocs ? 'กำลังอัพโหลด...' : 'อัพโหลด'}
                </button>
              </>
            )}
          </div>

          {/* เอกสารการศึกษา */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <i className='bx bx-book text-xl mr-2 text-purple-600'></i>
              เอกสารการศึกษา ({documents.educationUrls.length}/10)
            </h4>
            
            {documents.educationUrls.length > 0 ? (
              <div className="max-h-40 overflow-y-auto mb-3 space-y-2">
                {documents.educationUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-purple-50 p-2 rounded">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline text-xs flex items-center flex-1"
                    >
                      <i className='bx bx-file text-lg mr-1'></i>
                      เอกสาร {index + 1}
                    </a>
                    {!viewMode && (
                      <button
                        onClick={() => handleDeleteEducationDoc(index)}
                        className="text-red-500 hover:text-red-700 text-xs ml-2"
                      >
                        <i className='bx bx-trash'></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-3">ยังไม่ได้อัพโหลด</p>
            )}

            {!viewMode && (
              <>
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  multiple
                  onChange={(e) => setEducationFiles(e.target.files)}
                  disabled={documents.educationUrls.length >= 10}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 mb-2 disabled:opacity-50"
                />
                {educationFiles.length > 0 && (
                  <p className="text-xs text-gray-500 mb-2">{educationFiles.length} ไฟล์</p>
                )}
                <button
                  onClick={handleUploadEducation}
                  disabled={uploadingDocs || educationFiles.length === 0 || documents.educationUrls.length >= 10}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {uploadingDocs ? 'กำลังอัพโหลด...' : 'อัพโหลด'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;