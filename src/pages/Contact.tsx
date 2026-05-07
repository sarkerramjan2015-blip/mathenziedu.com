import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen py-16 sm:py-20 relative z-10 w-full overflow-x-hidden">
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
            {[
              { icon: Phone, label: 'Call', value: '+880 1234 567890' },
              { icon: Mail, label: 'Email', value: 'support@mathemziedu.com' },
              { icon: MapPin, label: 'Office', value: 'Mirpur Road, Dhaka, Bangladesh' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <item.icon className="mb-4 h-6 w-6 text-[#10B981]" />
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</div>
                <div className="mt-1 font-semibold text-white">{item.value}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Name</span>
                <input required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" placeholder="Your name" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Phone or Email</span>
                <input required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" placeholder="How we can reach you" />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Topic</span>
              <select className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]">
                <option>Course counselling</option>
                <option>Exam registration</option>
                <option>Technical support</option>
                <option>Partnership</option>
              </select>
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Message</span>
              <textarea required rows={5} className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" placeholder="Write your message..." />
            </label>
            <button className="mt-6 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500">
              Send Message <Send className="h-4 w-4" />
            </button>
            {submitted && (
              <p className="mt-4 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 px-4 py-3 text-sm font-medium text-[#10B981]">
                Thanks. This prototype captured the request locally; connect an email/API service before production launch.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
