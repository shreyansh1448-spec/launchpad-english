import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import Pagination from '../components/Pagination.jsx';

const DEFAULT_BLOG_IMAGE = '/images/learn-english-illustration.avif';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Public blog listing - hero band + a card grid (thumbnail, date, title,
// excerpt, "Read more") with the whole card clickable, plus Older/Newer
// pagination. Layout modeled after languagepantheon.com/blog.
export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const [data, setData] = useState({ posts: [], total: 0, pageSize: 12 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getBlogPosts(page)
      .then(setData)
      .catch(() => setData({ posts: [], total: 0, pageSize: 12 }))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(data.total / (data.pageSize || 12)));

  function goToPage(p) {
    setSearchParams(p === 1 ? {} : { page: String(p) });
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Blogs</h1>
          <p>Tips, guides and updates on Spoken English, IELTS, PTE and building real confidence in English.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {loading ? (
            <p className="muted center">Loading posts…</p>
          ) : data.posts.length === 0 ? (
            <p className="muted center">No posts yet - check back soon.</p>
          ) : (
            <>
              <div className="grid grid-3 blog-grid">
                {data.posts.map((post) => (
                  <article className="card blog-card" key={post._id}>
                    <div className="blog-card-img">
                      <img src={post.thumbnail || DEFAULT_BLOG_IMAGE} alt={post.title} loading="lazy" />
                    </div>
                    <div className="blog-card-body">
                      <p className="blog-date">📅 {formatDate(post.publishedAt)}</p>
                      <h3>{post.title}</h3>
                      <p className="blog-excerpt">{post.excerpt}</p>
                      <Link className="blog-read-more" to={`/blog/${post.slug}`}>
                        Read more →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={goToPage}
                prevLabel="← Newer"
                nextLabel="Older →"
                className="blog-pagination"
                showJump
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
