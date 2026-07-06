// Simple bilingual label helper for admin UI
// Returns "English / বাংলা" for display in admin forms

export function label(en: string, bn: string): string {
  return `${en} / ${bn}`;
}

export const L = {
  // Common
  save: 'Save / সংরক্ষণ করুন',
  cancel: 'Cancel / বাতিল',
  edit: 'Edit / এডিট',
  delete: 'Delete / ডিলিট',
  deleteConfirm: 'Are you sure? / আপনি কি নিশ্চিত?',
  add: 'Add / যোগ করুন',
  search: 'Search / সার্চ',
  loading: 'Loading... / লোড হচ্ছে...',
  noData: 'No data found / কোনো ডাটা নেই',
  confirm: 'Confirm / নিশ্চিত করুন',
  close: 'Close / বন্ধ',
  preview: 'Preview / প্রিভিউ',
  status: 'Status / স্ট্যাটাস',
  actions: 'Actions / একশন',

  // Content
  mainCategory: 'Main Category / প্রধান ক্যাটাগরি',
  subCategory: 'Subcategory / সাব-ক্যাটাগরি',
  title: 'Title / টাইটেল',
  description: 'Description / বিবরণ',
  image: 'Image / ছবি',
  imageUrl: 'Image URL / ছবির লিংক',
  price: 'Price / মূল্য',
  free: 'Free / ফ্রি',
  paid: 'Paid / পেইড',

  // Sections
  courses: 'Courses / কোর্স',
  addCourse: 'Add Course / নতুন কোর্স যোগ করুন',
  editCourse: 'Edit Course / কোর্স এডিট',
  books: 'Books / বই',
  addBook: 'Add Book / নতুন বই যোগ করুন',
  editBook: 'Edit Book / বই এডিট',
  articles: 'Articles / আর্টিকেল',
  addArticle: 'Add Article / নতুন আর্টিকেল যোগ করুন',
  editArticle: 'Edit Article / আর্টিকেল এডিট',
  exams: 'Exams / পরীক্ষা',
  examQuestions: 'Exam Questions / পরীক্ষার প্রশ্ন',
  examEvaluation: 'Exam Evaluation / পরীক্ষা মূল্যায়ন',
  certificates: 'Certificates / সার্টিফিকেট',
  categories: 'Categories / ক্যাটাগরি',
  enrollments: 'Enrollments / এনরোলমেন্ট',
  orders: 'Orders / অর্ডার',
  payments: 'Payments / পেমেন্ট',
  paymentVerification: 'Payment Verification / পেমেন্ট যাচাই',
  messages: 'Messages / মেসেজ',
  messagesDesc: 'Contact messages from website visitors / ওয়েবসাইট ভিজিটরদের মেসেজ',
  students: 'Students / স্টুডেন্ট',
  settings: 'Settings / সেটিংস',
  overview: 'Overview / ওভারভিউ',
  analytics: 'Analytics / অ্যানালিটিক্স',

  // Settings
  siteSettings: 'Site Settings / সাইট সেটিংস',
  branding: 'Branding / ব্র্যান্ডিং',
  homepage: 'Homepage / হোমপেজ',
  contactInfo: 'Contact Info / যোগাযোগ',
  paymentSettings: 'Payment Settings / পেমেন্ট সেটিংস',
  socialLinks: 'Social Links / সোশ্যাল লিংক',
  seoSettings: 'SEO / এসইও',

  // Status
  draft: 'Draft / ড্রাফট',
  published: 'Published / পাবলিশড',
  archived: 'Archived / আর্কাইভড',

  // Quick actions
  quickActions: 'Quick Actions / দ্রুত একশন',
  addQuick: label('Add', 'নতুন'),
  viewAll: 'View All / সব দেখুন',

  // Help texts
  coursesHelp: 'এখান থেকে কোর্স যোগ, এডিট, দাম পরিবর্তন, ক্যাটাগরি সেট এবং কোর্স পাবলিশ/আনপাবলিশ করতে পারবেন।',
  booksHelp: 'এখান থেকে বই/PDF রিসোর্স যোগ, ফ্রি/পেইড সেট, কভার ছবি আপলোড এবং ডাউনলোড লিংক ম্যানেজ করতে পারবেন।',
  articlesHelp: 'এখান থেকে আর্টিকেল/ব্লগ লেখা, এডিট, ক্যাটাগরি ও ছবি সেট করতে পারবেন।',
  examsHelp: 'পরীক্ষার প্রশ্ন যোগ, MCQ/Written সেট, মার্কস এবং অর্ডার ম্যানেজ করুন।',
  evalHelp: 'রিটেন এক্সামের উত্তর চেক করুন, মার্কস ও ফিডব্যাক দিন।',
  certHelp: 'কোর্স/পরীক্ষার সার্টিফিকেট ইস্যু বা রিভোক করুন।',
  paymentsHelp: 'ইউজার bKash Transaction ID সাবমিট করলে এখানে যাচাই করে Paid/Rejected করতে পারবেন।',
  catsHelp: 'মেইন ক্যাটাগরি ও সাব-ক্যাটাগরি যোগ/এডিট/ডিলিট করুন। ক্লিক করে এক্সপ্যান্ড করুন।',
  ordersHelp: 'সব অর্ডার হিস্টরি দেখুন। পেন্ডিং অর্ডার ম্যানুয়ালি Paid করতে পারবেন।',
  studentsHelp: 'ইউজার সার্চ করুন, রোল চেঞ্জ করুন (student/admin), এনরোলমেন্ট ও পেমেন্ট দেখুন।',
  settingsHelp: 'সাইটের নাম, ট্যাগলাইন, কন্টাক্ট, bKash নাম্বার, সোশ্যাল লিংক — সব এখান থেকে এডিট করুন।',
  messagesHelp: 'ভিজিটরদের পাঠানো কন্টাক্ট মেসেজ পড়ুন, Read/Replied মার্ক করুন। রিপ্লাই করতে ইমেইল লিংকে ক্লিক করুন।',
};
