import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  BookMarked,
  BookOpen,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  FileQuestion,
  FileText,
  Filter,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { adminStats, courses as defaultCourses, exams } from '../lib/data';
import { formatCurrency } from '../lib/media';
import { clearDemoSession, DEMO_MODE } from '../lib/demo';
import { useAuth } from '../lib/AuthContext';
import { useSiteSettings } from '../lib/useSiteConfig';
import AdminArticles from '../components/admin/AdminArticles';
import AdminBooks from '../components/admin/AdminBooks';
import AdminCategories from '../components/admin/AdminCategories';
import AdminCertificates from '../components/admin/AdminCertificates';
import AdminContactMessages from '../components/admin/AdminContactMessages';
import AdminCourses from '../components/admin/AdminCourses';
import AdminEnrollments from '../components/admin/AdminEnrollments';
import AdminExamEvaluation from '../components/admin/AdminExamEvaluation';
import AdminExamQuestions from '../components/admin/AdminExamQuestions';
import AdminExams from '../components/admin/AdminExams';
import AdminSiteSettings from '../components/admin/AdminSiteSettings';
import AdminStudents from '../components/admin/AdminStudents';
import type {
  AdminAnalyticsSummary,
  Enrollment,
  Exam,
  ExamAttempt,
  Order,
} from '../lib/types';

type AdminTabId =
  | 'overview'
  | 'courses'
  | 'books'
  | 'articles'
  | 'categories'
  | 'exams'
  | 'exam_questions'
  | 'exam_evaluation'
  | 'certificates'
  | 'enrollments'
  | 'students'
  | 'contact_messages'
  | 'settings';

interface AdminNavItem {
  id: AdminTabId;
  label: string;
  shortLabel: string;
  description: string;
  guide: string;
  keywords: string;
  icon: React.ElementType;
}

