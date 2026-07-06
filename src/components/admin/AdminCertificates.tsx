import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, Award, XCircle, CheckCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { L } from '../../lib/i18n';
import type { Certificate, ExamAttempt, CourseProgress, Exam } from '../../lib/types';

const STATUS_COLORS: Record<string, string> = {
  issued: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
  revoked: 'text-red-400 bg-red-500/10 border-red-400/30',
};

function generateCertNo(): string {
  const prefix = 'MZ';
  const date = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

function getGrade(score: number, total: number): string {
  const pct = (score / total) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

interface AdminCertificatesProps {
  exams: Exam[];
}

export default function AdminCertificates({ exams }: AdminCertificatesProps) {
  const [tab, setTab] = useState<'issued' | 'issue'>('issued');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [courseProgressList, setCourseProgressList] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'course' | 'exam'; title: string; userId: string; userEmail: string; studentName: string; score?: number; totalMarks?: number } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [certSnap, attSnap, progSnap] = await Promise.all([
        getDocs(query(collection(db, 'certificates'), orderBy('issuedAt', 'desc'))),
        getDocs(query(collection(db, 'examAttempts'), where('status', '==', 'evaluated'))),
        getDocs(query(collection(db, 'courseProgress'), where('status', '==', 'completed'))),
      ]);
      setCertificates(certSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Certificate[]);
      setAttempts(attSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ExamAttempt[]);
      setCourseProgressList(progSnap.docs.map(d => ({ id: d.id, ...d.data() })) as CourseProgress[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleIssue = async () => {
    if (!selectedItem) return;
    setIssuing(true);
    try {
      await addDoc(collection(db, 'certificates'), {
        userId: selectedItem.userId,
        userEmail: selectedItem.userEmail,
        studentName: selectedItem.studentName,
        certificateType: selectedItem.type,
        itemId: selectedItem.id,
        itemTitle: selectedItem.title,
        certificateNo: generateCertNo(),
        issuedAt: Date.now(),
        score: selectedItem.score ?? null,
        totalMarks: selectedItem.totalMarks ?? null,
        grade: selectedItem.score !== undefined && selectedItem.totalMarks ? getGrade(selectedItem.score, selectedItem.totalMarks) : null,
        status: 'issued',
      });
      setSelectedItem(null);
      fetchData();
    } catch (e) { console.error(e); alert('Error issuing certificate.'); }
    finally { setIssuing(false); }
  };

  const handleRevoke = async (certId: string) => {
    if (!confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) return;
    try {
      await updateDoc(doc(db, 'certificates', certId), { status: 'revoked', revokedAt: Date.now() });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const alreadyIssued = (itemId: string, type: string) => 
    certificates.some(c => c.itemId === itemId && c.certificateType === type && c.status === 'issued');

  const filteredCerts = certificates.filter(c => {
    const q = search.toLowerCase();
    return !q || c.studentName.toLowerCase().includes(q) || c.userEmail.toLowerCase().includes(q) || c.certificateNo.toLowerCase().includes(q) || c.itemTitle.toLowerCase().includes(q);
  });

  if (loading) return <div className="text-slate-400 text-center py-12"><div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">{L.certificates}</h2>
      <p className="mt-1 text-xs text-slate-400 mb-4">{L.certHelp}</p>
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setTab('issued')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'issued' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
          Issued Certificates ({certificates.filter(c => c.status === 'issued').length})
        </button>
        <button onClick={() => setTab('issue')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'issue' ? 'bg-[#F59E0B] text-white shadow-lg' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
          Issue New Certificate
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-500" />
        </div>
        <span className="text-xs text-slate-500">{filteredCerts.length} results</span>
      </div>

      {tab === 'issued' && (
        <div className="space-y-3">
          {filteredCerts.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <Award className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-500">No certificates found.</p>
            </div>
          )}
          {filteredCerts.map(cert => (
            <div key={cert.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  cert.status === 'issued' ? 'bg-[#F59E0B]/20' : 'bg-red-500/20'
                }`}>
                  <Award className={`h-5 w-5 ${cert.status === 'issued' ? 'text-[#F59E0B]' : 'text-red-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white text-sm">{cert.studentName}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[cert.status] || ''}`}>
                      {cert.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{cert.itemTitle} · <span className="text-[#F59E0B] font-mono">{cert.certificateNo}</span></p>
                  <div className="flex gap-3 mt-1 text-[10px] text-slate-500">
                    <span>{cert.certificateType}</span>
                    <span>{cert.userEmail}</span>
                    <span>Issued: {new Date(cert.issuedAt).toLocaleDateString('en-BD')}</span>
                    {cert.score !== undefined && <span className="text-[#10B981]">Score: {cert.score}/{cert.totalMarks} ({cert.grade})</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={`/certificates/${cert.id}`} target="_blank" rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                  <ExternalLink className="h-4 w-4" />
                </a>
                {cert.status === 'issued' && (
                  <button onClick={() => handleRevoke(cert.id!)}
                    className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10">
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'issue' && (
        <div className="space-y-6">
          {/* Exam Certificates */}
          <div>
            <h3 className="font-bold text-white text-sm mb-3 uppercase tracking-wider">Evaluated Exams</h3>
            {attempts.filter(a => !alreadyIssued(a.examId!, 'exam')).length === 0 ? (
              <p className="text-xs text-slate-500 bg-white/5 rounded-xl p-4">All evaluated exams already have certificates issued.</p>
            ) : (
              <div className="space-y-3">
                {attempts.filter(a => !alreadyIssued(a.examId!, 'exam')).map(a => (
                  <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-sm">{a.examTitle}</h4>
                      <p className="text-xs text-slate-400">{a.userEmail} · Score: {a.obtainedMarks}/{a.totalMarks}</p>
                    </div>
                    <button onClick={() => setSelectedItem({
                      id: a.examId!, type: 'exam', title: a.examTitle,
                      userId: a.userId, userEmail: a.userEmail,
                      studentName: a.userEmail.split('@')[0],
                      score: a.obtainedMarks, totalMarks: a.totalMarks,
                    })}
                      className="bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-bold px-3 py-2 rounded-xl border border-[#F59E0B]/30 hover:bg-[#F59E0B]/30 transition-all">
                      Issue Certificate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Course Certificates */}
          <div>
            <h3 className="font-bold text-white text-sm mb-3 uppercase tracking-wider">Completed Courses</h3>
            {courseProgressList.filter(c => !alreadyIssued(c.courseId, 'course')).length === 0 ? (
              <p className="text-xs text-slate-500 bg-white/5 rounded-xl p-4">All completed courses already have certificates issued.</p>
            ) : (
              <div className="space-y-3">
                {courseProgressList.filter(c => !alreadyIssued(c.courseId, 'course')).map(c => (
                  <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.courseTitle}</h4>
                      <p className="text-xs text-slate-400">{c.userEmail} · Progress: {c.progressPercent}%</p>
                    </div>
                    <button onClick={() => setSelectedItem({
                      id: c.courseId, type: 'course', title: c.courseTitle,
                      userId: c.userId, userEmail: c.userEmail,
                      studentName: c.userEmail.split('@')[0],
                    })}
                      className="bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-bold px-3 py-2 rounded-xl border border-[#F59E0B]/30 hover:bg-[#F59E0B]/30 transition-all">
                      Issue Certificate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Issue Confirmation Modal */}
          {selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-[#0F172A] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl">
                <div className="text-center mb-6">
                  <Award className="h-12 w-12 text-[#F59E0B] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Issue Certificate</h3>
                  <p className="text-sm text-slate-400">This will generate a certificate with a unique number.</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Student:</span><span className="text-white font-bold">{selectedItem.studentName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="text-white">{selectedItem.userEmail}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Item:</span><span className="text-white">{selectedItem.title}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Type:</span><span className="text-white capitalize">{selectedItem.type}</span></div>
                  {selectedItem.score !== undefined && (
                    <div className="flex justify-between"><span className="text-slate-400">Score:</span><span className="text-[#10B981] font-bold">{selectedItem.score}/{selectedItem.totalMarks}</span></div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSelectedItem(null)} className="flex-1 bg-white/10 text-white font-bold px-5 py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm">Cancel</button>
                  <button onClick={handleIssue} disabled={issuing}
                    className="flex-1 bg-[#F59E0B] hover:text-black text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                    {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                    {issuing ? 'Issuing...' : 'Confirm Issue'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
