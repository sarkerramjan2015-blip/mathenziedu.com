import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, query, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { Star, Clock, FileText, CheckCircle, PlayCircle, Users, BarChart, ChevronRight, Loader2, AlertCircle, CheckCircle as CheckIcon, BookOpen, Award, Eye } from 'lucide-react';
import { db } from '../lib/firebase';
import { courses as dummyCourses } from '../lib/data';
import type { Course, Enrollment, Order, CourseProgress, LessonProgress } from '../lib/types';
import { applyImageFallback, formatCurrency, imageWithFallback } from '../lib/media';
import { getCourseCover } from '../lib/courseCovers';
import { useAuth } from '../lib/AuthContext';
import { DEMO_MODE, addDemoLocalData, updateDemoLocalData, getDemoLocalData, isPermissionError } from '../lib/demo';
import SEO from '../components/SEO';
import BkashPaymentSection from '../components/BkashPaymentSection';

const fallbackOutcomes = [
  'Advanced problem solving techniques',
  'Shortcuts for time management',
  'Core concepts from scratch',
  'Real-world mathematical modeling',
  'Previous-year question analysis',
  'Direct mental math practice',
];

const fallbackCurriculum = [
  { title: 'Foundations of Number Theory', lessons: 5, time: '2h 10m' },
  { title: 'Algebraic Identities & Equations', lessons: 8, time: '3h 45m' },
  { title: 'Combinatorics & Probability', lessons: 6, time: '2h 30m' },
  { title: 'Geometric Properties', lessons: 7, time: '3h 15m' },
];

