import { ShieldCheck } from 'lucide-react';

interface LegalProps {
  type: 'privacy' | 'terms';
}

export default function Legal({ type }: LegalProps) {
  const isPrivacy = type === 'privacy';

  return (
    <div className="min-h-screen py-16 sm:py-20 relative z-10 w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
          <ShieldCheck className="mb-6 h-10 w-10 text-[#10B981]" />
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white mb-4">
            {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
          </h1>
          <p className="text-slate-300 leading-relaxed mb-8">
            {isPrivacy
              ? 'Mathemzi Edu collects only the account and learning information needed to provide courses, exams, support, and progress tracking.'
              : 'By using Mathemzi Edu, learners agree to use course materials fairly, keep account access private, and follow exam rules.'}
          </p>
          <div className="space-y-6 text-slate-300">
            <section>
              <h2 className="text-xl font-bold text-white mb-2">{isPrivacy ? 'Data We Use' : 'Learning Access'}</h2>
              <p>
                {isPrivacy
                  ? 'Basic profile, saved articles, progress, enrollment, and support details may be stored to personalize the platform.'
                  : 'Course access is tied to the registered account. Sharing paid course access outside the account is not permitted.'}
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white mb-2">{isPrivacy ? 'Security' : 'Payments and Exams'}</h2>
              <p>
                {isPrivacy
                  ? 'Production launch should use verified Firebase rules, admin-only dashboards, and secure payment or email providers.'
                  : 'Exam fees, refunds, and certification policies should be finalized before accepting live payments.'}
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white mb-2">Contact</h2>
              <p>For questions, contact support@mathemziedu.com.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
