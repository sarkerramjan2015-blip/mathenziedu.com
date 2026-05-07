import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#0F172A]/80 backdrop-blur-xl text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-[#10B981]" />
              <span className="font-display font-bold text-2xl">
                Mathemzi<span className="text-[#10B981]">Edu</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Learn Mathematics with Logic, Beauty, Faith, and Real-Life Application. Your complete platform for academic success and career growth.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" aria-label="Facebook" className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-[#2563EB] hover:border-transparent transition-all shadow-sm">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-[#2563EB] hover:border-transparent transition-all shadow-sm">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-[#2563EB] hover:border-transparent transition-all shadow-sm">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" aria-label="YouTube" className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-[#2563EB] hover:border-transparent transition-all shadow-sm">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg mb-6 text-white/90">Quick Links</h3>
            <ul className="space-y-4 text-slate-400 text-sm font-medium">
              <li><Link to="/about" className="hover:text-[#10B981] transition-colors">About Us</Link></li>
              <li><Link to="/courses" className="hover:text-[#10B981] transition-colors">All Courses</Link></li>
              <li><Link to="/exams" className="hover:text-[#10B981] transition-colors">Upcoming Exams</Link></li>
              <li><Link to="/articles" className="hover:text-[#10B981] transition-colors">Articles & Blog</Link></li>
              <li><Link to="/courses?category=Career" className="hover:text-[#10B981] transition-colors">Viva Preparation</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg mb-6 text-white/90">Categories</h3>
            <ul className="space-y-4 text-slate-400 text-sm font-medium">
              <li><Link to="/courses?category=Academic+Maths" className="hover:text-[#10B981] transition-colors">Academic Maths</Link></li>
              <li><Link to="/courses?category=Olympiad" className="hover:text-[#10B981] transition-colors">Math Olympiad</Link></li>
              <li><Link to="/courses?category=Career" className="hover:text-[#10B981] transition-colors">Job Math</Link></li>
              <li><Link to="/courses?category=Mathematics+and+Islam" className="hover:text-[#10B981] transition-colors">Mathematics and Islam</Link></li>
              <li><Link to="/articles" className="hover:text-[#10B981] transition-colors">Public Speaking</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg mb-6 text-white/90">Contact Us</h3>
            <ul className="space-y-4 text-slate-400 text-sm font-medium">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#2563EB] shrink-0" />
                <span>123 Mirpur Road, Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#2563EB] shrink-0" />
                <span>+880 1234 567890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#2563EB] shrink-0" />
                <span>support@mathemziedu.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} Mathemzi Edu. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
