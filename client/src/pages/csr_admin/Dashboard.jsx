import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">CSR Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/csr-admin/camps/fundable" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-100">
          <h3 className="text-lg font-semibold text-blue-600">Fundable Camps</h3>
          <p className="text-gray-600 mt-2">View camps that have been accepted and are awaiting CSR funding.</p>
        </Link>
        <Link to="/csr-admin/funding/history" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-100">
          <h3 className="text-lg font-semibold text-blue-600">Funding History</h3>
          <p className="text-gray-600 mt-2">View past funding commitments and their statuses.</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
