import React, { useState } from 'react';
import { Users, BookOpen, Settings, LayoutDashboard, DollarSign, Calendar, LogOut, ChevronRight, Search, Filter, FileText } from 'lucide-react';
import { adminStats, exams, courses } from '../lib/data';
import AdminArticles from '../components/admin/AdminArticles';
import AdminCategories from '../components/admin/AdminCategories';
import AdminCourses from '../components/admin/AdminCourses';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/media';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const menu = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'categories', label: 'Manage Categories', icon: Filter },
    { id: 'courses', label: 'Manage Courses', icon: BookOpen },
    { id: 'articles', label: 'Manage Articles', icon: FileText },
    { id: 'students', label: 'Manage Students', icon: Users },
    { id: 'settings', label: 'Site Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen relative z-10">
      <div className="flex min-h-screen overflow-hidden ml-0 md:ml-64 transition-all">
        
        {/* Sidebar - Desktop Fixed */}
        <div className="hidden md:flex flex-col w-64 bg-[#0F172A]/80 backdrop-blur-xl text-white fixed top-0 left-0 h-screen p-6 border-r border-white/10 shadow-2xl z-20">
          <div className="flex items-center gap-2 mb-12 mt-4 px-2">
            <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="font-display font-bold text-xl uppercase tracking-tight">
              Mathemzi<span className="text-[#F59E0B]">Edu</span>
            </span>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-4 px-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            Admin Panel
          </div>
          <nav className="space-y-2 flex-grow">
            {menu.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-[#2563EB]/20 text-white shadow-lg border border-[#2563EB]/40' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all">
              <LogOut className="h-5 w-5" /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow p-6 md:p-10 w-full relative z-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                {menu.find(m => m.id === activeTab)?.label}
              </h1>
              <p className="text-slate-400">Welcome to the Mathemzi Edu admin panel.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Global search..." 
                  className="pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm text-white placeholder:text-slate-500 backdrop-blur-md w-64 transition-all"
                />
              </div>
              <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold shadow-lg shrink-0">
                A
              </div>
            </div>
          </div>

          <div className="md:hidden -mx-2 mb-8 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2 px-2">
              {menu.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${
                    activeTab === item.id
                      ? 'border-[#2563EB]/40 bg-[#2563EB]/20 text-white'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label.replace('Manage ', '')}
                </button>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#2563EB]/20 text-[#2563EB] border border-[#2563EB]/30 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Students</div>
                    <div className="text-2xl font-bold text-white">{adminStats.totalStudents.toLocaleString()}</div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center shrink-0">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Revenue</div>
                    <div className="text-2xl font-bold text-white">{adminStats.totalRevenue}</div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Active Courses</div>
                    <div className="text-2xl font-bold text-white">{adminStats.activeCourses}</div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Upcoming Exams</div>
                    <div className="text-2xl font-bold text-white">{adminStats.upcomingExams}</div>
                  </div>
                </div>
              </div>

              {/* Data Tables */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Courses */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                  <div className="p-6 flex justify-between items-center bg-white/5 border-b border-white/10">
                    <h3 className="font-bold text-lg text-white">Recent Courses</h3>
                    <button className="text-sm text-[#2563EB] font-bold hover:underline">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black/20 text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/10">
                          <th className="p-4 font-bold">Course Name</th>
                          <th className="p-4 font-bold hidden sm:table-cell">Instructor</th>
                          <th className="p-4 font-bold">Price</th>
                          <th className="p-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.slice(0, 4).map(course => (
                          <tr key={course.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="font-medium text-white line-clamp-1">{course.title}</div>
                              <div className="text-xs text-slate-400 hidden sm:block">{course.category}</div>
                            </td>
                            <td className="p-4 text-sm text-slate-300 hidden sm:table-cell">{course.instructor}</td>
                            <td className="p-4 text-sm font-bold text-[#10B981]">{formatCurrency(course.price)}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded border border-[#10B981]/30 text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] uppercase tracking-wider">Active</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Upcoming Exams */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                  <div className="p-6 flex justify-between items-center bg-white/5 border-b border-white/10">
                    <h3 className="font-bold text-lg text-white">Upcoming Exams</h3>
                    <button className="text-sm text-[#2563EB] font-bold hover:underline">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black/20 text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/10">
                          <th className="p-4 font-bold">Exam Details</th>
                          <th className="p-4 font-bold">Date</th>
                          <th className="p-4 font-bold">Fee</th>
                          <th className="p-4 font-bold">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exams.slice(0, 4).map(exam => (
                          <tr key={exam.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="font-medium text-white line-clamp-1">{exam.title}</div>
                            </td>
                            <td className="p-4 text-sm text-slate-300 whitespace-nowrap">{exam.date}</td>
                            <td className="p-4 text-sm font-bold text-[#10B981]">{formatCurrency(exam.fee)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                exam.type === 'MCQ' ? 'bg-[#2563EB]/10 text-blue-300 border-[#2563EB]/30' : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              }`}>{exam.type}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'courses' && <AdminCourses />}
          {activeTab === 'articles' && <AdminArticles />}

          {activeTab !== 'overview' && activeTab !== 'categories' && activeTab !== 'courses' && activeTab !== 'articles' && (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center shadow-2xl">
              <div className="h-24 w-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500 shadow-inner">
                <Settings className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{menu.find(m => m.id === activeTab)?.label} Module</h3>
              <p className="text-slate-400">This management module is functional in the full version.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
