import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

export default function RestaurantSettings() {
  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', address: '', is_open: true });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/restaurants/my').then(({ data }) => {
      setRestaurant(data);
      setForm({ name: data.name, description: data.description || '', address: data.address || '', is_open: !!data.is_open });
      setPreview(data.image);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);
      await api.put('/restaurants/my', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Restaurant updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating restaurant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Restaurant</h1>

        {!restaurant ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : (
          <div className="max-w-lg bg-white rounded-xl shadow-sm border p-6">
            {success && <div className="bg-green-50 text-green-700 rounded-lg p-3 mb-4 text-sm">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                {preview && <img src={preview} alt="preview" className="w-full h-44 object-cover rounded-lg mb-2" />}
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setImage(f); setPreview(URL.createObjectURL(f)); } }} className="text-sm text-gray-500" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 rounded-lg p-3">
                <input type="checkbox" checked={form.is_open} onChange={e => setForm({ ...form, is_open: e.target.checked })} className="w-4 h-4 text-orange-500" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Restaurant is Open</span>
                  <p className="text-xs text-gray-400">Toggle to accept or pause orders</p>
                </div>
              </label>
              <button type="submit" disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
