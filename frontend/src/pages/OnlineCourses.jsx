import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api.js';
import CourseSection from '../components/CourseSection.jsx';
import RegistrationModal from '../components/RegistrationModal.jsx';

export default function OnlineCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState(null);
  const location = useLocation();

  useEffect(() => {
    api
      .getCourses()
      .then(setCourses)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && location.hash) {
      const id = location.hash.slice(1);
      const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150);
      return () => clearTimeout(t);
    }
  }, [loading, location.hash]);

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Online Courses</h1>
          <p>Live, trainer-led online classes for all 5 programs - join from anywhere with a stable internet connection.</p>
        </div>
      </div>

      <div className="container">
        {loading && <p className="center muted section">Loading courses…</p>}
        {courses.map((c) => (
          <CourseSection key={c.slug} course={c} mode="online" onPurchase={(course, mode) => setModalState({ course, mode })} />
        ))}
      </div>

      {modalState && (
        <RegistrationModal course={modalState.course} mode={modalState.mode} onClose={() => setModalState(null)} />
      )}
    </>
  );
}
