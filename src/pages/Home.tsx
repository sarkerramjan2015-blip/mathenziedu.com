import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, Clock, Users, PlayCircle, BookOpen, Brain, TrendingUp, Award, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { articles as defaultArticles, courses as dummyCourses, exams } from '../lib/data';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { isAdminEmail } from '../lib/admin';
import type { Article, Category, Course } from '../lib/types';
import { applyImageFallback, formatCurrency, imageWithFallback } from '../lib/media';

export default function Home() {
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const [courses, setCourses] = useState<Course[]>(dummyCourses);
  const [categories, setCategories] = useState([
    { title: 'Academic Maths', desc: 'School & College', icon: BookOpen, color: 'text-[#F59E0B]' },
    { title: 'Olympiad', desc: 'Problem Solving', icon: Award, color: 'text-[#2563EB]' },
    { title: 'Career', desc: 'Job & Viva Prep', icon: TrendingUp, color: 'text-[#10B981]' },
    { title: 'Mathematics and Islam', desc: 'Divine Symmetry', icon: Brain, color: 'text-purple-400' },
    { title: 'Public Speaking', desc: 'Viva Prep', icon: Users, color: 'text-rose-400' },
  ]);

  const [articles, setArticles] = useState<Article[]>(defaultArticles.slice(0, 3));
  const [loadingArticles, setLoadingArticles] = useState(true);

  const fetchContent = async () => {
    try {
      const catSnap = await getDocs(collection(db, 'categories'));
      if (!catSnap.empty) {
        const dbCats = catSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        setCategories(dbCats.map(cat => ({
          title: cat.title,
          desc: cat.description,
          icon: BookOpen, // Default icon for dynamic
          color: cat.color || 'text-white'
        })));
      }

      const courseSnap = await getDocs(collection(db, 'courses'));
      if (!courseSnap.empty) {
        setCourses(courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[]);
      }

      const articleSnap = await getDocs(collection(db, 'articles'));
      if (!articleSnap.empty) {
        setArticles(articleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 3) as Article[]);
      }
      setLoadingArticles(false);
    } catch (error) {
      console.error(error);
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const seedDummyData = async () => {
    if (!isAdmin) return;
    try {
      // Seed Categories
      const dummyCats = [
        { id: 'cat1', title: 'Academic Maths', description: 'School & College', color: 'text-[#F59E0B]', order: 1 },
        { id: 'cat2', title: 'Olympiad', description: 'Problem Solving', color: 'text-[#2563EB]', order: 2 },
        { id: 'cat3', title: 'Career', description: 'Job & Viva Prep', color: 'text-[#10B981]', order: 3 },
        { id: 'cat4', title: 'Mathematics and Islam', description: 'Divine Symmetry', color: 'text-purple-400', order: 4 },
        { id: 'cat5', title: 'Public Speaking', description: 'Viva Prep', color: 'text-rose-400', order: 5 },
      ];
      
      for (const cat of dummyCats) {
        await setDoc(doc(db, 'categories', cat.id), {
          title: cat.title,
          description: cat.description,
          color: cat.color,
          order: cat.order
        });
      }

      // Seed Courses
      for (const course of dummyCourses) {
        await setDoc(doc(db, 'courses', course.id), {
          title: course.title,
          description: course.description,
          category: course.category,
          instructor: course.instructor,
          price: course.price,
          rating: course.rating,
          lessons: course.lessons,
          duration: course.duration,
          image: course.image || '',
          level: course.level || '',
          enrolled: course.enrolled || 0,
          outcomes: course.outcomes || [],
          curriculum: course.curriculum || [],
        });
      }
      
      alert('Data seeded successfully!');
      fetchContent();
    } catch (error) {
      console.error(error);
      alert('Error seeding data');
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

  return (
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
            <span>Premium Mathematics Platform</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="text-[2.15rem] sm:text-5xl md:text-7xl font-extrabold leading-[1.08] mb-6 max-w-4xl mx-auto tracking-tight text-[#F8FAFC] break-words"
          >
            Learn Math with <br className="sm:hidden" /><span className="text-[#F59E0B]">Logic</span>, <br />Beauty & Faith.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed text-balance"
          >
            Academic math, Olympiad, career math, public speaking, viva, articles, and exams in one complete platform.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/courses" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-[#0F172A] font-bold text-lg transition-transform hover:scale-105 duration-300 shadow-xl hover:bg-slate-100 flex items-center justify-center gap-2">
              Explore Courses <ChevronRight className="h-5 w-5" />
            </Link>
            <Link to="/exams" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg font-bold text-lg text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
              Practice Exams <Calendar className="h-5 w-5" />
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
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-cols-5 gap-4 md:gap-6 min-w-0"
          >
            {categories.map((cat, i) => (
              <Link to={`/courses?category=${encodeURIComponent(cat.title)}`} key={i} className="min-w-0">
                <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 cursor-pointer group flex flex-col items-center text-center shadow-lg hover:shadow-2xl h-full min-w-0">
                   <cat.icon className={`h-8 w-8 ${cat.color} mb-3 group-hover:scale-110 transition-transform duration-300`} />
                   <div className={`font-bold mb-1 ${cat.color}`}>{cat.title}</div>
                   <div className="text-xs text-slate-400">{cat.desc}</div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Exam Widget / Upcoming Exams */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <h2 className="text-3xl font-extrabold mb-2 text-[#F8FAFC]">Upcoming Exams</h2>
              <p className="text-slate-400">Test your skills and prepare for reality.</p>
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
            {exams.slice(0, 3).map((exam, i) => (
              <motion.div key={exam.id} variants={itemVariants} className="bg-[#1E293B]/80 border border-white/10 hover:border-blue-500/50 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:shadow-blue-900/20 relative overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-2 py-1 bg-red-500/80 text-[10px] font-bold rounded uppercase animate-pulse">Live</span>
                </div>
                <h3 className="text-xl font-bold mb-1 text-white group-hover:text-blue-400 transition-colors">{exam.title}</h3>
                <p className="text-sm text-slate-400 mb-6">{exam.category} - {exam.type} Focus</p>
                
                <div className="flex items-center justify-between bg-black/30 rounded-2xl p-4 mb-6 border border-white/5">
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Time remaining</div>
                    <div className="text-xl font-mono font-bold tracking-wider text-white">42:15:08</div>
                  </div>
                  <Link to={`/exams/${exam.id}`} className="px-4 py-2 bg-[#10B981] text-xs font-bold rounded-lg hover:bg-emerald-400 hover:scale-105 text-[#0F172A] transition-all duration-300">Register</Link>
                </div>

                <div className="space-y-3 mt-auto">
                  <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-[#F59E0B] font-bold">{exam.duration || '60 Mins'}</span>
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-[#F8FAFC]">Popular Courses</h2>
              <p className="text-slate-400">Join thousands of students mastering mathematics.</p>
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
                <div className="relative h-48 overflow-hidden shrink-0">
                  <img src={imageWithFallback(course.image)} onError={applyImageFallback} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-semibold text-white">
                    {course.category}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
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
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Islamic Math Section */}
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
                  <svg className="w-10 h-10 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 12h3v9h6v-6h4v6h6v-9h3L12 2z"/></svg>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-wider text-[#10B981] mb-4">
                    Special Insights
                  </div>
                  <h2 className="text-3xl font-extrabold mb-3 text-white">Mathematics & Islam</h2>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-md mb-4">
                    Explore the divine symmetry, golden ratio, and historical contributions of Islamic scholars to the world of mathematics.
                  </p>
                  <Link to="/articles" className="text-sm font-bold text-[#F59E0B] inline-flex items-center gap-1 hover:text-amber-400 hover:gap-2 transition-all">
                    Read Articles <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Success Stats */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col justify-center"
            >
              <div className="flex justify-around items-center py-10 bg-[#1E293B]/50 rounded-3xl border border-white/10 backdrop-blur-sm h-full shadow-2xl hover:bg-[#1E293B]/70 transition-colors duration-500">
                <div className="text-center group">
                  <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 group-hover:text-[#3B82F6] transition-all duration-300">45k+</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Learners</div>
                </div>
                <div className="w-[1px] h-16 bg-white/10"></div>
                <div className="text-center group">
                  <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 group-hover:text-[#F59E0B] transition-all duration-300">120+</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Courses</div>
                </div>
                <div className="w-[1px] h-16 bg-white/10"></div>
                <div className="text-center group">
                  <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 group-hover:text-[#10B981] transition-all duration-300">98%</div>
                  <div className="text-xs font-bold text-[#10B981] uppercase tracking-widest">Success</div>
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Articles Preview */}
      <section className="py-20 relative z-10">
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
  );
}
