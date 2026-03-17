import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './AdminDashboard.css';

const socket = io.connect('https://ace-academy-backend-e0pi.onrender.com');

const gradeOptions = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const juniorGrades = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];

const isAllSubjectsGrade = (grade) => juniorGrades.includes(grade);

const getTeacherSubjectOptions = (grade) => {
  if (isAllSubjectsGrade(grade)) return [];
  if (grade === 'Grade 9' || grade === 'Grade 10') return ['Math', 'Science'];
  if (grade === 'Grade 11' || grade === 'Grade 12') return ['Account', 'Eco'];
  return [];
};

const getStudentSubjectsForGrade = (grade) => {
  if (isAllSubjectsGrade(grade)) return ['All Subjects'];
  if (grade === 'Grade 9' || grade === 'Grade 10') return ['Math', 'Science'];
  if (grade === 'Grade 11' || grade === 'Grade 12') return ['Account', 'Eco'];
  return [];
};

const formatSubjectAssignments = (subjects) => subjects.map((subject) => `${subject}`);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [allNotes, setAllNotes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [tName, setTName] = useState('');
  const [tUsername, setTUsername] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tGrades, setTGrades] = useState([]);
  const [tSubjects, setTSubjects] = useState({});
  const [tMsg, setTMsg] = useState('');

  const [sName, setSName] = useState('');
  const [sUsername, setSUsername] = useState('');
  const [sPassword, setSPassword] = useState('');
  const [sGrade, setSGrade] = useState('');
  const [sStartDate, setSStartDate] = useState('');
  const [sSubjects, setSSubjects] = useState([]);
  const [sMsg, setSMsg] = useState('');

  const [chatContacts, setChatContacts] = useState([]);
  const [selectedChatObj, setSelectedChatObj] = useState(null);
  const [chatRoom, setChatRoom] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [unreadRooms, setUnreadRooms] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    const safeRole = storedRole ? String(storedRole).toLowerCase().trim() : '';

    if (!token || safeRole !== 'admin') {
      localStorage.clear();
      navigate('/');
      return;
    }

    setAdminName(storedUsername);
    socket.emit('register_user', storedUsername);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const notesRes = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/notes');
      setAllNotes(await notesRes.json());

      const usersRes = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/admin/all-users');
      const users = await usersRes.json();
      setAllUsers(users);

      const contacts = users.map((user) => ({
        id: user.username,
        name: user.name || user.username,
        room: `admin_${user.username}`,
        type: user.role,
        initial: (user.name || user.username).charAt(0).toUpperCase(),
      }));
      setChatContacts(contacts);
      contacts.forEach((contact) => socket.emit('join_chat', contact.room));
    } catch (err) {
      console.error(err);
    }
  };

  const selectChat = (contact) => {
    setSelectedChatObj(contact);
    setChatRoom(contact.room);
    setUnreadRooms((prev) => ({ ...prev, [contact.room]: false }));
    fetch(`https://ace-academy-backend-e0pi.onrender.com/api/chat/${contact.room}`)
      .then((res) => res.json())
      .then((data) => setMessageList(data));
  };

  useEffect(() => {
    const handler = (data) => {
      if (data.room === chatRoom) setMessageList((list) => [...list, data]);
      if (data.author !== adminName && data.type !== 'system' && data.room !== chatRoom) {
        setUnreadRooms((prev) => ({ ...prev, [data.room]: true }));
      }
    };
    const receiptHandler = (data) => {
      if (data.room === chatRoom) setMessageList((list) => [...list, data]);
    };
    socket.on('receive_message', handler);
    socket.on('read_receipt', receiptHandler);
    return () => {
      socket.off('receive_message', handler);
      socket.off('read_receipt', receiptHandler);
    };
  }, [chatRoom, adminName]);

  const sendMessage = async () => {
    if (currentMessage === '' || chatRoom === '') return;
    const now = new Date();
    const msgData = {
      room: chatRoom,
      author: adminName,
      message: currentMessage,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('en-GB'),
      type: 'text',
    };
    await socket.emit('send_message', msgData);
    setMessageList((list) => [...list, msgData]);
    setCurrentMessage('');
  };

  const markAsRead = () => {
    if (!chatRoom) return;
    setUnreadRooms((prev) => ({ ...prev, [chatRoom]: false }));
    socket.emit('mark_read', { room: chatRoom, reader: 'Admin' });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleNav = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const toggleGrade = (grade) => {
    setTGrades((prev) => {
      if (prev.includes(grade)) {
        const nextGrades = prev.filter((currentGrade) => currentGrade !== grade);
        const nextSubjects = { ...tSubjects };
        delete nextSubjects[grade];
        setTSubjects(nextSubjects);
        return nextGrades;
      }

      if (isAllSubjectsGrade(grade)) {
        setTSubjects((current) => ({ ...current, [grade]: ['All Subjects'] }));
      }

      return [...prev, grade];
    });
  };

  const toggleTeacherSubject = (grade, subject) => {
    setTSubjects((prev) => {
      const currentSubjects = prev[grade] || [];
      if (currentSubjects.includes(subject)) {
        return { ...prev, [grade]: currentSubjects.filter((item) => item !== subject) };
      }
      return { ...prev, [grade]: [...currentSubjects, subject] };
    });
  };

  const handleStudentGradeChange = (e) => {
    const nextGrade = e.target.value;
    setSGrade(nextGrade);
    setSSubjects(getStudentSubjectsForGrade(nextGrade));
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      setTMsg('Creating...');
      const flatSubjects = [];

      for (const grade of tGrades) {
        const selectedSubjects = tSubjects[grade] || [];
        if (!isAllSubjectsGrade(grade) && selectedSubjects.length === 0) {
          setTMsg(`Please choose at least one subject for ${grade}.`);
          return;
        }
        selectedSubjects.forEach((subject) => flatSubjects.push(`${grade}: ${subject}`));
      }

      const res = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tName,
          username: tUsername,
          password: tPassword,
          role: 'teacher',
          assignedGrades: tGrades,
          assignedSubjects: flatSubjects,
        }),
      });

      if (res.ok) {
        setTMsg('Teacher created successfully!');
        setTName('');
        setTUsername('');
        setTPassword('');
        setTGrades([]);
        setTSubjects({});
        fetchData();
      } else {
        setTMsg('Failed to create teacher.');
      }
    } catch (err) {
      setTMsg('Server error while creating teacher.');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setSMsg('Creating...');
      const subjectsForGrade = getStudentSubjectsForGrade(sGrade);
      const flatStudentSubjects = subjectsForGrade.map((subject) => `${sGrade}: ${subject}`);

      const res = await fetch('https://ace-academy-backend-e0pi.onrender.com/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sName,
          username: sUsername,
          password: sPassword,
          role: 'student',
          grade: sGrade,
          startDate: sStartDate,
          assignedSubjects: flatStudentSubjects,
        }),
      });

      if (res.ok) {
        setSMsg('Student created successfully!');
        setSName('');
        setSUsername('');
        setSPassword('');
        setSGrade('');
        setSStartDate('');
        setSSubjects([]);
        fetchData();
      } else {
        setSMsg('Failed to create student.');
      }
    } catch (err) {
      setSMsg('Server error while creating student.');
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm('Admin: Permanently delete this note?')) return;
    await fetch(`https://ace-academy-backend-e0pi.onrender.com/api/notes/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const teacherGradesWithManualSubjects = tGrades.filter((grade) => !isAllSubjectsGrade(grade));
  const autoStudentSubjectsLabel = formatSubjectAssignments(getStudentSubjectsForGrade(sGrade)).join(', ');

  return (
    <div className="dashboard-container">
      <div className="mobile-header">
        <div className="mobile-logo-text"><span className="logo-text">ACE</span> Admin</div>
        <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>Menu</button>
      </div>

      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo"><span className="logo-text">ACE</span> Admin</div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleNav('dashboard')}><span className="nav-icon">Home</span> Admin Portal</button>
          <button className={`nav-item ${activeTab === 'addTeacher' ? 'active' : ''}`} onClick={() => handleNav('addTeacher')}><span className="nav-icon">Add</span> Add Teacher</button>
          <button className={`nav-item ${activeTab === 'addStudent' ? 'active' : ''}`} onClick={() => handleNav('addStudent')}><span className="nav-icon">Add</span> Add Student</button>
          <button className={`nav-item ${activeTab === 'manageNotes' ? 'active' : ''}`} onClick={() => handleNav('manageNotes')}><span className="nav-icon">Docs</span> Manage Content</button>
          <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => handleNav('chat')}><span className="nav-icon">Chat</span> Universal Chat</button>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>System Logout</button>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1>Administration Center</h1>
            <p className="date-display">System Status: Secure & Online</p>
          </div>
          <div className="user-profile-badge"><div className="avatar" style={{ backgroundColor: '#e74c3c' }}>A</div><span>{adminName}</span></div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="welcome-banner">
            <div className="banner-content">
              <h2>Master Control, <span className="highlight-name">{adminName}</span></h2>
              <p className="banner-subtitle">You have full oversight of the ACE platform.</p>
              <div className="profile-grid">
                <div className="profile-card"><span className="label">Active Users</span><span className="value">{allUsers.length} System Accounts</span></div>
                <div className="profile-card"><span className="label">Uploaded Materials</span><span className="value">{allNotes.length} Document Files</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'addTeacher' && (
          <div className="modern-widget tab-fade-in" style={{ maxWidth: '850px' }}>
            <h3 className="widget-title">Register New Faculty</h3>
            <form className="quick-form" onSubmit={handleAddTeacher}>
              <div className="form-row">
                <input type="text" className="modern-input" placeholder="Full Name" value={tName} onChange={(e) => setTName(e.target.value)} required />
                <input type="text" className="modern-input" placeholder="Teacher ID (Username)" value={tUsername} onChange={(e) => setTUsername(e.target.value)} required />
                <input type="text" className="modern-input" placeholder="Password" value={tPassword} onChange={(e) => setTPassword(e.target.value)} required />
              </div>

              <div className="dynamic-box">
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '10px' }}>Assign Grades to Teach:</p>
                <div className="checkbox-group">
                  {gradeOptions.map((grade) => (
                    <label key={grade} className="checkbox-label">
                      <input type="checkbox" checked={tGrades.includes(grade)} onChange={() => toggleGrade(grade)} /> {grade}
                    </label>
                  ))}
                </div>
              </div>

              {tGrades.some((grade) => isAllSubjectsGrade(grade)) && (
                <div className="dynamic-box">
                  <p style={{ margin: 0, color: 'var(--text-dark)', fontWeight: '600' }}>
                    Grades 3 to 8 are auto-assigned as <strong>All Subjects</strong>.
                  </p>
                </div>
              )}

              {teacherGradesWithManualSubjects.length > 0 && (
                <div className="dynamic-box">
                  <p style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '15px' }}>Assign Specific Subjects:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {teacherGradesWithManualSubjects.map((grade) => {
                      const availableSubjects = getTeacherSubjectOptions(grade);
                      const currentSelected = tSubjects[grade] || [];
                      return (
                        <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 'bold', width: '100px', color: 'var(--primary)' }}>{grade}</span>
                          {availableSubjects.map((subject) => (
                            <label key={subject} className="checkbox-label">
                              <input type="checkbox" checked={currentSelected.includes(subject)} onChange={() => toggleTeacherSubject(grade, subject)} /> {subject}
                            </label>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button type="submit" className="modern-btn btn-primary" style={{ marginTop: '10px' }}>Create Teacher Account</button>
              {tMsg && <p style={{ marginTop: '15px', fontWeight: 'bold', color: tMsg.toLowerCase().includes('success') ? 'var(--success)' : 'var(--danger)' }}>{tMsg}</p>}
            </form>
          </div>
        )}

        {activeTab === 'addStudent' && (
          <div className="modern-widget tab-fade-in" style={{ maxWidth: '850px' }}>
            <h3 className="widget-title">Register New Student</h3>
            <form className="quick-form" onSubmit={handleAddStudent}>
              <div className="form-row">
                <input type="text" className="modern-input" placeholder="Full Name" value={sName} onChange={(e) => setSName(e.target.value)} required />
                <input type="text" className="modern-input" placeholder="Student ID (Username)" value={sUsername} onChange={(e) => setSUsername(e.target.value)} required />
                <input type="text" className="modern-input" placeholder="Password" value={sPassword} onChange={(e) => setSPassword(e.target.value)} required />
              </div>
              <div className="form-row">
                <select className="modern-select" value={sGrade} onChange={handleStudentGradeChange} required>
                  <option value="">Select Enrolled Grade</option>
                  {gradeOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                </select>
                <input type="date" className="modern-input" value={sStartDate} onChange={(e) => setSStartDate(e.target.value)} title="Start Date" required />
              </div>

              {sGrade && (
                <div className="dynamic-box">
                  <p style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '10px' }}>Subjects will be assigned automatically for {sGrade}:</p>
                  <p style={{ margin: 0, color: 'var(--text-dark)', fontWeight: '600' }}>{autoStudentSubjectsLabel || 'No subjects available'}</p>
                </div>
              )}

              <button type="submit" className="modern-btn btn-primary" style={{ marginTop: '10px' }}>Create Student Account</button>
              {sMsg && <p style={{ marginTop: '15px', fontWeight: 'bold', color: sMsg.toLowerCase().includes('success') ? 'var(--success)' : 'var(--danger)' }}>{sMsg}</p>}
            </form>
          </div>
        )}

        {activeTab === 'manageNotes' && (
          <div className="modern-widget tab-fade-in" style={{ maxWidth: '850px' }}>
            <h3 className="widget-title">Content Moderation Override</h3>
            <div className="grid-list">
              {allNotes.length === 0 ? <p className="empty-state">System storage is currently empty.</p> : null}
              {allNotes.map((note) => (
                <div key={note._id} className="modern-card">
                  <div className="card-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>Doc</div>
                  <div className="card-details" style={{ flex: 1 }}>
                    <h4>{note.title} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>({note.batch})</span></h4>
                    <p>Uploaded by User ID: <strong>{note.uploadedBy}</strong></p>
                  </div>
                  <button onClick={() => deleteNote(note._id)} className="modern-btn btn-danger">Delete File</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="tab-fade-in" style={{ maxWidth: '1000px' }}>
            <div className="whatsapp-container">
              <div className="chat-sidebar-panel">
                <div className="chat-sidebar-header">System Directory</div>
                <div className="contact-list">
                  {chatContacts.map((contact) => (
                    <div key={contact.id} className={`chat-contact ${chatRoom === contact.room ? 'active' : ''}`} onClick={() => selectChat(contact)}>
                      <div className="contact-avatar-circle" style={{ backgroundColor: contact.type === 'teacher' ? '#4F46E5' : '#10b981' }}>
                        {contact.initial}
                      </div>
                      <div className="contact-info">
                        <span className="contact-name">{contact.name}</span>
                        <span className="contact-type">{contact.type}</span>
                      </div>
                      {unreadRooms[contact.room] && <div className="unread-dot" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="chat-main-panel">
                {selectedChatObj ? (
                  <>
                    <div className="chat-active-header">
                      <div className="contact-avatar-circle" style={{ width: '35px', height: '35px', marginRight: '10px', fontSize: '1rem', backgroundColor: selectedChatObj.type === 'teacher' ? '#4F46E5' : '#10b981' }}>
                        {selectedChatObj.initial}
                      </div>
                      {selectedChatObj.name}
                    </div>

                    <div className="chat-messages">
                      {messageList.map((msg, index) => (
                        msg.type === 'system' ? (
                          <div key={index} className="system-message">{msg.message} | {msg.time} ({msg.date})</div>
                        ) : (
                          <div key={index} className={`chat-bubble ${msg.author === adminName ? 'sent' : 'received'}`}>
                            <div className="chat-meta">{msg.author}</div>
                            <div className="chat-text">{msg.message}</div>
                            <div className="chat-time-date">{msg.time} | {msg.date}</div>
                          </div>
                        )
                      ))}
                    </div>

                    <div className="chat-input-area">
                      <input type="text" placeholder="Type a dispatch message..." className="modern-input" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') sendMessage(); }} />
                      <button onClick={markAsRead} className="modern-btn btn-success" style={{ padding: '0 15px' }}>Mark Read</button>
                      <button onClick={sendMessage} className="modern-btn btn-primary" style={{ padding: '0 25px' }}>Send</button>
                    </div>
                  </>
                ) : (
                  <div className="empty-chat-state">Establish a secure connection with any user in the network.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
