import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
const Articles = React.lazy(() => import('./pages/Articles'));
const ArticleDetails = React.lazy(() => import('./pages/ArticleDetails'));
const Home = React.lazy(() => import('./pages/Home'));
const Courses = React.lazy(() => import('./pages/Courses'));
const CourseDetails = React.lazy(() => import('./pages/CourseDetails'));
const Exams = React.lazy(() => import('./pages/Exams'));
const ExamDetails = React.lazy(() => import('./pages/ExamDetails'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Legal = React.lazy(() => import('./pages/Legal'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

const About = React.lazy(() => import('./pages/About'));

const PageLoader = () => (
  <div className="min-h-[70vh] flex items-center justify-center">
    <div className="h-12 w-12 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin" />
  </div>
);

// Wrapper to hide Navbar/Footer on Admin Dashboard
const AdminLayout = () => (
  <ProtectedRoute adminOnly>
    <AdminDashboard />
  </ProtectedRoute>
);

export default function App() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden bg-[#0F172A] text-[#F8FAFC]">
      {/* Global Mesh Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#2563EB]/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#10B981]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[#F59E0B]/10 rounded-full blur-[100px] pointer-events-none"></div>

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="*" element={
            <>
              <Navbar />
              <main className="flex-grow z-10 min-w-0">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/:id" element={<CourseDetails />} />
                  <Route path="/exams" element={<Exams />} />
                  <Route path="/exams/:id" element={<ExamDetails />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/articles" element={<Articles />} />
                  <Route path="/articles/:id" element={<ArticleDetails />} />
                  <Route path="/privacy" element={<Legal type="privacy" />} />
                  <Route path="/terms" element={<Legal type="terms" />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </>
          } />
        </Routes>
      </Suspense>
    </div>
  );
}
