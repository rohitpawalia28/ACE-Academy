import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './TeacherDashboard.css';

const socket = io.connect('https://ace-academy-backend-e0pi.onrender.com');

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]); 
  
  const [uploadTitle, setUploadTitle] = useState(''); const [uploadBatch, setUploadBatch] = useState(''); const [uploadFile, setUploadFile] = useState(null); const [uploadStatus, setUploadStatus] = useState(''); const [allNotes, setAllNotes] = useState([]);
  const [timeDate, setTimeDate] = useState(''); const [timeBatch, setTimeBatch] = useState(''); const [timeSubject, setTimeSubject] = useState(''); const [timeTopic, setTimeTopic] = useState(''); const [timeStatus, setTimeStatus] = useState(''); const [allSchedules, setAllSchedules] = useState([]);
  const [attDate, setAttDate] = useState(''); const [attRecords, setAttRecords] = useState([]); const [attStatusMsg, setAttStatusMsg] = useState('');
  const [markDate, setMarkDate] = useState(''); const [markSubject, setMarkSubject] = useState(''); const [markTopic, setMarkTopic] = useState(''); const [maxMarks, setMaxMarks] = useState(''); const [markRecords, setMarkRecords] = useState([]); const [markStatusMsg, setMarkStatusMsg] = useState('');
  const [viewStudent, setViewStudent] = useState(''); const [studentStats, setStudentStats] = useState(null);

  const [chatContacts, setChatContacts] = useState([]); const [selectedChatObj, setSelectedChatObj] = useState(null); const [chatRoom, setChatRoom] = useState(''); const [currentMessage, setCurrentMessage] = useState(''); const [messageList, setMessageList] = useState([]); const [unreadRooms, setUnreadRooms] = useState({}); 
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    const safeRole = storedRole ? String(storedRole).toLowerCase().trim() : '';

    if (!token || safeRole !== 'teacher') { localStorage.clear(); navigate('/'); } 
    else { setUsername(storedUsername); socket.emit('register_user', storedUsername); fetchData(storedUsername); }
  }, [navigate]);

  useEffect(() => {
    const handlePageClick = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('.profile-menu-wrap')) setIsProfileMenuOpen(false);
    };
    document.addEventListener('click', handlePageClick);
    return () => document.removeEventListener('click', handlePageClick);
  }, []);

  const fetchData = async (user) => {
    try {
      const profRes = await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/records/profile/${user}`);
      const profData = await profRes.json();
      setProfile(profData);

      const adminRes = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/records/admins');
      const aData = await adminRes.json();
      setAdmins(aData);

      const studentRes = await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/records/students?teacher=${user}`); 
      const sData = await studentRes.json();
      setStudents(sData);
      setAttRecords(sData.map(s => ({ username: s.username, status: 'Present', grade: s.grade, markedBy: null })));
      setMarkRecords(sData.map(s => ({ username: s.username, marksObtained: '', grade: s.grade })));

      const notesRes = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/notes'); setAllNotes(await notesRes.json());
      const scheduleRes = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/timetable'); setAllSchedules(await scheduleRes.json());

      const contacts = [];
      profData.assignedGrades?.forEach(g => contacts.push({ id: `group_${g}`, name: `${g} Class Group`, room: `Group_${g}`, type: 'group', initial: 'G' }));
      sData.forEach(s => contacts.push({ id: s.username, name: s.name || s.username, room: `${s.username}_${user}`, type: 'student', initial: (s.name || s.username).charAt(0).toUpperCase() }));
      aData.forEach(a => contacts.push({ id: a.username, name: a.name || a.username, room: `admin_${user}`, type: 'admin', initial: 'A' }));
      
      setChatContacts(contacts);
      contacts.forEach(c => socket.emit('join_chat', c.room));
    } catch (err) { console.error(err); }
  };

  const selectChat = (contact) => { setSelectedChatObj(contact); setChatRoom(contact.room); setUnreadRooms(prev => ({ ...prev, [contact.room]: false })); fetch(`https://ace-academy-backend-e0pi.onrender.com/api/chat/${contact.room}`).then(res => res.json()).then(data => setMessageList(data)); };
  useEffect(() => { const handler = (data) => { if (data.room === chatRoom) setMessageList((list) => [...list, data]); if (data.author !== username && data.type !== 'system') { if (data.room !== chatRoom) setUnreadRooms(prev => ({ ...prev, [data.room]: true })); } }; const receiptHandler = (data) => { if (data.room === chatRoom) setMessageList((list) => [...list, data]); }; socket.on('receive_message', handler); socket.on('read_receipt', receiptHandler); return () => { socket.off('receive_message', handler); socket.off('read_receipt', receiptHandler); }; }, [chatRoom, username]);
  const sendMessage = async () => { if (currentMessage !== '' && chatRoom !== '') { const now = new Date(); const msgData = { room: chatRoom, author: username, message: currentMessage, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: now.toLocaleDateString('en-GB'), type: 'text' }; await socket.emit('send_message', msgData); setMessageList((list) => [...list, msgData]); setCurrentMessage(''); } };
  const markAsRead = () => { if (chatRoom) { setUnreadRooms(prev => ({ ...prev, [chatRoom]: false })); socket.emit('mark_read', { room: chatRoom, reader: profile.name || username }); } };

  useEffect(() => { const fetchExistingAttendance = async () => { if (!attDate || students.length === 0) return; try { const res = await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/records/attendance/${attDate}`); const existingData = await res.json(); const mergedRecords = students.map(s => { const found = existingData.find(e => e.studentUsername === s.username); if (found) return { username: s.username, grade: s.grade, status: found.status, markedBy: found.markedBy }; return { username: s.username, grade: s.grade, status: 'Present', markedBy: null }; }); setAttRecords(mergedRecords); } catch (err) { console.error(err); } }; fetchExistingAttendance(); }, [attDate, students]);
  const getAllowedSubjects = (selectedGrade) => { if (!profile || !profile.assignedSubjects) return []; return profile.assignedSubjects.filter(sub => sub.startsWith(selectedGrade + ':')).map(sub => sub.split(': ')[1]); };
  const handleLogout = async () => { await fetch('https://ace-academy-backend-e0pi.onrender.com/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) }); localStorage.clear(); navigate('/'); };
  const handleNav = (tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); };
  const openChangePasswordModal = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangePasswordOpen(true);
    setIsProfileMenuOpen(false);
  };
  const closeChangePasswordModal = () => {
    setIsChangePasswordOpen(false);
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  };
  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword, confirmNewPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password change failed');
      setPasswordSuccess(data.message || 'Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      setPasswordError(error.message || 'Unable to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleFileUpload = async (e) => { e.preventDefault(); const formData = new FormData(); formData.append('title', uploadTitle); formData.append('batch', uploadBatch); formData.append('uploadedBy', username); formData.append('pdfFile', uploadFile); try { setUploadStatus('Uploading...'); const response = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/notes/upload', { method: 'POST', body: formData }); if (response.ok) { setUploadStatus('✅ Uploaded!'); fetchData(username); } else setUploadStatus('❌ Failed'); } catch (error) { setUploadStatus('❌ Error'); } };
  const handleTimetableSubmit = async (e) => { e.preventDefault(); try { const response = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/timetable/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: timeDate, batch: timeBatch, subject: timeSubject, topic: timeTopic, postedBy: username }) }); if (response.ok) { setTimeStatus('✅ Published!'); fetchData(username); } else setTimeStatus('❌ Failed'); } catch (error) { setTimeStatus('❌ Error'); } };
  const handleAttSubmit = async (e) => { e.preventDefault(); try { setAttStatusMsg('Saving...'); await fetch('https://ace-academy-backend-e0pi.onrender.com/api/records/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: attDate, records: attRecords, markedBy: username }) }); setAttStatusMsg('✅ Saved Successfully!'); } catch (err) { setAttStatusMsg('❌ Error'); } };
  const handleMarksSubmit = async (e) => { e.preventDefault(); const finalizedRecords = markRecords.map(rec => { const percent = (Number(rec.marksObtained) / Number(maxMarks)) * 100; let grade = 'Fail'; if (percent >= 75) grade = 'Excellent'; else if (percent >= 50) grade = 'Good'; else if (percent > 33) grade = 'Needs Improvement'; return { username: rec.username, marksObtained: rec.marksObtained, grade: grade }; }); try { setMarkStatusMsg('Saving...'); await fetch('https://ace-academy-backend-e0pi.onrender.com/api/records/marks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: markDate, subject: markSubject, topic: markTopic, maxMarks: Number(maxMarks), records: finalizedRecords }) }); setMarkStatusMsg('✅ Saved Successfully!'); } catch (err) { setMarkStatusMsg('❌ Error'); } };
  const handleViewProgress = async (studentName) => { setViewStudent(studentName); if(studentName) { const res = await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/records/stats/${studentName}`); setStudentStats(await res.json()); } else setStudentStats(null); };
  const deleteNote = async (id) => { if (window.confirm("Delete note?")) { await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/notes/${id}`, { method: 'DELETE' }); fetchData(username); } };
  const deleteSchedule = async (id) => { if (window.confirm("Delete schedule?")) { await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/timetable/${id}`, { method: 'DELETE' }); fetchData(username); } };

  if (!profile) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#4F46E5', fontSize: '1.5rem', fontWeight: 'bold' }}>Loading Teacher Portal...</div>;

  return (
    <div className="dashboard-container">
      {/* --- NEW MOBILE HEADER --- */}
      <div className="mobile-header">
        <div className="mobile-logo-text"><span className="logo-text">ACE</span> INSTITUTE</div>
        <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>☰</button>
      </div>

      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="ACE Logo" className="sidebar-logo-img" />
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleNav('dashboard')}><span className="nav-icon">🏠</span> Teacher Portal</button>
          <button className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => handleNav('timetable')}><span className="nav-icon">📅</span> Update Timetable</button>
          <button className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => handleNav('notes')}><span className="nav-icon">📁</span> Upload Notes</button>
          <button className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => handleNav('attendance')}><span className="nav-icon">✅</span> Daily Attendance</button>
          <button className={`nav-item ${activeTab === 'marks' ? 'active' : ''}`} onClick={() => handleNav('marks')}><span className="nav-icon">📝</span> Exam Marks</button>
          <button className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => handleNav('progress')}><span className="nav-icon">📊</span> Student Progress</button>
          <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => handleNav('chat')}><span className="nav-icon">💬</span> Live Chat</button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="dashboard-header"><div><h1>Faculty Dashboard</h1><p className="date-display">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div><div className="profile-menu-wrap"><button className="user-profile-badge" style={{ border: 'none', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setIsProfileMenuOpen((prev) => !prev); }}><div className="avatar">{profile.name ? profile.name.charAt(0).toUpperCase() : 'T'}</div><span>{profile.name || username}</span></button>{isProfileMenuOpen && (<div className="profile-menu-popover"><button className="modern-btn btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={openChangePasswordModal}>Change Password</button><button className="modern-btn btn-danger" style={{ width: '100%' }} onClick={handleLogout}>Secure Logout</button></div>)}</div></header>

        {activeTab === 'dashboard' && (<div className="welcome-banner"><div className="banner-content"><h2>Welcome, <span className="highlight-name">{profile.name || username}</span></h2><p className="banner-subtitle">Here is an overview of your teaching assignments.</p><div className="profile-grid"><div className="profile-card"><span className="label">Assigned Classes</span><span className="value">{profile.assignedGrades?.join(', ') || 'None'}</span></div><div className="profile-card"><span className="label">Assigned Subjects</span><span className="value" style={{fontSize: '0.9rem'}}>{profile.assignedSubjects?.join(', ') || 'None'}</span></div></div></div></div>)}
        {activeTab === 'timetable' && (<div className="modern-widget tab-fade-in" style={{ maxWidth: '800px' }}><h3 className="widget-title">Update Timetable</h3><form className="quick-form" onSubmit={handleTimetableSubmit}><div className="form-row"><input type="date" className="modern-input" value={timeDate} onChange={(e) => setTimeDate(e.target.value)} required /><select className="modern-select" value={timeBatch} onChange={(e) => { setTimeBatch(e.target.value); setTimeSubject(''); }} required><option value="">Select Grade</option>{profile.assignedGrades.map(g => <option key={g} value={g}>{g}</option>)}</select><select className="modern-select" value={timeSubject} onChange={(e) => setTimeSubject(e.target.value)} required disabled={!timeBatch}><option value="">Select Subject</option>{getAllowedSubjects(timeBatch).map(s => <option key={s} value={s}>{s}</option>)}</select></div><input type="text" className="modern-input" placeholder="Topic to be covered..." value={timeTopic} onChange={(e) => setTimeTopic(e.target.value)} required /><button type="submit" className="modern-btn btn-primary">Publish Schedule</button></form>{timeStatus && <p style={{color: 'green', marginTop: '10px'}}>{timeStatus}</p>}<h3 className="widget-title" style={{marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px'}}>Recently Published</h3><div className="grid-list">{allSchedules.filter(s => profile.assignedGrades.includes(s.batch)).map(s => (<div key={s._id} className="modern-card"><div className="card-details"><h4>{s.subject} <span style={{color: '#888', fontSize: '0.85rem'}}>({s.batch})</span></h4><p>{s.topic} • {new Date(s.date).toLocaleDateString('en-GB')}</p></div><button onClick={()=>deleteSchedule(s._id)} className="modern-btn btn-danger">Delete</button></div>))}</div></div>)}
        {activeTab === 'notes' && (<div className="modern-widget tab-fade-in" style={{ maxWidth: '800px' }}><h3 className="widget-title">Upload Class Notes</h3><form className="quick-form" onSubmit={handleFileUpload}><div className="form-row"><input type="text" className="modern-input" placeholder="Document Title..." value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required /><select className="modern-select" value={uploadBatch} onChange={(e) => setUploadBatch(e.target.value)} required><option value="">Select Grade</option>{profile.assignedGrades.map(g => <option key={g} value={g}>{g}</option>)}</select></div><input type="file" className="modern-input" style={{padding: '8px'}} onChange={(e) => setUploadFile(e.target.files[0])} required /><button type="submit" className="modern-btn btn-primary">Upload Document</button></form>{uploadStatus && <p style={{color: 'green', marginTop: '10px'}}>{uploadStatus}</p>}<h3 className="widget-title" style={{marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px'}}>Your Uploaded Notes</h3><div className="grid-list">{allNotes.filter(n => profile.assignedGrades.includes(n.batch)).map(n => (<div key={n._id} className="modern-card"><div className="card-details"><h4>{n.title} <span style={{color: '#888', fontSize: '0.85rem'}}>({n.batch})</span></h4></div><button onClick={()=>deleteNote(n._id)} className="modern-btn btn-danger">Delete</button></div>))}</div></div>)}
        {activeTab === 'attendance' && (<div className="modern-widget tab-fade-in" style={{ maxWidth: '700px' }}><h3 className="widget-title">Mark Daily Attendance</h3><form className="quick-form" onSubmit={handleAttSubmit}><input type="date" className="modern-input" value={attDate} onChange={(e) => setAttDate(e.target.value)} required /><div className="dynamic-box" style={{ maxHeight: '400px', overflowY: 'auto' }}>{attRecords.length === 0 ? <p style={{fontSize:'0.9rem', color:'#888'}}>No students to display.</p> : null}{attRecords.map((rec, idx) => (<div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}><span style={{ fontWeight: '600', color: '#1e293b' }}>{rec.username} <span style={{color: '#94a3b8', fontWeight: 'normal'}}>({rec.grade})</span></span>{rec.markedBy && rec.markedBy !== username ? (<span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>Marked by {rec.markedBy}</span>) : (<select className="modern-select" value={rec.status} onChange={(e) => { const newRecs = [...attRecords]; newRecs[idx].status = e.target.value; setAttRecords(newRecs); }} style={{ width: '140px', padding: '8px' }}><option value="Present">Present</option><option value="Absent">Absent</option><option value="Not my student">Not my student</option></select>)}</div>))}</div><button type="submit" className="modern-btn btn-success" style={{marginTop:'10px'}}>Save All Attendance</button></form>{attStatusMsg && <p style={{fontWeight:'bold', marginTop:'15px', color: '#10b981'}}>{attStatusMsg}</p>}</div>)}
        {activeTab === 'marks' && (<div className="modern-widget tab-fade-in" style={{ maxWidth: '800px' }}><h3 className="widget-title">Publish Exam Results</h3><form className="quick-form" onSubmit={handleMarksSubmit}><div className="form-row"><input type="date" className="modern-input" value={markDate} onChange={(e) => setMarkDate(e.target.value)} required /><input type="text" className="modern-input" placeholder="Subject (e.g. Math)" value={markSubject} onChange={(e) => setMarkSubject(e.target.value)} required /></div><div className="form-row"><input type="text" className="modern-input" placeholder="Topic/Chapter" value={markTopic} onChange={(e) => setMarkTopic(e.target.value)} required /><input type="number" className="modern-input" placeholder="Maximum Marks" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} required /></div><div className="dynamic-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px', maxHeight: '300px', overflowY: 'auto' }}>{markRecords.length === 0 ? <p style={{gridColumn: '1 / -1'}}>No students assigned.</p> : null}{markRecords.map((rec, idx) => (<div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>{rec.username} <span style={{fontWeight: 'normal', color: '#94a3b8'}}>({rec.grade})</span></span><input type="number" className="modern-input" placeholder="Score" value={rec.marksObtained} onChange={(e) => { const newRecs = [...markRecords]; newRecs[idx].marksObtained = e.target.value; setMarkRecords(newRecs); }} style={{ width: '80px', padding: '8px' }} required /></div>))}</div><button type="submit" className="modern-btn btn-primary" style={{marginTop: '10px'}}>Publish to Students</button></form>{markStatusMsg && <p style={{color: '#10b981', fontWeight: 'bold', marginTop: '10px'}}>{markStatusMsg}</p>}</div>)}
        {activeTab === 'progress' && (<div className="tab-fade-in" style={{ maxWidth: '850px' }}><div className="modern-widget" style={{ marginBottom: '20px' }}><h3 className="widget-title">Student Performance Lookup</h3><select className="modern-select" onChange={(e) => handleViewProgress(e.target.value)}><option value="">-- Choose an Assigned Student --</option>{students.map((s, idx) => <option key={idx} value={s.username}>{s.username} ({s.grade})</option>)}</select></div>{studentStats && (<div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}><div className="modern-widget" style={{ flex: 1, minWidth: '300px' }}><h3 className="widget-title">Attendance Profile</h3><div style={{ fontSize: '2.5rem', fontWeight: '800', color: studentStats.attendance.percent >= 75 ? '#10b981' : '#ef4444' }}>{studentStats.attendance.percent}%</div><p style={{ color: '#64748b' }}>Overall Attendance Rate</p></div><div className="modern-widget" style={{ flex: 2, minWidth: '300px' }}><h3 className="widget-title">Recent Exam Grades</h3><div className="grid-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>{studentStats.marks.length === 0 ? <p className="empty-state">No exams graded yet.</p> : null}{studentStats.marks.map((m, idx) => (<div key={idx} className="modern-card" style={{ padding: '15px' }}><div><h4 style={{ margin: '0 0 5px 0' }}>{m.subject} <span style={{fontWeight: 'normal', color: '#64748b'}}>({m.topic})</span></h4></div><div style={{ textAlign: 'right' }}><div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{m.marksObtained}/{m.maxMarks}</div><div className={`status-badge ${m.grade === 'Fail' || m.grade === 'Needs Improvement' ? 'badge-danger' : 'badge-success'}`} style={{display: 'inline-block', marginTop: '5px'}}>{m.grade}</div></div></div>))}</div></div></div>)}</div>)}

        {/* --- MODERN WHATSAPP CHAT UI --- */}
        {activeTab === 'chat' && (
          <div className="tab-fade-in" style={{ maxWidth: '1000px' }}>
            <div className="whatsapp-container">
              <div className="chat-sidebar-panel">
                <div className="chat-sidebar-header">Conversations</div>
                <div className="contact-list">
                  {chatContacts.map(contact => (
                    <div key={contact.id} className={`chat-contact ${chatRoom === contact.room ? 'active' : ''}`} onClick={() => selectChat(contact)}>
                      <div className="contact-avatar-circle" style={{ backgroundColor: contact.type === 'group' ? '#f59e0b' : contact.type === 'admin' ? '#ef4444' : '#4F46E5' }}>{contact.initial}</div>
                      <div className="contact-info"><span className="contact-name">{contact.name}</span><span className="contact-type">{contact.type}</span></div>
                      {unreadRooms[contact.room] && <div className="unread-dot"></div>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="chat-main-panel">
                {selectedChatObj ? (
                  <>
                    <div className="chat-active-header">
                      <div className="contact-avatar-circle" style={{ width: '35px', height: '35px', marginRight: '10px', fontSize: '1rem', backgroundColor: selectedChatObj.type === 'group' ? '#f59e0b' : selectedChatObj.type === 'admin' ? '#ef4444' : '#4F46E5' }}>{selectedChatObj.initial}</div>
                      {selectedChatObj.name}
                    </div>
                    <div className="chat-messages">
                      {messageList.map((msg, index) => (
                        msg.type === 'system' ? (
                          <div key={index} className="system-message">{msg.message} • {msg.time} ({msg.date})</div>
                        ) : (
                          <div key={index} className={`chat-bubble ${msg.author === username ? 'sent' : 'received'}`}>
                            <div className="chat-meta">{msg.author}</div>
                            <div className="chat-text">{msg.message}</div>
                            <div className="chat-time-date">{msg.time} • {msg.date}</div>
                          </div>
                        )
                      ))}
                    </div>
                    <div className="chat-input-area">
                      <input type="text" placeholder="Type a message..." className="modern-input" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyPress={(e) => { e.key === 'Enter' && sendMessage() }} />
                      <button onClick={markAsRead} className="modern-btn btn-success" style={{ padding: '0 15px' }}>✓ Mark Read</button>
                      <button onClick={sendMessage} className="modern-btn btn-primary" style={{ padding: '0 25px' }}>Send</button>
                    </div>
                  </>
                ) : (
                  <div className="empty-chat-state"></div>
                )}
              </div>
            </div>
          </div>
        )}
        {isChangePasswordOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3000,
              padding: '16px',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2)',
                padding: '20px',
              }}
            >
              <h3 style={{ margin: '0 0 14px 0', color: '#1e293b' }}>Change Password</h3>
              <form className="quick-form" onSubmit={handlePasswordChangeSubmit}>
                <input type="password" className="modern-input" placeholder="Current Password" value={passwordForm.currentPassword} onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)} required />
                <input type="password" className="modern-input" placeholder="New Password" value={passwordForm.newPassword} onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)} required />
                <input type="password" className="modern-input" placeholder="Confirm New Password" value={passwordForm.confirmNewPassword} onChange={(e) => handlePasswordFieldChange('confirmNewPassword', e.target.value)} required />
                {passwordError ? <p style={{ margin: 0, color: '#dc2626', fontWeight: 600 }}>{passwordError}</p> : null}
                {passwordSuccess ? <p style={{ margin: 0, color: '#16a34a', fontWeight: 600 }}>{passwordSuccess}</p> : null}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="modern-btn" style={{ background: '#e2e8f0', color: '#1f2937' }} onClick={closeChangePasswordModal}>
                    Cancel
                  </button>
                  <button type="submit" className="modern-btn btn-primary" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default TeacherDashboard;
