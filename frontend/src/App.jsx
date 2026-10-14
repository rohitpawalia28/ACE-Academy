import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Home from './pages/Home';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Courses from './pages/Courses';
import { AceMark } from './components/AceLogo';

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

const wipe = { duration: 0.6, ease: [0.76, 0, 0.24, 1] };

// Every page change: a yellow "card" sweeps in, the ace flips, then it lifts away.
const PageTransition = ({ children }) => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div className="page-shell">{children}</div>;

  return (
    <>
      <motion.div
        className="page-shell"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.5, ease: 'easeOut' } }}
        exit={{ opacity: 1 }}
      >
        {children}
      </motion.div>

      {/* reveals the new page */}
      <motion.div
        className="deal-curtain"
        style={{ originY: 0 }}
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0, transition: { ...wipe, delay: 0.15 } }}
        exit={{ scaleY: 0 }}
      >
        <motion.div
          initial={{ rotateY: 0, scale: 1 }}
          animate={{ rotateY: 180, scale: 0.6, opacity: 0, transition: { duration: 0.4 } }}
        >
          <AceMark size={88} />
        </motion.div>
      </motion.div>

      {/* covers the old page */}
      <motion.div
        className="deal-curtain"
        style={{ originY: 1 }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1, transition: wipe }}
      />
    </>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><RootRoute /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/courses" element={<PageTransition><Courses /></PageTransition>} />
        <Route path="/student-dashboard" element={<PageTransition><StudentDashboard /></PageTransition>} />
        <Route path="/teacher-dashboard" element={<PageTransition><TeacherDashboard /></PageTransition>} />
        <Route path="/admin-dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
