import { useCallback, useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, KeyRound, Trash2, RefreshCw } from 'lucide-react';
import './AdminLogs.css';

const API = 'https://ace-academy-backend-e0pi.onrender.com/api/admin/logs';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
const fmtDuration = (ms) => {
  if (ms == null) return '—';
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'under 1 min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
};

const isLogin = (a) => a === 'Logged In';
const isLogout = (a) => a === 'Logged Out' || a.startsWith('Auto-Logged Out');

const actionInfo = (action) => {
  if (isLogin(action)) return { cls: 'lg-in', icon: <LogIn size={14} />, label: 'Logged in' };
  if (action.startsWith('Auto-Logged Out')) return { cls: 'lg-auto', icon: <LogOut size={14} />, label: 'Logged out (tab closed)' };
  if (isLogout(action)) return { cls: 'lg-out', icon: <LogOut size={14} />, label: 'Logged out' };
  if (action === 'Password Changed') return { cls: 'lg-pass', icon: <KeyRound size={14} />, label: 'Changed password' };
  return { cls: 'lg-other', icon: null, label: action };
};

// Pair each login with the next logout for the same user (logs arrive newest first).
const buildSessions = (logs) => {
  const ordered = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const open = {};
  const sessions = [];
  ordered.forEach((l) => {
    if (isLogin(l.action)) {
      if (open[l.username]) sessions.push({ ...open[l.username], out: null });
      open[l.username] = { username: l.username, role: l.role, in: l.timestamp };
    } else if (isLogout(l.action) && open[l.username]) {
      sessions.push({ ...open[l.username], out: l.timestamp, auto: l.action.startsWith('Auto') });
      delete open[l.username];
    }
  });
  Object.values(open).forEach((s) => sessions.push({ ...s, out: null, active: true }));
  return sessions.sort((a, b) => new Date(b.in) - new Date(a.in));
};

