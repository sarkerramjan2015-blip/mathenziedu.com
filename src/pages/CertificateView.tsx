import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { isAdminUser } from '../lib/admin';
import { Printer, Award, AlertCircle, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import type { Certificate } from '../lib/types';
import { SITE_CONFIG } from '../lib/config';

export default function CertificateView() {
  const { id } = useParams();
  const { user, userRole } = useAuth();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchCert = async () => {
      try {
        const snap = await getDoc(doc(db, 'certificates', id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Certificate;
          // Check access: only cert owner or admin can view
          if (user && (user.uid === data.userId || user.email === data.userEmail || isAdminUser(userRole, user.email))) {
            setCert(data);
          } else {
            setError('You do not have access to this certificate.');
          }
        } else {
          setError('Certificate not found.');
        }
      } catch (e) { console.error(e); setError('Error loading certificate.'); }
      finally { setLoading(false); }
    };
    fetchCert();
  }, [id, user]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Certificate Unavailable</h2>
          <p className="text-slate-400 mb-6">{error || 'Not found'}</p>
          <Link to="/dashboard" className="inline-block bg-[#2563EB] text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title={`Certificate: ${cert.itemTitle} - Mathemzi Edu`} description={`Certificate of completion for ${cert.itemTitle}`} path={`/certificates/${id}`} />
      <div className="min-h-screen py-8 relative z-10 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Print button */}
          <div className="mb-6 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-[#2563EB]">Certificate</span>
            </div>
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-[#2563EB] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-500 transition-all shadow-lg">
              <Printer className="h-4 w-4" /> Print Certificate
            </button>
          </div>

          {/* Certificate */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl print:border-2 print:border-[#F59E0B]/50">
            {/* Decorative top bar */}
            <div className="h-3 bg-gradient-to-r from-[#2563EB] via-[#10B981] to-[#F59E0B] print:h-2 print:from-[#2563EB]/80 print:via-[#10B981]/80 print:to-[#F59E0B]/80" />
            
            <div className="p-8 md:p-16 text-center">
              {/* Seal/Badge */}
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-[#F59E0B]/20 border-2 border-[#F59E0B]/40 mb-8 print:border-[#F59E0B]/60">
                <Award className="h-12 w-12 text-[#F59E0B]" />
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 print:text-black">
                Certificate of {cert.certificateType === 'course' ? 'Completion' : 'Achievement'}
              </h1>

              <div className="w-24 h-0.5 bg-gradient-to-r from-[#2563EB] to-[#10B981] mx-auto mb-8 print:from-[#2563EB]/60 print:to-[#10B981]/60" />

              {/* Body */}
              <p className="text-lg text-slate-300 mb-6 print:text-gray-600">
                This is to certify that
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6 print:text-black">
                {cert.studentName}
              </h2>
              <p className="text-lg text-slate-300 mb-2 print:text-gray-600">
                has successfully {cert.certificateType === 'course' ? 'completed' : 'participated in'}
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-[#10B981] mb-8 print:text-[#10B981]">
                {cert.itemTitle}
              </h3>

              {/* Score */}
              {cert.score !== undefined && (
                <div className="inline-block bg-white/5 border border-white/10 rounded-2xl px-8 py-4 mb-8 print:border-gray-300 print:bg-gray-50">
                  <div className="text-sm text-slate-400 mb-1 print:text-gray-500">Score</div>
                  <div className="text-3xl font-bold text-white print:text-black">
                    {cert.score} <span className="text-lg text-slate-400">/ {cert.totalMarks}</span>
                  </div>
                  {cert.grade && (
                    <div className="text-sm font-bold text-[#10B981] mt-1 print:text-[#10B981]">Grade: {cert.grade}</div>
                  )}
                </div>
              )}

              {/* Certificate Number */}
              <div className="text-sm text-slate-500 mb-8 print:text-gray-500">
                Certificate No: <span className="font-mono text-[#F59E0B] font-bold print:text-[#B8860B]">{cert.certificateNo}</span>
              </div>

              {/* Date */}
              <p className="text-sm text-slate-400 print:text-gray-500">
                Issued on {new Date(cert.issuedAt).toLocaleDateString('en-BD', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-white/10 print:border-gray-300">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-lg">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg print:text-black">{SITE_CONFIG.name}</div>
                    <div className="text-xs text-slate-500 print:text-gray-500">{SITE_CONFIG.tagline}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revoked watermark */}
            {cert.status === 'revoked' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-6xl font-bold text-red-500/20 rotate-[-30deg] uppercase tracking-widest">Revoked</div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center print:hidden">
            <Link to="/dashboard" className="text-[#2563EB] font-bold text-sm hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
