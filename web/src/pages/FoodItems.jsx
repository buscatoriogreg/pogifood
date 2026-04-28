import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const initialForm = { name: '', description: '', price: '', category_id: '', is_available: true };

export default function FoodItems() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState(null);

  const load = async () => {
    try {
      const [restRes, catRes] = await Promise.all([
        api.get('/restaurants/my'),
        api.get('/restaurants/categories')
      ]);
      setRestaurant(restRes.data);
      setCategories(catRes.data);
      const { data } = await api.get(`/food-items/restaurant/${restRes.data.id}`);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(initialForm);
    setImage(null);
    setPreview(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id || '',
      is_available: !!item.is_available
    });
    setPreview(item.image);
    setImage(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);
      if (editItem) {
        await api.put(`/food-items/${editItem.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/food-items', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this food item?')) return;
    try {
      await api.delete(`/food-items/${id}`);
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting item');
    }
  };

  const toggleAvailable = async (item) => {
    try {
      const fd = new FormData();
      fd.append('name', item.name);
      fd.append('price', item.price);
      fd.append('is_available', !item.is_available ? 1 : 0);
      await api.put(`/food-items/${item.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setItems(items.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    } catch {}
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Food Items</h1>
          <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium transition-colors">
            + Add Item
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🍽️</div>
            <p>No food items yet. Add your first item!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-4xl">🍽️</div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{item.category_name}</p>
                    </div>
                    <span className="text-orange-500 font-bold">₱{Number(item.price).toFixed(2)}</span>
                  </div>
                  {item.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                        item.is_available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {item.is_available ? '✓ Available' : '✗ Unavailable'}
                    </button>
                    <button onClick={() => openEdit(item)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between">
                <h2 className="text-lg font-bold">{editItem ? 'Edit Food Item' : 'Add Food Item'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱) *</label>
                    <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400">
                      <option value="">— None —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  {preview && <img src={preview} alt="preview" className="w-full h-36 object-cover rounded-lg mb-2" />}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-500" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-700">Available</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
