import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, LogOut, PlayCircle, CreditCard, AlertCircle, CheckCircle, Smartphone, HelpCircle, Clock, Award, Printer, BookMarked, Eye } from 'lucide-react';
import { courses as dummyCourses } from '../lib/data';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import UserSavedArticles from '../components/UserSavedArticles';
import { isAdminUser } from '../lib/admin';
import { applyImageFallback, imageWithFallback } from '../lib/media';
import { getCourseCover } from '../lib/courseCovers';
import { DEMO_MODE, clearDemoSession, getDemoLocalData } from '../lib/demo';
import SEO from '../components/SEO';
import type { Enrollment, Order, PaymentSubmission, ExamAttempt, WrittenSubmission, CourseProgress, Certificate } from '../lib/types';
import { formatCurrency } from '../lib/media';

const STATUS_COLORS: Record<string, string> = {
  active: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
  pending_payment: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
  cancelled: 'text-red-400 bg-red-500/10 border-red-400/30',
  completed: 'text-blue-400 bg-blue-500/10 border-blue-400/30',
};

const EXAM_STATUS_COLORS: Record<string, string> = {
  in_progress: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
  submitted: 'text-blue-400 bg-blue-500/10 border-blue-400/30',
  evaluated: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const { user, userRole, isDemo } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [writtenSubs, setWrittenSubs] = useState<WrittenSubmission[]>([]);
  const [courseProgressData, setCourseProgressData] = useState<CourseProgress[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingEnroll, setLoadingEnroll] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [enrSnap, ordSnap, subSnap, attSnap, wrSnap, progSnap, certSnap] = await Promise.all([
          getDocs(query(collection(db, 'enrollments'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'paymentSubmissions'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'examAttempts'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'writtenSubmissions'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'courseProgress'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'certificates'), where('userId', '==', user.uid))),
        ]);
        setEnrollments(enrSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Enrollment[]);
        setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
        setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PaymentSubmission[]);
        setExamAttempts(attSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ExamAttempt[]);
        setWrittenSubs(wrSnap.docs.map(d => ({ id: d.id, ...d.data() })) as WrittenSubmission[]);
        setCourseProgressData(progSnap.docs.map(d => ({ id: d.id, ...d.data() })) as CourseProgress[]);
        setCertificates(certSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Certificate[]);

        // Merge demo localStorage data
        if (DEMO_MODE) {
          const demoEnroll = (getDemoLocalData('enrollments') as any[]).filter(e => e.userId === user.uid) as Enrollment[];
          const demoOrders = (getDemoLocalData('orders') as any[]).filter(o => o.userId === user.uid) as Order[];
          const demoSubs = (getDemoLocalData('paymentSubmissions') as any[]).filter(s => s.userId === user.uid) as PaymentSubmission[];
          const demoAttempts = (getDemoLocalData('examAttempts') as any[]).filter(a => a.userId === user.uid) as ExamAttempt[];
          const demoWr = (getDemoLocalData('writtenSubmissions') as any[]).filter(s => s.userId === user.uid) as WrittenSubmission[];
          const demoProg = (getDemoLocalData('courseProgress') as any[]).filter(p => p.userId === user.uid) as CourseProgress[];

          setEnrollments(prev => [...prev, ...demoEnroll]);
          setOrders(prev => [...prev, ...demoOrders]);
          setSubmissions(prev => [...prev, ...demoSubs]);
          setExamAttempts(prev => [...prev, ...demoAttempts]);
          setWrittenSubs(prev => [...prev, ...demoWr]);
          setCourseProgressData(prev => [...prev, ...demoProg]);
        }
      } catch {} finally {
        setLoadingEnroll(false);
      }
    };
    fetchData();
  }, [user]);

  const handleLogout = async () => {
    if (isDemo) {
      clearDemoSession();
      navigate('/login');
      return;
    }
    await auth.signOut();
    navigate('/');
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    setVerificationStatus('sending');
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationStatus('sent');
    } catch {
      setVerificationStatus('error');
    }
  };

  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending_payment');

  const menu = [
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'exams', label: 'My Exams', icon: HelpCircle },
    { id: 'books', label: 'My Books', icon: BookMarked },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'saved_articles', label: 'Saved Articles', icon: FileText },
    { id: 'payments', label: 'Payments & Orders', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen py-10 relative z-10 w-full">
      <SEO title="Dashboard" description="Your Mathenzi Edu learning dashboard — track courses, enrollments, and saved articles." path="/dashboard" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {user && !user.emailVerified && !isDemo && (
          <div role="status" className="mb-6 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-5 py-4 text-sm text-amber-100 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <strong className="block text-[#F59E0B]">Verify your email to enroll or make payments</strong>
              <span className="text-xs text-slate-300">Open the verification link sent to {user.email}. Then reload this page.</span>
            </div>
            <button
              type="button"
              onClick={resendVerification}
              disabled={verificationStatus === 'sending' || verificationStatus === 'sent'}
              className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-bold text-amber-100 hover:bg-amber-300/20 disabled:opacity-60 sm:mt-0"
            >
              {verificationStatus === 'sending' ? 'Sending...' : verificationStatus === 'sent' ? 'Email sent' : 'Resend email'}
            </button>
            {verificationStatus === 'error' && <span className="mt-2 block text-xs text-red-300 sm:mt-0">Could not send. Try again later.</span>}
          </div>
        )}
        {DEMO_MODE && isDemo && (
          <div className="mb-6 rounded-xl bg-purple-500/10 border border-purple-500/30 px-5 py-3 text-sm text-purple-300 flex items-center gap-2">
            <Eye className="h-4 w-4 shrink-0" />
            <span><strong>Demo Mode Active</strong> — local preview only. Data shown is static or localStorage-based.</span>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl mb-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="h-12 w-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20 uppercase">
                  {user?.displayName ? user.displayName.charAt(0) : (user?.email ? user.email.charAt(0) : 'U')}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-white truncate">{user?.displayName || (user?.email ? user.email.split('@')[0] : 'User')}</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{isAdminUser(userRole, user?.email, user?.emailVerified) ? 'Admin' : 'Student'}</p>
                </div>
              </div>
              <nav className="space-y-2">
                {menu.map(item => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id ? 'bg-white/10 text-white border border-white/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}>
                    <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-[#10B981]' : ''}`} />
                    {item.label}
                    {item.id === 'courses' && activeEnrollments.length > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded">{activeEnrollments.length}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all border border-transparent">
                <LogOut className="h-5 w-5" /> Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-white mb-2">{menu.find(m => m.id === activeTab)?.label}</h1>
              <p className="text-slate-400">Welcome back! Here's an overview of your progress.</p>
            </div>

            {/* My Courses tab */}
            {activeTab === 'courses' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-[#10B981] mb-1">{activeEnrollments.length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-[#F59E0B] mb-1">{pendingEnrollments.length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Payment</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{enrollments.filter(e => e.status === 'completed').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">{(() => {
                      const evaluated = examAttempts.filter(a => a.status === 'evaluated' && a.obtainedMarks !== undefined);
                      if (evaluated.length === 0) return '—';
                      const avg = Math.round(evaluated.reduce((s, a) => s + ((a.obtainedMarks || 0) / a.totalMarks) * 100, 0) / evaluated.length);
                      return `${avg}%`;
                    })()}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Score</div>
                  </div>
                </div>

                {loadingEnroll ? (
                  <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>
                ) : enrollments.length === 0 ? (
                  <>
                    <div className="space-y-6">
                      <p className="text-slate-500 text-sm mb-4">You haven't enrolled in any courses yet.</p>
                      {dummyCourses.slice(0, 2).map(course => (
                        <div key={course.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col md:flex-row gap-6 hover:bg-white/10 transition-colors">
                          <div className="w-full md:w-40 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                            <img src={imageWithFallback(getCourseCover(course.title, course.image))} onError={applyImageFallback} alt={`${course.title} course cover`} loading="lazy" className="h-32 w-full object-cover object-top rounded-2xl" />
                          </div>
                          <div className="flex-grow flex flex-col justify-between">
                            <div>
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-300">
                                  {course.mainCategory || course.category}
                                </span>
                                {course.subCategory && (
                                  <span className="bg-blue-500/10 border border-blue-400/20 px-2.5 py-1 rounded-full text-[10px] font-semibold text-blue-300">
                                    {course.subCategory}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-xl text-white mb-2 leading-snug">{course.title}</h3>
                              <p className="text-sm text-slate-400 mb-4 font-medium">{course.instructor} · {course.duration}</p>
                            </div>
                            <div className="mt-auto">
                              <Link to={`/courses/${course.id}`} className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-lg">
                                View Course <PlayCircle className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {enrollments.map(enrollment => (
                      <div key={enrollment.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col md:flex-row gap-6 hover:bg-white/10 transition-colors">
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[enrollment.status] || 'text-slate-400 bg-white/10 border-white/20'} uppercase tracking-wider`}>
                                {enrollment.status.replace('_', ' ')}
                              </span>
                              {enrollment.enrollmentType === 'free' && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">Free</span>
                              )}
                            </div>
                            <h3 className="font-bold text-xl text-white mb-1">{enrollment.courseTitle}</h3>
                            <p className="text-sm text-slate-400">{enrollment.mainCategory}{enrollment.subCategory ? ` · ${enrollment.subCategory}` : ''}</p>
                            <p className="text-xs text-slate-500 mt-1">Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString('en-BD')}</p>
                          </div>
                          {enrollment.status === 'active' && (() => {
                            const prog = courseProgressData.find(p => p.courseId === enrollment.courseId);
                            const percent = prog?.progressPercent ?? enrollment.progress;
                            const completed = prog?.completedLessons ?? 0;
                            const total = prog?.totalLessons ?? 0;
                            return (
                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Progress</span>
                                <span>{percent}%</span>
                              </div>
                              <div className="w-full bg-black/40 rounded-full h-2 border border-white/5 overflow-hidden">
                                <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] h-full rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                              {total > 0 && <div className="text-[10px] text-slate-500 mt-1">{completed}/{total} lessons</div>}
                            </div>
                          )})()}
                          {enrollment.status === 'pending_payment' && (
                            <div className="mt-3 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-4 py-2.5 text-xs font-medium text-[#F59E0B] flex items-center gap-2">
                              <AlertCircle className="h-3.5 w-3.5" /> Payment pending — complete to access course
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                          <Link to={`/courses/${enrollment.courseId}`}
                            className="bg-white/10 border border-white/20 hover:bg-[#2563EB] hover:border-[#2563EB] text-white h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-lg">
                            <PlayCircle className="h-6 w-6 ml-0.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'exams' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-[#F59E0B] mb-1">{examAttempts.filter(e => e.status === 'in_progress').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{examAttempts.filter(e => e.status === 'submitted').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Under Review</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-[#10B981] mb-1">{examAttempts.filter(e => e.status === 'evaluated').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluated</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">{examAttempts.length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Attempts</div>
                  </div>
                </div>

                {loadingEnroll ? (
                  <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>
                ) : examAttempts.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center shadow-2xl">
                    <HelpCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Exams Yet</h3>
                    <p className="text-slate-400 text-sm mb-6">You haven't taken any exams yet. Browse available exams and start practicing.</p>
                    <Link to="/exams" className="inline-block bg-[#2563EB] text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg">
                      Browse Exams
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {examAttempts.map(attempt => {
                      const hasWrittenSub = writtenSubs.filter(s => s.attemptId === attempt.id);
                      const pendingReviewCount = hasWrittenSub.filter(s => s.status === 'submitted').length;
                      return (
                        <div key={attempt.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl hover:bg-white/10 transition-colors">
                          <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                            <div className="flex-grow">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${EXAM_STATUS_COLORS[attempt.status] || 'text-slate-400 bg-white/10 border-white/20'} uppercase tracking-wider`}>
                                  {attempt.status === 'evaluated' ? 'Evaluated' : attempt.status === 'submitted' ? 'Under Review' : 'In Progress'}
                                </span>
                              </div>
                              <h3 className="font-bold text-lg text-white mb-1">{attempt.examTitle}</h3>
                              <p className="text-xs text-slate-500">
                                Started {new Date(attempt.startedAt).toLocaleDateString('en-BD')}
                                {attempt.timeSpent > 0 && ` · ${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s spent`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {attempt.status === 'evaluated' && attempt.obtainedMarks !== undefined && (
                                <div className="mb-2">
                                  <div className="text-2xl font-bold text-[#10B981]">{attempt.obtainedMarks}</div>
                                  <div className="text-[10px] text-slate-500">out of {attempt.totalMarks} marks</div>
                                </div>
                              )}
                              <div className="flex gap-2">
                                {attempt.status === 'in_progress' && (
                                  <Link to={`/exams/${attempt.examId}/take?attempt=${attempt.id}`}
                                    className="inline-flex items-center gap-1 bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-bold px-3 py-2 rounded-xl border border-[#F59E0B]/30 hover:bg-[#F59E0B]/30 transition-all">
                                    <Clock className="h-3.5 w-3.5" /> Continue
                                  </Link>
                                )}
                                <Link to={`/exams/${attempt.examId}`}
                                  className="inline-flex items-center gap-1 bg-[#2563EB] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-blue-500 transition-all shadow-lg">
                                  View Exam
                                </Link>
                              </div>
                            </div>
                          </div>
                          {attempt.status === 'submitted' && pendingReviewCount > 0 && (
                            <div className="mt-3 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2.5 text-xs font-medium text-blue-300 flex items-center gap-2">
                              <AlertCircle className="h-3.5 w-3.5" /> Written answers submitted — awaiting admin review
                            </div>
                          )}
                          {attempt.status === 'submitted' && pendingReviewCount === 0 && (
                            <div className="mt-3 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-4 py-2.5 text-xs font-medium text-[#F59E0B] flex items-center gap-2">
                              <CheckCircle className="h-3.5 w-3.5" /> Submitted — waiting for evaluation
                            </div>
                          )}
                          {attempt.status === 'evaluated' && attempt.obtainedMarks !== undefined && (
                            <div className="mt-3">
                              <div className="w-full bg-black/40 rounded-full h-2 border border-white/5 overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  (attempt.obtainedMarks / attempt.totalMarks) >= 0.8 ? 'bg-[#10B981]' :
                                  (attempt.obtainedMarks / attempt.totalMarks) >= 0.5 ? 'bg-[#F59E0B]' : 'bg-red-400'
                                }`} style={{ width: `${(attempt.obtainedMarks / attempt.totalMarks) * 100}%` }} />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                <span>Score: {(attempt.obtainedMarks / attempt.totalMarks * 100).toFixed(0)}%</span>
                                <span>{attempt.correctCount ?? 0} correct · {attempt.wrongCount ?? 0} wrong</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'certificates' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-[#10B981] mb-1">{certificates.filter(c => c.status === 'issued').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Certificates</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{certificates.filter(c => c.certificateType === 'course').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">{certificates.filter(c => c.certificateType === 'exam').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-red-400 mb-1">{certificates.filter(c => c.status === 'revoked').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revoked</div>
                  </div>
                </div>

                {loadingEnroll ? (
                  <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>
                ) : certificates.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center shadow-2xl">
                    <Award className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Certificates Yet</h3>
                    <p className="text-slate-400 text-sm mb-6">Complete a course or get an evaluated exam score to earn your certificate.</p>
                    <Link to="/courses" className="inline-block bg-[#2563EB] text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg">
                      Browse Courses
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certificates.filter(c => c.status === 'issued').map(cert => (
                      <div key={cert.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl hover:bg-white/10 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center shrink-0">
                              <Award className="h-7 w-7 text-[#F59E0B]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 uppercase tracking-wider">
                                  {cert.certificateType}
                                </span>
                              </div>
                              <h3 className="font-bold text-lg text-white">{cert.itemTitle}</h3>
                              <p className="text-xs text-slate-400 mt-1">Certificate No: <span className="font-mono text-[#F59E0B]">{cert.certificateNo}</span></p>
                              <p className="text-xs text-slate-500">Issued: {new Date(cert.issuedAt).toLocaleDateString('en-BD')}</p>
                              {cert.score !== undefined && (
                                <p className="text-xs text-[#10B981] mt-1 font-semibold">Score: {cert.score}/{cert.totalMarks} ({cert.grade || 'N/A'})</p>
                              )}
                            </div>
                          </div>
                          <Link to={`/certificates/${cert.id}`}
                            className="flex items-center gap-2 bg-[#2563EB] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-500 transition-all shadow-lg shrink-0">
                            <Printer className="h-3.5 w-3.5" /> View
                          </Link>
                        </div>
                      </div>
                    ))}
                    {/* Show revoked certificates separately */}
                    {certificates.filter(c => c.status === 'revoked').length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Revoked Certificates</h3>
                        {certificates.filter(c => c.status === 'revoked').map(cert => (
                          <div key={cert.id} className="bg-red-500/5 border border-red-400/20 rounded-2xl p-4 mb-3">
                            <div className="flex items-center gap-3">
                              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                              <div>
                                <h4 className="font-bold text-white text-sm">{cert.itemTitle}</h4>
                                <p className="text-[10px] text-red-300">{cert.certificateNo} · Revoked</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved_articles' && <UserSavedArticles />}

            {activeTab === 'books' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">{orders.filter(o => o.itemType === 'book').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchased Books</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-[#10B981] mb-1">{orders.filter(o => o.itemType === 'book' && o.status === 'paid').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-[#F59E0B] mb-1">{orders.filter(o => o.itemType === 'book' && o.status === 'pending').length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Payment</div>
                  </div>
                </div>

                {loadingEnroll ? (
                  <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>
                ) : orders.filter(o => o.itemType === 'book').length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center shadow-2xl">
                    <BookMarked className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Books Yet</h3>
                    <p className="text-slate-400 text-sm mb-6">You haven't purchased any books yet.</p>
                    <Link to="/books" className="inline-block bg-purple-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-purple-500 transition-all shadow-lg">
                      Browse Books
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.filter(o => o.itemType === 'book').map(order => {
                      const sub = submissions.find(s => s.orderId === order.id);
                      return (
                        <div key={order.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl hover:bg-white/10 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                  order.status === 'paid' ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30' :
                                  order.status === 'pending' ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' :
                                  'text-red-400 bg-red-500/10 border-red-400/30'
                                }`}>
                                  {order.status}
                                </span>
                                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                                  {order.itemType}
                                </span>
                              </div>
                              <h3 className="font-bold text-lg text-white mb-1">{order.itemTitle}</h3>
                              <p className="text-xs text-slate-500">
                                {order.currency} {order.amount.toLocaleString('en-BD')} · {new Date(order.createdAt).toLocaleDateString('en-BD')}
                              </p>
                              {sub && sub.status === 'verified' && (
                                <p className="text-xs text-[#10B981] mt-1 font-semibold">Payment verified ✓</p>
                              )}
                            </div>
                            <div className="shrink-0">
                              {order.status === 'paid' && (
                                <Link to="/books" className="inline-flex items-center gap-1 bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-purple-500 transition-all">
                                  <BookMarked className="h-3.5 w-3.5" /> Browse
                                </Link>
                              )}
                              {order.status === 'pending' && (
                                <Link to="/books" className="inline-flex items-center gap-1 bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-bold px-3 py-2 rounded-xl border border-[#F59E0B]/30 hover:bg-[#F59E0B]/30 transition-all">
                                  <CreditCard className="h-3.5 w-3.5" /> Complete Payment
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Payment & Order History</h3>
                    <p className="text-sm text-slate-400">Track your orders and bKash payment submissions.</p>
                  </div>
                  {orders.length > 0 && (
                    <span className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">{orders.length} orders</span>
                  )}
                </div>

                {loadingEnroll ? (
                  <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                    <CreditCard className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No orders yet. Browse courses to get started.</p>
                    <Link to="/courses" className="inline-block mt-4 text-[#2563EB] font-bold text-sm hover:underline">Browse Courses</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => {
                      const sub = submissions.find(s => s.orderId === order.id);
                      return (
                        <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h4 className="font-bold text-white text-sm">{order.itemTitle}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {order.itemType} · {order.currency} {order.amount.toLocaleString('en-BD')} · {new Date(order.createdAt).toLocaleDateString('en-BD')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                order.status === 'paid' ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30' :
                                order.status === 'pending' ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' :
                                'text-red-400 bg-red-500/10 border-red-400/30'
                              }`}>
                                {order.status === 'paid' ? 'Paid ✓' : order.status}
                              </span>
                            </div>
                          </div>

                          {/* Payment submission status */}
                          {sub && (
                            <div className={`text-xs rounded-lg px-3 py-2 flex items-center gap-2 ${
                              sub.status === 'verified' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' :
                              sub.status === 'submitted' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20' :
                              'bg-red-500/10 text-red-400 border border-red-400/20'
                            }`}>
                              {sub.status === 'verified' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                              <span>
                                {sub.status === 'verified' ? 'Payment verified ✓' :
                                 sub.status === 'submitted' ? `Transaction submitted (${sub.transactionId}) — awaiting verification` :
                                 `Rejected: ${sub.adminNote || 'Payment rejected, please resubmit.'}`}
                              </span>
                            </div>
                          )}

                          {/* No submission yet — for pending orders show link */}
                          {order.status === 'pending' && !sub && (
                            <div className="text-xs text-slate-500 bg-black/20 rounded-lg px-3 py-2 flex items-center gap-2">
                              <Smartphone className="h-3.5 w-3.5 text-[#E2136E]" />
                              <span>Order created. <Link to="/courses" className="text-[#2563EB] font-bold hover:underline">Complete bKash payment</Link> to activate.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
