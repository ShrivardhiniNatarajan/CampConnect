import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, FilePlus, List, Bell, FileText, IndianRupee, History, CheckSquare, LogOut, HeartPulse } from 'lucide-react';

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = {
    social_worker: [
      { path: '/social-worker', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
      { path: '/social-worker/tickets/create', label: 'Request Camp', icon: <FilePlus className="w-5 h-5 mr-3" /> },
      { path: '/social-worker/tickets', label: 'My Requests', icon: <List className="w-5 h-5 mr-3" /> }
    ],
    org_admin: [
      { path: '/org-admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
      { path: '/org-admin/notifications', label: 'Notifications', icon: <Bell className="w-5 h-5 mr-3" /> },
      { path: '/org-admin/reports/submit', label: 'Submit Report', icon: <FileText className="w-5 h-5 mr-3" /> }
    ],
    csr_admin: [
      { path: '/csr-admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
      { path: '/csr-admin/camps/fundable', label: 'Fundable Camps', icon: <IndianRupee className="w-5 h-5 mr-3" /> },
      { path: '/csr-admin/funding/history', label: 'Funding History', icon: <History className="w-5 h-5 mr-3" /> }
    ],
    coordinator: [
      { path: '/coordinator', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
      { path: '/coordinator/reports/pending', label: 'Pending Reports', icon: <CheckSquare className="w-5 h-5 mr-3" /> }
    ]
  };

  const links = user ? navLinks[user.role] || [] : [];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-72 bg-white shadow-xl flex flex-col z-10 hidden md:flex">
        <div className="p-6 bg-blue-700 text-white shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <HeartPulse className="w-8 h-8 text-blue-200" />
            <h2 className="text-2xl font-bold tracking-tight">CampConnect</h2>
          </div>
          <div className="bg-blue-800/50 p-3 rounded-lg border border-blue-600/30">
            <p className="text-sm text-blue-200">Welcome back,</p>
            <p className="font-semibold text-lg truncate">{user?.name}</p>
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize shadow-sm">
              {user?.role.replace('_', ' ')}
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                {React.cloneElement(link.icon, { 
                  className: `w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}` 
                })}
                {link.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
