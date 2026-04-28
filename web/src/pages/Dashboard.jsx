import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, revenue: 0 });

  useEffect(() => {
    api.get('/orders/owner').then(({ data }) => {
      setOrders(data);
      setStats({
        total: data.length,
        pending: data.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length,
        delivered: data.filter(o => o.status === 'delivered').length,
        revenue: data.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total_amount), 0),
      });
    }).finally(() => setLoading(false));
  }, []);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: stats.total, icon: '📋', color: 'bg-blue-50 text-blue-600' },
            { label: 'Active Orders', value: stats.pending, icon: '⏳', color: 'bg-yellow-50 text-yellow-600' },
            { label: 'Delivered', value: stats.delivered, icon: '✅', color: 'bg-green-50 text-green-600' },
            { label: 'Revenue', value: `₱${stats.revenue.toFixed(2)}`, icon: '💰', color: 'bg-orange-50 text-orange-600' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm mt-1 opacity-80">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No orders yet</div>
          ) : (
            <div className="divide-y">
              {recentOrders.map(order => (
                <div key={order.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">#{order.id} — {order.customer_name}</div>
                    <div className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">₱{Number(order.total_amount).toFixed(2)}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
