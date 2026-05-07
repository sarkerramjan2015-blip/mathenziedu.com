import React, { useState } from 'react';
import { BookOpen, Calendar, Award, CreditCard, User, Settings, LogOut, ChevronRight, PlayCircle, FileText } from 'lucide-react';
import { studentStats, courses } from '../lib/data';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import UserSavedArticles from '../components/UserSavedArticles';
import { isAdminEmail } from '../lib/admin';
import { applyImageFallback, imageWithFallback } from '../lib/media';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const menu = [
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'saved_articles', label: 'Saved Articles', icon: FileText },
    { id: 'exams', label: 'My Exams', icon: Calendar },
    { id: 'results', label: 'My Results', icon: FileText },
    { id: 'certificates', label: 'My Certificates', icon: Award },
    { id: 'payments', label: 'Payment History', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen py-10 relative z-10 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl mb-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="h-12 w-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20 uppercase">
                  {user?.displayName ? user.displayName.charAt(0) : (user?.email ? user.email.charAt(0) : 'JD')}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-white truncate">{user?.displayName || (user?.email ? user.email.split('@')[0] : 'John Doe')}</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{isAdminEmail(user?.email) ? 'Admin' : 'Student'}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {menu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id 
                        ? 'bg-white/10 text-white border border-white/20 shadow-inner' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-[#10B981]' : ''}`} />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all border border-transparent">
                  <User className="h-5 w-5" /> Profile Settings
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all border border-transparent">
                  <LogOut className="h-5 w-5" /> Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-grow">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                {menu.find(m => m.id === activeTab)?.label}
              </h1>
              <p className="text-slate-400">Welcome back! Here's an overview of your progress.</p>
            </div>

            {/* Quick Stats */}
            {activeTab === 'courses' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-[#2563EB] mb-1">{studentStats.activeCourses}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-[#10B981] mb-1">{studentStats.completedCourses}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-[#F59E0B] mb-1">{studentStats.upcomingExams}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exams</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">{studentStats.averageScore}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Score</div>
                  </div>
                </div>

                <div className="space-y-6">
                  {courses.slice(0, 2).map(course => (
                    <div key={course.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col md:flex-row gap-6 hover:bg-white/10 transition-colors">
                      <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                        <img src={imageWithFallback(course.image)} onError={applyImageFallback} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 uppercase tracking-wider mb-2">In Progress</div>
                          <h3 className="font-bold text-xl text-white mb-2 leading-snug">{course.title}</h3>
                          <p className="text-sm text-slate-400 mb-4 font-medium">{Math.floor(course.lessons * 0.4)} / {course.lessons} lessons completed</p>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-300">40% Complete</span>
                          </div>
                          <div className="w-full bg-black/40 rounded-full h-2 border border-white/5 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] h-full rounded-full relative shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '40%' }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                        <button className="bg-white/10 border border-white/20 hover:bg-[#2563EB] hover:border-[#2563EB] text-white h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-lg">
                          <PlayCircle className="h-6 w-6 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'saved_articles' && (
              <UserSavedArticles />
            )}

            {activeTab !== 'courses' && activeTab !== 'saved_articles' && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center shadow-2xl">
                <div className="h-24 w-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500 shadow-inner">
                  <Calendar className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No data available</h3>
                <p className="text-slate-400">Feature under construction in this prototype.</p>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
