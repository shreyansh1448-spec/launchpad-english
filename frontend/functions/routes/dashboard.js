import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { serializeOrder } from '../lib/serialize.js';

const app = new Hono();

// GET /api/dashboard (admin) -> headline numbers + recent activity.
app.get('/', requireAdmin, async (c) => {
  const db = c.env.DB;
  const [courses, batches, sales, recentOrders, recentStudents] = await db.batch([
    db.prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN active = 1 AND offer_online = 1 THEN 1 ELSE 0 END) AS online,
              SUM(CASE WHEN active = 1 AND offer_offline = 1 THEN 1 ELSE 0 END) AS offline,
              SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS published
       FROM courses`
    ),
    db.prepare("SELECT COUNT(*) AS active FROM batches WHERE status IN ('open', 'filling')"),
    db.prepare("SELECT COUNT(*) AS enrollments, COALESCE(SUM(amount), 0) AS revenue FROM orders WHERE status = 'paid'"),
    db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 6'),
    db.prepare("SELECT * FROM orders WHERE status = 'paid' ORDER BY created_at DESC LIMIT 6"),
  ]);
  const cc = courses.results[0];
  const s = sales.results[0];
  return c.json({
    totalCourses: cc.total || 0,
    publishedCourses: cc.published || 0,
    onlineCourses: cc.online || 0,
    offlineCourses: cc.offline || 0,
    activeBatches: batches.results[0].active || 0,
    totalEnrollments: s.enrollments || 0,
    totalRevenue: (s.revenue || 0) / 100, // orders store paise
    recentOrders: recentOrders.results.map(serializeOrder),
    recentStudents: recentStudents.results.map(serializeOrder),
  });
});

export default app;
