import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { L } from '../../lib/i18n';
import type { Book, MainCategory, SubCategory } from '../../lib/types';
import { formatCurrency } from '../../lib/media';

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [customId, setCustomId] = useState('');
  const [formData, setFormData] = useState({
    title: '', author: '', description: '', category: '', mainCategory: 'Books Corner', subCategory: '',
    classOrLevel: '', price: 0, isFree: false, coverImage: '', buyUrl: '', downloadUrl: '',
  });

  const fetchData = async () => {
    try {
      const [bookSnap, catSnap, subSnap] = await Promise.all([
        getDocs(collection(db, 'books')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'subcategories')),
      ]);
      setBooks(bookSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Book[]);
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
      const dbData = { ...formData, price: Number(formData.price), category: formData.mainCategory };
      if (currentId) {
        await updateDoc(doc(db, 'books', currentId), dbData);
      } else {
        if (customId) await setDoc(doc(db, 'books', customId), { ...dbData, createdAt: Date.now() });
        else await addDoc(collection(db, 'books'), { ...dbData, createdAt: Date.now() });
      }
      setIsEditing(false);
      fetchData();
      resetForm();
    } catch (error) {
      console.error(error);
      alert('Error saving book');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', author: '', description: '', category: '', mainCategory: 'Books Corner', subCategory: '', classOrLevel: '', price: 0, isFree: false, coverImage: '', buyUrl: '', downloadUrl: '' });
    setCurrentId(null);
    setCustomId('');
  };

  const handleEdit = (book: Book) => {
    setFormData({
      title: book.title, author: book.author, description: book.description,
      category: book.mainCategory || book.category, mainCategory: book.mainCategory,
      subCategory: book.subCategory || '', classOrLevel: book.classOrLevel || '',
      price: book.price, isFree: book.isFree, coverImage: book.coverImage || '',
      buyUrl: book.buyUrl || '', downloadUrl: book.downloadUrl || '',
    });
    setCurrentId(book.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    try {
      await deleteDoc(doc(db, 'books', id));
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error deleting');
    }
  };

  if (loading) return <div className="text-slate-400">Loading books...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{isEditing ? L.editBook : L.books}</h2>
          <p className="mt-1 text-xs text-slate-400">{L.booksHelp}</p>
        </div>
        <button onClick={() => { setIsEditing(true); resetForm(); }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg">
          <Plus className="h-4 w-4"/> {L.addBook}
        </button>
      </div>

      {isEditing && (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">{currentId ? L.editBook : L.addBook}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 text-black">
            {!currentId && (
              <input placeholder="Custom ID (optional)" value={customId} onChange={e => setCustomId(e.target.value)} className="w-full p-2 border rounded text-slate-800" />
            )}
            <input required placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <input required placeholder="Author" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <div className="flex gap-4">
              <select value={formData.mainCategory} onChange={e => setFormData({...formData, mainCategory: e.target.value, subCategory: ''})} className="w-full p-2 border rounded text-slate-800">
                {mainCategories.map(c => (<option key={c.id} value={c.title}>{c.title}</option>))}
              </select>
              <select value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} className="w-full p-2 border rounded text-slate-800">
                <option value="">Subcategory</option>
                {filteredSubs.map(s => (<option key={s.id} value={s.title}>{s.title}</option>))}
              </select>
            </div>
            <input placeholder="Class / Level (e.g. HSC, O Level)" value={formData.classOrLevel} onChange={e => setFormData({...formData, classOrLevel: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <div className="flex gap-4 items-center">
              <input type="number" placeholder="Price (৳)" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-2 border rounded text-slate-800" />
              <label className="flex items-center gap-2 text-slate-200 text-sm whitespace-nowrap">
                <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.checked, price: e.target.checked ? 0 : formData.price})} />
                Free
              </label>
            </div>
            <input placeholder="Cover Image URL" value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <input placeholder="Download URL (for free books)" value={formData.downloadUrl} onChange={e => setFormData({...formData, downloadUrl: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <textarea required placeholder="Description" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <div className="flex gap-4 pt-4">
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">Save</button>
              <button type="button" onClick={() => { setIsEditing(false); resetForm(); }} className="bg-slate-600 text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-white">
          <thead className="bg-black/20">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Author</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.id} className="border-b border-white/5">
                <td className="p-4 font-medium">{book.title}</td>
                <td className="p-4 text-slate-400">{book.author}</td>
                <td className="p-4 text-slate-400">{book.subCategory || book.mainCategory}</td>
                <td className="p-4">{book.isFree ? <span className="text-emerald-400 font-bold">Free</span> : formatCurrency(book.price)}</td>
                <td className="p-4 flex gap-2 justify-end">
                  <button onClick={() => handleEdit(book)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(book.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
