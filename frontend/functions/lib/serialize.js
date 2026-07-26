// Row -> API JSON shape helpers. The frontend was built against Mongoose's
// default toJSON output (camelCase fields, `_id`, nested objects for
// pricing/batchTimings/etc.), and this migration intentionally keeps that
// response shape so the React components don't need to change - only
// storage moved to D1, JSON columns get parsed back into nested objects here.

function toBool(v) {
  return !!v;
}

function serializeCourse(row, resourceRows = []) {
  return {
    _id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    duration: row.duration,
    level: row.level,
    overview: row.overview,
    highlights: JSON.parse(row.highlights),
    whoShouldJoin: JSON.parse(row.who_should_join),
    syllabus: JSON.parse(row.syllabus),
    dailyPattern: JSON.parse(row.daily_pattern),
    outcomes: JSON.parse(row.outcomes),
    batchTimings: JSON.parse(row.batch_timings),
    faqs: JSON.parse(row.faqs),
    images: JSON.parse(row.images),
    thumbnail: row.thumbnail,
    resources: resourceRows.map((r) => ({ _id: r.id, title: r.title, url: r.url })),
    pricing: {
      online: { mrp: row.pricing_online_mrp, offer: row.pricing_online_offer },
      offline: { mrp: row.pricing_offline_mrp, offer: row.pricing_offline_offer },
    },
    displayOrder: row.display_order,
    active: toBool(row.active),
    featured: toBool(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
  };
}

export {
  serializeCourse,
  serializeGallery,
  serializeOrder,
  serializeReview,
  serializeLead,
  serializeSiteContent,
};
