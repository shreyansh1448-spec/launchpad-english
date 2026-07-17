// Guards against accidental edits to protected course content (overview,
// syllabus, duration, outcomes, pricing, batchTimings, faqs). Run after any
// change that touches Course documents or the admin course-edit endpoint:
//   node scripts/verifyCourseContentUnchanged.js            (check)
//   node scripts/verifyCourseContentUnchanged.js --write    (record new snapshot)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const courses = require('../seed/coursesData');

const PROTECTED_FIELDS = ['overview', 'syllabus', 'duration', 'outcomes', 'pricing', 'batchTimings', 'faqs'];
const SNAPSHOT_PATH = path.join(__dirname, '..', 'seed', 'coursesData.hash.json');

function hashProtectedFields(course) {
  const picked = {};
  for (const field of PROTECTED_FIELDS) picked[field] = course[field];
  return crypto.createHash('sha256').update(JSON.stringify(picked)).digest('hex');
}

function buildSnapshot() {
  const snapshot = {};
  for (const course of courses) snapshot[course.slug] = hashProtectedFields(course);
  return snapshot;
}

const shouldWrite = process.argv.includes('--write');
const current = buildSnapshot();

if (shouldWrite) {
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(current, null, 2) + '\n');
  console.log(`Snapshot written: ${SNAPSHOT_PATH}`);
  process.exit(0);
}

if (!fs.existsSync(SNAPSHOT_PATH)) {
  console.error(`No snapshot found at ${SNAPSHOT_PATH}. Run with --write to create one.`);
  process.exit(1);
}

const saved = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
let changed = false;

for (const course of courses) {
  const savedHash = saved[course.slug];
  const currentHash = current[course.slug];
  if (!savedHash) {
    console.warn(`⚠ No saved hash for "${course.slug}" (new course - add it with --write).`);
    continue;
  }
  if (savedHash !== currentHash) {
    changed = true;
    console.error(`✗ Protected content changed for "${course.slug}" (${PROTECTED_FIELDS.join(', ')}).`);
  }
}

if (changed) {
  console.error('\nFAILED: protected course content differs from the recorded snapshot.');
  process.exit(1);
}

console.log('OK: protected course content matches the recorded snapshot.');
