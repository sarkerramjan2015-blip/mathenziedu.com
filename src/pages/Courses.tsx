import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { courses as dummyCourses } from '../lib/data';
import { Search, Star, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Course, MainCategory, SubCategory } from '../lib/types';
import { applyImageFallback, formatCurrency, imageWithFallback } from '../lib/media';
import { getCourseCover } from '../lib/courseCovers';
import SEO from '../components/SEO';

export default function Courses() {
  const [searchParams] = useSearchParams();
  const urlMainCategory = searchParams.get('mainCategory') || '';
  const urlSubCategory = searchParams.get('subCategory') || '';

  const [searchTerm, setSearchTerm] = useState('');
  
  const [courses, setCourses] = useState<Course[]>(dummyCourses);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMain, setSelectedMain] = useState(urlMainCategory);
  const [selectedSub, setSelectedSub] = useState(urlSubCategory);
  const [showSubDropdown, setShowSubDropdown] = useState(false);

  // Sync URL params on initial load and when they change
  useEffect(() => {
    if (urlMainCategory) setSelectedMain(urlMainCategory);
    if (urlSubCategory) setSelectedSub(urlSubCategory);
  }, [urlMainCategory, urlSubCategory]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseSnap, catSnap, subSnap] = await Promise.all([
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'subcategories')),
        ]);
        if (!courseSnap.empty) {
          setCourses(courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[]);
        }
        if (!catSnap.empty) {
          setMainCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as MainCategory[]);
        }
        if (!subSnap.empty) {
          setSubCategories(subSnap.docs.map(d => ({ id: d.id, ...d.data() })) as SubCategory[]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derive main category list from data
  const mainCategoryOptions = useMemo(() => {
    return ['All', ...Array.from(new Set(courses.map(c => c.mainCategory || c.category)))];
  }, [courses]);

  // Filtered subcategories based on selected main
  const availableSubs = useMemo(() => {
    if (!selectedMain || selectedMain === 'All') return [];
    const fromFirestore = subCategories.filter(s => s.parentMainCategory === selectedMain);
    if (fromFirestore.length > 0) return fromFirestore;
    // Fallback from course data
    const subsFromCourses = [...new Set(courses.filter(c => (c.mainCategory || c.category) === selectedMain).map(c => c.subCategory).filter(Boolean))];
    return subsFromCourses.map(title => ({ title }));
  }, [selectedMain, subCategories, courses]);

  // Filter logic
  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return courses.filter(course => {
      // Filter by main category
      const courseMain = course.mainCategory || course.category;
      const matchesMain = selectedMain === 'All' || !selectedMain || courseMain === selectedMain;
      // Filter by sub category
      const matchesSub = !selectedSub || course.subCategory === selectedSub;
      // Search
      const searchable = `${course.title} ${course.description} ${course.instructor} ${courseMain} ${course.subCategory || ''}`.toLowerCase();
      return matchesMain && matchesSub && (!query || searchable.includes(query));
    });
  }, [courses, selectedMain, selectedSub, searchTerm]);

  return (
    <>
      <SEO 
        title="Courses"
        description="Browse Mathemzi Edu's premium mathematics courses — Academic Maths, Olympiad, Admission prep, and more. Find the right course for your level."
        path="/courses"
      />
      <div className="min-h-screen py-12 relative z-10 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Explore Courses</h1>
          <p className="text-slate-400 text-lg max-w-2xl">Browse our premium collection of mathematics courses designed for academic excellence and career growth.</p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10"
        >
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {mainCategoryOptions.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedMain(cat === 'All' ? '' : cat); setSelectedSub(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all backdrop-blur-sm ${
                  (selectedMain === cat) || (!selectedMain && cat === 'All')
                    ? 'bg-blue-600 text-white shadow-lg border border-transparent scale-105' 
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/10 hover:text-white hover:scale-105'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Subcategory filter */}
            {availableSubs.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowSubDropdown(!showSubDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-slate-300 hover:text-white hover:border-white/20 transition-all"
                >
                  {selectedSub || 'All Subcategories'} <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {showSubDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSubDropdown(false)} />
                    <div className="absolute top-full right-0 mt-2 w-56 z-20 bg-[#0F172A]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2">
                      <button
                        onClick={() => { setSelectedSub(''); setShowSubDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-sm ${!selectedSub ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                      >
                        All Subcategories
                      </button>
                      {availableSubs.map(sub => (
                        <button
                          key={sub.title}
                          onClick={() => { setSelectedSub(sub.title); setShowSubDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm ${selectedSub === sub.title ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                        >
                          {sub.title}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div className="w-full md:w-56 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search courses..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all placeholder:text-slate-500 backdrop-blur-sm shadow-sm"
              />
            </div>
          </div>
        </motion.div>

        {/* Course Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((course) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={course.id} 
                className="bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 hover:shadow-[0_0_25px_rgba(37,99,235,0.3)] hover:bg-[#1E293B]/80 transition-all duration-300 group flex flex-col h-full hover:-translate-y-2 min-w-0"
              >
                <div className="relative overflow-hidden">
                  <img src={imageWithFallback(getCourseCover(course.title, course.image))} onError={applyImageFallback} alt={`${course.title} course cover`} loading="lazy" className="h-56 w-full object-cover object-top rounded-t-3xl group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                  <div className="absolute top-4 left-4 flex gap-1.5">
                    <span className="bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white">
                      {course.mainCategory || course.category}
                    </span>
                    {course.subCategory && (
                      <span className="bg-black/60 backdrop-blur-md border border-blue-400/30 px-2.5 py-1 rounded-full text-[10px] font-semibold text-blue-300">
                        {course.subCategory}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow relative z-10">
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
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1 text-[#F59E0B]">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-bold text-white">{course.rating || '4.8'}</span>
                    </div>
                    <div className="text-sm text-slate-400 font-bold bg-black/30 border border-white/5 px-2 py-1 rounded">
                      {course.lessons || 10} Lessons
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-xl leading-tight mb-2 group-hover:text-blue-400 transition-colors duration-300 text-white">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="text-sm text-slate-300 mb-4 flex items-center gap-2">
                      <span className="bg-gradient-to-br from-blue-500 to-emerald-400 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm">
                        {(course.instructor || 'I').charAt(0)}
                      </span>
                      <span className="font-medium">{course.instructor}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-2xl text-[#10B981]">
                        {formatCurrency(course.price)}
                      </div>
                      <Link to={`/courses/${course.id}`} className="flex items-center gap-1 bg-white text-[#0F172A] hover:bg-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105 shadow-md">
                        Details <ChevronRight className="h-4 w-4 text-[#0F172A]" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {!loading && filteredCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm mt-8"
          >
            <h3 className="text-xl font-medium text-slate-400">No courses found for this category or search.</h3>
            <button onClick={() => { setSelectedMain(''); setSelectedSub(''); setSearchTerm(''); }} className="mt-4 text-[#2563EB] font-bold hover:underline">Clear filters</button>
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
}
