import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, ChevronDown, User as UserIcon, LogOut, Eye } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MAIN_CATEGORIES_DATA } from '../lib/data';
import { DEMO_MODE, SIMPLE_EMAIL_LOGIN, clearDemoSession } from '../lib/demo';
import type { MainCategory, SubCategory } from '../lib/types';
import { useSiteSettings } from '../lib/useSiteConfig';

const CATEGORY_COLORS: Record<string, string> = {
  'Academic Maths': 'text-[#F59E0B]',
  'Olympiad': 'text-[#2563EB]',
  'Admission Course': 'text-[#10B981]',
  'Books Corner': 'text-purple-400',
  'Mathematics and Nature': 'text-rose-400',
};

const linkMap: Record<string, string> = {
  'Admission Course': '/admission',
  'Books Corner': '/books',
  'Mathematics and Nature': '/mathematics-and-nature',
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isDemo } = useAuth();
  const site = useSiteSettings();
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    const fetchNavData = async () => {
      try {
        const [catSnap, subSnap] = await Promise.all([
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'subcategories')),
        ]);
        if (!catSnap.empty) {
          setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as MainCategory[]);
        }
        if (!subSnap.empty) {
          setSubCategories(subSnap.docs.map(d => ({ id: d.id, ...d.data() })) as SubCategory[]);
        }
      } catch {}
    };
    fetchNavData();
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!site.faviconUrl) return;
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = site.faviconUrl;
  }, [site.faviconUrl]);

  const displayCategories = categories.length > 0 ? categories : MAIN_CATEGORIES_DATA;
  
  const getSubsForMain = (mainTitle: string) => {
    if (subCategories.length > 0) {
      return subCategories.filter(s => s.parentMainCategory === mainTitle);
    }
    const found = MAIN_CATEGORIES_DATA.find(c => c.title === mainTitle);
    return found ? found.subCategories.map((title, i) => ({ id: `sub-${i}`, title, parentMainCategory: mainTitle })) : [];
  };

  const isSimpleLogin = DEMO_MODE || SIMPLE_EMAIL_LOGIN;
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    if (isDemo) {
      clearDemoSession();
      window.location.href = '/login';
      return;
    }
    try {
      await auth.signOut();
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <>
      {/* Demo Mode Banner */}
      {DEMO_MODE && isDemo && (
        <div className="sticky top-0 z-[60] w-full bg-purple-600/90 backdrop-blur-md text-white text-center py-1.5 px-4 text-xs font-bold flex items-center justify-center gap-2">
          <Eye className="h-3.5 w-3.5" />
          Demo Mode Active — Local Preview Only
        </div>
      )}
      <nav className={`${DEMO_MODE && isDemo ? '' : 'sticky top-0'} z-50 w-full backdrop-blur-md bg-[#0F172A]/80 border-b border-white/10`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <Link to="/" className="flex items-center gap-3 rounded-lg" aria-label={`${site.name} home`}>
            <span className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
              {site.logoUrl ? <img src={site.logoUrl} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-6 w-6 text-white" />}
            </span>
            <span className="font-display font-bold text-xl tracking-tight uppercase text-white hover:text-blue-400 transition-colors">{site.name}</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden xl:flex items-center gap-4 text-sm">
            <Link 
              to="/" 
              className={`font-medium transition-colors ${isActive('/') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              Home
            </Link>
            <div className="relative group">
              <button type="button" aria-haspopup="true" className="flex items-center gap-1 font-medium text-slate-300 hover:text-white transition-colors">
                Categories <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-[650px] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200" style={{ left: '-200px' }}>
                <div className="p-4 bg-[#0F172A]/95 rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl">
                  <div className="grid grid-cols-5 gap-2">
                    {displayCategories.slice(0, 5).map((cat) => {
                      const subs = getSubsForMain(cat.title);
                      const href = linkMap[cat.title] || `/courses?mainCategory=${encodeURIComponent(cat.title)}`;
                      const colorClass = CATEGORY_COLORS[cat.title] || 'text-slate-300';
                      return (
                        <Link to={href} key={cat.id || cat.title} className="rounded-lg p-2.5 hover:bg-white/5 transition-colors">
                          <div className={`font-bold text-xs ${colorClass} mb-1`}>{cat.title}</div>
                          <div className="text-[9px] text-slate-400 space-y-0.5">
                            {subs.slice(0, 5).map((s) => (
                              <div key={s.id} className="hover:text-white transition-colors">{s.title}</div>
                            ))}
                            {subs.length > 5 && <div className="text-slate-500">+{subs.length - 5} more</div>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <Link 
              to="/courses" 
              className={`font-medium transition-colors ${isActive('/courses') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              Courses
            </Link>
            <Link 
              to="/admission" 
              className={`font-medium transition-colors ${isActive('/admission') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              Admission
            </Link>
            <Link 
              to="/books" 
              className={`font-medium transition-colors ${isActive('/books') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              Books
            </Link>
            <Link 
              to="/mathematics-and-nature" 
              className={`font-medium transition-colors ${isActive('/mathematics-and-nature') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              Math & Nature
            </Link>
            <Link 
              to="/exams" 
              className={`font-medium transition-colors ${isActive('/exams') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              Exams
            </Link>
            <Link
              to="/articles"
              className={`font-medium transition-colors ${isActive('/articles') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              Articles
            </Link>
            <Link 
              to="/about" 
              className={`font-medium transition-colors ${isActive('/about') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`font-medium transition-colors ${isActive('/contact') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              Contact
            </Link>
            
            <div className="flex items-center gap-4 ml-6 pl-6 border-l border-white/10">
              {user ? (
                <div className="relative group">
                  <button type="button" aria-haspopup="true" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <UserIcon className="h-4 w-4 text-[#10B981]" />
                    <span className="text-sm font-medium text-white max-w-[120px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
                    <div className="py-2 bg-[#0F172A] rounded-xl shadow-2xl border border-white/10 flex flex-col backdrop-blur-xl">
                      <Link to="/dashboard" className="px-4 py-2 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white">Dashboard</Link>
                      <button onClick={handleLogout} className="text-left px-4 py-2 hover:bg-white/10 text-sm font-medium text-rose-400 hover:text-rose-300">{isDemo || isSimpleLogin ? 'Logout / লগআউট' : 'Sign Out'}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="shrink-0 whitespace-nowrap px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] rounded-full text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:scale-105 transition-all text-white border border-blue-400/20">
                  {isSimpleLogin ? 'Login / প্রবেশ' : 'Login'}
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center xl:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              className="text-slate-300 hover:text-white p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div id="mobile-navigation" className="xl:hidden bg-[#0F172A]/95 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link to="/" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/') ? 'text-[#10B981] bg-white/5' : 'text-white hover:bg-white/5'}`}>Home</Link>
            <Link to="/courses" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/courses') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Courses</Link>
            <Link to="/admission" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/admission') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Admission</Link>
            <Link to="/books" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/books') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Books</Link>
            <Link to="/mathematics-and-nature" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/mathematics-and-nature') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Math & Nature</Link>
            <Link to="/exams" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/exams') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Exams</Link>
            <Link to="/articles" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/articles') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Articles</Link>
            <Link to="/about" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/about') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>About</Link>
            <Link to="/contact" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/contact') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Contact</Link>
            <div className="pt-4 flex flex-col gap-3 px-3 border-t border-white/10 mt-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} className="w-full text-center border border-[#10B981]/30 text-[#10B981] px-4 py-2.5 rounded-full font-medium bg-[#10B981]/10">Dashboard</Link>
                  <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full text-center border border-white/10 text-rose-400 px-4 py-2.5 rounded-full font-medium">{isDemo || isSimpleLogin ? 'Logout / লগআউট' : 'Sign Out'}</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)} className="w-full text-center bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] shadow-[0_0_15px_rgba(37,99,235,0.4)] text-white px-4 py-2.5 rounded-full font-bold">
                  {isSimpleLogin ? 'Login / প্রবেশ' : 'Login'}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