export default function AdminLogs({ users = [] }) {
  const [role, setRole] = useState('');
  const [person, setPerson] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [view, setView] = useState('sessions');

  const nameOf = useCallback((u) => users.find((x) => x.username === u)?.name || u, [users]);
  const people = useMemo(
    () => users.filter((u) => (role ? u.role === role : u.role === 'student' || u.role === 'teacher'))
      .sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username)),
    [users, role],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMsg('');
    try {
      const params = new URLSearchParams();
      if (person) params.set('username', person);
      else if (role) params.set('role', role);
      const res = await fetch(`${API}?${params}`);
      if (!res.ok) throw new Error();
      setLogs(await res.json());
    } catch {
      setMsg('Could not load logs. Please try again.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [person, role]);

  useEffect(() => { load(); }, [load]);

  const sessions = useMemo(() => buildSessions(logs), [logs]);
  const lastIn = logs.find((l) => isLogin(l.action));
  const lastOut = logs.find((l) => isLogout(l.action));

  const deleteOne = async (id) => {
    if (!window.confirm('Delete this log entry?')) return;
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (res.ok) setLogs((prev) => prev.filter((l) => l._id !== id));
    else setMsg('Could not delete the log entry.');
  };

  const deleteShown = async () => {
    const target = person ? `all logs of ${nameOf(person)}` : role ? `all ${role} logs` : 'ALL logs of every user';
    if (!window.confirm(`Permanently delete ${target}? This cannot be undone.`)) return;
    const body = person ? { username: person } : role ? { role } : { all: true };
    const res = await fetch(API, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setMsg(data.message || 'Logs deleted.'); setLogs([]); }
    else setMsg(data.message || 'Could not delete logs.');
  };

  return (
    <div className="modern-widget tab-fade-in lg-widget">
      <div className="lg-head">
        <h3 className="widget-title">Login Logs</h3>
        <div className="lg-head-actions">
          <button type="button" className="modern-btn btn-ghost" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</button>
          <button type="button" className="modern-btn btn-danger lg-del-all" onClick={deleteShown} disabled={logs.length === 0}><Trash2 size={16} /> Delete {person ? 'these' : 'shown'} logs</button>
        </div>
      </div>

      <div className="lg-filters">
        <div className="lg-roles" role="group" aria-label="Filter by role">
          {[['', 'Everyone'], ['student', 'Students'], ['teacher', 'Teachers']].map(([val, label]) => (
            <button key={label} type="button" className={`lg-pill ${role === val ? 'on' : ''}`} onClick={() => { setRole(val); setPerson(''); }}>{label}</button>
          ))}
        </div>
        <select className="modern-select" value={person} onChange={(e) => setPerson(e.target.value)}>
          <option value="">{role ? `All ${role}s` : 'All students and teachers'}</option>
          {people.map((u) => (
            <option key={u.username} value={u.username}>
              {(u.name || u.username)} ({u.role === 'student' ? u.grade || 'student' : 'teacher'})
            </option>
          ))}
        </select>
      </div>

      {person && (
        <div className="lg-summary">
          <div><span>Person</span><strong>{nameOf(person)}</strong><em>{person}</em></div>
          <div><span>Last login</span><strong>{lastIn ? fmtTime(lastIn.timestamp) : '—'}</strong><em>{lastIn ? fmtDate(lastIn.timestamp) : 'Never'}</em></div>
          <div><span>Last logout</span><strong>{lastOut ? fmtTime(lastOut.timestamp) : '—'}</strong><em>{lastOut ? fmtDate(lastOut.timestamp) : 'Never'}</em></div>
          <div><span>Total logins</span><strong>{logs.filter((l) => isLogin(l.action)).length}</strong><em>{sessions.some((s) => s.active) ? 'Online now' : 'Offline'}</em></div>
        </div>
      )}

      <div className="lg-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={view === 'sessions'} className={view === 'sessions' ? 'on' : ''} onClick={() => setView('sessions')}>Sessions (login → logout)</button>
        <button type="button" role="tab" aria-selected={view === 'all'} className={view === 'all' ? 'on' : ''} onClick={() => setView('all')}>Full log ({logs.length})</button>
      </div>

      {msg && <p className="form-msg is-error lg-msg">{msg}</p>}
      {loading && <div className="lg-loading"><div className="dash-spinner" /> Loading logs…</div>}

      {!loading && logs.length === 0 && !msg && <p className="empty-state">No logs found for this selection.</p>}

      {!loading && logs.length > 0 && view === 'sessions' && (
        <div className="lg-table-wrap">
          <table className="lg-table">
            <thead><tr><th>Name</th><th>Role</th><th>Date</th><th>Logged in</th><th>Logged out</th><th>Duration</th></tr></thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={`${s.username}-${s.in}-${i}`}>
                  <td><div className="lg-name">{nameOf(s.username)}</div><div className="lg-sub">{s.username}</div></td>
                  <td className="lg-cap">{s.role}</td>
                  <td>{fmtDate(s.in)}</td>
                  <td className="lg-num">{fmtTime(s.in)}</td>
                  <td className="lg-num">
                    {s.out ? <>{fmtTime(s.out)}{s.auto && <span className="lg-note"> (tab closed)</span>}</> : s.active ? <span className="lg-badge lg-in">Online now</span> : <span className="lg-sub">No logout recorded</span>}
                  </td>
                  <td className="lg-num">{s.out ? fmtDuration(new Date(s.out) - new Date(s.in)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && logs.length > 0 && view === 'all' && (
        <div className="lg-table-wrap">
          <table className="lg-table">
            <thead><tr><th>Name</th><th>Role</th><th>Activity</th><th>Date</th><th>Time</th><th aria-label="Delete" /></tr></thead>
            <tbody>
              {logs.map((l) => {
                const a = actionInfo(l.action);
                return (
                  <tr key={l._id}>
                    <td><div className="lg-name">{nameOf(l.username)}</div><div className="lg-sub">{l.username}</div></td>
                    <td className="lg-cap">{l.role}</td>
                    <td><span className={`lg-badge ${a.cls}`}>{a.icon}{a.label}</span></td>
                    <td>{fmtDate(l.timestamp)}</td>
                    <td className="lg-num">{fmtTime(l.timestamp)}</td>
                    <td><button type="button" className="lg-trash" onClick={() => deleteOne(l._id)} aria-label="Delete this log entry" title="Delete"><Trash2 size={16} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
