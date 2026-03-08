import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';

const getDashboardPath = () => {
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('role') || '').toLowerCase().trim();

  if (!token) return null;
  if (role === 'student') return '/student-dashboard';
  if (role === 'teacher') return '/teacher-dashboard';
  if (role === 'admin') return '/admin-dashboard';
  return null;
};

const RootRoute = () => {
  const dashboardPath = getDashboardPath();
  if (dashboardPath) return <Navigate to={dashboardPath} replace />;
  return <Home />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
