import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './StudentDashboard.css';

const socket = io.connect('https://ace-academy-backend-e0pi.onrender.com');

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

  const [notesList, setNotesList] = useState([]);
  const [schedule, setSchedule] = useState([]); 
  const [stats, setStats] = useState({ attendance: { percent: 0, total: 0, present: 0, history: [] }, marks: [] });
  
  const [teachers, setTeachers] = useState([]);
  const [admins, setAdmins] = useState([]); 

  const [chatContacts, setChatContacts] = useState([]);
  const [selectedChatObj, setSelectedChatObj] = useState(null);
  const [chatRoom, setChatRoom] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [unreadRooms, setUnreadRooms] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('username');
    if (!token || localStorage.getItem('role') !== 'student') navigate('/login?role=student'); 
    else {
      setUsername(storedName);
      socket.emit('register_user', storedName);
      fetchAllData(storedName);
    }
  }, [navigate]);

  const fetchAllData = async (user) => {
    try {
      const profRes = await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/records/profile/${user}`);
      const profData = await profRes.json();
      setProfile(profData);
      const statsRes = await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/records/stats/${user}`);
      setStats(await statsRes.json());
      
      if (profData.grade) {
        const notesRes = await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/notes/${profData.grade}`);
        setNotesList(await notesRes.json());
        const scheduleRes = await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/timetable/${profData.grade}`);
        setSchedule(await scheduleRes.json());
      }

      const teachersRes = await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/records/teachers?student=${user}`);
      const tData = await teachersRes.json();
      setTeachers(tData);

      const adminRes = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/records/admins');
      const aData = await adminRes.json();
      setAdmins(aData);

      const contacts = [];
      if (profData.grade) contacts.push({ id: `group_${profData.grade}`, name: `${profData.grade} Class Group`, room: `Group_${profData.grade}`, type: 'group', initial: 'G' });
      tData.forEach(t => contacts.push({ id: t.username, name: t.name || t.username, room: `${user}_${t.username}`, type: 'teacher', initial: (t.name || t.username).charAt(0).toUpperCase() }));
      aData.forEach(a => contacts.push({ id: a.username, name: a.name || a.username, room: `admin_${user}`, type: 'admin', initial: 'A' }));
      
      setChatContacts(contacts);
      contacts.forEach(c => socket.emit('join_chat', c.room));

    } catch (error) { console.error("Error fetching data:", error); }
  };

  const selectChat = (contact) => {
    setSelectedChatObj(contact);
    setChatRoom(contact.room);
    setUnreadRooms(prev => ({ ...prev, [contact.room]: false }));
    fetch(`https://ace-academy-backend-e0pi.onrender.com/api/chat/${contact.room}`).then(res => res.json()).then(data => setMessageList(data));
  };

  useEffect(() => {
    const handler = (data) => {
      if (data.room === chatRoom) setMessageList((list) => [...list, data]);
      if (data.author !== username && data.type !== 'system') {
        if (data.room !== chatRoom) setUnreadRooms(prev => ({ ...prev, [data.room]: true }));
      }
    };
    const receiptHandler = (data) => { if (data.room === chatRoom) setMessageList((list) => [...list, data]); };
    socket.on('receive_message', handler);
    socket.on('read_receipt', receiptHandler);
    return () => { socket.off('receive_message', handler); socket.off('read_receipt', receiptHandler); };
  }, [chatRoom, username]);

  const sendMessage = async () => {
    if (currentMessage !== '' && chatRoom !== '') {
      const now = new Date();
      const msgData = { room: chatRoom, author: username, message: currentMessage, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: now.toLocaleDateString('en-GB'), type: 'text' };
      await socket.emit('send_message', msgData);
      setMessageList((list) => [...list, msgData]);
      setCurrentMessage(''); 
    }
  };

  const markAsRead = () => {
    if (chatRoom) {
      setUnreadRooms(prev => ({ ...prev, [chatRoom]: false }));
      socket.emit('mark_read', { room: chatRoom, reader: profile.name || username });
    }
  };

  const handleLogout = async () => { await fetch('https://ace-academy-backend-e0pi.onrender.com/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) }); localStorage.clear(); navigate('/'); };
  const handleNav = (tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); };

  if (!profile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #fffef7 0%, #f8fafc 100%)',
          padding: '20px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            background: '#ffffff',
            boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
            padding: '26px 22px',
            maxWidth: '360px',
            width: '100%',
          }}
        >
          <img
            src="/ace-logo.png"
            alt="ACE Academy"
            style={{ width: '78px', height: '78px', objectFit: 'contain', marginBottom: '12px' }}
          />
          <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Preparing Your Dashboard</h3>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontWeight: 500 }}>
            Loading classes, notes, attendance, and chat.
          </p>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '3px solid #fde68a',
              borderTopColor: '#c10000',
              margin: '0 auto',
              animation: 'dashboardSpin 0.8s linear infinite',
            }}
          />
        </div>
      </div>
    );
  }

  const attPercent = stats?.attendance?.percent !== undefined ? stats.attendance.percent : 0;
  let attStatusText = "Caution, you need to attend all classes."; let attStatusColor = "#ef4444"; 
  if (attPercent >= 90) { attStatusText = "Excellent"; attStatusColor = "#10b981"; } 
  else if (attPercent >= 80) { attStatusText = "Good"; attStatusColor = "#3b82f6"; } 
  else if (attPercent >= 75) { attStatusText = "Critical"; attStatusColor = "#f59e0b"; }

  return (
    <div className="dashboard-container">
      <div className="mobile-header">
        <div className="mobile-logo-text"><span className="logo-text">ACE</span> Academy</div>
        <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>☰</button>
      </div>

      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="ACE Logo" className="sidebar-logo-img" />
          <div>
            <span className="logo-text">ACE</span> Academy
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleNav('dashboard')}><span className="nav-icon">🏠</span> Home / Profile</button>
          <button className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => handleNav('attendance')}><span className="nav-icon">📅</span> Class Attendance</button>
          <button className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => handleNav('timetable')}><span className="nav-icon">⏰</span> My Classes</button>
          <button className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => handleNav('notes')}><span className="nav-icon">📁</span> Class Notes</button>
          <button className={`nav-item ${activeTab === 'marks' ? 'active' : ''}`} onClick={() => handleNav('marks')}><span className="nav-icon">📝</span> Exam Marks</button>
          <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => handleNav('chat')}><span className="nav-icon">💬</span> Support & Chat</button>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>🚪 Secure Logout</button>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div><h1>Student Portal</h1><p className="date-display">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
          <div className="user-profile-badge"><div className="avatar">{profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}</div><span>{profile.name || username}</span></div>
        </header>

        <div className="content-wrapper">
          {activeTab === 'dashboard' && (<div className="welcome-banner"><div className="banner-content"><h2>Welcome back, <span className="highlight-name">{profile.name || username}</span>!</h2><p className="banner-subtitle">Here is an overview of your academic profile.</p><div className="profile-grid"><div className="profile-card"><span className="label">Class/Grade</span><span className="value">{profile.grade || 'Not Assigned'}</span></div><div className="profile-card"><span className="label">Timing</span><span className="value">{profile.timing || 'TBD'}</span></div><div className="profile-card"><span className="label">Fee Structure</span><span className="value">{profile.feeStructure || 'Pending'}</span></div><div className="profile-card"><span className="label">Started On</span><span className="value">{profile.startDate || 'Unknown'}</span></div></div></div></div>)}

          {activeTab === 'attendance' && (
            <div className="tab-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px', maxWidth: '850px' }}>
              <div className="modern-widget text-center" style={{ borderTop: `5px solid ${attStatusColor}` }}>
                <h3 className="widget-title">Overall Attendance</h3>
                <div className="circle-container"><div className="progress-circle" style={{ background: `conic-gradient(${attStatusColor} ${attPercent}%, #e2e8f0 ${attPercent}%)` }}><div className="circle-inner"><span className="percentage-text" style={{ color: attStatusColor }}>{attPercent}%</span></div></div></div>
                <div className="status-container"><h4 style={{ color: attStatusColor, fontSize: '1.4rem', margin: '15px 0 5px 0' }}>{attStatusText}</h4><p className="status-subtext">You have attended <strong>{stats.attendance?.present || 0}</strong> out of <strong>{stats.attendance?.total || 0}</strong> total classes.</p></div>
              </div>
              
              {/* --- BEAUTIFUL NEW ATTENDANCE HISTORY WIDGET --- */}
              <div className="modern-widget">
                <h3 className="widget-title">Day-by-Day History</h3>
                <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '10px' }}>
                  {stats.attendance.history && stats.attendance.history.length === 0 ? (
                    <div className="empty-state">No attendance records yet.</div>
                  ) : null}
                  {stats.attendance.history && stats.attendance.history.map((att, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: '#1E293B' }}>
                        <div style={{ backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📅</div>
                        <span>{new Date(att.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <span className={`status-badge ${att.status === 'Present' ? 'badge-success' : 'badge-danger'}`} style={{ minWidth: '90px', textAlign: 'center', padding: '6px 12px' }}>
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timetable' && (<div className="modern-widget tab-fade-in" style={{ maxWidth: '850px' }}><h3 className="widget-title">My Classes (Timetable)</h3><div className="grid-list">{schedule.length === 0 ? <div className="empty-state">No upcoming classes scheduled.</div> : null}{schedule.map((cls, index) => (<div key={index} className="modern-card hover-lift"><div className="card-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>⏰</div><div className="card-details"><h4>{cls.subject} - {cls.topic}</h4><p>Scheduled: {new Date(cls.date).toLocaleDateString('en-GB')}</p></div></div>))}</div></div>)}

          {activeTab === 'notes' && (<div className="modern-widget tab-fade-in" style={{ maxWidth: '850px' }}><h3 className="widget-title">Class Notes & Resources</h3><div className="grid-list">{notesList.length === 0 ? <div className="empty-state">No notes uploaded yet.</div> : null}{notesList.map((note, index) => (<div key={index} className="modern-card hover-lift"><div className="card-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>📁</div><div className="card-details" style={{ flex: 1 }}><h4>{note.title}</h4><p>Uploaded by: {note.uploadedBy}</p></div><a href={`https://ace-academy-backend-e0pi.onrender.com/${note.filePath.replace('\\', '/')}`} target="_blank" rel="noreferrer" className="modern-btn btn-primary">Download</a></div>))}</div></div>)}

          {activeTab === 'marks' && (<div className="modern-widget tab-fade-in" style={{ maxWidth: '850px' }}><h3 className="widget-title">Exam Marks History</h3><div className="grid-list">{stats.marks && stats.marks.length === 0 ? <div className="empty-state">No exams graded yet.</div> : null}{stats.marks && stats.marks.map((mark, index) => (<div key={index} className="modern-card hover-lift"><div className="card-icon" style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}>📝</div><div className="card-details" style={{ flex: 1 }}><h4>{mark.subject} ({mark.topic})</h4><p>Date: {new Date(mark.date).toLocaleDateString()}</p></div><div className="marks-display"><div className="marks-score">{mark.marksObtained} / {mark.maxMarks}</div><div className={`status-badge ${mark.grade === 'Fail' ? 'badge-danger' : 'badge-success'}`}>{mark.grade}</div></div></div>))}</div></div>)}

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
        </div>
      </main>
    </div>
  );
};
export default StudentDashboard;
