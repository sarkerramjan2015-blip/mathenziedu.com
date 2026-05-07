import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Edit2, Trash2, Plus } from 'lucide-react';
import type { Category } from '../../lib/types';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [customId, setCustomId] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '', color: '', icon: '', order: 0 });

  const fetchCategories = async () => {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      setCategories((snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]).sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dbData = { ...formData, order: Number(formData.order) };
      if (currentId) {
        await updateDoc(doc(db, 'categories', currentId), dbData);
      } else {
        if (customId) {
           await setDoc(doc(db, 'categories', customId), dbData);
        } else {
           await addDoc(collection(db, 'categories'), dbData);
        }
      }
      setIsEditing(false);
      fetchCategories();
      setFormData({ title: '', description: '', color: '', icon: '', order: 0 });
      setCurrentId(null);
      setCustomId('');
    } catch (error) {
      console.error(error);
      alert('Error saving category');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({ 
      title: category.title, 
      description: category.description, 
      color: category.color || '', 
      icon: category.icon || '', 
      order: category.order || 0 
    });
    setCurrentId(category.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        fetchCategories();
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
        <h2 className="text-2xl font-bold text-white">Manage Categories</h2>
        <button onClick={() => { setIsEditing(true); setCurrentId(null); setFormData({ title: '', description: '', color: '', icon: '', order: categories.length + 1 }); setCustomId(''); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus className="h-4 w-4"/> Add Category
        </button>
      </div>

      {isEditing ? (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4 text-black">
            {!currentId && (
              <input placeholder="Custom ID (optional)" value={customId} onChange={e => setCustomId(e.target.value)} className="w-full p-2 border rounded text-slate-800" />
            )}
            <input required placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <input required placeholder="Short Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <input placeholder="Color Config (e.g. text-[#F59E0B])" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <input type="number" placeholder="Order" value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="w-full p-2 border rounded text-slate-800" />
            
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
                <th className="p-4">Description</th>
                <th className="p-4">Order</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id} className="border-b border-white/5">
                  <td className="p-4 font-bold">{category.title}</td>
                  <td className="p-4 text-slate-400">{category.description}</td>
                  <td className="p-4">{category.order}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button onClick={() => handleEdit(category)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(category.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="h-4 w-4" /></button>
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
