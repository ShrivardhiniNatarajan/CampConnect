import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, MapPin, Calendar, Users, Activity, Check, X, Phone } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/mine');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/notifications/${id}/${action}`);
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action}`);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Bell className="w-8 h-8 mr-3 text-blue-600" />
          Incoming Requests
        </h1>
        <p className="text-gray-500 mt-1">Health camp requests from social workers in your area.</p>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No new notifications</h3>
            <p className="text-gray-500 mt-1">You'll receive requests here when social workers create camps near your organization.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.notif_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket #{notif.ticket_id}</span>
                    <h3 className="font-bold text-xl text-gray-900 mt-1 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-blue-500" />
                      {notif.health_focus_area} Camp
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold border ${notif.urgency === 'high' ? 'bg-red-50 text-red-700 border-red-200' : notif.urgency === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {notif.urgency} Urgency
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center text-sm text-gray-700">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-900 mr-1">{Number(notif.distance_km).toFixed(1)} km</span> away (Pincode: {notif.pincode})
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span><span className="font-medium text-gray-900">{notif.expected_patient_count}</span> Expected Patients</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{new Date(notif.preferred_date_from).toLocaleDateString()} to {new Date(notif.preferred_date_to).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{notif.local_contact_name} ({notif.local_contact_phone})</span>
                  </div>
                </div>

                <div className="text-sm text-gray-500 flex items-center">
                  <span className="mr-4">Venue: {notif.venue_available ? <span className="font-medium text-gray-900 capitalize">{notif.venue_type.replace('_', ' ')}</span> : 'None'}</span>
                  <span>Consent: <span className="font-medium capitalize text-gray-900">{notif.village_head_consent}</span></span>
                </div>
              </div>

              <div className="flex flex-row md:flex-col justify-end gap-3 md:min-w-[140px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                {notif.status === 'notified' ? (
                  <>
                    <button onClick={() => handleAction(notif.notif_id, 'accept')} className="flex-1 flex items-center justify-center bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow-md">
                      <Check className="w-4 h-4 mr-2" /> Accept
                    </button>
                    <button onClick={() => handleAction(notif.notif_id, 'reject')} className="flex-1 flex items-center justify-center bg-red-50 text-red-600 px-4 py-3 rounded-xl hover:bg-red-100 transition-colors font-medium border border-red-100">
                      <X className="w-4 h-4 mr-2" /> Reject
                    </button>
                  </>
                ) : (
                  <div className={`flex items-center justify-center h-full text-sm font-bold uppercase rounded-xl border-2 border-dashed ${notif.status === 'accepted' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-500 border-red-200 bg-red-50'}`}>
                    {notif.status}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
