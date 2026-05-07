import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Star, Clock, FileText, CheckCircle, PlayCircle, Users, BarChart, ChevronRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { courses as dummyCourses } from '../lib/data';
import type { Course } from '../lib/types';
import { applyImageFallback, formatCurrency, imageWithFallback } from '../lib/media';
import { useAuth } from '../lib/AuthContext';

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

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollMessage, setEnrollMessage] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() } as Course);
        } else {
          setCourse(dummyCourses.find(item => item.id === id) || null);
        }
      } catch (error) {
        console.error(error);
        setCourse(dummyCourses.find(item => item.id === id) || null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const outcomes = useMemo(() => course?.outcomes?.length ? course.outcomes : fallbackOutcomes, [course]);
  const curriculum = useMemo(() => course?.curriculum?.length ? course.curriculum : fallbackCurriculum, [course]);

  const handleEnroll = () => {
    if (!user) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    setEnrollMessage('Enrollment request saved. Connect payment/enrollment automation before taking live payments.');
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

  return (
    <div className="min-h-screen relative z-10 w-full overflow-x-hidden">
      <div className="py-14 sm:py-20 md:py-24 relative overflow-hidden border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 text-sm font-medium mb-6 backdrop-blur-md bg-white/10 w-max max-w-full px-4 py-2 rounded-full border border-white/20">
            <Link to="/courses" className="text-slate-300 hover:text-white">Courses</Link>
            <ChevronRight className="h-4 w-4 text-slate-500" />
            <span className="text-[#10B981] truncate">{course.category}</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 max-w-4xl text-balance text-white">
            {course.title}
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mb-10 leading-relaxed font-light">
            {course.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="bg-[#2563EB] h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg">
                {instructorInitial}
              </span>
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
                {outcomes.map((item) => (
                  <div key={item} className="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-[#10B981] flex-shrink-0" />
                    <span className="text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-display font-bold text-white mb-6">Course Curriculum</h2>
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md">
                {curriculum.map((module, index) => (
                  <div key={module.title} className={`border-b border-white/10 last:border-b-0 ${index === 0 ? 'bg-white/5' : 'hover:bg-white/5 transition-colors'}`}>
                    <div className="p-5 flex flex-col sm:flex-row sm:justify-between gap-3 sm:items-center">
                      <div className="font-bold text-white">Module {index + 1}: {module.title}</div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="bg-black/30 px-2 py-1 rounded">{module.lessons} lessons</span>
                        <span>{module.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-12">
              <h2 className="text-3xl font-display font-bold text-white mb-6">Instructor</h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="h-24 w-24 rounded-2xl bg-[#2563EB]/20 border border-[#2563EB]/40 flex-shrink-0 flex items-center justify-center text-3xl font-bold text-[#F8FAFC]">
                  {instructorInitial}
                </div>
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
              <div className="h-48 relative">
                <img src={imageWithFallback(course.image)} onError={applyImageFallback} alt={course.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-[#0F172A]/40 flex items-center justify-center">
                  <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-xl">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex flex-wrap items-end gap-3">
                  <div className="text-4xl font-display font-bold text-white leading-none">
                    {formatCurrency(course.price)}
                  </div>
                  {course.price > 0 && <div className="text-slate-400 line-through text-lg">৳{discountPrice.toLocaleString('en-BD')}</div>}
                  {course.price > 0 && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded sm:ml-auto">33% OFF</span>}
                </div>

                <button onClick={handleEnroll} className="w-full bg-[#2563EB] hover:bg-blue-500 text-white font-bold text-lg py-4 rounded-xl mb-4 transition-all shadow-lg shadow-blue-500/30">
                  {user ? 'Request Enrollment' : 'Login to Enroll'}
                </button>
                <div className="text-center text-sm text-slate-400 mb-6 font-medium">Payment automation ready to connect</div>
                {enrollMessage && (
                  <div className="mb-6 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 p-3 text-sm font-medium text-[#10B981]">
                    {enrollMessage}
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
