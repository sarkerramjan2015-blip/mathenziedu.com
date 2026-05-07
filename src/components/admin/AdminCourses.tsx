import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Edit2, Trash2, Plus } from 'lucide-react';
import type { Category, Course } from '../../lib/types';
import { formatCurrency } from '../../lib/media';

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [customId, setCustomId] = useState('');
  const [formData, setFormData] = useState({ 
    title: '', description: '', category: '', instructor: '', 
    price: 0, rating: 0, lessons: 0, image: '' 
  });

  const fetchData = async () => {
    try {
      const snap = await getDocs(collection(db, 'courses'));
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[]);
      
      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dbData = { 
        ...formData, 
        price: Number(formData.price),
        rating: Number(formData.rating),
        lessons: Number(formData.lessons)
      };
      if (currentId) {
        await updateDoc(doc(db, 'courses', currentId), dbData);
      } else {
        if (customId) {
           await setDoc(doc(db, 'courses', customId), dbData);
        } else {
           await addDoc(collection(db, 'courses'), dbData);
        }
      }
      setIsEditing(false);
      fetchData();
      setFormData({ title: '', description: '', category: '', instructor: '', price: 0, rating: 0, lessons: 0, image: '' });
      setCurrentId(null);
      setCustomId('');
    } catch (error) {
      console.error(error);
      alert('Error saving course');
    }
  };

  const handleEdit = (course: Course) => {
    setFormData({ 
      title: course.title, 
      description: course.description, 
      category: course.category, 
      instructor: course.instructor, 
      price: course.price, 
      rating: course.rating || 0,
      lessons: course.lessons || 0,
      image: course.image || '' 
    });
    setCurrentId(course.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteDoc(doc(db, 'courses', id));
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
        <h2 className="text-2xl font-bold text-white">Manage Courses</h2>
        <button onClick={() => { 
          setIsEditing(true); setCurrentId(null); 
          setFormData({ title: '', description: '', category: categories.length > 0 ? categories[0].title : '', instructor: '', price: 0, rating: 0, lessons: 0, image: '' }); 
          setCustomId('');
        }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus className="h-4 w-4"/> Add Course
        </button>
      </div>

      {isEditing ? (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4 text-black">
            {!currentId && (
              <input placeholder="Custom ID (optional)" value={customId} onChange={e => setCustomId(e.target.value)} className="w-full p-2 border rounded text-slate-800" />
            )}
            <input required placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded text-slate-800">
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.title}>{c.title}</option>
              ))}
            </select>
            <input required placeholder="Instructor Name" value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <div className="flex gap-4">
              <input type="number" required placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-2 border rounded text-slate-800" />
              <input type="number" step="0.1" placeholder="Rating" value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} className="w-full p-2 border rounded text-slate-800" />
              <input type="number" placeholder="Lessons" value={formData.lessons} onChange={e => setFormData({...formData, lessons: Number(e.target.value)})} className="w-full p-2 border rounded text-slate-800" />
            </div>
            <input placeholder="Image URL" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            <textarea required placeholder="Description" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded text-slate-800" />
            
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
                <th className="p-4">Instructor</th>
                <th className="p-4">Price</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id} className="border-b border-white/5">
                  <td className="p-4 font-medium">{course.title}</td>
                  <td className="p-4 text-slate-400">{course.category}</td>
                  <td className="p-4 text-slate-400">{course.instructor}</td>
                  <td className="p-4">{formatCurrency(course.price)}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button onClick={() => handleEdit(course)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(course.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="h-4 w-4" /></button>
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
