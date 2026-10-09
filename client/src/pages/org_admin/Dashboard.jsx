import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, FileText, History } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hospital & NGO Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage incoming camp requests, field execution, and completion reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/org-admin/notifications" className="block p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Incoming Requests</h3>
          </div>
          <p className="text-gray-600 mt-2 text-sm leading-relaxed">
            Review incoming camp requests matched in your vicinity, check credibility scores, and accept or reject.
          </p>
        </Link>

        <Link to="/org-admin/reports/submit" className="block p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Submit Report</h3>
          </div>
          <p className="text-gray-600 mt-2 text-sm leading-relaxed">
            Submit post-camp completion reports, enter actual patient counts treated, and upload proof photos.
          </p>
        </Link>

        <Link to="/org-admin/history" className="block p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Camp History</h3>
          </div>
          <p className="text-gray-600 mt-2 text-sm leading-relaxed">
            Track past camps, review submitted reports, and check coordinator verification statuses.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
