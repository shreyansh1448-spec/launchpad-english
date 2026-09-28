import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import BatchManager from '../../admin/BatchManager.jsx';

export default function AdminBatches() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.admin.listCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  return (
    <div className="cms-page">
      <div className="cms-page-head">
        <div>
          <h1>Batch Timings</h1>
          <p className="muted">
            "All courses" slots are offered for every course in that mode; course-specific batches only show on that course. Students pick a batch when they
            enroll, and seats go down automatically with each paid enrollment.
          </p>
        </div>
      </div>
      <div className="admin-panel">
        <BatchManager courses={courses} />
      </div>
    </div>
  );
}
