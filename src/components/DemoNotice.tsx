import React from 'react';
import { Eye } from 'lucide-react';
import { DEMO_MODE } from '../lib/demo';

export function DemoNotice({ text = "Demo mode: changes are saved locally only." }: { text?: string }) {
  if (!DEMO_MODE) return null;
  return (
    <div className="mb-4 rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 py-2.5 text-xs text-purple-300 flex items-center gap-2">
      <Eye className="h-3.5 w-3.5 shrink-0" /> {text}
    </div>
  );
}
