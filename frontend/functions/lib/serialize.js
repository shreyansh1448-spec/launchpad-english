// Row -> API JSON shape helpers. The frontend was built against Mongoose's
// default toJSON output (camelCase fields, `_id`, nested objects for
// pricing/batchTimings/etc.), and this migration intentionally keeps that
// response shape so the React components don't need to change - only
// storage moved to D1, JSON columns get parsed back into nested objects here.

function toBool(v) {
  return !!v;
}

function parseJson(text, fallback) {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

// `full` = false drops the heavy detail-only fields (PDF resources are
// base64 data URLs) for listing endpoints.
function serializeCourse(row, resourceRows = [], { full = true } = {}) {
  const course = {
    _id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category || '',
    tagline: row.tagline,
    shortDescription: row.short_description || '',
    duration: row.duration,
    level: row.level,
    overview: row.overview,
    highlights: parseJson(row.highlights, []),
    whoShouldJoin: parseJson(row.who_should_join, []),
    syllabus: parseJson(row.syllabus, []),
    dailyPattern: parseJson(row.daily_pattern, []),
    outcomes: parseJson(row.outcomes, []),
    faqs: parseJson(row.faqs, []),
    details: parseJson(row.details, {}),
    images: parseJson(row.images, []),
    thumbnail: row.thumbnail,
    heroImage: row.hero_image || '',
    promoVideo: row.promo_video || '',
    instructor: parseJson(row.instructor, {}),
    modes: { online: toBool(row.offer_online ?? 1), offline: toBool(row.offer_offline ?? 1) },
    pricing: {
      online: { mrp: row.pricing_online_mrp, offer: row.pricing_online_offer },
      offline: { mrp: row.pricing_offline_mrp, offer: row.pricing_offline_offer },
    },
    currency: row.currency || 'INR',
    modeContent: parseJson(row.mode_content, {}),
    seo: parseJson(row.seo, {}),
    legacySlugs: parseJson(row.legacy_slugs, []),
    displayOrder: row.display_order,
    active: toBool(row.active),
    featured: toBool(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (full) {
    course.fullDescription = row.full_description || '';
    course.resources = resourceRows.map((r) => ({ _id: r.id, title: r.title, url: r.url }));
  }
  return course;
}

function serializeBatch(row) {
  return {
    _id: row.id,
    courseId: row.course_id || null,
    mode: row.mode,
    dayType: row.day_type,
    timeLabel: row.time_label,
    classroom: row.classroom,
    seatsAvailable: row.seats_available ?? null,
    startDate: row.start_date,
    status: row.status,
    displayOrder: row.display_order,
    // Bookable = open/filling and not sold out.
    bookable: (row.status === 'open' || row.status === 'filling') && (row.seats_available === null || row.seats_available > 0),
  };
}

function serializeGallery(row) {
  return {
    _id: row.id,
    title: row.title,
    mediaType: row.media_type,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    category: row.category,
    courseSlug: row.course_slug,
    displayOrder: row.display_order,
    active: toBool(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeOrder(row) {
  return {
    _id: row.id,
    name: row.name,
    phone: row.phone,
    phoneVerified: toBool(row.phone_verified),
    email: row.email,
    address: row.address,
    courseSlug: row.course_slug,
    courseTitle: row.course_title,
    mode: row.mode,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.payment_method,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    razorpaySignature: row.razorpay_signature,
    status: row.status,
    notes: row.notes,
    batchId: row.batch_id || null,
    batchLabel: row.batch_label || '',
    confirmationSent: toBool(row.confirmation_sent),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeReview(row) {
  return {
    _id: row.id,
    order: row.order_id,
    source: row.source,
    courseSlug: row.course_slug,
    name: row.name,
    role: row.role,
    stars: row.stars,
    text: row.text,
    photoUrl: row.photo_url,
    reviewDate: row.review_date,
    approved: toBool(row.approved),
    featured: toBool(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeBlogPost(row) {
  return {
    _id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    thumbnail: row.thumbnail,
    publishedAt: row.published_at,
    active: toBool(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeLead(row) {
  return {
    _id: row.id,
    type: row.type,
    name: row.name,
    phone: row.phone,
    email: row.email,
    courseType: row.course_type,
    message: row.message,
    createdAt: row.created_at,
  };
}

function serializeSiteContent(row) {
  return {
    _id: row.id,
    siteName: row.site_name,
    tagline: row.tagline,
    aboutTitle: row.about_title,
    aboutText: row.about_text,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    mapLat: row.map_lat,
    mapLng: row.map_lng,
    mapPlaceUrl: row.map_place_url,
    workingHours: row.working_hours,
    youtubeUrl: row.youtube_url,
    social: JSON.parse(row.social),
    heroSlides: JSON.parse(row.hero_slides),
    batchTimings: JSON.parse(row.batch_timings),
    stats: JSON.parse(row.stats),
    homeContent: JSON.parse(row.home_content || '{}'),
  };
}

export {
  parseJson,
  serializeCourse,
  serializeBatch,
  serializeGallery,
  serializeOrder,
  serializeReview,
  serializeLead,
  serializeSiteContent,
  serializeBlogPost,
};
