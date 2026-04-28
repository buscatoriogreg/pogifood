import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    restaurantName: '', restaurantDescription: '', restaurantAddress: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (image) formData.append('restaurant_image', image);

      const { data } = await api.post('/auth/owner/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} required={!['phone', 'restaurantDescription', 'restaurantAddress'].includes(key)}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏪</div>
          <h1 className="text-3xl font-bold text-gray-900">Register Restaurant</h1>
          <p className="text-gray-500 mt-1">Join PogiFood as a restaurant owner</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-b pb-4">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-3">Account Info</p>
            {field('Full Name', 'name', 'text', 'Your full name')}
            {field('Email', 'email', 'email', 'your@email.com')}
            {field('Password', 'password', 'password', '••••••••')}
            {field('Phone', 'phone', 'tel', '+63 900 000 0000')}
          </div>

          <div className="pt-2">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-3">Restaurant Info</p>
            {field('Restaurant Name', 'restaurantName', 'text', 'e.g. Aling Nena\'s Lutong Bahay')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.restaurantDescription}
                onChange={e => setForm({ ...form, restaurantDescription: e.target.value })}
                rows={2}
                placeholder="What kind of food do you serve?"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>
            {field('Address', 'restaurantAddress', 'text', 'Restaurant address')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Photo</label>
              {preview && <img src={preview} alt="preview" className="w-full h-36 object-cover rounded-lg mb-2" />}
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500" />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register Restaurant'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-500 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
