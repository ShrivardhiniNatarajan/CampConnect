import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = {
    social_worker: [
      { path: '/social-worker', label: 'Dashboard' },
      { path: '/social-worker/tickets/create', label: 'Create Ticket' },
      { path: '/social-worker/tickets', label: 'My Tickets' }
    ],
    org_admin: [
      { path: '/org-admin', label: 'Dashboard' },
      { path: '/org-admin/notifications', label: 'Notifications' },
      { path: '/org-admin/reports/submit', label: 'Submit Report' }
    ],
    csr_admin: [
      { path: '/csr-admin', label: 'Dashboard' },
      { path: '/csr-admin/camps/fundable', label: 'Fundable Camps' },
      { path: '/csr-admin/funding/history', label: 'Funding History' }
    ],
    coordinator: [
      { path: '/coordinator', label: 'Dashboard' },
      { path: '/coordinator/reports/pending', label: 'Pending Reports' }
    ]
  };

  const links = user ? navLinks[user.role] || [] : [];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 bg-blue-600 text-white">
          <h2 className="text-xl font-bold">CampConnect</h2>
          <p className="text-sm mt-1">Welcome, {user?.name}</p>
          <span className="text-xs uppercase bg-blue-800 px-2 py-1 rounded mt-2 inline-block">
            {user?.role.replace('_', ' ')}
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
