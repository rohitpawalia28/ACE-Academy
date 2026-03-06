import React, { useEffect } from "react";
import { Link } from "react-router-dom";
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
import "./Home.css";

const features = [
  {
    icon: <BookOpen className="feature-icon ace-yellow" />,
    title: "Strong Concept Building",
    description:
      "We focus on the 'why' before the 'how', ensuring students master the fundamentals of every subject.",
  },
  {
    icon: <Video className="feature-icon ace-red" />,
    title: "Free Revision Videos",
    description:
      "Access our library of high-quality revision videos anytime to reinforce your learning at your own pace.",
  },
  {
    icon: <ShieldCheck className="feature-icon blue" />,
    title: "Exam Oriented Notes",
    description:
      "Curated notes designed specifically to help students excel in board and competitive examinations.",
  },
  {
    icon: <Zap className="feature-icon amber" />,
    title: "Regular Assessments",
    description:
      "Weekly tests and mock exams to track progress and identify areas for improvement.",
  },
  {
    icon: <Users className="feature-icon green" />,
    title: "Doubt Solving Sessions",
    description:
      "One-on-one sessions with expert faculty to clear all academic hurdles.",
  },
  {
    icon: <CheckCircle className="feature-icon purple" />,
    title: "Personalized Attention",
    description:
      "Small batch sizes ensure every student gets the focus they deserve from our educators.",
  },
];

export default function Home() {
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

  return (
    <div className="home-page">
      <nav className="top-nav">
        <Link to="/" className="brand">
          <img src="/ace.png" alt="ACE Academy Logo" className="brand-logo" />
          <span className="brand-text">
            <span className="brand-main">ACE ACADEMY</span>
            <span className="brand-sub">Achievers' Centre of Education</span>
          </span>
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
                  <h5>9th - 10th Maths & Science</h5>
                  <p>In-depth coverage of Physics.</p>
                </div>
                <div className="course-item-mini">
                  <h5>3rd - 8th All Subjects</h5>
                  <p>Foundation building.</p>
                </div>
                <div className="course-item-mini">
                  <h5>11th - 12th Commerce</h5>
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
        <div className="hero-content">
          <div className="hero-badge">Admissions Open for 2026-27</div>
          <h1>
            Welcome to <span>Excellence</span>
          </h1>
          <p>
            Empowering Students for a Brighter Future through strong concept building,
            regular assessments, and dedicated mentorship.
          </p>

          <div className="hero-cards">
            <div className="hero-card">
              <Clock className="card-watermark ace-yellow" />
              <div className="card-topline ace-yellow-line">Active Now</div>
              <h3>Ongoing Courses</h3>
              <h4>9th - 10th Maths & Science</h4>
              <p>Status: Deep diving into Trigonometry & Physics</p>
              <div className="duration-btns">
                <button>1 Month</button>
                <button>6 Months</button>
                <button>1 Year</button>
              </div>
            </div>

            <div className="hero-card">
              <Star className="card-watermark ace-red" />
              <div className="card-topline ace-red-line">Launching Soon</div>
              <h3>Upcoming Courses</h3>
              <div className="upcoming-row">
                <h4>3rd to 8th All Subjects</h4>
                <span>Next Mon</span>
              </div>
              <p>Concept building + Regular Tests</p>
              <div className="upcoming-row">
                <h4>11th - 12th Commerce</h4>
                <span>1st Next Month</span>
              </div>
              <p>Free Exam Oriented Notes</p>
            </div>
          </div>

          <div className="explore-more">
            <small>Explore More</small>
            <ArrowRight size={18} />
          </div>
        </div>
      </section>

      <section className="why-section">
        <div className="section-head">
          <h2>
            Why <span>Gen-Z</span> Students Choose ACE Academy?
          </h2>
          <p>
            We combine traditional teaching excellence with modern learning methods
            to provide a comprehensive educational experience.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon-wrap">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="director" className="director-section">
        <div className="director-image-col">
          <div className="director-stack">
            <div className="bg-yellow" />
            <div className="bg-red" />
            <img
              src="/owner.jpg"
              alt="Muskan Kalra - Director"
            />
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
            "At ACE Academy, we don't just teach subjects; we build foundations.
            Our mission is to provide every student with the clarity they need to excel in their academic journey."
          </p>
          <div className="director-points">
            <div>
              <BookCheck size={20} />
              <div>
                <h4>Concept Building</h4>
                <p>Deep conceptual clarity for all subjects.</p>
              </div>
            </div>
            <div>
              <MessageCircle size={20} />
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
            <h3>ACE ACADEMY</h3>
            <small>Achievers' Centre of Education</small>
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
            <p><Mail size={16} /> contact@aceacademy.com</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 ACE Academy. All rights reserved.</p>
          <div>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
