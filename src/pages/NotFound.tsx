import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div>
        <div className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#10B981]">404</div>
        <h1 className="mb-4 text-4xl font-display font-extrabold text-white">Page not found</h1>
        <p className="mb-8 max-w-md text-slate-400">The page you requested is not available in Mathemzi Edu.</p>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-[#0F172A]">
          <ArrowLeft className="h-4 w-4" /> Back Home
        </Link>
      </div>
    </div>
  );
}
