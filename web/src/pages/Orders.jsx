import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/orders/owner' + (filter ? `?status=${filter}` : ''));
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); load(); }, [filter]);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.put(`/orders/owner/${orderId}/status`, { status });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">All Orders</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p>No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-semibold text-gray-900">Order #{order.id}</div>
                      <div className="text-sm text-gray-500">{order.customer_name} • {new Date(order.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-orange-500">₱{Number(order.total_amount).toFixed(2)}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-400">{expanded === order.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === order.id && (
                  <div className="border-t p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Customer</p>
                        <p className="text-sm">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Delivery Address</p>
                        <p className="text-sm">{order.delivery_address}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 font-medium mb-2">Items</p>
                      <div className="space-y-1">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 font-medium">Notes</p>
                        <p className="text-sm text-gray-700">{order.notes}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.filter(s => s !== order.status).map(s => (
                          <button
                            key={s}
                            disabled={updating === order.id}
                            onClick={() => updateStatus(order.id, s)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-300 hover:border-orange-400 hover:text-orange-500 transition-colors disabled:opacity-50"
                          >
                            {s.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
