import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, BadgePercent, BookOpenCheck } from "lucide-react";
import "./Courses.css";

const enrollmentMessage =
  "Online enrollment has not started yet. Please contact 8053515171 for manual enrollment.";

const courses = [
  {
    title: "Classes 3 to 5",
    monthly: "INR 800 / month",
    sixMonth: "INR 4500 / 6 months",
    standard: "Regular total: INR 4800",
    discount: "You save INR 300",
    paymentNote: "6-month plan available with month-by-month payment.",
    chips: ["All Core Subjects", "Foundation Focus"],
  },
  {
    title: "Classes 5 to 8",
    monthly: "INR 1000 / month",
    sixMonth: "INR 5500 / 6 months",
    standard: "Regular total: INR 6000",
    discount: "You save INR 500",
    paymentNote: "6-month plan available with month-by-month payment.",
    chips: ["All Core Subjects", "Concept Strengthening"],
  },
  {
    title: "Classes 9 to 10",
    monthly: "INR 800 / subject / month",
    monthlyCombo: "INR 1600 / month for 2 subjects",
    sixMonth: "INR 9000 / 6 months (for 2 subjects)",
    standard: "Regular total for 2 subjects: INR 9600",
    discount: "You save INR 600",
    paymentNote: "6-month combo plan available with month-by-month payment.",
    chips: ["Math + Science Track", "Board Exam Oriented"],
  },
  {
    title: "Classes 11 to 12",
    monthly: "INR 1200 / subject / month",
    monthlyCombo: "INR 2400 / month for 2 subjects",
    sixMonth: "INR 13500 / 6 months (for 2 subjects)",
    standard: "Regular total for 2 subjects: INR 14400",
    discount: "You save INR 900",
    paymentNote: "6-month combo plan available with month-by-month payment.",
    chips: ["Commerce Focus", "Exam + Practical Prep"],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function Courses() {
  const handleEnroll = () => window.alert(enrollmentMessage);

  return (
    <div className="courses-page">
      <div className="courses-bg-glow courses-bg-glow-left" />
      <div className="courses-bg-glow courses-bg-glow-right" />

      <header className="courses-header">
        <Link to="/" className="courses-back-link">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        <div className="courses-brand">ACE Academy</div>
      </header>

      <main className="courses-main">
        <motion.section
          className="courses-hero"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <p className="courses-pill">
            <Sparkles size={14} />
            Explore More Courses
          </p>
          <h1>Course Fees & Enrollment Plans</h1>
          <p>
            Choose a monthly plan or a 6-month plan with discount benefits.
            For 6-month plans, payment can still be done month-by-month.
          </p>
        </motion.section>

        <motion.section
          className="courses-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {courses.map((course) => (
            <motion.article key={course.title} className="course-card" variants={cardVariants}>
              <div className="course-card-top">
                <h2>{course.title}</h2>
                <div className="discount-badge">
                  <BadgePercent size={15} />
                  <span>{course.discount}</span>
                </div>
              </div>

              <div className="course-pricing">
                <p className="price-primary">{course.monthly}</p>
                {course.monthlyCombo ? (
                  <p className="price-secondary">{course.monthlyCombo}</p>
                ) : null}
                <p className="price-six">{course.sixMonth}</p>
                <p className="price-standard">{course.standard}</p>
              </div>

              <div className="course-note">
                <BookOpenCheck size={16} />
                <span>{course.paymentNote}</span>
              </div>

              <div className="course-chips">
                {course.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>

              <motion.button
                type="button"
                className="enroll-btn"
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEnroll}
              >
                Enroll Now
              </motion.button>
            </motion.article>
          ))}
        </motion.section>
      </main>
    </div>
  );
}
