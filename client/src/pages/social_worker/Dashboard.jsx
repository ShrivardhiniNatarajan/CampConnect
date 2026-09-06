import React, { useState, useEffect } from 'react';
import api from '../../../services/apiClient';
import { Ticket, Activity, CheckCircle, PackageCheck, Banknote, CalendarCheck } from 'lucide-react';

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/tickets/mine');
        setTickets(res.data.tickets || []);
      } catch (err) {
        console.error('Error fetching tickets', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const stats = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    acc.total += 1;
    return acc;
  }, { total: 0, open: 0, matched: 0, accepted: 0, funded: 0, completed: 0, rejected_all: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your health camp requests.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Requests" value={stats.total} icon={<Ticket className="w-6 h-6 text-blue-600" />} color="bg-blue-50 border-blue-100" />
        <StatCard title="Open" value={stats.open} icon={<Activity className="w-6 h-6 text-gray-600" />} color="bg-gray-50 border-gray-200" />
        <StatCard title="Matched" value={stats.matched} icon={<CheckCircle className="w-6 h-6 text-yellow-600" />} color="bg-yellow-50 border-yellow-100" />
        <StatCard title="Accepted" value={stats.accepted} icon={<PackageCheck className="w-6 h-6 text-indigo-600" />} color="bg-indigo-50 border-indigo-100" />
        <StatCard title="Funded" value={stats.funded} icon={<Banknote className="w-6 h-6 text-purple-600" />} color="bg-purple-50 border-purple-100" />
        <StatCard title="Completed" value={stats.completed} icon={<CalendarCheck className="w-6 h-6 text-green-600" />} color="bg-green-50 border-green-100" />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between ${color} transition-transform hover:scale-105 duration-200`}>
    <div>
      <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">{title}</p>
      <h3 className="text-4xl font-bold text-gray-900 mt-2">{value}</h3>
    </div>
    <div className="p-4 bg-white rounded-xl shadow-sm">
      {icon}
    </div>
  </div>
);

export default Dashboard;
