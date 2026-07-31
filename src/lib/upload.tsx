// Simple file upload helper using Firebase Storage
// Falls back to URL input if Firebase Storage is not configured

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Loader2, Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';

let storage: any = null;
try {
  // Lazy import — won't crash if Storage is not configured in Firebase project
  storage = getStorage();
} catch (e) {
  console.warn('Firebase Storage not configured. Image/file uploads will fall back to URL input.');
}

export { storage };

interface UploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  folder?: string;
  showUrlInput?: boolean;
}

export function UploadField({ label, value, onChange, accept = 'image/*', folder = 'uploads', showUrlInput = true }: UploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useUrl, setUseUrl] = useState(true);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!storage) {
      alert('Firebase Storage is not configured yet. Please paste an image URL instead.');
      setUseUrl(true);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(pct);
        },
        (error) => {
          console.error('Upload error:', error);
          alert('Upload failed. Please try again or use a URL.');
          setUploading(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(url);
          setUploading(false);
          setProgress(0);
        }
      );
    } catch (e) {
      console.error(e);
      alert('Upload failed. Please paste an image URL instead.');
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-400 mb-1.5">{label}</label>

      {/* Mode toggle */}
      {showUrlInput && (
        <div className="flex items-center gap-2 mb-2">
          <button type="button" onClick={() => setUseUrl(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${useUrl ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
            <LinkIcon className="h-3 w-3" /> ছবির লিংক
          </button>
          <button type="button" onClick={() => setUseUrl(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${!useUrl ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
            <Upload className="h-3 w-3" /> ছবি আপলোড
          </button>
          {!storage && (
            <span className="text-[9px] text-[#F59E0B] flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> আপলোড চালু নেই—ছবির লিংক দিন
            </span>
          )}
        </div>
      )}

      {/* URL input */}
      {(useUrl || !storage) && (
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="https://... ছবির লিংক এখানে দিন"
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-600" />
      )}

      {/* File upload */}
      {!useUrl && storage && (
        <div>
          <input type="file" accept={accept} onChange={handleFileUpload}
            className="w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#2563EB] file:text-white hover:file:bg-blue-500 file:cursor-pointer" />
          {uploading && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> আপলোড হচ্ছে… {progress}%
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 mt-1 border border-white/5 overflow-hidden">
                <div className="bg-[#2563EB] h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {value && (
            <div className="mt-2">
              <img src={value} alt="Preview" className="h-20 w-auto rounded-lg border border-white/10 object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Preview for URL mode */}
      {useUrl && value && (
        <div className="mt-2">
          <img src={value} alt="Preview" className="h-20 w-auto rounded-lg border border-white/10 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
    </div>
  );
}
