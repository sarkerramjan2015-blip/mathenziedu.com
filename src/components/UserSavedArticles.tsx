import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Link } from 'react-router-dom';
import { ChevronRight, Trash2 } from 'lucide-react';
import type { Article } from '../lib/types';

export default function UserSavedArticles() {
  const { user } = useAuth();
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'savedArticles'));
      const articlePromises = snap.docs.map(async (d) => {
        const adoc = await getDoc(doc(db, 'articles', d.id));
        if (adoc.exists()) {
           return { ...adoc.data(), id: adoc.id } as Article;
        }
        return null;
      });
      const resolved = (await Promise.all(articlePromises)).filter(Boolean);
      setSavedArticles(resolved);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSaved(); }, [user]);

  const handleRemove = async (articleId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savedArticles', articleId));
      fetchSaved();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading saved articles...</div>;
  if (!savedArticles.length) return <div className="text-slate-400 p-8 text-center bg-white/5 rounded-2xl border border-white/10">No saved articles found.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {savedArticles.map(article => (
        <div key={article.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col hover:bg-white/10 transition-colors">
          <h3 className="font-bold text-lg text-white mb-2">{article.title}</h3>
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">{article.description}</p>
          <div className="mt-auto flex justify-between items-center">
            <Link to={`/articles/${article.id}`} className="text-blue-400 hover:text-blue-300 text-sm font-bold flex items-center gap-1">
              Read <ChevronRight className="h-4 w-4" />
            </Link>
            <button onClick={() => handleRemove(article.id)} className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-400/10 transition-colors">
               <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
