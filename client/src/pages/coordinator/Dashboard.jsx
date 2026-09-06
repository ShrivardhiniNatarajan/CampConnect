import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Coordinator Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/coordinator/reports/pending" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-100">
          <h3 className="text-lg font-semibold text-blue-600">Pending Reports</h3>
          <p className="text-gray-600 mt-2">View and verify camp completion reports submitted by organizations.</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
