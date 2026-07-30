import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Mail, MapPin, Phone, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSiteSettings } from '../lib/useSiteConfig';
import SEO from '../components/SEO';

export default function Contact() {
  const cfg = useSiteSettings();
  const info = { phone: cfg.phone, email: cfg.email, address: cfg.address };
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: 'Course Counselling', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    setStatus('loading');
    try {
      await addDoc(collection(db, 'contactMessages'), {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject || 'General',
        message: formData.message.trim(),
        createdAt: Date.now(),
        status: 'unread',
      });
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: 'Course Counselling', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen py-16 sm:py-20 relative z-10 w-full overflow-x-hidden">
      <SEO 
        title="Contact Us"
        description="Get in touch with Mathemzi Edu. Course guidance, exam registration, mentor support, and partnership inquiries."
        path="/contact"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#10B981] mb-5">
            Student Support
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white mb-4">Talk to Mathemzi Edu</h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Course guidance, exam registration, mentor support, or partnership questions. Send a note and the team will follow up.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8">
          <div className="space-y-4">
            <a href={`tel:${info.phone.replace(/\s/g, '')}`} className="block rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md hover:bg-white/10 transition-colors">
              <Phone className="mb-4 h-6 w-6 text-[#10B981]" />
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Call</div>
              <div className="mt-1 font-semibold text-white">{info.phone}</div>
            </a>
            <a href={`mailto:${info.email}`} className="block rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md hover:bg-white/10 transition-colors">
              <Mail className="mb-4 h-6 w-6 text-[#10B981]" />
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</div>
              <div className="mt-1 font-semibold text-white">{info.email}</div>
            </a>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <MapPin className="mb-4 h-6 w-6 text-[#10B981]" />
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Office</div>
              <div className="mt-1 font-semibold text-white">{info.address}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Name *</span>
                <input required maxLength={100} autoComplete="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" placeholder="Your name" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Email *</span>
                <input required type="email" maxLength={100} autoComplete="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" placeholder="your@email.com" />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Phone (optional)</span>
                <input type="tel" maxLength={20} autoComplete="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" placeholder="+880 1XXX XXXXXXX" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Subject</span>
                <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]">
                  <option value="Course Counselling">Course Counselling</option>
                  <option value="Exam Registration">Exam Registration</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Message *</span>
              <textarea required rows={5} maxLength={5000} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" placeholder="Write your message..." />
            </label>

            <button type="submit" disabled={status === 'loading'}
              className="mt-6 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 disabled:opacity-50">
              {status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send Message</>}
            </button>

            {status === 'success' && (
              <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 px-4 py-3 text-sm font-medium text-[#10B981] flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Message sent successfully. We'll get back to you soon.
              </div>
            )}
            {status === 'error' && (
              <div role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Something went wrong. Please try again or email us directly.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
