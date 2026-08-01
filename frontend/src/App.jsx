import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import FloatingContact from './components/FloatingContact.jsx';
import CounsellingPopup from './components/CounsellingPopup.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import OnlineCourses from './pages/OnlineCourses.jsx';
import OfflineCourses from './pages/OfflineCourses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import Counselling from './pages/Counselling.jsx';
import FAQs from './pages/FAQs.jsx';
import Contact from './pages/Contact.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsConditions from './pages/TermsConditions.jsx';
import CancellationRefundPolicy from './pages/CancellationRefundPolicy.jsx';
import RequireAdmin from './admin/RequireAdmin.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminCourses from './pages/admin/AdminCourses.jsx';
import AdminSiteContent from './pages/admin/AdminSiteContent.jsx';
import AdminHomePage from './pages/admin/AdminHomePage.jsx';
import AdminGallery from './pages/admin/AdminGallery.jsx';
import AdminBlog from './pages/admin/AdminBlog.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';
import AdminLeads from './pages/admin/AdminLeads.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminAccount from './pages/admin/AdminAccount.jsx';

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // React Router doesn't reset scroll position on navigation the way a full
  // page load does, so clicking a link (e.g. from the footer) while scrolled
  // down otherwise lands on the new page still scrolled down. Skipped when
  // there's a hash (e.g. /#gallery) so the existing anchor-scroll logic in
  // Home.jsx can take over instead.
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/online-courses" element={<OnlineCourses />} />
          <Route path="/offline-courses" element={<OfflineCourses />} />
          <Route path="/course/:mode/:slug" element={<CourseDetail />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/counselling" element={<Counselling />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsConditions />} />
          <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminCourses />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="site-content" element={<AdminSiteContent />} />
              <Route path="home-page" element={<AdminHomePage />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="account" element={<AdminAccount />} />
            </Route>
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      {!isAdmin && <FloatingContact />}
      {!isAdmin && <CounsellingPopup />}
    </>
  );
}
