import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const CreateTicket = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pincode: '',
    expected_patient_count: '',
    health_focus_area: '',
    preferred_date_from: '',
    preferred_date_to: '',
    urgency: 'medium',
    village_head_consent: 'pending',
    venue_available: false,
    venue_type: '',
    local_contact_name: '',
    local_contact_phone: '',
    electricity_available: false,
    water_available: false,
    local_volunteer_count: '0',
    additional_details: ''
  });
  const [position, setPosition] = useState([20.5937, 78.9629]); // Default India
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error(err)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        latitude: position[0],
        longitude: position[1]
      };
      
      const res = await api.post('/tickets', payload);
      setSuccess(res.data.message);
      setTimeout(() => navigate('/social-worker/tickets'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating ticket');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create New Ticket</h2>
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-600 p-3 rounded mb-4">{success}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium mb-1">Expected Patient Count</label>
            <input type="number" name="expected_patient_count" value={formData.expected_patient_count} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Health Focus Area</label>
            <input type="text" name="health_focus_area" value={formData.health_focus_area} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Preferred Date From</label>
            <input type="date" name="preferred_date_from" value={formData.preferred_date_from} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Preferred Date To</label>
            <input type="date" name="preferred_date_to" value={formData.preferred_date_to} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Local Contact Name</label>
            <input type="text" name="local_contact_name" value={formData.local_contact_name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Local Contact Phone</label>
            <input type="text" name="local_contact_phone" value={formData.local_contact_phone} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pincode</label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Urgency</label>
            <select name="urgency" value={formData.urgency} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Venue Type (if available)</label>
            <select name="venue_type" value={formData.venue_type} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
              <option value="">Select...</option>
              <option value="community_hall">Community Hall</option>
              <option value="school">School</option>
              <option value="temple">Temple</option>
              <option value="open_ground">Open Ground</option>
              <option value="other">Other</option>
            </select>
          </div>

        </div>

        <div className="flex gap-4">
          <label className="flex items-center">
            <input type="checkbox" name="venue_available" checked={formData.venue_available} onChange={handleChange} className="mr-2" />
            Venue Available
          </label>
          <label className="flex items-center">
            <input type="checkbox" name="electricity_available" checked={formData.electricity_available} onChange={handleChange} className="mr-2" />
            Electricity
          </label>
          <label className="flex items-center">
            <input type="checkbox" name="water_available" checked={formData.water_available} onChange={handleChange} className="mr-2" />
            Water
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location (Click map or use Current Location)</label>
          <button type="button" onClick={handleGetCurrentLocation} className="mb-2 bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">Use Current Location</button>
          <div className="h-64 bg-gray-200 rounded">
            <MapContainer center={position} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-medium text-lg">
          Submit Ticket
        </button>
      </form>
    </div>
  );
};

export default CreateTicket;
