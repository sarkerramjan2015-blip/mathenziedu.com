import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Settings, LayoutDashboard, DollarSign, Calendar, LogOut, ChevronRight, Search, Filter, FileText, BookMarked, CreditCard, ClipboardList, HelpCircle, CheckSquare, Award, Mail, Shield, UserCheck, Eye } from 'lucide-react';
import { adminStats, exams, courses as defaultCourses } from '../lib/data';
import AdminArticles from '../components/admin/AdminArticles';
import AdminCategories from '../components/admin/AdminCategories';
import AdminCourses from '../components/admin/AdminCourses';
import AdminBooks from '../components/admin/AdminBooks';
import AdminEnrollments from '../components/admin/AdminEnrollments';
import AdminExamQuestions from '../components/admin/AdminExamQuestions';
import AdminExams from '../components/admin/AdminExams';
import AdminExamEvaluation from '../components/admin/AdminExamEvaluation';
import AdminCertificates from '../components/admin/AdminCertificates';
import AdminContactMessages from '../components/admin/AdminContactMessages';
import AdminSiteSettings from '../components/admin/AdminSiteSettings';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/media';
import { L } from '../lib/i18n';
import { DEMO_MODE, clearDemoSession } from '../lib/demo';
import { useAuth } from '../lib/AuthContext';
import { collection, getDocs, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AdminAnalyticsSummary, Enrollment, Order, PaymentSubmission, ExamAttempt, WrittenSubmission, Certificate, Course, Exam } from '../lib/types';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { isDemo } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary>({
    totalUsers: 0, totalEnrollments: 0, activeEnrollments: 0,
    pendingOrders: 0, paidOrders: 0, totalRevenue: 0,
    totalCourses: 0, totalBooks: 0, totalExams: 0,
    totalExamAttempts: 0, averageExamScore: 0,
    pendingWrittenEvaluations: 0, certificatesIssued: 0,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [adminExams, setAdminExams] = useState<Exam[]>(exams);

  const handleLogout = async () => {
    if (isDemo) {
      clearDemoSession();
      navigate('/login');
      return;
    }
    await auth.signOut();
    navigate('/');
  };

  // Fetch real analytics
  useEffect(() => {
    if (DEMO_MODE && isDemo) {
      setAnalytics({
        totalUsers: adminStats.totalStudents,
        totalEnrollments: 0,
        activeEnrollments: 0,
        pendingOrders: 0,
        paidOrders: 0,
        totalRevenue: 1250000,
        totalCourses: defaultCourses.length,
        totalBooks: 0,
        totalExams: exams.length,
        totalExamAttempts: 0,
        averageExamScore: 0,
        pendingWrittenEvaluations: 0,
        certificatesIssued: 0,
      });
      setAnalyticsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const [
          usersSnap, enrollSnap, ordersSnap, subsSnap,
          coursesSnap, booksSnap, examsSnap,
          attSnap, wrSnap, certSnap, contactSnap
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

        const allOrders = ordersSnap.docs.map(d => d.data() as Order);
        const allAttempts = attSnap.docs.map(d => d.data() as ExamAttempt);
        const allEnrollments = enrollSnap.docs.map(d => d.data() as Enrollment);
        const paidOrders = allOrders.filter(o => o.status === 'paid');
        const verifiedSubs = subsSnap.docs.filter(d => d.data().status === 'verified');

        // Calculate real revenue from bKash verified submissions
        const totalRevenue = verifiedSubs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

        // Calculate average exam score
        const evaluatedAttempts = allAttempts.filter(a => a.status === 'evaluated' && a.obtainedMarks !== undefined);
        const avgScore = evaluatedAttempts.length > 0
          ? Math.round(evaluatedAttempts.reduce((sum, a) => sum + (a.obtainedMarks || 0), 0) / evaluatedAttempts.length)
          : 0;

        const pendingWritten = wrSnap.docs.filter(d => d.data().status === 'submitted').length;
        const issuedCerts = certSnap.docs.filter(d => d.data().status === 'issued').length;

        setAnalytics({
          totalUsers: usersSnap.size,
          totalEnrollments: enrollSnap.size,
          activeEnrollments: allEnrollments.filter(e => e.status === 'active').length,
          pendingOrders: allOrders.filter(o => o.status === 'pending').length,
          paidOrders: paidOrders.length,
          totalRevenue,
          totalCourses: coursesSnap.size,
          totalBooks: booksSnap.size,
          totalExams: examsSnap.size,
          totalExamAttempts: attSnap.size,
          averageExamScore: avgScore,
          pendingWrittenEvaluations: pendingWritten,
          certificatesIssued: issuedCerts,
        });
      } catch (e) { console.error(e); }
      finally { setAnalyticsLoading(false); }
    };
    fetchAnalytics();
  }, [isDemo]);

  useEffect(() => {
    if (DEMO_MODE && isDemo) return;
    const unsubscribe = onSnapshot(collection(db, 'exams'), (snapshot) => {
      if (!snapshot.empty) setAdminExams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Exam[]);
    });
    return unsubscribe;
  }, [isDemo]);

  const menu = [
    { id: 'overview', label: L.overview, icon: LayoutDashboard },
    { id: 'enrollments', label: L.enrollments, icon: ClipboardList },
    { id: 'orders', label: L.orders, icon: CreditCard },
    { id: 'categories', label: L.categories, icon: Filter },
    { id: 'courses', label: L.courses, icon: BookOpen },
    { id: 'books', label: L.books, icon: BookMarked },
    { id: 'articles', label: L.articles, icon: FileText },
    { id: 'exams', label: 'Exams', icon: Calendar },
    { id: 'exam_questions', label: L.examQuestions, icon: HelpCircle },
    { id: 'exam_evaluation', label: L.examEvaluation, icon: CheckSquare },
    { id: 'certificates', label: L.certificates, icon: Award },
    { id: 'contact_messages', label: L.messages, icon: Mail },
    { id: 'students', label: L.students, icon: Users },
    { id: 'settings', label: L.settings, icon: Settings },
  ];

  return (
    <div className="min-h-screen relative z-10">
      <div className="flex min-h-screen overflow-hidden ml-0 md:ml-64 transition-all">
        
        {/* Sidebar - Desktop Fixed */}
        <div className="hidden md:flex flex-col w-64 bg-[#0F172A]/80 backdrop-blur-xl text-white fixed top-0 left-0 h-screen p-6 border-r border-white/10 shadow-2xl z-20">
          <div className="flex items-center gap-2 mb-12 mt-4 px-2">
            <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="font-display font-bold text-xl uppercase tracking-tight">
              Mathemzi<span className="text-[#F59E0B]">Edu</span>
            </span>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-4 px-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            Admin Panel
          </div>
          <nav className="space-y-2 flex-grow">
            {menu.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-[#2563EB]/20 text-white shadow-lg border border-[#2563EB]/40' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all">
              <LogOut className="h-5 w-5" /> {isDemo ? 'Exit Demo' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow p-6 md:p-10 w-full relative z-10">
          {DEMO_MODE && isDemo && (
            <div className="mb-6 rounded-xl bg-purple-500/10 border border-purple-500/30 px-5 py-3 text-sm text-purple-300 flex items-center gap-2">
              <Eye className="h-4 w-4 shrink-0" />
              <span><strong>Demo Mode Active</strong> — changes may be saved to localStorage only. Firestore writes may be blocked.</span>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                {menu.find(m => m.id === activeTab)?.label}
              </h1>
              <p className="text-slate-400">Welcome to the Mathemzi Edu admin panel.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Global search..." 
                  className="pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm text-white placeholder:text-slate-500 backdrop-blur-md w-64 transition-all"
                />
              </div>
              <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold shadow-lg shrink-0">
                A
              </div>
            </div>
          </div>

          <div className="md:hidden -mx-2 mb-8 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2 px-2">
              {menu.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${
                    activeTab === item.id
                      ? 'border-[#2563EB]/40 bg-[#2563EB]/20 text-white'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label.replace('Manage ', '')}
                </button>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">
                <LogOut className="h-4 w-4" /> {isDemo ? 'Exit Demo' : 'Logout'}
              </button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Quick Actions */}
              <div className="mb-10">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{L.quickActions}</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setActiveTab('courses')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 hover:text-white transition-all">
                    + {L.addCourse}
                  </button>
                  <button onClick={() => setActiveTab('books')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 hover:text-white transition-all">
                    + {L.addBook}
                  </button>
                  <button onClick={() => setActiveTab('articles')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 hover:text-white transition-all">
                    + {L.addArticle}
                  </button>
                  <button onClick={() => setActiveTab('enrollments')} className="px-4 py-2 rounded-xl bg-[#E2136E]/20 border border-[#E2136E]/30 text-[#E2136E] text-xs font-bold hover:bg-[#E2136E]/30 transition-all">
                    {L.paymentVerification}
                  </button>
                  <button onClick={() => setActiveTab('contact_messages')} className="px-4 py-2 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/30 text-blue-300 text-xs font-bold hover:bg-[#2563EB]/30 transition-all">
                    {L.messages}
                  </button>
                  <button onClick={() => setActiveTab('certificates')} className="px-4 py-2 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-bold hover:bg-[#F59E0B]/30 transition-all">
                    {L.certificates}
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              {analyticsLoading ? (
                <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>
              ) : (<>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#2563EB]/20 text-[#2563EB] border border-[#2563EB]/30 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Users</div>
                    <div className="text-2xl font-bold text-white">{analytics.totalUsers.toLocaleString()}</div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center shrink-0">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Revenue (bKash Verified)</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(analytics.totalRevenue)}</div>
                    <div className="text-[10px] text-slate-500">{analytics.paidOrders} paid orders</div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Enrollments</div>
                    <div className="text-2xl font-bold text-white">{analytics.totalEnrollments}</div>
                    <div className="text-[10px] text-slate-500">{analytics.activeEnrollments} active</div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Pending Orders</div>
                    <div className="text-2xl font-bold text-white">{analytics.pendingOrders}</div>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Courses</div>
                    <div className="text-2xl font-bold text-white">{analytics.totalCourses}</div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Books</div>
                    <div className="text-2xl font-bold text-white">{analytics.totalBooks}</div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Exams</div>
                    <div className="text-2xl font-bold text-white">{analytics.totalExams}</div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Exam Attempts</div>
                    <div className="text-2xl font-bold text-white">{analytics.totalExamAttempts}</div>
                    <div className="text-[10px] text-slate-500">Avg score: {analytics.averageExamScore}</div>
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Pending Evaluations</div>
                    <div className="text-2xl font-bold text-white">{analytics.pendingWrittenEvaluations}</div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center shrink-0">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Certificates Issued</div>
                    <div className="text-2xl font-bold text-white">{analytics.certificatesIssued}</div>
                  </div>
                </div>
              </div>
              </> )}

              {/* Data Tables */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Courses */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                  <div className="p-6 flex justify-between items-center bg-white/5 border-b border-white/10">
                    <h3 className="font-bold text-lg text-white">Recent Courses</h3>
                    <button type="button" onClick={() => setActiveTab('courses')} className="text-sm text-[#2563EB] font-bold hover:underline">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black/20 text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/10">
                          <th className="p-4 font-bold">Course Name</th>
                          <th className="p-4 font-bold hidden sm:table-cell">Instructor</th>
                          <th className="p-4 font-bold">Price</th>
                          <th className="p-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {defaultCourses.slice(0, 4).map(course => (
                          <tr key={course.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="font-medium text-white line-clamp-1">{course.title}</div>
                              <div className="text-xs text-slate-400 hidden sm:block">{course.category}</div>
                            </td>
                            <td className="p-4 text-sm text-slate-300 hidden sm:table-cell">{course.instructor}</td>
                            <td className="p-4 text-sm font-bold text-[#10B981]">{formatCurrency(course.price)}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded border border-[#10B981]/30 text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] uppercase tracking-wider">Active</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Upcoming Exams */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                  <div className="p-6 flex justify-between items-center bg-white/5 border-b border-white/10">
                    <h3 className="font-bold text-lg text-white">Upcoming Exams</h3>
                    <button type="button" onClick={() => setActiveTab('exams')} className="text-sm text-[#2563EB] font-bold hover:underline">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black/20 text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/10">
                          <th className="p-4 font-bold">Exam Details</th>
                          <th className="p-4 font-bold">Date</th>
                          <th className="p-4 font-bold">Fee</th>
                          <th className="p-4 font-bold">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exams.slice(0, 4).map(exam => (
                          <tr key={exam.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="font-medium text-white line-clamp-1">{exam.title}</div>
                            </td>
                            <td className="p-4 text-sm text-slate-300 whitespace-nowrap">{exam.date}</td>
                            <td className="p-4 text-sm font-bold text-[#10B981]">{formatCurrency(exam.fee)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                exam.type === 'MCQ' ? 'bg-[#2563EB]/10 text-blue-300 border-[#2563EB]/30' : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              }`}>{exam.type}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'enrollments' && <AdminEnrollments />}
          {activeTab === 'orders' && <AdminEnrollments />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'courses' && <AdminCourses />}
          {activeTab === 'books' && <AdminBooks />}
          {activeTab === 'articles' && <AdminArticles />}
          {activeTab === 'exams' && <AdminExams />}
          {activeTab === 'exam_questions' && <AdminExamQuestions exams={adminExams} />}
          {activeTab === 'exam_evaluation' && <AdminExamEvaluation exams={adminExams} />}
          {activeTab === 'certificates' && <AdminCertificates exams={adminExams} />}
          {activeTab === 'contact_messages' && <AdminContactMessages />}
          {activeTab === 'students' && (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Students Management</h3>
                  <p className="text-sm text-slate-400">User accounts are automatically created when students register. To manage a user's role (student/admin), update the user document in Firestore: set <code className="text-[#F59E0B] bg-black/30 px-1.5 py-0.5 rounded text-xs">role: 'admin'</code></p>
                </div>
              </div>
              <div className="bg-black/30 rounded-2xl p-5 border border-white/10">
                <h4 className="font-bold text-white mb-3">How to make a user Admin</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                  <li>Go to Firebase Console → Firestore Database</li>
                  <li>Find the user document in <code className="text-[#F59E0B] bg-black/30 px-1 py-0.5 rounded text-xs">users/{'{userId}'}</code> collection</li>
                  <li>Set <code className="text-[#10B981] bg-black/30 px-1 py-0.5 rounded text-xs">role: 'admin'</code> field</li>
                  <li>User must sign out and sign in again for changes to take effect</li>
                </ol>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                <p>Current firebase-applet-config.json determines the Firebase project connection.</p>
                <p>All user data is stored in the Firestore <code className="text-[#F59E0B] bg-black/30 px-1 py-0.5 rounded text-xs">users</code> collection.</p>
              </div>
            </div>
          )}
          {activeTab === 'settings' && <AdminSiteSettings />}
        </div>
      </div>
    </div>
  );
}
