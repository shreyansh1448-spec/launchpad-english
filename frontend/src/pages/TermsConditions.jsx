import React from 'react';

const TERMS = [
  'By accessing or using the Launch Pad English website, you agree to comply with these Terms & Conditions.',
  'All information provided during registration must be accurate, complete, and up to date.',
  'Course materials, videos, notes, PDFs, assignments, and website content are the exclusive intellectual property of Launch Pad English and may not be copied, shared, or reproduced without written permission.',
  'Students are responsible for maintaining the confidentiality of their account credentials and must not share them with others.',
  'Course access is intended only for the registered student and is non-transferable.',
  'All course fees must be paid in full before access to classes or study materials is granted.',
  'Launch Pad English reserves the right to modify course schedules, trainers, study materials, or course content to improve the learning experience.',
  'Students are expected to maintain respectful behaviour towards trainers, staff, and fellow learners during online and offline classes.',
  'Any misuse of the website, unauthorized recording of classes, or sharing of copyrighted material may result in immediate termination of course access without refund.',
  'Launch Pad English is not responsible for technical issues, internet failures, or third-party service interruptions beyond our control.',
  'We may update these Terms & Conditions at any time, and continued use of our website or services constitutes acceptance of the revised terms.',
  'Personal information collected through our website will be handled in accordance with our Privacy Policy.',
  'Any disputes arising from the use of our website or services shall be governed by the laws of India and subject to the exclusive jurisdiction of the courts of New Delhi.',
  'For any questions regarding these Terms & Conditions, please contact Launch Pad English using the contact details provided on our website.',
];

export default function TermsConditions() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Terms &amp; Conditions</h1>
          <p>Please read these terms carefully before using our website or services.</p>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <ol>
            {TERMS.map((t, i) => (
              <li key={i} style={{ marginBottom: 14 }}>
                {t}
              </li>
            ))}
            <li style={{ marginBottom: 14 }}>
              <strong>
                All payments made to Launch Pad English are final. We maintain a strict No Refund and No
                Cancellation Policy under any circumstances, including non-attendance, schedule conflicts, change of
                mind, or partial course usage.
              </strong>
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}
