import React, { useState, useEffect } from 'react';
import api from '../../services/api';

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

  if (loading) return <div>Loading...</div>;

  const stats = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    acc.total += 1;
    return acc;
  }, { total: 0, open: 0, matched: 0, accepted: 0, funded: 0, completed: 0, rejected_all: 0 });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Social Worker Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Tickets" value={stats.total} color="bg-blue-100 text-blue-800" />
        <StatCard title="Open" value={stats.open} color="bg-gray-100 text-gray-800" />
        <StatCard title="Matched" value={stats.matched} color="bg-yellow-100 text-yellow-800" />
        <StatCard title="Accepted" value={stats.accepted} color="bg-indigo-100 text-indigo-800" />
        <StatCard title="Funded" value={stats.funded} color="bg-purple-100 text-purple-800" />
        <StatCard title="Completed" value={stats.completed} color="bg-green-100 text-green-800" />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className={`p-6 rounded-lg shadow-sm ${color}`}>
    <h3 className="text-lg font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

export default Dashboard;
