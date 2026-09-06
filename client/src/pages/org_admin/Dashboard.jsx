import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Organization Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/org-admin/notifications" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-100">
          <h3 className="text-lg font-semibold text-blue-600">View Incoming Notifications</h3>
          <p className="text-gray-600 mt-2">Check for new camp requests matched with your organization.</p>
        </Link>
        <Link to="/org-admin/reports/submit" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-100">
          <h3 className="text-lg font-semibold text-blue-600">Submit Camp Report</h3>
          <p className="text-gray-600 mt-2">Upload proof photos and submit reports for completed camps.</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