interface EnrollmentState {
  exists: boolean;
  status?: string;
  loading: boolean;
}

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [enrollment, setEnrollment] = useState<EnrollmentState>({ exists: false, loading: true });
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({});
const [loadingProgress, setLoadingProgress] = useState(false);
const [togglingLesson, setTogglingLesson] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) { setLoading(false); return; }
      try {
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() } as Course);
        } else {
          setCourse(dummyCourses.find(item => item.id === id) || null);
        }
      } catch {
        setCourse(dummyCourses.find(item => item.id === id) || null);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  // Check if user already has enrollment for this course
  useEffect(() => {
    if (!user || !id) {
      setEnrollment({ exists: false, loading: false });
      return;
    }
    const checkEnrollment = async () => {
      try {
        const q = query(
          collection(db, 'enrollments'),
          where('userId', '==', user.uid),
          where('courseId', '==', id)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data() as Enrollment;
          setEnrollment({ exists: true, status: data.status, loading: false });
        } else if (DEMO_MODE) {
          // Check localStorage demo enrollments
          const demoEnrs = getDemoLocalData('enrollments') as any[];
          const found = demoEnrs.find((e: any) => e.userId === user.uid && e.courseId === id);
          if (found) {
            setEnrollment({ exists: true, status: found.status, loading: false });
          } else {
            setEnrollment({ exists: false, loading: false });
          }
        } else {
          setEnrollment({ exists: false, loading: false });
        }
      } catch {
        setEnrollment({ exists: false, loading: false });
      }
    };
    checkEnrollment();
  }, [user, id]);

  // Reuse the latest course order so refreshing the page cannot create duplicates.
  useEffect(() => {
    if (!user || !id) {
      setCreatedOrder(null);
      return;
    }

    const fetchExistingOrder = async () => {
      try {
        const orderSnapshot = await getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid)));
        const latestOrder = orderSnapshot.docs
          .map(document => ({ id: document.id, ...document.data() }) as Order)
          .filter(order => order.itemType === 'course' && order.itemId === id && (order.status === 'pending' || order.status === 'paid'))
          .sort((a, b) => b.createdAt - a.createdAt)[0];
        setCreatedOrder(latestOrder || null);
      } catch {
        if (DEMO_MODE) {
          const latestDemoOrder = (getDemoLocalData('orders') as Order[])
            .filter(order => order.userId === user.uid && order.itemType === 'course' && order.itemId === id && (order.status === 'pending' || order.status === 'paid'))
            .sort((a, b) => b.createdAt - a.createdAt)[0];
          setCreatedOrder(latestDemoOrder || null);
        }
      }
    };

    fetchExistingOrder();
  }, [user, id]);

  // Load progress when user is enrolled
  useEffect(() => {
    if (!user || !id || !enrollment.exists) return;
    const fetchProgress = async () => {
      setLoadingProgress(true);
      try {
        // Get course-level progress
        const progQuery = query(
          collection(db, 'courseProgress'),
          where('userId', '==', user.uid),
          where('courseId', '==', id)
        );
        const progSnap = await getDocs(progQuery);
        if (!progSnap.empty) {
          setCourseProgress(progSnap.docs[0].data() as CourseProgress);
        }

        // Get lesson-level progress
        const lessonQuery = query(
          collection(db, 'lessonProgress'),
          where('userId', '==', user.uid),
          where('courseId', '==', id)
        );
        const lessonSnap = await getDocs(lessonQuery);
        const lessonMap: Record<string, boolean> = {};
        lessonSnap.forEach(d => {
          lessonMap[d.data().lessonId] = d.data().completed;
        });
        setLessonProgress(lessonMap);
      } catch (e) { console.error(e); }
      finally { setLoadingProgress(false); }
    };
    fetchProgress();
  }, [user, id, enrollment.exists, enrollment.loading]);

  const outcomes = useMemo(() => course?.outcomes?.length ? course.outcomes : fallbackOutcomes, [course]);
  const curriculum = useMemo(() => course?.curriculum?.length ? course.curriculum : fallbackCurriculum, [course]);

  const handleToggleLesson = useCallback(async (lessonIndex: number, lessonTitle: string) => {
    if (!user || !id || !course) return;
    const lessonId = `${id}_lesson_${lessonIndex}`;
    const currentlyCompleted = lessonProgress[lessonId] || false;
    const newCompleted = !currentlyCompleted;
    
    setTogglingLesson(lessonId);
    try {
      // Upsert lesson progress
      const lessonQuery = query(
        collection(db, 'lessonProgress'),
        where('userId', '==', user.uid),
        where('courseId', '==', id),
        where('lessonId', '==', lessonId)
      );
      const snap = await getDocs(lessonQuery);
      const now = Date.now();
      
      if (snap.empty) {
        try {
          await addDoc(collection(db, 'lessonProgress'), {
            userId: user.uid, courseId: id, lessonId, lessonTitle,
            completed: newCompleted, completedAt: newCompleted ? now : 0, createdAt: now, updatedAt: now,
          });
        } catch (e) {
          if (DEMO_MODE && isPermissionError(e)) {
            addDemoLocalData('lessonProgress', { id: `${user.uid}_${lessonId}`, userId: user.uid, courseId: id, lessonId, lessonTitle, completed: newCompleted, completedAt: newCompleted ? now : 0, createdAt: now, updatedAt: now });
          }
        }
      } else {
        try {
          await updateDoc(doc(db, 'lessonProgress', snap.docs[0].id), { completed: newCompleted, completedAt: newCompleted ? now : 0, updatedAt: now });
        } catch (e) {
          if (DEMO_MODE && isPermissionError(e)) {
            updateDemoLocalData('lessonProgress', snap.docs[0].id, { completed: newCompleted, completedAt: newCompleted ? now : 0, updatedAt: now });
          }
        }
      }

      // Update local state
      setLessonProgress(prev => ({ ...prev, [lessonId]: newCompleted }));

      // Recalculate course progress
      const totalLessons = curriculum.length;
      const newLessonMap = { ...lessonProgress, [lessonId]: newCompleted };
      const completedCount = Object.values(newLessonMap).filter(Boolean).length;
      const progressPercent = Math.round((completedCount / totalLessons) * 100);
      const status = completedCount === totalLessons ? 'completed' : completedCount > 0 ? 'in_progress' : 'not_started';

      // Upsert course progress
      const progQuery = query(
        collection(db, 'courseProgress'),
        where('userId', '==', user.uid),
        where('courseId', '==', id)
      );
      const progSnap = await getDocs(progQuery);
      
      const progData = {
        completedLessons: completedCount,
        totalLessons,
        progressPercent,
        lastAccessedAt: now,
        status,
        updatedAt: now,
      };

      if (progSnap.empty) {
        const enrollmentQuery = query(
          collection(db, 'enrollments'),
          where('userId', '==', user.uid),
          where('courseId', '==', id)
        );
        const enrSnap = await getDocs(enrollmentQuery);
        const enrId = enrSnap.empty ? '' : enrSnap.docs[0].id;

        try {
          await addDoc(collection(db, 'courseProgress'), {
            userId: user.uid, userEmail: user.email || '', courseId: id, courseTitle: course.title,
            enrollmentId: enrId, ...progData, createdAt: now,
          });
        } catch (e) {
          if (DEMO_MODE && isPermissionError(e)) {
            addDemoLocalData('courseProgress', { id: `${user.uid}_${id}`, userId: user.uid, userEmail: user.email || '', courseId: id, courseTitle: course.title, enrollmentId: enrId, ...progData, createdAt: now });
          }
        }
      } else {
        try {
          await updateDoc(doc(db, 'courseProgress', progSnap.docs[0].id), progData);
        } catch (e) {
          if (DEMO_MODE && isPermissionError(e)) {
            updateDemoLocalData('courseProgress', progSnap.docs[0].id, progData as any);
          }
        }
      }

      // Update local course progress
      setCourseProgress(prev => prev ? { ...prev, ...progData } : null);

      // If all completed, update enrollment status to completed
      if (status === 'completed') {
        const enrollmentQuery = query(
          collection(db, 'enrollments'),
          where('userId', '==', user.uid),
          where('courseId', '==', id)
        );
        const enrSnap = await getDocs(enrollmentQuery);
        if (!enrSnap.empty) {
          try {
            await updateDoc(doc(db, 'enrollments', enrSnap.docs[0].id), { status: 'completed', progress: 100, updatedAt: now });
          } catch (e) {
            if (DEMO_MODE && isPermissionError(e)) {
              updateDemoLocalData('enrollments', enrSnap.docs[0].id, { status: 'completed', progress: 100, updatedAt: now });
            }
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setTogglingLesson(null); }
  }, [user, id, course, curriculum, lessonProgress]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }
    if (!course || !id) return;

    setActionLoading(true);
    setActionMessage(null);

    try {
      const isFree = course.price === 0;

      if (isFree) {
        // Free course — create enrollment directly
        const enrollmentData: Omit<Enrollment, 'id'> = {
          userId: user.uid,
          userEmail: user.email || '',
          courseId: id,
          courseTitle: course.title,
          mainCategory: course.mainCategory || course.category,
          subCategory: course.subCategory || '',
          enrollmentType: 'free',
          status: 'active',
          progress: 0,
          enrolledAt: Date.now(),
        };
        try {
          await addDoc(collection(db, 'enrollments'), enrollmentData);
        } catch (e) {
          if (!DEMO_MODE || !isPermissionError(e)) throw e;
          addDemoLocalData('enrollments', enrollmentData);
        }
        setEnrollment({ exists: true, status: 'active', loading: false });
        setActionMessage({ type: 'success', text: DEMO_MODE ? 'Enrolled! (Demo mode: saved locally only.)' : 'You are now enrolled! Start learning right away.' });
      } else {
        if (createdOrder?.status === 'pending') {
          setActionMessage({ type: 'info', text: 'Your existing order is ready below. Complete the bKash payment and submit the transaction ID.' });
          return;
        }
        if (createdOrder?.status === 'paid') {
          setActionMessage({ type: 'info', text: 'Payment is verified. Your course access is being refreshed; contact support if it does not appear shortly.' });
          return;
        }

        // Paid course — create pending order
        const orderData: Omit<Order, 'id'> = {
          userId: user.uid,
          userEmail: user.email || '',
          itemType: 'course',
          itemId: id,
          itemTitle: course.title,
          amount: course.price,
          currency: 'BDT',
          status: 'pending',
          paymentMethod: 'bkash_manual',
          createdAt: Date.now(),
        };
        try {
          const orderRef = await addDoc(collection(db, 'orders'), orderData);
          setCreatedOrder({ id: orderRef.id, ...orderData });
        } catch (e) {
          if (!DEMO_MODE || !isPermissionError(e)) throw e;
          const savedOrder = addDemoLocalData('orders', orderData) as Order;
          setCreatedOrder(savedOrder);
        }
        setActionMessage({
          type: 'info',
          text: DEMO_MODE ? 'Order created (demo). Pay via bKash and submit TrxID.' : 'Order created! Please pay via bKash and submit your transaction ID for verification.',
        });
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setActionMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-4">Course not found</h1>
          <Link to="/courses" className="text-[#10B981] font-bold hover:text-emerald-300">Back to courses</Link>
        </div>
      </div>
    );
  }

  const instructorInitial = (course.instructor || 'M').charAt(0);
  const discountPrice = Math.round(course.price * 1.5);
  const isFree = course.price === 0;

  const getButtonContent = () => {
    if (actionLoading) return <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>;
    if (enrollment.loading) return <><Loader2 className="h-5 w-5 animate-spin" /> Checking...</>;
    if (enrollment.exists) {
      if (enrollment.status === 'active' || enrollment.status === 'completed') {
        return <>✓ Enrolled</>;
      }
      if (enrollment.status === 'pending_payment') {
        return <>Payment Pending</>;
      }
    }
    if (!user) return 'Login to Enroll';
    if (isFree) return 'Enroll Free';
    if (createdOrder?.status === 'pending') return 'Continue Payment';
    if (createdOrder?.status === 'paid') return 'Payment Verified';
    return 'Enroll Now — Pay Later';
  };

  return (
    <div className="min-h-screen relative z-10 w-full overflow-x-hidden">
      <SEO 
        title={course.title}
        description={course.description.slice(0, 160)}
        path={`/courses/${course.id}`}
        ogType="product"
      />
      <div className="py-14 sm:py-20 md:py-24 relative overflow-hidden border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 text-sm font-medium mb-6 backdrop-blur-md bg-white/10 w-max max-w-full px-4 py-2 rounded-full border border-white/20">
            <Link to="/courses" className="text-slate-300 hover:text-white">Courses</Link>
            <ChevronRight className="h-4 w-4 text-slate-500" />
            <span className="text-[#10B981] truncate">{course.mainCategory || course.category}</span>
            {course.subCategory && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-500" />
                <span className="text-blue-400 truncate">{course.subCategory}</span>
              </>
            )}
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 max-w-4xl text-balance text-white">
            {course.title}
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mb-10 leading-relaxed font-light">
            {course.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="bg-[#2563EB] h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg">{instructorInitial}</span>
              <span className="font-semibold text-white">{course.instructor}</span>
            </div>
            <div className="flex items-center gap-1 text-[#F59E0B] bg-[#F59E0B]/10 px-4 py-2 rounded-full border border-[#F59E0B]/20 backdrop-blur-sm">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-bold">{course.rating || '4.8'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <Users className="h-4 w-4" />
              <span className="font-medium">{(course.enrolled || 0).toLocaleString('en-BD')} enrolled</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-2/3 min-w-0">
            <div className="mb-12">
              <h2 className="text-3xl font-display font-bold text-white mb-6">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outcomes.map(item => (
                  <div key={item} className="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-[#10B981] flex-shrink-0" />
                    <span className="text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-display font-bold text-white mb-6">Course Curriculum</h2>
              
              {/* Progress bar for enrolled users */}
              {enrollment.exists && (enrollment.status === 'active' || enrollment.status === 'completed') && (
                <div className="mb-6 bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#2563EB]" />
                      <span className="font-bold text-white">Your Progress</span>
                    </div>
                    <span className="text-sm font-bold text-[#10B981]">
                      {courseProgress?.completedLessons ?? Object.values(lessonProgress).filter(Boolean).length} / {curriculum.length} lessons
                    </span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      (courseProgress?.progressPercent ?? 0) >= 100 ? 'bg-[#10B981]' : 'bg-gradient-to-r from-[#2563EB] to-[#10B981]'
                    }`} style={{ width: `${courseProgress?.progressPercent ?? 0}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{courseProgress?.progressPercent ?? 0}% complete</span>
                    {courseProgress?.status === 'completed' && (
                      <span className="text-[#10B981] font-bold flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Completed</span>
                    )}
                  </div>
                </div>
              )}

              <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md">
                {curriculum.map((module, index) => {
                  const lessonId = `${id}_lesson_${index}`;
                  const isCompleted = lessonProgress[lessonId] || false;
                  return (
                  <div key={module.title} className={`border-b border-white/10 last:border-b-0 transition-colors ${isCompleted ? 'bg-[#10B981]/5' : index === 0 ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                    <div className="p-5 flex flex-col sm:flex-row sm:justify-between gap-3 sm:items-center">
                      <div className="flex items-center gap-3">
                        {enrollment.exists && (enrollment.status === 'active' || enrollment.status === 'completed') && (
                          <button
                            onClick={() => handleToggleLesson(index, module.title)}
                            disabled={togglingLesson === lessonId}
                            className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                              isCompleted
                                ? 'bg-[#10B981] border-[#10B981] text-white'
                                : 'border-white/30 hover:border-[#2563EB] hover:bg-[#2563EB]/10'
                            }`}
                          >
                            {togglingLesson === lessonId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isCompleted ? (
                              <CheckIcon className="h-4 w-4" />
                            ) : null}
                          </button>
                        )}
                        <div>
                          <div className={`font-bold ${isCompleted ? 'text-[#10B981]' : 'text-white'}`}>Module {index + 1}: {module.title}</div>
                          {isCompleted && <div className="text-[10px] text-[#10B981] font-medium">Completed</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="bg-black/30 px-2 py-1 rounded">{module.lessons} lessons</span>
                        <span>{module.time}</span>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
              {!enrollment.loading && !enrollment.exists && (
                <p className="mt-4 text-xs text-slate-500">Enroll in this course to track your progress.</p>
              )}
            </div>
            
            <div className="mb-12">
              <h2 className="text-3xl font-display font-bold text-white mb-6">Instructor</h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="h-24 w-24 rounded-2xl bg-[#2563EB]/20 border border-[#2563EB]/40 flex-shrink-0 flex items-center justify-center text-3xl font-bold text-[#F8FAFC]">{instructorInitial}</div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{course.instructor}</h3>
                  <p className="text-[#2563EB] font-medium mb-4">Senior Mathematics Faculty</p>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    Experienced in academic math, olympiad preparation, and competitive exam training. The teaching style focuses on clear logic, repeatable steps, and confidence under exam pressure.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="sticky top-28 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="relative">
                <img src={imageWithFallback(getCourseCover(course.title, course.image))} onError={applyImageFallback} alt={`${course.title} course cover`} loading="lazy" className="h-72 w-full object-cover object-top rounded-t-3xl opacity-80" />
                <div className="absolute inset-0 bg-[#0F172A]/40 flex items-center justify-center">
                  <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-xl">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex flex-wrap items-end gap-3">
                  <div className="text-4xl font-display font-bold text-white leading-none">
                    {isFree ? <span className="text-[#10B981]">Free</span> : formatCurrency(course.price)}
                  </div>
                  {!isFree && <div className="text-slate-400 line-through text-lg">৳{discountPrice.toLocaleString('en-BD')}</div>}
                  {!isFree && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded sm:ml-auto">33% OFF</span>}
                </div>

                {/* Enrollment status badge */}
                {enrollment.exists && enrollment.status === 'active' && (
                  <div className="mb-4 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 px-4 py-3 text-sm font-medium text-[#10B981] flex items-center gap-2">
                    <CheckIcon className="h-4 w-4" /> Enrolled — access all content
                  </div>
                )}
                {enrollment.exists && enrollment.status === 'pending_payment' && (
                  <div className="mb-4 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-4 py-3 text-sm font-medium text-[#F59E0B] flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Payment pending — complete to activate
                  </div>
                )}

                {/* Action message */}
                {actionMessage && (
                  <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                    actionMessage.type === 'success' ? 'border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]' :
                    actionMessage.type === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-400' :
                    'border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#F59E0B]'
                  }`}>
                    {actionMessage.type === 'success' ? <CheckIcon className="h-4 w-4" /> :
                     actionMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
                     <AlertCircle className="h-4 w-4" />}
                    {actionMessage.text}
                  </div>
                )}

                <button
                  onClick={handleEnroll}
                  disabled={actionLoading || enrollment.loading || enrollment.exists || createdOrder?.status === 'paid'}
                  className={`w-full font-bold text-lg py-4 rounded-xl mb-4 transition-all shadow-lg flex items-center justify-center gap-2 ${
                    enrollment.exists || createdOrder?.status === 'paid'
                      ? 'bg-[#10B981]/30 text-[#10B981] cursor-default border border-[#10B981]/30'
                      : 'bg-[#2563EB] hover:bg-blue-500 text-white shadow-blue-500/30'
                  } disabled:opacity-60`}
                >
                  {getButtonContent()}
                </button>

                {!isFree && !enrollment.exists && !createdOrder && (
                  <div className="text-center text-xs text-slate-500 mb-6 font-medium">
                    Pay with bKash manually. Admin verifies within 24 hours.
                  </div>
                )}

                {/* bKash Payment Section — shown after order is created */}
                {createdOrder?.status === 'pending' && user && (
                  <div className="mb-6">
                    <BkashPaymentSection
                      order={createdOrder}
                      userId={user.uid}
                      userEmail={user.email || ''}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 text-slate-300">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-slate-400" />
                      <span className="font-medium">Duration</span>
                    </div>
                    <span className="text-white font-semibold">{course.duration || '12 Weeks'}</span>
                  </div>
                  <div className="border-t border-white/10"></div>
                  <div className="flex items-center justify-between gap-4 text-slate-300">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <span className="font-medium">Lessons</span>
                    </div>
                    <span className="text-white font-semibold">{course.lessons || 10} videos</span>
                  </div>
                  <div className="border-t border-white/10"></div>
                  <div className="flex items-center justify-between gap-4 text-slate-300">
                    <div className="flex items-center gap-3">
                      <BarChart className="h-5 w-5 text-slate-400" />
                      <span className="font-medium">Level</span>
                    </div>
                    <span className="text-[#F59E0B] font-bold">{course.level || 'Advanced'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
