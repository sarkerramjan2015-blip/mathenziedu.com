import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, ChevronDown, User as UserIcon } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebase';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0F172A]/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <Link to="/" className="font-display font-bold text-xl tracking-tight uppercase text-white hover:text-blue-400 transition-colors">
              Mathemzi <span className="text-[#10B981]">Edu</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`font-medium transition-colors ${isActive('/') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              Home
            </Link>
            <div className="relative group">
              <button className="flex items-center gap-1 font-medium text-slate-300 hover:text-white transition-colors">
                Categories <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-2 bg-[#0F172A] rounded-xl shadow-2xl border border-white/10 flex flex-col backdrop-blur-xl">
                  <Link to="/courses?category=Academic+Maths" className="px-4 py-2 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white">Academic Maths</Link>
                  <Link to="/courses?category=Olympiad" className="px-4 py-2 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white">Olympiad</Link>
                  <Link to="/courses?category=Career" className="px-4 py-2 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white">Job Math</Link>
                  <Link to="/courses?category=Mathematics+and+Islam" className="px-4 py-2 hover:bg-white/10 text-sm font-medium text-[#10B981]">Math & Islam</Link>
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
              to="/exams" 
              className={`font-medium transition-colors ${isActive('/exams') ? 'text-[#10B981]' : 'text-slate-300 hover:text-white'}`}
            >
              Exams
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
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <UserIcon className="h-4 w-4 text-[#10B981]" />
                    <span className="text-sm font-medium text-white max-w-[120px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2 bg-[#0F172A] rounded-xl shadow-2xl border border-white/10 flex flex-col backdrop-blur-xl">
                      <Link to="/dashboard" className="px-4 py-2 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white">Dashboard</Link>
                      <button onClick={handleLogout} className="text-left px-4 py-2 hover:bg-white/10 text-sm font-medium text-rose-400 hover:text-rose-300">Sign Out</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                    Register
                  </Link>
                  <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] rounded-full text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:scale-105 transition-all text-white border border-blue-400/20">
                    Join Free
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-[#0F172A]/95 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link to="/" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/') ? 'text-[#10B981] bg-white/5' : 'text-white hover:bg-white/5'}`}>Home</Link>
            <Link to="/courses" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/courses') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Courses</Link>
            <Link to="/exams" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/exams') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Exams</Link>
            <Link to="/articles" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/articles') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Articles</Link>
            <Link to="/about" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/about') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>About</Link>
            <Link to="/contact" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base font-medium ${isActive('/contact') ? 'text-[#10B981] bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>Contact</Link>
            <div className="pt-4 flex flex-col gap-3 px-3 border-t border-white/10 mt-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} className="w-full text-center border border-[#10B981]/30 text-[#10B981] px-4 py-2.5 rounded-full font-medium bg-[#10B981]/10">Dashboard</Link>
                  <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full text-center border border-white/10 text-rose-400 px-4 py-2.5 rounded-full font-medium">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="w-full text-center border border-white/10 text-white px-4 py-2.5 rounded-full font-medium">Login</Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="w-full text-center border border-white/10 text-white px-4 py-2.5 rounded-full font-medium">Register</Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="w-full text-center bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] shadow-[0_0_15px_rgba(37,99,235,0.4)] text-white px-4 py-2.5 rounded-full font-bold">Join Free</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
