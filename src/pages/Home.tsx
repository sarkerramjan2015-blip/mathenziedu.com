import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, Clock, Users, PlayCircle, BookOpen, Brain, Award, Calendar, BookMarked, Sigma, Library, Shapes, BarChart, Shield, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { articles as defaultArticles, courses as dummyCourses, exams as defaultExams, MAIN_CATEGORIES_DATA } from '../lib/data';
import { collection, getDocs, doc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { isAdminUser } from '../lib/admin';
import type { Article, MainCategory, SubCategory, Course } from '../lib/types';
import { applyImageFallback, formatCurrency, imageWithFallback } from '../lib/media';
import { useSiteSettings } from '../lib/useSiteConfig';
import { COURSE_COVER_MAP, getCourseCover } from '../lib/courseCovers';
import { getCategoryCover } from '../lib/categoryCovers';
import { getExamCover } from '../lib/examCovers';
import { formatDhakaDateTime, getExamDurationMinutes, getExamStatus, toDate } from '../lib/examStatus';
import ExamCountdown from '../components/ExamCountdown';
import SEO from '../components/SEO';
import type { Exam } from '../lib/types';

const MAIN_ICONS: Record<string, React.ElementType> = {
  'Academic Maths': BookOpen,
  'Olympiad': Award,
  'Admission Course': Brain,
  'Books Corner': Library,
  'Mathematics and Nature': Shapes,
};

// Subcategory icons mapping
const SUBCAT_COLORS: Record<string, string> = {
  'Standard One-Seven': 'text-emerald-400',
  'O Level': 'text-blue-400',
  'A Level': 'text-purple-400',
  'Junior Level': 'text-yellow-400',
  'Secondary Level': 'text-orange-400',
  'Higher Secondary Level': 'text-red-400',
  'University Admission': 'text-sky-400',
  'Engineering Admission': 'text-cyan-400',
  'Medical Admission': 'text-green-400',
  'Other Admission Courses': 'text-slate-400',
  'Academic Books': 'text-amber-400',
  'Olympiad Books': 'text-indigo-400',
  'Admission Books': 'text-teal-400',
  'Practice Books': 'text-pink-400',
  'Articles': 'text-rose-400',
  'Visual Learning': 'text-violet-400',
  'Real-life Mathematics': 'text-lime-400',
  'Nature Patterns': 'text-emerald-300',
};

export default function Home() {
  const { user, userRole } = useAuth();
  const siteCfg = useSiteSettings();
  const isAdmin = isAdminUser(userRole, user?.email, user?.emailVerified);
  const [courses, setCourses] = useState<Course[]>(dummyCourses);
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [articles, setArticles] = useState<Article[]>(defaultArticles.slice(0, 3));
  const [featuredExams, setFeaturedExams] = useState<Exam[]>(defaultExams.slice(0, 3));
  const [loadingArticles, setLoadingArticles] = useState(true);

  // Build the display categories from Firestore or fallback
  const displayCategories = categories.length > 0 ? categories : MAIN_CATEGORIES_DATA;
  const displaySubCategories = subCategories;

  const fetchContent = async () => {
    try {
      const [catSnap, subSnap, courseSnap, articleSnap] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'subcategories')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'articles')),
      ]);

      if (!catSnap.empty) {
        setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MainCategory[]);
      }
      if (!subSnap.empty) {
        setSubCategories(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubCategory[]);
      }
      if (!courseSnap.empty) {
        setCourses(courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[]);
      }
      if (!articleSnap.empty) {
        setArticles(articleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 3) as Article[]);
      }
      setLoadingArticles(false);
    } catch (error) {
      console.error(error);
      // Fallback: use MAIN_CATEGORIES_DATA if no Firestore data
      setCategories(MAIN_CATEGORIES_DATA.map((c, i) => ({
        id: String(i + 1),
        title: c.title,
        description: c.description,
        color: c.color,
        order: c.order,
      })));
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    const sortFeaturedExams = (items: Exam[]) => items
      .filter(exam => (exam.publishStatus || 'published') === 'published' && (exam.isFeatured ?? true))
      .sort((a, b) => {
        const aTime = toDate(a.scheduledStartAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bTime = toDate(b.scheduledStartAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 4);

    setFeaturedExams(sortFeaturedExams(defaultExams));
    const q = query(collection(db, 'exams'), where('publishStatus', '==', 'published'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setFeaturedExams(sortFeaturedExams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Exam[]));
      }
    }, (error) => {
      console.error(error);
      setFeaturedExams(sortFeaturedExams(defaultExams));
    });
    return unsubscribe;
  }, []);

  const seedDummyData = async () => {
    if (!isAdmin) return;
    try {
      // Seed Main Categories
      const dummyCats = [
        { id: 'cat1', title: 'Academic Maths', description: 'School & College curriculum', color: 'text-[#F59E0B]', order: 1 },
        { id: 'cat2', title: 'Olympiad', description: 'Problem Solving & competition', color: 'text-[#2563EB]', order: 2 },
        { id: 'cat3', title: 'Admission Course', description: 'University & job admission prep', color: 'text-[#10B981]', order: 3 },
        { id: 'cat4', title: 'Books Corner', description: 'Book resources & practice', color: 'text-purple-400', order: 4 },
        { id: 'cat5', title: 'Mathematics and Nature', description: 'Articles, visuals & real-life math', color: 'text-rose-400', order: 5 },
      ];
      
      for (const cat of dummyCats) {
        await setDoc(doc(db, 'categories', cat.id), {
          title: cat.title,
          description: cat.description,
          color: cat.color,
          order: cat.order
        });
      }

      // Seed SubCategories — expanded for Bangladesh market
      const dummySubs = [
        // Academic Maths
        { parentMainCategory: 'Academic Maths', title: 'Standard One-Seven', order: 1 },
        { parentMainCategory: 'Academic Maths', title: 'Standard Eight-Ten', order: 2 },
        { parentMainCategory: 'Academic Maths', title: 'SSC Mathematics', order: 3 },
        { parentMainCategory: 'Academic Maths', title: 'HSC Higher Mathematics', order: 4 },
        { parentMainCategory: 'Academic Maths', title: 'O Level', order: 5 },
        { parentMainCategory: 'Academic Maths', title: 'A Level', order: 6 },
        // Olympiad
        { parentMainCategory: 'Olympiad', title: 'Primary Level', order: 1 },
        { parentMainCategory: 'Olympiad', title: 'Junior Level', order: 2 },
        { parentMainCategory: 'Olympiad', title: 'Secondary Level', order: 3 },
        { parentMainCategory: 'Olympiad', title: 'Higher Secondary Level', order: 4 },
        { parentMainCategory: 'Olympiad', title: 'Problem Solving', order: 5 },
        { parentMainCategory: 'Olympiad', title: 'Number Theory', order: 6 },
        { parentMainCategory: 'Olympiad', title: 'Geometry', order: 7 },
        { parentMainCategory: 'Olympiad', title: 'Combinatorics', order: 8 },
        { parentMainCategory: 'Olympiad', title: 'Algebra', order: 9 },
        // Admission Course
        { parentMainCategory: 'Admission Course', title: 'University Admission Math', order: 1 },
        { parentMainCategory: 'Admission Course', title: 'Engineering Admission Math', order: 2 },
        { parentMainCategory: 'Admission Course', title: 'Medical Admission Math', order: 3 },
        { parentMainCategory: 'Admission Course', title: 'GST Admission Math', order: 4 },
        { parentMainCategory: 'Admission Course', title: 'IBA/BBA Math', order: 5 },
        { parentMainCategory: 'Admission Course', title: 'Written Math Preparation', order: 6 },
        { parentMainCategory: 'Admission Course', title: 'Shortcut Math & Problem Solving', order: 7 },
        // Books Corner
        { parentMainCategory: 'Books Corner', title: 'Academic Books', order: 1 },
        { parentMainCategory: 'Books Corner', title: 'Olympiad Books', order: 2 },
        { parentMainCategory: 'Books Corner', title: 'Admission Books', order: 3 },
        { parentMainCategory: 'Books Corner', title: 'Practice Books', order: 4 },
        { parentMainCategory: 'Books Corner', title: 'Formula Sheets', order: 5 },
        { parentMainCategory: 'Books Corner', title: 'PDF Resources', order: 6 },
        { parentMainCategory: 'Books Corner', title: 'Model Test Books', order: 7 },
        // Mathematics and Nature
        { parentMainCategory: 'Mathematics and Nature', title: 'Fibonacci Sequence', order: 1 },
        { parentMainCategory: 'Mathematics and Nature', title: 'Golden Ratio', order: 2 },
        { parentMainCategory: 'Mathematics and Nature', title: 'Symmetry', order: 3 },
        { parentMainCategory: 'Mathematics and Nature', title: 'Fractals', order: 4 },
        { parentMainCategory: 'Mathematics and Nature', title: 'Geometry in Nature', order: 5 },
        { parentMainCategory: 'Mathematics and Nature', title: 'Mathematical Patterns', order: 6 },
        { parentMainCategory: 'Mathematics and Nature', title: 'Real-life Mathematics', order: 7 },
      ];

      for (let i = 0; i < dummySubs.length; i++) {
        await setDoc(doc(db, 'subcategories', `sub${i + 1}`), dummySubs[i]);
      }

      // Seed Courses — 8 courses
      const dummyCoursesList = [
        { id: '1', title: 'Standard One-Seven Foundation Mathematics', description: 'Build a strong mathematics foundation for primary and junior secondary students with structured lessons.', instructor: 'Mathemzi Edu Mentor', price: 1200, duration: '8 Weeks', lessons: 32, rating: 4.7, mainCategory: 'Academic Maths', subCategory: 'Standard One-Seven', level: 'Beginner', image: COURSE_COVER_MAP['Standard One-Seven Foundation Mathematics'], outcomes: ['Strong arithmetic and number sense', 'Basic algebra and geometry fundamentals', 'Problem solving confidence', 'Weekly practice tests'], curriculum: [{ title: 'Number Systems', lessons: 6, time: '1h 50m' }, { title: 'Basic Operations', lessons: 8, time: '2h 30m' }, { title: 'Fractions & Decimals', lessons: 6, time: '1h 45m' }] },
        { id: '2', title: 'SSC Mathematics Complete Course', description: 'Complete SSC Mathematics syllabus coverage with board-focused examples and model tests.', instructor: 'Prof. Anisul Islam', price: 1500, duration: '12 Weeks', lessons: 48, rating: 4.6, mainCategory: 'Academic Maths', subCategory: 'SSC Mathematics', level: 'Intermediate', image: COURSE_COVER_MAP['SSC Mathematics Complete Course'], outcomes: ['Full syllabus mastery', 'Board exam pattern practice', 'Written answer techniques'], curriculum: [{ title: 'Algebra & Equations', lessons: 10, time: '3h 50m' }, { title: 'Geometry & Trigonometry', lessons: 12, time: '4h 20m' }] },
        { id: '3', title: 'HSC Higher Mathematics Foundation', description: 'Master HSC Higher Mathematics with detailed calculus, geometry, and board exam preparation.', instructor: 'Prof. Anisul Islam', price: 2000, duration: '12 Weeks', lessons: 48, rating: 4.7, mainCategory: 'Academic Maths', subCategory: 'HSC Higher Mathematics', level: 'Advanced', image: COURSE_COVER_MAP['HSC Higher Mathematics Foundation'], outcomes: ['Full HSC Higher Math coverage', 'Calculus mastery', 'Board written answer patterns'], curriculum: [{ title: 'Differentiation', lessons: 12, time: '4h 30m' }, { title: 'Integration', lessons: 12, time: '4h 30m' }] },
        { id: '4', title: 'O Level Mathematics Preparation', description: 'Cambridge O Level Mathematics complete preparation with past paper practice.', instructor: 'Mathemzi Edu Mentor', price: 2500, duration: '10 Weeks', lessons: 40, rating: 4.5, mainCategory: 'Academic Maths', subCategory: 'O Level', level: 'Intermediate', image: COURSE_COVER_MAP['O Level Mathematics Preparation'], outcomes: ['Complete O Level syllabus', 'Past paper strategies', 'Scientific calculator skills'], curriculum: [{ title: 'Number & Algebra', lessons: 12, time: '3h 40m' }, { title: 'Geometry', lessons: 10, time: '3h 15m' }] },
        { id: '5', title: 'A Level Pure Mathematics Starter', description: 'A Level Pure Mathematics 1 & 2 complete preparation with proof-based approach.', instructor: 'Prof. Anisul Islam', price: 3000, duration: '12 Weeks', lessons: 52, rating: 4.8, mainCategory: 'Academic Maths', subCategory: 'A Level', level: 'Advanced', image: COURSE_COVER_MAP['A Level Pure Mathematics Starter'], outcomes: ['Full A Level coverage', 'Proof-based reasoning', 'Exam techniques'], curriculum: [{ title: 'Functions', lessons: 8, time: '3h 30m' }, { title: 'Trigonometry', lessons: 10, time: '4h 00m' }] },
        { id: '6', title: 'Junior Math Olympiad Preparation', description: 'Olympiad training for junior students with problem-solving and mock contests.', instructor: 'Dr. Hasan Rahman', price: 2000, duration: '8 Weeks', lessons: 36, rating: 4.9, mainCategory: 'Olympiad', subCategory: 'Junior Level', level: 'Intermediate', image: COURSE_COVER_MAP['Junior Math Olympiad Preparation'], outcomes: ['Number theory', 'Combinatorics', 'Geometry proofs'], curriculum: [{ title: 'Number Theory', lessons: 8, time: '2h 50m' }, { title: 'Algebra', lessons: 8, time: '2h 50m' }] },
        { id: '7', title: 'Secondary Math Olympiad Problem Solving', description: 'Advanced olympiad training covering core areas with competition-level practice.', instructor: 'Dr. Hasan Rahman', price: 2500, duration: '10 Weeks', lessons: 40, rating: 4.8, mainCategory: 'Olympiad', subCategory: 'Secondary Level', level: 'Advanced', image: COURSE_COVER_MAP['Secondary Math Olympiad Problem Solving'], outcomes: ['Advanced number theory', 'Combinatorics', 'National olympiad prep'], curriculum: [{ title: 'Number Theory Advanced', lessons: 8, time: '3h 10m' }, { title: 'Combinatorics', lessons: 8, time: '3h 00m' }] },
        { id: '8', title: 'Engineering Admission Math Crash Course', description: 'Focused engineering admission math preparation with shortcut techniques.', instructor: 'Ayesha Siddiqua', price: 2000, duration: '10 Weeks', lessons: 40, rating: 4.9, mainCategory: 'Admission Course', subCategory: 'Engineering Admission Math', level: 'Advanced', image: COURSE_COVER_MAP['Engineering Admission Math Crash Course'], outcomes: ['Shortcut techniques', 'Pattern recognition', 'Mock test strategy'], curriculum: [{ title: 'Arithmetic Speed', lessons: 8, time: '3h 00m' }, { title: 'Algebra', lessons: 10, time: '3h 50m' }] },
      ];

      for (const course of dummyCoursesList) {
        await setDoc(doc(db, 'courses', course.id), {
          title: course.title, description: course.description,
          category: course.mainCategory, mainCategory: course.mainCategory, subCategory: course.subCategory,
          instructor: course.instructor, price: course.price, rating: course.rating,
          lessons: course.lessons, duration: course.duration, image: course.image,
          level: course.level, enrolled: 0, outcomes: course.outcomes, curriculum: course.curriculum,
        });
      }
      
      alert('Demo data seeded successfully! Refresh to see changes.');
      fetchContent();
    } catch (error) {
      console.error(error);
      alert('Error seeding data: ' + (error as Error).message);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  // Get subcategories for a main category
  const getSubsForMain = (mainTitle: string) => {
    if (subCategories.length > 0) {
      return subCategories.filter(s => s.parentMainCategory === mainTitle);
    }
    // Fallback to data.ts static data
    const found = MAIN_CATEGORIES_DATA.find(c => c.title === mainTitle);
    return found ? found.subCategories.map((title, i) => ({ id: `sub-${i}`, title, parentMainCategory: mainTitle })) : [];
  };

  return (
    <>
      <SEO 
        title="Mathemzi Edu | Premium Mathematics Learning Platform in Bangladesh"
        description="Master Mathematics for School, Olympiad & Admission Success. Mathemzi Edu helps Bangladeshi students build strong mathematical foundations through structured courses, practice exams, books, and progress tracking."
        path="/"
        keywords="mathematics learning Bangladesh, math courses, olympiad preparation, admission math, SSC math, HSC higher math, O Level math, A Level math, math books Bangladesh, math practice exams"
      />
      <div className="w-full">
      {/* Decorative Math Symbols */}
      <div className="absolute top-20 right-40 text-white/5 text-9xl font-serif select-none pointer-events-none">∑</div>
      <div className="absolute bottom-40 left-10 text-white/5 text-8xl font-serif select-none pointer-events-none">∫</div>
      <div className="absolute top-1/2 left-1/4 text-white/5 text-6xl font-serif select-none pointer-events-none">π</div>
      <div className="absolute bottom-20 right-1/4 text-white/5 text-7xl font-serif select-none pointer-events-none">√</div>

      {/* Hero Section */}
      <section className="relative text-[#F8FAFC] pt-24 pb-32 z-10 w-full overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-[#10B981]/20 border border-[#10B981]/30 rounded-full text-[#10B981] text-xs font-bold uppercase tracking-wider mb-6"
          >
            <span className="animate-pulse w-2 h-2 bg-[#10B981] rounded-full"></span>
            <span>Bangladesh's Premium Math Platform</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="text-[2.15rem] sm:text-5xl md:text-7xl font-extrabold leading-[1.08] mb-6 max-w-4xl mx-auto tracking-tight text-[#F8FAFC] break-words"
          >
            {siteCfg.heroTitle}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed text-balance"
          >
            {siteCfg.heroSubtitle}
          </motion.p>

          {/* Hero Sub-tagline in Bangla */}
          {siteCfg.banglaTagline && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="text-base md:text-lg text-[#F59E0B] max-w-2xl mx-auto mb-10 font-bold"
          >
            &#x201C;{siteCfg.banglaTagline}&#x201D;
          </motion.p>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to={siteCfg.heroBtn1Link} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-[#0F172A] font-bold text-lg transition-transform hover:scale-105 duration-300 shadow-xl hover:bg-slate-100 flex items-center justify-center gap-2">
              {siteCfg.heroBtn1Text} <ChevronRight className="h-5 w-5" />
            </Link>
            <Link to={siteCfg.heroBtn2Link} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg font-bold text-lg text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
              {siteCfg.heroBtn2Text} <Calendar className="h-5 w-5" />
            </Link>
            <Link to={siteCfg.heroBtn3Link} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-purple-500/20 border border-purple-400/30 backdrop-blur-lg font-bold text-lg text-white hover:bg-purple-500/30 hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
              {siteCfg.heroBtn3Text} <BookMarked className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feature Category Cards */}
      <section className="py-16 -mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isAdmin && (
            <div className="mb-4 flex justify-end">
              <button 
                onClick={seedDummyData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs"
              >
                Admin: Seed Default Data
              </button>
            </div>
          )}
          
          {/* Main Category Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 min-w-0"
          >
            {displayCategories.map((cat, i) => {
              const IconComp = MAIN_ICONS[cat.title] || BookOpen;
              const subs = getSubsForMain(cat.title);
              // Map dedicated pages
              const linkMap: Record<string, string> = {
                'Admission Course': '/admission',
                'Books Corner': '/books',
                'Mathematics and Nature': '/mathematics-and-nature',
              };
              const href = linkMap[cat.title] || `/courses?mainCategory=${encodeURIComponent(cat.title)}`;
              return (
                <Link to={href} key={cat.id || i} className="min-w-0">
                  <motion.div variants={itemVariants} className="relative overflow-hidden border border-white/10 p-4 md:p-5 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 cursor-pointer group flex flex-col shadow-lg hover:shadow-[0_0_26px_rgba(37,99,235,0.25)] h-full min-h-[205px] min-w-0">
                    <img src={imageWithFallback(getCategoryCover(cat.title, cat.coverImage))} onError={applyImageFallback} alt={`${cat.title} category`} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-[#0F172A]/30" />
                    <div className="relative z-10 flex h-full flex-col">
                    <IconComp className={`h-8 w-8 ${cat.color || 'text-white'} mb-3 group-hover:scale-110 transition-transform duration-300 drop-shadow`} />
                    <div className={`font-bold text-base md:text-lg mb-1 ${cat.color || 'text-white'}`}>{cat.title}</div>
                    <div className="text-xs text-slate-200 mb-2 leading-relaxed">{cat.description}</div>
                    {/* Subcategory pills */}
                    {subs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-white/5">
                        {subs.slice(0, 3).map((sub, si) => (
                          <span key={sub.id || si} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 ${SUBCAT_COLORS[sub.title] || 'text-slate-400'}`}>
                            {sub.title}
                          </span>
                        ))}
                        {subs.length > 3 && (
                          <span className="text-[9px] text-slate-500">+{subs.length - 3}</span>
                        )}
                      </div>
                    )}
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Live Exam Widget / Upcoming Exams */}
      <section className="py-14 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <h2 className="text-3xl font-extrabold mb-2 text-[#F8FAFC]">Practice Exams</h2>
              <p className="text-slate-400">Test your skills with MCQ and written exams. Get results and earn certificates.</p>
            </div>
            <Link to="/exams" className="text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors hover:translate-x-1 duration-300">
              All Exams <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {featuredExams.slice(0, 4).map((exam) => {
              const status = getExamStatus(exam);
              const buttonLabel = status === 'registration_not_open'
                ? 'Opens Soon / শীঘ্রই শুরু'
                : status === 'registration_open'
                  ? user ? 'Register / রেজিস্টার করুন' : 'Login to Register / লগইন করুন'
                  : status === 'registration_closed'
                    ? 'Registration Closed / রেজিস্ট্রেশন বন্ধ'
                    : status === 'live'
                      ? 'Start Exam / পরীক্ষা শুরু করুন'
                      : status === 'ended'
                        ? 'View Result / ফলাফল দেখুন'
                        : 'Schedule not configured';
              const disabled = status === 'registration_not_open' || status === 'registration_closed' || status === 'schedule_missing';
              return (
              <motion.div key={exam.id} variants={itemVariants} className="bg-[#1E293B]/80 border border-white/10 hover:border-blue-500/50 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-blue-900/20 relative overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2">
                <div className="relative h-40 overflow-hidden">
                  <img src={imageWithFallback(getExamCover(exam.title, exam.coverImage))} onError={applyImageFallback} alt={`${exam.title} cover`} loading="lazy" className="h-40 w-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-transparent" />
                  <div className="absolute left-4 top-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                      status === 'live' ? 'bg-red-500/80 text-white animate-pulse' : 'bg-black/50 text-slate-100 border border-white/10'
                    }`}>{status === 'live' ? 'Live' : status.replaceAll('_', ' ')}</span>
                  </div>
                  <h3 className="absolute bottom-4 left-4 right-4 text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{exam.title}</h3>
                </div>
                <div className="p-6 flex flex-1 flex-col">
                <p className="text-sm text-slate-400 mb-2">{exam.category} - {exam.type} Focus</p>
                <p className="text-xs font-medium text-slate-300 mb-4">{formatDhakaDateTime(exam.scheduledStartAt)} <span className="text-slate-500">• বাংলাদেশ সময়</span></p>
                
                <div className="flex items-center justify-between bg-black/30 rounded-2xl p-4 mb-6 border border-white/5">
                  <div>
                    <ExamCountdown exam={exam} />
                  </div>
                  {disabled ? (
                    <button disabled className="px-4 py-2 bg-white/10 text-xs font-bold rounded-lg text-slate-400 border border-white/10">{buttonLabel}</button>
                  ) : (
                    <Link to={`/exams/${exam.id}`} className="px-4 py-2 bg-[#10B981] text-xs font-bold rounded-lg hover:bg-emerald-400 hover:scale-105 text-[#0F172A] transition-all duration-300">{buttonLabel}</Link>
                  )}
                </div>

                <div className="space-y-3 mt-auto">
                  <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-[#F59E0B] font-bold">{exam.duration || `${getExamDurationMinutes(exam)} Mins`}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                    <span className="text-slate-400">Fee</span>
                    <span className="text-white font-medium">৳{exam.fee}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Marks</span>
                    <span className="text-white font-medium">{exam.totalMarks} Total</span>
                  </div>
                </div>
                </div>
              </motion.div>
            )})}
          </motion.div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-14 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-[#F8FAFC]">Featured Courses</h2>
              <p className="text-slate-400">Structured learning paths for every level of mathematics.</p>
            </div>
            <Link to="/courses" className="hidden md:flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors hover:translate-x-1 duration-300">
              View All Courses <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {courses.slice(0, 4).map((course) => (
              <motion.div key={course.id} variants={itemVariants} className="bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all duration-300 hover:-translate-y-2 group shrink-0 flex flex-col h-full">
                <div className="relative overflow-hidden shrink-0">
                  <img src={imageWithFallback(getCourseCover(course.title, course.image))} onError={applyImageFallback} alt={`${course.title} course cover`} loading="lazy" className="h-56 w-full object-cover object-top rounded-t-2xl group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-semibold text-white">
                    {course.category}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-300">
                      {course.mainCategory || course.category}
                    </span>
                    {course.subCategory && (
                      <span className="bg-blue-500/10 border border-blue-400/20 px-2.5 py-1 rounded-full text-[10px] font-semibold text-blue-300">
                        {course.subCategory}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[#F59E0B] mb-2">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold text-white">{course.rating || '4.8'}</span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 min-h-[3rem] text-white group-hover:text-[#3B82F6] transition-colors duration-300">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">{course.instructor}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {course.duration || '12 Weeks'}</span>
                    </div>
                    <div className="font-bold text-lg text-[#10B981]">
                      {formatCurrency(course.price)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/courses" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors">
              View All Courses <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Mathematics and Islam Highlight & Success Stats (Split Layout) */}
      <section className="py-14 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Mathematics and Nature Section */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-gradient-to-br from-[#10B981]/10 to-[#2563EB]/10 border border-white/10 backdrop-blur-md rounded-3xl p-10 relative overflow-hidden flex flex-col justify-center hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-shadow duration-500"
            >
              <div className="absolute inset-0 pattern-islamic opacity-50 mix-blend-overlay"></div>
              <div className="relative z-10 flex gap-6 sm:items-center">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/10 hidden sm:flex transform hover:rotate-12 transition-transform duration-500">
                  <Shapes className="w-10 h-10 text-[#F59E0B]" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-wider text-[#10B981] mb-4">
                    Explore & Discover
                  </div>
                  <h2 className="text-3xl font-extrabold mb-3 text-white">Mathematics & Nature</h2>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-md mb-4">
                    Discover math in the world around you — patterns, symmetry, golden ratio, and the beauty of numbers in nature.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getSubsForMain('Mathematics and Nature').map((sub, si) => (
                      <Link key={sub.id || si} to={`/mathematics-and-nature?subCategory=${encodeURIComponent(sub.title)}`} 
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                  <Link to="/mathematics-and-nature" className="text-sm font-bold text-[#F59E0B] inline-flex items-center gap-1 hover:text-amber-400 hover:gap-2 transition-all">
                    Explore More <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Trust & Platform Features */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col justify-center"
            >
              <div className="py-8 px-6 bg-[#1E293B]/50 rounded-3xl border border-white/10 backdrop-blur-sm h-full shadow-2xl hover:bg-[#1E293B]/70 transition-colors duration-500">
                <h3 className="text-lg font-bold text-white mb-6 text-center">Why Learn With Mathemzi Edu</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#10B981]/20 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-[#10B981]" />
                    </div>
                    <span className="text-sm text-slate-300">Structured learning paths for all levels</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-[#2563EB]" />
                    </div>
                    <span className="text-sm text-slate-300">Practice-based exam preparation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-sm text-slate-300">Manual bKash verified enrollment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
                      <BarChart className="h-4 w-4 text-[#F59E0B]" />
                    </div>
                    <span className="text-sm text-slate-300">Progress tracking &amp; completion certificates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-rose-400/20 flex items-center justify-center shrink-0">
                      <Shield className="h-4 w-4 text-rose-400" />
                    </div>
                    <span className="text-sm text-slate-300">Admin-managed content &amp; quality control</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Articles Preview */}
      <section className="py-14 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-[#F8FAFC]">Latest Articles</h2>
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto">Explore wisdom beyond equations.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {!loadingArticles && articles.map(a => (
              <Link to={`/articles/${a.id}`} key={a.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                <span className="text-xs font-bold text-emerald-400 mb-2 block uppercase">{a.category}</span>
                <h3 className="text-xl font-bold text-white mb-2">{a.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-3">{a.description}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/articles" className="inline-flex items-center gap-2 text-[#2563EB] hover:text-blue-400 font-bold">
              View All Articles <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Background Footer Pattern */}
      <div className="absolute bottom-0 left-0 w-full h-[200px] pointer-events-none overflow-hidden z-0">
        <svg className="absolute bottom-0 w-full opacity-10" viewBox="0 0 1000 200" preserveAspectRatio="none">
          <path d="M0,150 Q250,50 500,150 T1000,150 L1000,200 L0,200 Z" fill="#2563EB"></path>
          <path d="M0,180 Q250,120 500,180 T1000,180 L1000,200 L0,200 Z" fill="#10B981"></path>
        </svg>
      </div>

    </div>
    </>
  );
}
