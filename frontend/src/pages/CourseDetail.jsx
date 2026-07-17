import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import CourseSection from '../components/CourseSection.jsx';
import RegistrationModal from '../components/RegistrationModal.jsx';

// Deep-link page: /course/:mode/:slug - reuses the same detailed
// CourseSection block shown on the Online/Offline listing pages.
export default function CourseDetail() {
  const { mode, slug } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .getCourse(slug)
      .then(setCourse)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const safeMode = mode === 'offline' ? 'offline' : 'online';

  if (loading) return <p className="center muted section">Loading course…</p>;
  if (error || !course) {
    return (
      <div className="container section center">
        <p className="form-error">{error || 'Course not found.'}</p>
        <Link className="btn" to="/online-courses">
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <CourseSection course={course} mode={safeMode} onPurchase={(c, m) => setModalState({ course: c, mode: m })} />
      </div>
      {modalState && (
        <RegistrationModal course={modalState.course} mode={modalState.mode} onClose={() => setModalState(null)} />
      )}
    </>
  );
}
