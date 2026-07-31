// --- Main Categories / SubCategories ---

export interface MainCategory {
  id?: string;
  title: string;
  description: string;
  color?: string;
  icon?: string;
  coverImage?: string;
  order?: number;
}

export interface SubCategory {
  id?: string;
  title: string;
  description?: string;
  order?: number;
  parentMainCategory?: string; // title of the parent MainCategory
}

// Alias for backward compatibility
export type Category = MainCategory;

// --- Content Entities ---

export interface Course {
  id: string;
  title: string;
  instructor: string;
  price: number;
  duration: string;
  lessons: number;
  rating: number;
  /** Legacy flat category — keep for backward compat */
  category: string;
  /** New two-level category support */
  mainCategory?: string;
  subCategory?: string;
  image: string;
  description: string;
  level?: string;
  enrolled?: number;
  outcomes?: string[];
  curriculum?: {
    title: string;
    lessons: number;
    time: string;
  }[];
}

export interface Exam {
  id: string;
  title: string;
  /** Legacy flat category — keep for backward compat */
  category: string;
  /** New two-level category support */
  mainCategory?: string;
  subCategory?: string;
  type: 'MCQ' | 'Written';
  fee: number;
  date: string;
  duration: string;
  durationMinutes?: number;
  totalMarks: number;
  syllabus: string;
  coverImage?: string;
  registrationOpenAt?: import('firebase/firestore').Timestamp;
  registrationCloseAt?: import('firebase/firestore').Timestamp;
  scheduledStartAt?: import('firebase/firestore').Timestamp;
  timezone?: 'Asia/Dhaka';
  publishStatus?: 'draft' | 'published' | 'archived';
  isFeatured?: boolean;
  statusOverride?: 'auto' | 'upcoming' | 'live' | 'ended';
  /** Firestore document reference — set when fetched from DB */
  description?: string;
  instructions?: string;
  isPublished?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

// ===== Exam System Types =====

export type QuestionType = 'mcq' | 'written';

export interface ExamQuestion {
  id?: string;
  examId: string;
  questionType: QuestionType;
  questionText: string;
  /** MCQ options array — only for mcq type */
  options?: string[];
  /** Correct option index (0-based) — only for mcq type */
  correctOption?: number;
  marks: number;
  /** Optional explanation shown after submission */
  explanation?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export type ExamAttemptStatus = 'in_progress' | 'submitted' | 'evaluated';

export interface ExamAnswer {
  questionId: string;
  questionType: QuestionType;
  /** Selected option index for MCQ */
  selectedOption?: number;
  /** Text answer for written questions */
  answerText?: string;
  marks?: number;
  isCorrect?: boolean;
}

export interface ExamAttempt {
  id?: string;
  userId: string;
  userEmail: string;
  examId: string;
  examTitle: string;
  status: ExamAttemptStatus;
  startedAt: number;
  submittedAt?: number;
  totalMarks: number;
  obtainedMarks?: number;
  correctCount?: number;
  wrongCount?: number;
  answers: ExamAnswer[];
  timeSpent: number; // seconds
  createdAt: number;
  updatedAt: number;
}

export type WrittenSubmissionStatus = 'submitted' | 'reviewed';

export interface WrittenSubmission {
  id?: string;
  userId: string;
  userEmail: string;
  examId: string;
  examTitle: string;
  attemptId: string;
  questionId: string;
  questionText: string;
  answerText: string;
  status: WrittenSubmissionStatus;
  marks?: number;
  feedback?: string;
  maxMarks?: number;
  submittedAt: number;
  reviewedAt?: number;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  /** Legacy flat category — keep for backward compat */
  category: string;
  /** New two-level category support */
  mainCategory?: string;
  subCategory?: string;
  image: string;
  author?: string;
  date?: string;
  content?: string;
}

// --- Books ---

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string; // backward compat
  mainCategory: string;
  subCategory: string;
  classOrLevel?: string;
  price: number;
  isFree: boolean;
  coverImage: string;
  buyUrl?: string;
  downloadUrl?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface StudentStats {
  activeCourses: number;
  completedCourses: number;
  upcomingExams: number;
  certificates: number;
  averageScore: string;
}

export interface AdminStats {
  totalStudents: number;
  activeCourses: number;
  totalRevenue: string;
  upcomingExams: number;
}

// ===== Progress & Certificates =====

export type CourseProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface CourseProgress {
  id?: string;
  userId: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  enrollmentId: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  lastAccessedAt: number;
  status: CourseProgressStatus;
  createdAt: number;
  updatedAt: number;
}

export interface LessonProgress {
  id?: string;
  userId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  completed: boolean;
  completedAt?: number;
  watchTime?: number;
  createdAt: number;
  updatedAt: number;
}

export type CertificateType = 'course' | 'exam';
export type CertificateStatus = 'issued' | 'revoked';

export interface Certificate {
  id?: string;
  userId: string;
  userEmail: string;
  studentName: string;
  certificateType: CertificateType;
  itemId: string;
  itemTitle: string;
  certificateNo: string;
  issuedAt: number;
  score?: number;
  totalMarks?: number;
  grade?: string;
  downloadUrl?: string;
  status: CertificateStatus;
  issuedBy?: string;
  revokedAt?: number;
}

export interface StudentAnalytics {
  coursesEnrolled: number;
  coursesCompleted: number;
  averageExamScore: number;
  certificatesEarned: number;
  pendingPayments: number;
  pendingWrittenEvaluations: number;
}

export interface AdminAnalyticsSummary {
  totalUsers: number;
  totalEnrollments: number;
  activeEnrollments: number;
  pendingOrders: number;
  paidOrders: number;
  totalRevenue: number;
  totalCourses: number;
  totalBooks: number;
  totalExams: number;
  totalExamAttempts: number;
  averageExamScore: number;
  pendingWrittenEvaluations: number;
  certificatesIssued: number;
}

// --- Enrollment System ---

export type EnrollmentType = 'free' | 'paid';
export type EnrollmentStatus = 'active' | 'pending_payment' | 'cancelled' | 'completed';

export interface Enrollment {
  id?: string;
  userId: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  mainCategory?: string;
  subCategory?: string;
  enrollmentType: EnrollmentType;
  status: EnrollmentStatus;
  progress: number;
  enrolledAt: number;
  updatedAt?: number;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type OrderItemType = 'course' | 'book' | 'exam';
export type PaymentMethod = 'bkash_manual' | 'manual' | 'sslcommerz' | 'bkash' | 'nagad' | 'shurjopay' | 'none';

export interface Order {
  id?: string;
  userId: string;
  userEmail: string;
  itemType: OrderItemType;
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: 'BDT';
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: number;
  updatedAt?: number;
}

export interface PaymentRecord {
  id?: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: PaymentMethod;
  status: OrderStatus;
  transactionId?: string;
  providerResponse?: string;
  createdAt: number;
  updatedAt?: number;
}

// --- Manual bKash Payment Submission ---

export type SubmissionStatus = 'submitted' | 'verified' | 'rejected';

export interface PaymentSubmission {
  id?: string;
  orderId: string;
  userId: string;
  userEmail: string;
  amount: number;
  senderBkashNumber: string;
  transactionId: string;
  paymentNote?: string;
  status: SubmissionStatus;
  adminNote?: string;
  submittedAt: number;
  reviewedAt?: number;
}

// --- Admin-manageable Site Settings ---

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface SiteSettings {
  id?: string;
  // Branding
  siteName: string;
  shortName: string;
  tagline: string;
  banglaTagline: string;
  logoUrl: string;
  faviconUrl: string;
  // Homepage
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroBtn1Text: string;
  heroBtn1Link: string;
  heroBtn2Text: string;
  heroBtn2Link: string;
  heroBtn3Text: string;
  heroBtn3Link: string;
  trustSectionTitle: string;
  trustSectionItems: string[];
  // About page
  aboutTitle: string;
  aboutIntro: string;
  missionTitle: string;
  missionText: string;
  visionTitle: string;
  visionText: string;
  aboutFeatures: string[];
  // Contact page
  contactPageTitle: string;
  contactPageSubtitle: string;
  // Contact
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  supportHours: string;
  // Payment
  bkashNumber: string;
  bkashAccountType: string;
  bkashInstructions: string[];
  paymentSupportContact: string;
  paymentNote: string;
  // Social
  facebookUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  // SEO
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoOgImage: string;
  // Policies
  privacyIntro: string;
  privacyDataText: string;
  privacySecurityText: string;
  termsIntro: string;
  termsAccessText: string;
  termsPaymentsText: string;
  // Footer
  footerText: string;
  updatedAt: number;
}
