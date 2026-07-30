import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { L } from '../../lib/i18n';
import type { MainCategory, SubCategory } from '../../lib/types';
import { UploadField } from '../../lib/upload';

export default function AdminCategories() {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  // Main cat editing
  const [editingMain, setEditingMain] = useState(false);
  const [mainId, setMainId] = useState<string | null>(null);
  const [mainForm, setMainForm] = useState({ title: '', description: '', color: '', coverImage: '', order: 0 });
  const [mainCustomId, setMainCustomId] = useState('');
  // Sub cat editing
  const [editingSub, setEditingSub] = useState(false);
  const [subId, setSubId] = useState<string | null>(null);
  const [subForm, setSubForm] = useState({ title: '', description: '', parentMainCategory: '' });
  // Expanded accordion
  const [expandedMain, setExpandedMain] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const mainSnap = await getDocs(collection(db, 'categories'));
      setMainCategories((mainSnap.docs.map(d => ({ id: d.id, ...d.data() })) as MainCategory[]).sort((a, b) => (a.order || 0) - (b.order || 0)));

      const subSnap = await getDocs(collection(db, 'subcategories'));
      setSubCategories(subSnap.docs.map(d => ({ id: d.id, ...d.data() })) as SubCategory[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...mainForm, order: Number(mainForm.order) };
      if (mainId) {
        await updateDoc(doc(db, 'categories', mainId), data);
      } else {
        if (mainCustomId) await setDoc(doc(db, 'categories', mainCustomId), data);
        else await addDoc(collection(db, 'categories'), data);
      }
      resetMainForm();
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error saving main category');
    }
  };

  const resetMainForm = () => {
    setEditingMain(false);
    setMainId(null);
    setMainForm({ title: '', description: '', color: '', coverImage: '', order: 0 });
    setMainCustomId('');
  };

  const handleMainDelete = async (id: string) => {
    if (!confirm('Delete this main category and ALL its subcategories?')) return;
    try {
      // Delete related subcategories
      const relSubs = subCategories.filter(s => s.parentMainCategory === mainCategories.find(m => m.id === id)?.title);
      for (const s of relSubs) {
        if (s.id) await deleteDoc(doc(db, 'subcategories', s.id));
      }
      await deleteDoc(doc(db, 'categories', id));
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error deleting');
    }
  };

  // Sub category handlers
  const openAddSub = (mainTitle: string) => {
    setEditingSub(true);
    setSubId(null);
    setSubForm({ title: '', description: '', parentMainCategory: mainTitle });
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (subId) {
        await updateDoc(doc(db, 'subcategories', subId), subForm);
      } else {
        await addDoc(collection(db, 'subcategories'), subForm);
      }
      setEditingSub(false);
      setSubId(null);
      setSubForm({ title: '', description: '', parentMainCategory: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error saving subcategory');
    }
  };

  const handleSubEdit = (sub: SubCategory) => {
    setSubForm({ title: sub.title, description: sub.description || '', parentMainCategory: sub.parentMainCategory || '' });
    setSubId(sub.id || null);
    setEditingSub(true);
  };

  const handleSubDelete = async (id: string) => {
    if (!confirm('Delete this subcategory?')) return;
    try {
      await deleteDoc(doc(db, 'subcategories', id));
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const getSubsForMain = (mainTitle: string) => subCategories.filter(s => s.parentMainCategory === mainTitle);

  if (loading) return <div className="text-slate-400">Loading categories...</div>;

  return (
    <div>
      {/* Main Categories Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{L.categories}</h2>
          <p className="mt-1 text-xs text-slate-400">{L.catsHelp}</p>
        </div>
        <button onClick={() => { setEditingMain(true); setMainId(null); setMainForm({ title: '', description: '', color: '', coverImage: '', order: mainCategories.length + 1 }); setMainCustomId(''); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg">
          <Plus className="h-4 w-4"/> {L.add} Main Category
        </button>
      </div>

      {/* Main Category Form */}
      {editingMain && (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">{mainId ? 'Edit' : 'New'} Main Category</h3>
          <form onSubmit={handleMainSubmit} className="space-y-4 text-black">
            {!mainId && (
              <input placeholder="Custom ID (optional)" value={mainCustomId} onChange={e => setMainCustomId(e.target.value)} className="w-full p-2 border rounded text-slate-800" />
            )}
            <input required placeholder="Title (e.g. Academic Maths)" value={mainForm.title} onChange={e => setMainForm({...mainForm, title: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <input required placeholder="Short Description" value={mainForm.description} onChange={e => setMainForm({...mainForm, description: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <input placeholder="Color Config (e.g. text-[#F59E0B])" value={mainForm.color} onChange={e => setMainForm({...mainForm, color: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <UploadField
              label="Category Cover / ক্যাটাগরি কভার"
              value={mainForm.coverImage}
              onChange={coverImage => setMainForm({ ...mainForm, coverImage })}
              folder="category-covers"
            />
            <p className="-mt-3 text-xs text-slate-300">Image URL অথবা /course-covers/file-name.png path দিন।</p>
            <input type="number" placeholder="Order" value={mainForm.order} onChange={e => setMainForm({...mainForm, order: Number(e.target.value)})} className="w-full p-2 border rounded text-slate-800" />
            <div className="flex gap-4 pt-4">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
              <button type="button" onClick={resetMainForm} className="bg-slate-600 text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Sub Category Form */}
      {editingSub && (
        <div className="bg-white/5 p-6 rounded-2xl border border-indigo-500/30 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">{subId ? 'Edit' : 'New'} Subcategory</h3>
          <form onSubmit={handleSubSubmit} className="space-y-4 text-black">
            <input required placeholder="Subcategory Title (e.g. O Level)" value={subForm.title} onChange={e => setSubForm({...subForm, title: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <input placeholder="Description (optional)" value={subForm.description} onChange={e => setSubForm({...subForm, description: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <select required value={subForm.parentMainCategory} onChange={e => setSubForm({...subForm, parentMainCategory: e.target.value})} className="w-full p-2 border rounded text-slate-800">
              <option value="">Select Parent Main Category</option>
              {mainCategories.map(m => (<option key={m.id} value={m.title}>{m.title}</option>))}
            </select>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
              <button type="button" onClick={() => { setEditingSub(false); setSubId(null); setSubForm({ title: '', description: '', parentMainCategory: '' }); }} className="bg-slate-600 text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Accordion List */}
      <div className="space-y-4">
        {mainCategories.map(main => {
          const subs = getSubsForMain(main.title);
          const isExpanded = expandedMain === main.id;
          return (
            <div key={main.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpandedMain(isExpanded ? null : main.id)}>
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                  <div>
                    <span className={`font-bold text-white ${main.color || ''}`}>{main.title}</span>
                    <span className="text-slate-500 text-sm ml-2">{main.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 bg-black/30 px-2 py-1 rounded">{subs.length} subs</span>
                  <button onClick={(e) => { e.stopPropagation(); handleMainDelete(main.id); }} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="h-4 w-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingMain(true); setMainId(main.id); setMainForm({ title: main.title, description: main.description, color: main.color || '', coverImage: main.coverImage || '', order: main.order || 0 }); }} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"><Edit2 className="h-4 w-4" /></button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-white/10 p-4 pl-12">
                  {subs.length === 0 && <p className="text-slate-500 text-sm mb-3">No subcategories yet.</p>}
                  {subs.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between py-2 px-3 hover:bg-white/5 rounded-lg group">
                      <div>
                        <span className="text-white text-sm font-medium">{sub.title}</span>
                        {sub.description && <span className="text-slate-500 text-xs ml-2">{sub.description}</span>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleSubEdit(sub)} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => sub.id && handleSubDelete(sub.id)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => openAddSub(main.title)} className="mt-3 flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add Subcategory
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
