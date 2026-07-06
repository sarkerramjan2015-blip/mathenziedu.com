import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { courses as dummyCourses } from '../lib/data';
import { Search, ChevronRight, Star, Clock, Users, GraduationCap, Stethoscope, Building2, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Course } from '../lib/types';
import { applyImageFallback, formatCurrency, imageWithFallback } from '../lib/media';
import SEO from '../components/SEO';

const SUBCATEGORIES = ['All', 'University Admission Math', 'Engineering Admission Math', 'Medical Admission Math', 'GST Admission Math', 'IBA/BBA Math', 'Written Math Preparation', 'Shortcut Math & Problem Solving'];

const SUBCAT_ICONS: Record<string, React.ElementType> = {
  'University Admission Math': Building2,
  'Engineering Admission Math': GraduationCap,
  'Medical Admission Math': Stethoscope,
  'GST Admission Math': BookOpen,
  'IBA/BBA Math': BookOpen,
  'Written Math Preparation': BookOpen,
  'Shortcut Math & Problem Solving': BookOpen,
};

const SUBCAT_COLORS: Record<string, string> = {
  'University Admission Math': 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  'Engineering Admission Math': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  'Medical Admission Math': 'text-green-400 border-green-500/30 bg-green-500/10',
  'GST Admission Math': 'text-slate-300 border-white/10 bg-white/5',
  'IBA/BBA Math': 'text-slate-300 border-white/10 bg-white/5',
  'Written Math Preparation': 'text-slate-300 border-white/10 bg-white/5',
  'Shortcut Math & Problem Solving': 'text-slate-300 border-white/10 bg-white/5',
};

const SUBCAT_BG: Record<string, string> = {
  'University Admission Math': 'from-sky-500/10 to-blue-500/10',
  'Engineering Admission Math': 'from-cyan-500/10 to-teal-500/10',
  'Medical Admission Math': 'from-green-500/10 to-emerald-500/10',
  'GST Admission Math': 'from-slate-500/10 to-gray-500/10',
  'IBA/BBA Math': 'from-slate-500/10 to-gray-500/10',
  'Written Math Preparation': 'from-slate-500/10 to-gray-500/10',
  'Shortcut Math & Problem Solving': 'from-slate-500/10 to-gray-500/10',
};

export default function Admission() {
  const [searchParams] = useSearchParams();
  const urlSub = searchParams.get('subCategory') || '';
  const [filter, setFilter] = useState(urlSub || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (urlSub) setFilter(urlSub);
  }, [urlSub]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const snap = await getDocs(collection(db, 'courses'));
        const allCourses = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Course[];
        const admission = allCourses.filter(c => (c.mainCategory || c.category) === 'Admission Course');
        setCourses(admission.length > 0 ? admission : dummyCourses.filter(c => (c.mainCategory || c.category) === 'Admission Course'));
      } catch {
        setCourses(dummyCourses.filter(c => (c.mainCategory || c.category) === 'Admission Course'));
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return courses.filter(c => {
      const matchSub = filter === 'All' || c.subCategory === filter;
      const searchable = `${c.title} ${c.instructor} ${c.description} ${c.subCategory || ''}`.toLowerCase();
      return matchSub && (!q || searchable.includes(q));
    });
  }, [courses, filter, searchTerm]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <>
      <SEO 
        title="Admission Courses"
        description="Prepare for university, engineering, medical, and other admission exams with Mathemzi Edu's expert-led mathematics courses in Bangladesh."
        path="/admission"
      />
      <div className="min-h-screen py-12 relative z-10 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-bold uppercase tracking-wider mb-4">
            <GraduationCap className="h-4 w-4" /> Admission Preparation
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Admission Courses</h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Prepare for university, engineering, medical, and other admission exams with expert-led mathematics courses.
          </p>
        </motion.div>

        {/* Subcategory Filter + Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <div className="flex flex-wrap gap-2">
            {SUBCATEGORIES.map(sub => (
              <button
                key={sub}
                onClick={() => setFilter(sub)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  filter === sub
                    ? 'bg-[#10B981] text-white shadow-lg scale-105'
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                {sub === 'All' ? 'All' : sub}
              </button>
            ))}
          </div>
          <div className="w-full md:w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search admission courses..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#10B981] placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
            <GraduationCap className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-400 mb-2">No admission courses found</h3>
            <button onClick={() => { setFilter('All'); setSearchTerm(''); }} className="text-[#10B981] font-bold hover:underline">Clear filters</button>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(course => (
              <motion.div key={course.id} variants={itemVariants}
                className={`bg-gradient-to-br ${SUBCAT_BG[course.subCategory || ''] || 'from-white/5 to-white/5'} border border-white/10 hover:border-white/20 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 flex flex-col h-full`}>
                <div className="relative h-48 overflow-hidden">
                  <img src={imageWithFallback(course.image)} onError={applyImageFallback} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white">Admission Course</span>
                    {course.subCategory && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-md ${SUBCAT_COLORS[course.subCategory] || 'text-slate-300 bg-white/10 border-white/20'}`}>
                        {course.subCategory}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-1 text-[#F59E0B] mb-2">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold text-white">{course.rating || '4.8'}</span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 text-white line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.level || 'All Levels'}</span>
                  </div>
                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="font-bold text-lg text-[#10B981]">{formatCurrency(course.price)}</div>
                    <Link to={`/courses/${course.id}`}
                      className="flex items-center gap-1 bg-[#10B981] text-[#0F172A] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                      Details <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
}
