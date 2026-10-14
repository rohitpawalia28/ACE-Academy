import { useMemo, useState } from 'react';
import { Download, ArrowUpDown } from 'lucide-react';
import { downloadXlsx } from '../utils/xlsx';
import './ClassProgress.css';

const API = 'https://ace-academy-backend-e0pi.onrender.com/api/records/stats';

const statusFor = (row) => {
  if (row.totalClasses === 0 && row.exams === 0) return 'No records yet';
  if (row.totalClasses > 0 && row.attendance < 75) return 'Low attendance';
  if (row.exams > 0 && row.average < 40) return 'Needs support';
  return 'On track';
};

const buildRow = (student, stats) => {
  const marks = Array.isArray(stats?.marks) ? stats.marks : [];
  const obtained = marks.reduce((s, m) => s + (Number(m.marksObtained) || 0), 0);
  const max = marks.reduce((s, m) => s + (Number(m.maxMarks) || 0), 0);
  const latest = marks[0];
  const row = {
    username: student.username,
    name: student.name || student.username,
    grade: student.grade,
    attendance: stats?.attendance?.percent ?? 0,
    present: stats?.attendance?.present ?? 0,
    totalClasses: stats?.attendance?.total ?? 0,
    exams: marks.length,
    obtained,
    max,
    average: max > 0 ? Math.round((obtained / max) * 1000) / 10 : 0,
    latestExam: latest ? `${latest.subject} (${latest.topic})` : '',
    latestScore: latest ? `${latest.marksObtained}/${latest.maxMarks}` : '',
    latestGrade: latest ? latest.grade : '',
    failed: !!stats?.failed,
  };
  row.status = row.failed ? 'Could not load' : statusFor(row);
  return row;
};

const COLUMNS = [
  { key: 'name', label: 'Student' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'present', label: 'Classes attended' },
  { key: 'exams', label: 'Exams' },
  { key: 'average', label: 'Average score' },
  { key: 'latestExam', label: 'Latest exam' },
  { key: 'status', label: 'Status' },
];

const STATUS_CLASS = {
  'On track': 'cp-ok',
  'Low attendance': 'cp-warn',
  'Needs support': 'cp-bad',
  'No records yet': 'cp-none',
  'Could not load': 'cp-none',
};

export default function ClassProgress({ students = [], grades = [] }) {
  const [grade, setGrade] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 1 });

  const loadClass = async (g) => {
    setGrade(g);
    setRows([]);
    setError('');
    if (!g) return;
    const inClass = students.filter((s) => s.grade === g);
    if (inClass.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        inClass.map(async (s) => {
          try {
            const res = await fetch(`${API}/${encodeURIComponent(s.username)}`);
            if (!res.ok) throw new Error();
            return buildRow(s, await res.json());
          } catch {
            return buildRow(s, { failed: true });
          }
        })
      );
      setRows(results);
      if (results.some((r) => r.failed)) setError('Some students could not be loaded. Their rows are marked "Could not load".');
    } finally {
      setLoading(false);
    }
  };

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * sort.dir;
      return String(x).localeCompare(String(y)) * sort.dir;
    });
    return out;
  }, [rows, sort]);

  const summary = useMemo(() => {
    const withAtt = rows.filter((r) => r.totalClasses > 0);
    const withExams = rows.filter((r) => r.exams > 0);
    const avg = (list, key) => (list.length ? Math.round(list.reduce((s, r) => s + r[key], 0) / list.length) : null);
    return {
      count: rows.length,
      attendance: avg(withAtt, 'attendance'),
      score: avg(withExams, 'average'),
      attention: rows.filter((r) => r.status === 'Low attendance' || r.status === 'Needs support').length,
    };
  }, [rows]);

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));

  const handleDownload = () => {
    const headers = [
      'S.No', 'Student Name', 'Username', 'Class', 'Attendance %', 'Classes Attended', 'Total Classes',
      'Exams Taken', 'Marks Obtained', 'Max Marks', 'Average Score %', 'Latest Exam', 'Latest Score', 'Latest Grade', 'Status',
    ];
    const data = sorted.map((r, i) => [
      i + 1, r.name, r.username, r.grade, r.attendance, r.present, r.totalClasses,
      r.exams, r.obtained, r.max, r.average, r.latestExam, r.latestScore, r.latestGrade, r.status,
    ]);
    const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    downloadXlsx(
      `Class ${grade} progress ${today}.xlsx`,
      `Class ${grade}`,
      headers,
      data,
      [6, 24, 16, 8, 13, 16, 13, 12, 15, 11, 16, 28, 13, 16, 16]
    );
  };

  const classSize = grade ? students.filter((s) => s.grade === grade).length : 0;

  return (
    <div className="modern-widget cp-widget">
      <div className="cp-head">
        <h3 className="widget-title">Class Progress</h3>
        {rows.length > 0 && (
          <button type="button" className="modern-btn btn-success cp-download" onClick={handleDownload}>
            <Download size={18} /> Download Excel
          </button>
        )}
      </div>

      <select className="modern-select" value={grade} onChange={(e) => loadClass(e.target.value)}>
        <option value="">-- Choose a Class --</option>
        {grades.map((g) => (
          <option key={g} value={g}>Class {g}</option>
        ))}
      </select>

      {loading && (
        <div className="cp-loading">
          <div className="dash-spinner" />
          <span>Loading progress for {classSize} students…</span>
        </div>
      )}

      {!loading && grade && classSize === 0 && (
        <p className="empty-state cp-empty">No students are enrolled in Class {grade} yet.</p>
      )}

      {error && <p className="form-msg is-error cp-error">{error}</p>}

      {!loading && rows.length > 0 && (
        <>
          <div className="cp-summary">
            <div><span>Students</span><strong>{summary.count}</strong></div>
            <div><span>Avg attendance</span><strong>{summary.attendance === null ? '—' : `${summary.attendance}%`}</strong></div>
            <div><span>Avg score</span><strong>{summary.score === null ? '—' : `${summary.score}%`}</strong></div>
            <div className={summary.attention ? 'cp-sum-alert' : ''}><span>Need attention</span><strong>{summary.attention}</strong></div>
          </div>

          <div className="cp-table-wrap">
            <table className="cp-table">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c.key} aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" onClick={() => toggleSort(c.key)}>
                        {c.label} <ArrowUpDown size={13} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.username}>
                    <td>
                      <div className="cp-name">{r.name}</div>
                      <div className="cp-sub">{r.username}</div>
                    </td>
                    <td>
                      <div className="cp-att">
                        <span className={r.attendance >= 75 ? 'cp-num-ok' : r.totalClasses ? 'cp-num-bad' : ''}>
                          {r.totalClasses ? `${r.attendance}%` : '—'}
                        </span>
                        {r.totalClasses > 0 && (
                          <span className="cp-bar"><i style={{ width: `${r.attendance}%` }} /></span>
                        )}
                      </div>
                    </td>
                    <td className="cp-num">{r.present} / {r.totalClasses}</td>
                    <td className="cp-num">{r.exams}</td>
                    <td className="cp-num">{r.exams ? `${r.average}%` : '—'}</td>
                    <td>
                      {r.latestExam ? (
                        <>
                          <div>{r.latestExam}</div>
                          <div className="cp-sub">{r.latestScore} · {r.latestGrade}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td><span className={`cp-status ${STATUS_CLASS[r.status]}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="cp-note">Status: below 75% attendance is "Low attendance"; an average score below 40% is "Needs support".</p>
        </>
      )}
    </div>
  );
}
