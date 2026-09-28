import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import CourseDetailView from '../components/CourseDetailView.jsx';
import RegistrationModal from '../components/RegistrationModal.jsx';
import useSeo from '../hooks/useSeo.js';
import useSiteContent from '../hooks/useSiteContent.js';
import { MODE_META, courseJsonLd, coursePath, courseSeo, offersMode } from '../../shared/course.js';

// /online-courses/:slug and /offline-courses/:slug - one page per course per
// mode, all rendered from the database through CourseDetailView.
export default function CourseDetail({ mode }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const siteContent = useSiteContent();
  const [course, setCourse] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [enroll, setEnroll] = useState(null); // { course, batchId }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    Promise.all([api.getCourse(slug), api.getCourses(mode).catch(() => [])])
      .then(([c, list]) => {
        if (!alive) return;
        // Old slug -> canonical URL.
        if (c.slug !== slug) {
          navigate(coursePath(mode, c.slug), { replace: true });
          return;
        }
        setCourse(c);
        setRelated(list.filter((r) => r.slug !== c.slug));
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug, mode, navigate]);

  const origin = window.location.origin;
  const available = course && offersMode(course, mode);
  useSeo(
    available ? courseSeo(course, mode, origin) : null,
    available ? courseJsonLd(course, mode, origin) : []
  );

  if (loading) {
    return (
      <div className="container section">
        <div className="cd-skeleton" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container section center">
        <h1>Course not found</h1>
        <p className="muted">This course may have been renamed or is no longer available.</p>
        <Link className="btn" to={MODE_META[mode].listingPath}>
          Browse {MODE_META[mode].listingTitle}
        </Link>
      </div>
    );
  }

  if (!available) {
    const other = mode === 'online' ? 'offline' : 'online';
    if (offersMode(course, other)) {
      return (
        <div className="container section center">
          <h1>{course.title} isn't available {mode} right now</h1>
          <p className="muted">It's currently offered as a {MODE_META[other].label.toLowerCase()} course.</p>
          <Link className="btn" to={coursePath(other, course.slug)}>
            View {MODE_META[other].label} Course
          </Link>
        </div>
      );
    }
    return <Navigate to={MODE_META[mode].listingPath} replace />;
  }

  return (
    <>
      <CourseDetailView
        course={course}
        mode={mode}
        related={related}
        siteContent={siteContent}
        onEnroll={(batchId, otherCourse) => setEnroll({ course: otherCourse || course, batchId })}
      />
      {enroll && (
        <RegistrationModal
          course={enroll.course}
          mode={mode}
          initialBatchId={enroll.batchId}
          onClose={() => setEnroll(null)}
        />
      )}
    </>
  );
}

// Old deep links: /course/:mode/:slug -> /online-courses/:slug (the server
// also 301s these; this covers in-app navigation).
export function LegacyCourseRedirect() {
  const { mode, slug } = useParams();
  return <Navigate to={coursePath(mode === 'offline' ? 'offline' : 'online', slug)} replace />;
}
