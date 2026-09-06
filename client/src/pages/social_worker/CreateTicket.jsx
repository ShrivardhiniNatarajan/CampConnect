import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import api from '../../services/apiClient';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Users, HeartPulse, Calendar, Phone, Activity, Navigation, Settings2 } from 'lucide-react';

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
  const [position, setPosition] = useState([20.5937, 78.9629]); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // If venue_available is unchecked, clear venue_type
    if (name === 'venue_available' && !checked) {
      setFormData(prev => ({ ...prev, venue_available: false, venue_type: '' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => {
          console.error(err);
          alert("Could not fetch location. Please ensure location services are enabled.");
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Ensure venue_type is not empty if venue is available
    if (formData.venue_available && !formData.venue_type) {
      setError('Please select a venue type since a venue is available.');
      setLoading(false);
      return;
    }
    
    // Convert empty string venue_type to undefined so it doesn't fail validation
    const payload = {
      ...formData,
      venue_type: formData.venue_type === '' ? undefined : formData.venue_type,
      latitude: position[0],
      longitude: position[1]
    };

    try {
      const res = await api.post('/tickets', payload);
      setSuccess(res.data.message);
      setTimeout(() => navigate('/social-worker/tickets'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating ticket');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Health Camp Request</h1>
        <p className="text-gray-500 mt-1">Fill out the details below to request a new health camp for your community.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <p className="text-green-700 font-medium">{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Section 1: Basic Information */}
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Camp Requirements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Health Focus Area *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HeartPulse className="h-4 w-4 text-gray-400" />
                </div>
                <input type="text" name="health_focus_area" value={formData.health_focus_area} onChange={handleChange} required placeholder="e.g. Eye Camp, General Checkup" className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Patient Count *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <input type="number" min="1" name="expected_patient_count" value={formData.expected_patient_count} onChange={handleChange} required placeholder="Estimated number of patients" className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date From *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input type="date" name="preferred_date_from" value={formData.preferred_date_from} onChange={handleChange} required className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date To *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input type="date" name="preferred_date_to" value={formData.preferred_date_to} onChange={handleChange} required className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Urgency *</label>
              <select name="urgency" value={formData.urgency} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village Head Consent</label>
              <select name="village_head_consent" value={formData.village_head_consent} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Location */}
        <div className="p-8 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-blue-600" />
            Location & Contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Contact Name *</label>
              <input type="text" name="local_contact_name" value={formData.local_contact_name} onChange={handleChange} required placeholder="Full Name" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Contact Phone *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input type="text" name="local_contact_phone" value={formData.local_contact_phone} onChange={handleChange} required placeholder="Phone Number" className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Pincode *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder="6-digit pincode" className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Volunteer Count</label>
              <input type="number" min="0" name="local_volunteer_count" value={formData.local_volunteer_count} onChange={handleChange} placeholder="0" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Map Coordinates *</label>
              <button type="button" onClick={handleGetCurrentLocation} className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-md transition-colors font-medium flex items-center">
                <MapPin className="w-3 h-3 mr-1" /> Use Current Location
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Click on the map to accurately pinpoint the camp location.</p>
            <div className="h-80 border border-gray-300 rounded-xl overflow-hidden shadow-inner">
              <MapContainer center={position} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Section 3: Facilities */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Settings2 className="w-5 h-5 mr-2 text-blue-600" />
            Venue & Facilities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="venue_available" checked={formData.venue_available} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="font-medium text-gray-700">Venue is already available</span>
              </label>
              
              {formData.venue_available && (
                <div className="pl-8 pt-2 animate-in fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Type *</label>
                  <select name="venue_type" value={formData.venue_type} onChange={handleChange} required className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="">Select a venue type...</option>
                    <option value="community_hall">Community Hall</option>
                    <option value="school">School</option>
                    <option value="temple">Temple/Religious Site</option>
                    <option value="open_ground">Open Ground</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="electricity_available" checked={formData.electricity_available} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="font-medium text-gray-700">Electricity access available</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="water_available" checked={formData.water_available} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="font-medium text-gray-700">Clean water access available</span>
              </label>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
              <textarea 
                name="additional_details" 
                value={formData.additional_details} 
                onChange={handleChange} 
                rows="3" 
                placeholder="Any other important information..." 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg font-semibold text-lg transition-all disabled:bg-blue-400 flex justify-center items-center">
            {loading ? 'Submitting Request...' : 'Submit Health Camp Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;
