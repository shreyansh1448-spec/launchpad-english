import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';

const DEFAULT_BLOG_IMAGE = '/images/learn-english-illustration.avif';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Single blog post - hero band with the title, then the full formatted
// article body. Content is sanitized HTML (script/style/event-handlers
// stripped) set at import/admin-save time, not user-submitted, so rendering
// it directly is safe.
export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api
      .getBlogPost(slug)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p className="muted center">Loading…</p>
        </div>
      </section>
    );
  }

  if (notFound || !post) {
    return (
      <section className="section">
        <div className="container center">
          <h2>Post not found</h2>
          <p className="muted">This post may have been removed or the link is incorrect.</p>
          <Link className="btn" to="/blog">
            ← Back to Blog
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>{post.title}</h1>
          <p className="blog-post-date">📅 {formatDate(post.publishedAt)}</p>
        </div>
      </div>

      <section className="section">
        <div className="container blog-post-container">
          <div className="blog-post-img">
            <img src={post.thumbnail || DEFAULT_BLOG_IMAGE} alt={post.title} />
          </div>
          <article className="blog-article" dangerouslySetInnerHTML={{ __html: post.content }} />
          <Link className="blog-read-more" to="/blog">
            ← Back to Blog
          </Link>
        </div>
      </section>
    </>
  );
}
