import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  GraduationCap,
  UserCircle,
  Clock,
  Star,
  ArrowRight,
  BookOpen,
  Video,
  Users,
  CheckCircle,
  Zap,
  ShieldCheck,
  Award,
  BookCheck,
  MessageCircle,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import AceLogo from "../components/AceLogo";
import "./Home.css";

const features = [
  {
    icon: <BookOpen className="feature-icon" />,
    tone: "yellow",
    title: "Strong Concept Building",
    description:
      "We focus on the 'why' before the 'how', ensuring students master the fundamentals of every subject.",
  },
  {
    icon: <Video className="feature-icon" />,
    tone: "red",
    title: "Free Revision Videos",
    description:
      "Access our library of high-quality revision videos anytime to reinforce your learning at your own pace.",
  },
  {
    icon: <ShieldCheck className="feature-icon" />,
    tone: "sky",
    title: "Exam Oriented Notes",
    description:
      "Curated notes designed specifically to help students excel in board and competitive examinations.",
  },
  {
    icon: <Zap className="feature-icon" />,
    tone: "lilac",
    title: "Regular Assessments",
    description:
      "Weekly tests and mock exams to track progress and identify areas for improvement.",
  },
  {
    icon: <Users className="feature-icon" />,
    tone: "mint",
    title: "Doubt Solving Sessions",
    description:
      "One-on-one sessions with expert faculty to clear all academic hurdles.",
  },
  {
    icon: <CheckCircle className="feature-icon" />,
    tone: "yellow",
    title: "Personalized Attention",
    description:
      "Small batch sizes ensure every student gets the focus they deserve from our educators.",
  },
];

const ticker = [
  "3rd - 8th All Subjects",
  "9th - 10th Maths & Science",
  "11th - 12th Accounts & Economics",
  "Admissions Open for 2026-27",
  "Doubt Solving Sessions",
  "Exam Oriented Notes",
];

