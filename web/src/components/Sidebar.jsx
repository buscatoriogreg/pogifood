import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/food-items', label: 'Food Items', icon: '🍔' },
  { to: '/orders', label: 'Orders', icon: '📋' },
  { to: '/restaurant', label: 'My Restaurant', icon: '🏪' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="text-orange-400 text-2xl font-bold">🍜 PogiFood</div>
        <div className="text-gray-400 text-sm mt-1">Restaurant Panel</div>
      </div>
      <div className="p-4 flex-1">
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Menu</div>
        <nav className="space-y-1">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{link.icon}</span> {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="text-gray-400 text-sm mb-2 truncate">{user?.name}</div>
        <button
          onClick={logout}
          className="w-full text-left text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
