import React from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, History } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CSR Sponsor Dashboard</h1>
        <p className="text-gray-500 mt-1">Discover verified rural health camps, commit CSR funding, and track impact.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/csr-admin/camps/fundable" className="block p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <IndianRupee className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Fundable Camps</h3>
          </div>
          <p className="text-gray-600 mt-2 text-sm leading-relaxed">
            Browse health camps that have been accepted by hospitals/NGOs and commit CSR budget grants directly.
          </p>
        </Link>

        <Link to="/csr-admin/funding/history" className="block p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Funding History</h3>
          </div>
          <p className="text-gray-600 mt-2 text-sm leading-relaxed">
            View all committed and utilized CSR grants, partner organizations, and camp operational status.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