export default function Home() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const anchors = document.querySelectorAll('a[href^="#"]');
    const onClick = (e) => {
      e.preventDefault();
      const href = e.currentTarget.getAttribute("href");
      if (!href) return;
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    };
    anchors.forEach((a) => a.addEventListener("click", onClick));
    return () => anchors.forEach((a) => a.removeEventListener("click", onClick));
  }, []);

  // The two hero cards are "dealt" onto the table on load.
  const deal = (i) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 160, rotate: i === 0 ? -24 : 24, scale: 0.85 },
          animate: { opacity: 1, y: 0, rotate: i === 0 ? -3 : 2.5, scale: 1 },
          transition: { type: "spring", stiffness: 120, damping: 15, delay: 0.75 + i * 0.15 },
        };

  return (
    <div className="home-page">
      <nav className="top-nav">
        <Link to="/" className="brand" aria-label="ACE Institute home">
          <AceLogo size={34} />
        </Link>

        <div className="menu desktop-only">
          <Link to="/" className="menu-link">Home</Link>

          <div className="menu-dropdown">
            <button className="menu-link dropdown-btn">
              Courses <ChevronDown size={16} />
            </button>
            <div className="courses-panel">
              <div className="courses-highlight">
                <GraduationCap className="courses-highlight-icon" />
                <h4>Excellence in Education</h4>
                <p>Empowering students with strong concept building.</p>
              </div>
              <div className="courses-list">
                <div className="course-item-mini">
                  <h5>3rd - 8th All Subjects</h5>
                  <p>Foundation building.</p>
                </div>
                <div className="course-item-mini">
                  <h5>9th - 10th Maths & Science</h5>
                  <p>In-depth coverage of Topics.</p>
                </div>
                <div className="course-item-mini">
                  <h5>11th - 12th Accounts and Economics</h5>
                  <p>Specialized notes.</p>
                </div>
              </div>
            </div>
          </div>

          <a href="#director" className="menu-link">About</a>
        </div>

        <div className="login-dropdown">
          <button className="login-btn">
            Login <ChevronDown size={16} />
          </button>
          <div className="login-panel">
            <Link to="/login?role=student" className="login-option">
              <GraduationCap size={16} /> Student Login
            </Link>
            <Link to="/login?role=teacher" className="login-option">
              <UserCircle size={16} /> Teacher Login
            </Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <motion.div
            className="hero-badge"
            initial={reduceMotion ? false : { scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.55 }}
          >
            Admissions Open for 2026-27
          </motion.div>
          <h1>
            Welcome to <span className="hero-word">Excellence</span>
          </h1>
          <p>
            Empowering Students for a Brighter Future through strong concept building,
            regular assessments, and dedicated mentorship.
          </p>
        </div>

        <div className="hero-cards">
          <motion.div className="hero-card card-yellow" {...deal(0)}>
            <span className="card-index" aria-hidden="true">A<br />♠</span>
            <Clock className="card-watermark" />
            <div className="card-topline">Active Now</div>
            <h3>Ongoing Courses</h3>
            <div className="hero-course-list">
              <div className="hero-course-item">3rd - 8th All Subjects</div>
              <div className="hero-course-item">9th - 10th Maths & Science</div>
              <div className="hero-course-item">11th - 12th Accounts & Economics</div>
            </div>
            <ul className="hero-points">
              <li>Strong Concept Building</li>
              <li>Exam Oriented Notes</li>
              <li>Regular Assessments</li>
              <li>Doubt Solving Sessions</li>
              <li>Personalized Attention</li>
            </ul>
          </motion.div>

          <motion.div className="hero-card card-red" {...deal(1)}>
            <span className="card-index" aria-hidden="true">A<br />♥</span>
            <Star className="card-watermark" />
            <div className="card-topline">Launching Soon</div>
            <h3>New Courses Coming Soon</h3>
            <p className="launch-copy">
              Upcoming batches will open shortly with structured learning plans
              and personal counselling support for every student.
            </p>
            <ul className="hero-points">
              <li>New session batches for all levels</li>
              <li>Early guidance before batch selection</li>
              <li>Small batch size and focused mentoring</li>
            </ul>
            <div className="launch-tags">
              <span>Admissions Opening Soon</span>
              <span>Counselling Open</span>
            </div>
          </motion.div>
        </div>

        <Link to="/courses" className="explore-more">
          Explore More Courses
          <ArrowRight size={18} />
        </Link>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i}>{t}<i>✦</i></span>
          ))}
        </div>
      </div>

      <section className="why-section">
        <div className="section-head">
          <h2>
            Why Gen-Z & Alpha Students Choose ACE INSTITUTE?
          </h2>
          <p>
            We combine traditional teaching excellence with modern learning methods
            to provide a comprehensive educational experience.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className={`feature-card tone-${f.tone}`}
              initial={reduceMotion ? false : { opacity: 0, y: 40, rotate: i % 2 ? 3 : -3 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 140, damping: 16, delay: (i % 3) * 0.08 }}
            >
              <div className="feature-icon-wrap">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="director" className="director-section">
        <div className="director-image-col">
          <div className="director-stack">
            <div className="photo-card-back" />
            <img src="/owner.jpg" alt="Muskan Kalra - Director" />
            <div className="verified-badge">
              <div><Award size={20} /></div>
              <div>
                <small>Verified Expert</small>
                <strong>NET Qualifier</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="director-content">
          <div className="director-tag">Meet the Director</div>
          <h2>Muskan Kalra</h2>
          <div className="chips">
            <span>M.Com</span>
            <span>B.Com</span>
            <span>B.Ed</span>
          </div>
          <p className="quote">
            "At ACE INSTITUTE, we don't just teach subjects; we build foundations.
            Our mission is to provide every student with the clarity they need to excel in their academic journey."
          </p>
          <div className="director-points">
            <div>
              <BookCheck size={22} />
              <div>
                <h4>Concept Building</h4>
                <p>Deep conceptual clarity for all subjects.</p>
              </div>
            </div>
            <div>
              <MessageCircle size={22} />
              <div>
                <h4>Doubt Solving</h4>
                <p>Dedicated sessions for every query.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <AceLogo size={44} tone="paper" />
            <p>
              Leading the way in quality education with a focus on concept building,
              personalized attention, and academic excellence.
            </p>
            <a href="https://wa.me/918053515171" target="_blank" rel="noreferrer" className="whatsapp">
              <MessageCircle size={18} /> WhatsApp Us
            </a>
          </div>

          <div>
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/login?role=student">Student Login</Link>
            <Link to="/login?role=teacher">Teacher Login</Link>
          </div>

          <div>
            <h4>Contact Us</h4>
            <p><MapPin size={16} /> 23A, T.P Scheme - 9, Behind Shopping Complex, Rewari</p>
            <p><Phone size={16} /> 8053515171</p>
            <p><Mail size={16} /> mathswithmuskankalra@gmail.com</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 ACE Institute. All rights reserved.</p>
          <div>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
