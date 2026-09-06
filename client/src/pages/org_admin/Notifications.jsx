import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

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
      alert(`Successfully ${action}ed`);
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action}`);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Incoming Notifications</h1>
      <div className="space-y-4">
        {notifications.length === 0 ? <p>No pending notifications.</p> : null}
        {notifications.map(notif => (
          <div key={notif.notif_id} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold text-lg">Ticket #{notif.ticket_id} - {notif.health_focus_area}</h3>
                <p className="text-sm text-gray-600 mt-1">Distance: {Number(notif.distance_km).toFixed(2)} km</p>
                <p className="text-sm text-gray-600">Expected Patients: {notif.expected_patient_count}</p>
                <p className="text-sm text-gray-600">Urgency: <span className="uppercase text-red-500 font-medium">{notif.urgency}</span></p>
              </div>
              {notif.status === 'notified' ? (
                <div className="flex gap-2 items-start">
                  <button onClick={() => handleAction(notif.notif_id, 'accept')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Accept</button>
                  <button onClick={() => handleAction(notif.notif_id, 'reject')} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Reject</button>
                </div>
              ) : (
                <span className="font-semibold uppercase text-gray-500">{notif.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
