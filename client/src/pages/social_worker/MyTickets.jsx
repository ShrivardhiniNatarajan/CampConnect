import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { MapPin, Calendar, Users, Activity, Phone, ArrowRight } from 'lucide-react';

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'funded': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'accepted': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'matched': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
        <p className="text-gray-500 mt-1">Track the status of your health camp requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tickets.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
            <p className="text-gray-500 mt-1">You haven't created any health camp requests yet.</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.ticket_id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket #{ticket.ticket_id}</span>
                  <h3 className="font-bold text-xl text-gray-900 mt-1 flex items-center">
                    {ticket.health_focus_area}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold border ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{new Date(ticket.preferred_date_from).toLocaleDateString()} <ArrowRight className="inline w-3 h-3 mx-1 text-gray-400"/> {new Date(ticket.preferred_date_to).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                  <span>Pincode: {ticket.pincode}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{ticket.expected_patient_count} Expected Patients</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{ticket.local_contact_name} ({ticket.local_contact_phone})</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                <span className="text-gray-400">Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                <span className={`font-medium capitalize ${ticket.urgency === 'high' ? 'text-red-600' : ticket.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {ticket.urgency} Urgency
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