const NAV_GROUPS: Array<{ label: string; items: AdminNavItem[] }> = [
  {
    label: 'শুরু করুন',
    items: [
      {
        id: 'overview',
        label: 'কন্ট্রোল সেন্টার',
        shortLabel: 'Overview',
        description: 'আজকের গুরুত্বপূর্ণ কাজ ও পুরো সাইটের অবস্থা',
        guide: 'যে কাজটি করতে চান, নিচের বড় কার্ড থেকে সেটি বেছে নিন।',
        keywords: 'home dashboard overview status শুরু আজ কাজ',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'কনটেন্ট',
    items: [
      { id: 'courses', label: 'কোর্স', shortLabel: 'Courses', description: 'কোর্স যোগ, মূল্য ও তথ্য পরিবর্তন', guide: '“নতুন কোর্স” চাপুন, প্রয়োজনীয় তথ্য দিন, তারপর সেভ করুন।', keywords: 'course class price শিক্ষক fee কোর্স মূল্য', icon: BookOpen },
      { id: 'books', label: 'বই ও PDF', shortLabel: 'Books', description: 'বই, মূল্য ও download link', guide: 'বইটি Free না Paid তা বেছে নিয়ে cover ও download link দিন।', keywords: 'book pdf download price free বই', icon: BookMarked },
      { id: 'articles', label: 'আর্টিকেল', shortLabel: 'Articles', description: 'Blog ও শিক্ষামূলক লেখা', guide: 'শিরোনাম, ছোট পরিচিতি ও পুরো লেখাটি দিয়ে সেভ করুন।', keywords: 'article blog post লেখা আর্টিকেল', icon: FileText },
      { id: 'categories', label: 'ক্যাটাগরি', shortLabel: 'Categories', description: 'Menu ও content grouping', guide: 'আগে Main Category তৈরি করুন, তারপর তার ভেতরে Subcategory যোগ করুন।', keywords: 'category menu subject বিভাগ ক্যাটাগরি', icon: Filter },
    ],
  },
  {
    label: 'পরীক্ষা',
    items: [
      { id: 'exams', label: 'পরীক্ষা ও সময়সূচি', shortLabel: 'Exams', description: 'Exam date, fee ও publish status', guide: 'সময়সূচি পূরণ করে Draft হিসেবে সেভ করুন; যাচাই শেষে Published করুন।', keywords: 'exam schedule date fee publish পরীক্ষা সময়সূচি', icon: Calendar },
      { id: 'exam_questions', label: 'প্রশ্নপত্র', shortLabel: 'Questions', description: 'MCQ ও written question যোগ করুন', guide: 'প্রথমে পরীক্ষা বেছে নিন, তারপর একে একে প্রশ্ন ও নম্বর যোগ করুন।', keywords: 'question mcq written answer প্রশ্ন', icon: FileQuestion },
      { id: 'exam_evaluation', label: 'উত্তর যাচাই', shortLabel: 'উত্তর যাচাই', description: 'লিখিত উত্তরে নম্বর ও মন্তব্য দিন', guide: 'অপেক্ষমাণ উত্তর খুলুন, নম্বর ও মন্তব্য লিখে “মূল্যায়ন সেভ করুন” চাপুন।', keywords: 'evaluate marks feedback result উত্তর নম্বর', icon: CheckSquare },
      { id: 'certificates', label: 'সার্টিফিকেট', shortLabel: 'Certificates', description: 'যোগ্য শিক্ষার্থীকে certificate দিন', guide: 'Evaluated exam বা completed course বেছে নিয়ে তথ্য যাচাই করে certificate দিন।', keywords: 'certificate award issue revoke সার্টিফিকেট', icon: Award },
    ],
  },
  {
    label: 'মানুষ ও সাপোর্ট',
    items: [
      { id: 'enrollments', label: 'অনুমোদন ও ভর্তি', shortLabel: 'Approvals', description: 'Student message দেখে course access অনুমোদন', guide: 'Student-এর message দেখে সঠিক request-এ Approve & Activate চাপুন।', keywords: 'approval request enrollment message course access ভর্তি', icon: CreditCard },
      { id: 'students', label: 'শিক্ষার্থী ও Admin', shortLabel: 'ব্যবহারকারী', description: 'নাম ও ব্যবহারের অনুমতি পরিবর্তন', guide: 'ব্যবহারকারী খুঁজে “এডিট” চাপুন; প্রয়োজন হলে শিক্ষার্থী বা Admin বেছে সেভ করুন।', keywords: 'student user admin role account শিক্ষার্থী', icon: Users },
      { id: 'contact_messages', label: 'মেসেজ', shortLabel: 'Messages', description: 'Contact form-এর প্রশ্ন ও উত্তর', guide: 'Unread message খুলুন, যোগাযোগ সম্পন্ন হলে Replied হিসেবে চিহ্নিত করুন।', keywords: 'message contact support reply মেসেজ', icon: Mail },
    ],
  },
  {
    label: 'ওয়েবসাইট',
    items: [
      { id: 'settings', label: 'ওয়েবসাইট এডিটর', shortLabel: 'ওয়েবসাইট এডিটর', description: 'নাম, হোমপেজ, যোগাযোগ, bKash ও নীতিমালা', guide: 'অংশ বেছে লেখা পরিবর্তন করুন; সবশেষে “সব পরিবর্তন সেভ করুন” চাপুন।', keywords: 'settings homepage logo contact bkash seo about policy edit website', icon: Settings },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(group => group.items);
const VALID_TABS = new Set(ALL_NAV_ITEMS.map(item => item.id));

const emptyAnalytics: AdminAnalyticsSummary = {
  totalUsers: 0,
  totalEnrollments: 0,
  activeEnrollments: 0,
  pendingOrders: 0,
  paidOrders: 0,
  totalRevenue: 0,
  totalCourses: 0,
  totalBooks: 0,
  totalExams: 0,
  totalExamAttempts: 0,
  averageExamScore: 0,
  pendingWrittenEvaluations: 0,
  certificatesIssued: 0,
};

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = VALID_TABS.has(requestedTab as AdminTabId) ? requestedTab as AdminTabId : 'overview';
  const { isDemo } = useAuth();
  const site = useSiteSettings();
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary>(emptyAnalytics);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [adminExams, setAdminExams] = useState<Exam[]>(exams);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [taskSearch, setTaskSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const activeItem = ALL_NAV_ITEMS.find(item => item.id === activeTab) || ALL_NAV_ITEMS[0];
  const searchResults = useMemo(() => {
    const term = taskSearch.trim().toLowerCase();
    if (!term) return ALL_NAV_ITEMS.slice(1, 7);
    return ALL_NAV_ITEMS.filter(item => `${item.label} ${item.shortLabel} ${item.description} ${item.keywords}`.toLowerCase().includes(term));
  }, [taskSearch]);

  const navigateTo = (tab: AdminTabId) => {
    if (tab === 'overview') setSearchParams({});
    else setSearchParams({ tab });
    setTaskSearch('');
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    if (isDemo) {
      clearDemoSession();
      window.location.href = '/login';
      return;
    }
    await auth.signOut();
    window.location.href = '/';
  };

  useEffect(() => {
    if (DEMO_MODE && isDemo) {
      setAnalytics({
        ...emptyAnalytics,
        totalUsers: adminStats.totalStudents,
        totalRevenue: 1250000,
        totalCourses: defaultCourses.length,
        totalExams: exams.length,
      });
      setPendingPayments(3);
      setUnreadMessages(5);
      setAnalyticsLoading(false);
      return;
    }

    let active = true;
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const [
          usersSnapshot,
          enrollmentsSnapshot,
          ordersSnapshot,
          paymentsSnapshot,
          coursesSnapshot,
          booksSnapshot,
          examsSnapshot,
          attemptsSnapshot,
          writtenSnapshot,
          certificatesSnapshot,
          contactSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'enrollments')),
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'paymentSubmissions')),
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'books')),
          getDocs(collection(db, 'exams')),
          getDocs(collection(db, 'examAttempts')),
          getDocs(collection(db, 'writtenSubmissions')),
          getDocs(collection(db, 'certificates')),
          getDocs(collection(db, 'contactMessages')),
        ]);
        if (!active) return;

        const orders = ordersSnapshot.docs.map(item => item.data() as Order);
        const attempts = attemptsSnapshot.docs.map(item => item.data() as ExamAttempt);
        const enrollments = enrollmentsSnapshot.docs.map(item => item.data() as Enrollment);
        const verifiedPayments = paymentsSnapshot.docs.filter(item => item.data().status === 'verified');
        const evaluatedAttempts = attempts.filter(attempt => attempt.status === 'evaluated' && attempt.obtainedMarks !== undefined);
        const averageScore = evaluatedAttempts.length
          ? Math.round(evaluatedAttempts.reduce((total, attempt) => total + (attempt.obtainedMarks || 0), 0) / evaluatedAttempts.length)
          : 0;

        setPendingPayments(paymentsSnapshot.docs.filter(item => item.data().status === 'submitted').length);
        setUnreadMessages(contactSnapshot.docs.filter(item => item.data().status === 'unread').length);
        setAnalytics({
          totalUsers: usersSnapshot.size,
          totalEnrollments: enrollmentsSnapshot.size,
          activeEnrollments: enrollments.filter(item => item.status === 'active').length,
          pendingOrders: orders.filter(item => item.status === 'pending').length,
          paidOrders: orders.filter(item => item.status === 'paid').length,
          totalRevenue: verifiedPayments.reduce((total, item) => total + (Number(item.data().amount) || 0), 0),
          totalCourses: coursesSnapshot.size,
          totalBooks: booksSnapshot.size,
          totalExams: examsSnapshot.size,
          totalExamAttempts: attemptsSnapshot.size,
          averageExamScore: averageScore,
          pendingWrittenEvaluations: writtenSnapshot.docs.filter(item => item.data().status === 'submitted').length,
          certificatesIssued: certificatesSnapshot.docs.filter(item => item.data().status === 'issued').length,
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
    return () => { active = false; };
  }, [isDemo]);

  useEffect(() => {
    if (DEMO_MODE && isDemo) return;
    return onSnapshot(collection(db, 'exams'), snapshot => {
      if (!snapshot.empty) {
        setAdminExams(snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Exam[]);
      }
    }, error => console.error(error));
  }, [isDemo]);

  const bkashReady = /^01[3-9]\d{8}$/.test(site.bkashNumber.replace(/[\s-]/g, ''));
  const phoneReady = !/X|000000/.test(site.phone);
  const setupChecks = [
    { label: 'কোর্স যোগ করা আছে', done: analytics.totalCourses > 0, action: 'courses' as AdminTabId },
    { label: 'bKash নম্বর দেওয়া আছে', done: bkashReady, action: 'settings' as AdminTabId },
    { label: 'সঠিক ফোন নম্বর দেওয়া আছে', done: phoneReady, action: 'settings' as AdminTabId },
    { label: 'পরীক্ষা তৈরি করা আছে', done: analytics.totalExams > 0, action: 'exams' as AdminTabId },
  ];
  const completedChecks = setupChecks.filter(check => check.done).length;

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'courses': return <AdminCourses />;
      case 'books': return <AdminBooks />;
      case 'articles': return <AdminArticles />;
      case 'categories': return <AdminCategories />;
      case 'exams': return <AdminExams />;
      case 'exam_questions': return <AdminExamQuestions exams={adminExams} />;
      case 'exam_evaluation': return <AdminExamEvaluation exams={adminExams} />;
      case 'certificates': return <AdminCertificates exams={adminExams} />;
      case 'enrollments': return <AdminEnrollments />;
      case 'students': return <AdminStudents />;
      case 'contact_messages': return <AdminContactMessages />;
      case 'settings': return <AdminSiteSettings />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/10 bg-[#0B1220]/95 px-4 py-5 backdrop-blur-xl md:flex">
        <Link to="/" target="_blank" className="mb-6 flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-white/5">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#2563EB] to-[#10B981] shadow-lg">
            {site.logoUrl ? <img src={site.logoUrl} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-6 w-6 text-white" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-extrabold">{site.shortName || site.name}</span>
            <span className="block text-[11px] font-bold uppercase tracking-widest text-emerald-300">Admin Control Center</span>
          </span>
        </Link>

        <nav className="min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Admin navigation">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-5">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{group.label}</div>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      activeTab === item.id
                        ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-950/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{item.label}</span>
                      {activeTab === item.id && <span className="block truncate text-[10px] text-blue-100">{item.shortLabel}</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-3 border-t border-white/10 pt-3">
          <Link to="/" target="_blank" className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white">
            <ExternalLink className="h-4 w-4" /> ওয়েবসাইট দেখুন
          </Link>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-500/10">
            <LogOut className="h-4 w-4" /> {isDemo ? 'Demo থেকে বের হন' : 'Logout'}
          </button>
        </div>
      </aside>

      <main id="main-content" className="min-h-screen md:ml-72">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-10">
          {DEMO_MODE && isDemo && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-purple-400/20 bg-purple-400/10 px-4 py-3 text-sm text-purple-200">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              Demo mode চলছে—এখানে করা পরিবর্তন শুধু এই browser-এ দেখা যেতে পারে।
            </div>
          )}

          <div className="mb-5 md:hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]"><BookOpen className="h-5 w-5" /></span>
                <div>
                  <div className="font-extrabold">{site.shortName || 'Mathenzi'}</div>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-300">Admin</div>
                </div>
              </div>
              <Link to="/" target="_blank" className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200" aria-label="View website">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <label>
              <span className="sr-only">Admin section</span>
              <select value={activeTab} onChange={event => navigateTo(event.target.value as AdminTabId)}
                className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm font-bold text-white outline-none">
                {NAV_GROUPS.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300">
                <activeItem.icon className="h-4 w-4" /> {activeItem.shortLabel}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{activeItem.label}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{activeItem.description}</p>
            </div>

            <div className="relative w-full xl:w-[390px]">
              <label>
                <span className="sr-only">Admin কাজ খুঁজুন</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={taskSearch}
                  onFocus={() => setSearchOpen(true)}
                  onChange={event => { setTaskSearch(event.target.value); setSearchOpen(true); }}
                  placeholder="আমি কী করতে চাই? যেমন: bKash, course…"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-10 text-sm text-white outline-none backdrop-blur-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                />
                {taskSearch && (
                  <button type="button" onClick={() => setTaskSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>
              {searchOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111827] p-2 shadow-2xl">
                  <div className="mb-1 flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>{taskSearch ? 'খোঁজার ফল' : 'জনপ্রিয় কাজ'}</span>
                    <button type="button" onClick={() => setSearchOpen(false)} className="rounded p-1 hover:bg-white/5"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  {searchResults.length ? searchResults.slice(0, 7).map(item => (
                    <button key={item.id} type="button" onClick={() => navigateTo(item.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-blue-300"><item.icon className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-white">{item.label}</span>
                        <span className="block truncate text-xs text-slate-400">{item.description}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                  )) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">এই নামে কোনো কাজ পাওয়া যায়নি।</div>
                  )}
                </div>
              )}
            </div>
          </header>

          {activeTab === 'overview' ? (
            <div className="space-y-7">
              <section className="overflow-hidden rounded-3xl border border-blue-400/15 bg-gradient-to-br from-[#172554] via-[#111D3A] to-[#0F172A] p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300"><Gauge className="h-4 w-4" /> সহজ শুরু</div>
                    <h2 className="text-2xl font-extrabold sm:text-3xl">আজ কী করতে চান?</h2>
                    <p className="mt-2 text-sm text-slate-300">কাজটি বেছে নিন—পরের পাতায় ধাপে ধাপে নির্দেশনা থাকবে।</p>
                  </div>
                  <button type="button" onClick={() => navigateTo('settings')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#0F172A] hover:bg-blue-50">
                    <Sparkles className="h-4 w-4 text-[#2563EB]" /> ওয়েবসাইটের লেখা বদলান
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { id: 'courses' as AdminTabId, title: 'নতুন কোর্স যোগ করব', text: 'মূল্য, শিক্ষক ও cover দিন', icon: BookOpen, color: 'text-blue-300 bg-blue-400/10' },
                    { id: 'enrollments' as AdminTabId, title: 'Payment যাচাই করব', text: `${pendingPayments}টি submission অপেক্ষায়`, icon: WalletCards, color: 'text-pink-300 bg-pink-400/10' },
                    { id: 'exams' as AdminTabId, title: 'পরীক্ষা তৈরি করব', text: 'তারিখ, fee ও সময় ঠিক করুন', icon: Calendar, color: 'text-purple-300 bg-purple-400/10' },
                    { id: 'exam_evaluation' as AdminTabId, title: 'উত্তর দেখব', text: `${analytics.pendingWrittenEvaluations}টি written answer pending`, icon: ClipboardCheck, color: 'text-amber-300 bg-amber-400/10' },
                    { id: 'contact_messages' as AdminTabId, title: 'মেসেজের উত্তর দেব', text: `${unreadMessages}টি unread message`, icon: MessageSquare, color: 'text-emerald-300 bg-emerald-400/10' },
                    { id: 'students' as AdminTabId, title: 'শিক্ষার্থী দেখব', text: 'নাম ও access পরিবর্তন করুন', icon: UserCog, color: 'text-cyan-300 bg-cyan-400/10' },
                  ].map(task => (
                    <button key={task.id} type="button" onClick={() => navigateTo(task.id)}
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${task.color}`}><task.icon className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-extrabold text-white">{task.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-400">{task.text}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-extrabold">Website readiness</h2>
                      <p className="mt-1 text-xs text-slate-400">Live payment নেওয়ার আগে এই তথ্যগুলো পূরণ করুন।</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-slate-300">{completedChecks}/{setupChecks.length} সম্পন্ন</span>
                  </div>
                  <div className="mb-5 h-2 overflow-hidden rounded-full bg-black/30">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] transition-all" style={{ width: `${(completedChecks / setupChecks.length) * 100}%` }} />
                  </div>
                  <div className="space-y-2">
                    {setupChecks.map(check => (
                      <button key={check.label} type="button" onClick={() => navigateTo(check.action)}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-black/15 px-4 py-3 text-left hover:bg-white/5">
                        {check.done ? <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" /> : <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />}
                        <span className="flex-1 text-sm font-bold text-slate-200">{check.label}</span>
                        <span className={`text-xs font-bold ${check.done ? 'text-emerald-300' : 'text-amber-300'}`}>{check.done ? 'ঠিক আছে' : 'সম্পন্ন করুন'}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
                  <h2 className="text-lg font-extrabold">সংক্ষিপ্ত হিসাব</h2>
                  <p className="mt-1 text-xs text-slate-400">বর্তমান সাইটের গুরুত্বপূর্ণ সংখ্যা।</p>
                  {analyticsLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-[#2563EB]" /></div>
                  ) : (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {[
                        { label: 'মোট শিক্ষার্থী', value: analytics.totalUsers.toLocaleString(), icon: Users },
                        { label: 'Active ভর্তি', value: analytics.activeEnrollments.toLocaleString(), icon: ShieldCheck },
                        { label: 'মোট আয়', value: formatCurrency(analytics.totalRevenue), icon: CreditCard },
                        { label: 'Certificate', value: analytics.certificatesIssued.toLocaleString(), icon: Award },
                      ].map(stat => (
                        <div key={stat.label} className="rounded-2xl border border-white/8 bg-black/15 p-4">
                          <stat.icon className="mb-3 h-4 w-4 text-blue-300" />
                          <div className="text-lg font-extrabold text-white sm:text-xl">{stat.value}</div>
                          <div className="mt-1 text-[11px] text-slate-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-extrabold">সবকিছু এখান থেকে নিয়ন্ত্রণ করুন</h2>
                  <p className="mt-1 text-xs text-slate-400">প্রতিটি অংশে যোগ করা, পরিবর্তন করা ও প্রয়োজনীয় নিয়ন্ত্রণের অপশন আছে।</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { id: 'courses' as AdminTabId, label: 'কোর্স', count: analytics.totalCourses, icon: BookOpen },
                    { id: 'books' as AdminTabId, label: 'বই', count: analytics.totalBooks, icon: BookMarked },
                    { id: 'exams' as AdminTabId, label: 'পরীক্ষা', count: analytics.totalExams, icon: Calendar },
                    { id: 'students' as AdminTabId, label: 'অ্যাকাউন্ট', count: analytics.totalUsers, icon: Users },
                  ].map(item => (
                    <button key={item.id} type="button" onClick={() => navigateTo(item.id)}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-left hover:bg-white/5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-blue-300"><item.icon className="h-5 w-5" /></span>
                      <span className="flex-1">
                        <span className="block text-xl font-extrabold">{item.count.toLocaleString()}</span>
                        <span className="block text-xs text-slate-400">{item.label}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-5">
              {activeTab !== 'settings' && (
                <div className="flex items-start gap-3 rounded-2xl border border-blue-400/15 bg-blue-400/5 px-4 py-3 text-sm leading-relaxed text-blue-100">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span><strong>সহজ নিয়ম:</strong> {activeItem.guide}</span>
                </div>
              )}
              {renderActiveContent()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
