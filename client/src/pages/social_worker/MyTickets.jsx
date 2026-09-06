import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const MyTickets = () => {
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Tickets</h1>
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <p>No tickets found.</p>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.ticket_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Ticket #{ticket.ticket_id} - {ticket.health_focus_area}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Pincode: {ticket.pincode} | Dates: {new Date(ticket.preferred_date_from).toLocaleDateString()} to {new Date(ticket.preferred_date_to).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm uppercase font-semibold ${
                  ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
                  ticket.status === 'funded' ? 'bg-purple-100 text-purple-800' :
                  ticket.status === 'accepted' ? 'bg-indigo-100 text-indigo-800' :
                  ticket.status === 'matched' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyTickets;
