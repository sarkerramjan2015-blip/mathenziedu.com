import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { L } from '../../lib/i18n';
import type { Article, MainCategory, SubCategory } from '../../lib/types';

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', content: '', category: '', mainCategory: '', subCategory: '', image: '' });

  const fetchData = async () => {
    try {
      const [artSnap, catSnap, subSnap] = await Promise.all([
        getDocs(collection(db, 'articles')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'subcategories')),
      ]);
      setArticles(artSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Article[]);
      setMainCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as MainCategory[]);
      setSubCategories(subSnap.docs.map(d => ({ id: d.id, ...d.data() })) as SubCategory[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSubs = subCategories.filter(s => s.parentMainCategory === formData.mainCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dbData = {
        ...formData,
        category: formData.mainCategory, // keep backward compat
      };
      if (currentId) {
        await updateDoc(doc(db, 'articles', currentId), dbData);
      } else {
        await addDoc(collection(db, 'articles'), dbData);
      }
      setIsEditing(false);
      fetchData();
      setFormData({ title: '', description: '', content: '', category: '', mainCategory: '', subCategory: '', image: '' });
      setCurrentId(null);
    } catch (error) {
      console.error(error);
      alert('Error saving article');
    }
  };

  const handleEdit = (article: Article) => {
    setFormData({ 
      title: article.title, 
      description: article.description, 
      content: article.content || '', 
      category: article.mainCategory || article.category, 
      mainCategory: article.mainCategory || article.category, 
      subCategory: article.subCategory || '', 
      image: article.image || '' 
    });
    setCurrentId(article.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteDoc(doc(db, 'articles', id));
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Error deleting');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{isEditing ? L.editArticle : L.articles}</h2>
          <p className="mt-1 text-xs text-slate-400">{L.articlesHelp}</p>
        </div>
        <button onClick={() => { setIsEditing(true); setCurrentId(null); setFormData({ title: '', description: '', content: '', category: '', mainCategory: '', subCategory: '', image: '' }) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg">
          <Plus className="h-4 w-4"/> {L.addArticle}
        </button>
      </div>

      {isEditing ? (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4 text-black">
            <input required placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            
            {/* Main Category */}
            <select required value={formData.mainCategory} onChange={e => setFormData({...formData, mainCategory: e.target.value, subCategory: ''})} className="w-full p-2 border rounded text-slate-800">
              <option value="">Select Main Category</option>
              {mainCategories.map(c => (<option key={c.id} value={c.title}>{c.title}</option>))}
            </select>
            
            {/* Sub Category */}
            <select value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} className="w-full p-2 border rounded text-slate-800">
              <option value="">Select Subcategory (optional)</option>
              {filteredSubs.map(s => (<option key={s.id} value={s.title}>{s.title}</option>))}
            </select>
            
            <input placeholder="Image URL" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <textarea required placeholder="Short Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <textarea required placeholder="Full Content" rows={6} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <div className="flex gap-4 pt-4">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
              <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-600 text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-left text-white">
            <thead className="bg-black/20">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Subcategory</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id} className="border-b border-white/5">
                  <td className="p-4">{article.title}</td>
                  <td className="p-4">{article.mainCategory || article.category}</td>
                  <td className="p-4 text-slate-500 text-xs">{article.subCategory || '—'}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button onClick={() => handleEdit(article)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(article.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
