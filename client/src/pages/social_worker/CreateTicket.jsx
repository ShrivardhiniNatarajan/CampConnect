import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  MapPin, Users, HeartPulse, Calendar, Phone, Activity, Navigation, 
  Settings2, LocateFixed, Search, TrendingUp, Lightbulb, CheckCircle2
} from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to center and zoom map when position changes
const MapRecenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, 13, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
};

// Interactive Pin Dropper & Dragger Component
const LocationPicker = ({ position, setPosition, onReverseGeocode }) => {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      if (onReverseGeocode) onReverseGeocode(newPos[0], newPos[1]);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          const newPos = [latlng.lat, latlng.lng];
          setPosition(newPos);
          if (onReverseGeocode) onReverseGeocode(newPos[0], newPos[1]);
        }
      },
    }),
    [setPosition, onReverseGeocode]
  );

  return position ? (
    <Marker 
      draggable={true} 
      eventHandlers={eventHandlers} 
      position={position} 
      ref={markerRef}
    >
      <Popup>
        <div className="text-xs">
          <strong>Camp Location</strong>
          <br />
          Drag this marker or click the map to reposition.
        </div>
      </Popup>
    </Marker>
  ) : null;
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

  // Default coordinate: Tamil Nadu / Vellore / Chennai region center
  const [position, setPosition] = useState([12.9165, 79.1325]);
  const [gpsStatus, setGpsStatus] = useState('');
  const [detectedAddress, setDetectedAddress] = useState('');
  const [searchingPincode, setSearchingPincode] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Suggestions for Social Worker on how to strengthen their request (no numeric score displayed)
  const recommendations = useMemo(() => {
    const todo = [];
    const completed = [];

    // 1. Village Head Consent (+25pts in backend)
    if (formData.village_head_consent === 'confirmed') {
      completed.push('Village head / Panchayat formal consent confirmed');
    } else {
      todo.push('Secure confirmed consent from the Village Head / Panchayat President');
    }

    // 2. Designated Venue (+15pts in backend)
    if (formData.venue_available && formData.venue_type) {
      completed.push(`Designated venue secured: ${(formData.venue_type || '').replace('_', ' ')}`);
    } else {
      todo.push('Select a designated venue (School, Community Hall, or Temple) for camp setup');
    }

    // 3. Infrastructure Utilities (+15pts in backend)
    if (formData.electricity_available && formData.water_available) {
      completed.push('Both clean drinking water and electricity points confirmed');
    } else if (formData.electricity_available || formData.water_available) {
      todo.push('Ensure both drinking water AND electricity connections are arranged');
    } else {
      todo.push('Arrange clean drinking water and electricity connections for medical equipment');
    }

    // 4. Ground Contact Person (+20pts in backend)
    const cleanPhone = (formData.local_contact_phone || '').replace(/[^0-9]/g, '');
    if ((formData.local_contact_name || '').trim().length >= 3 && cleanPhone.length === 10) {
      completed.push('Valid 10-digit ground coordinator contact verified');
    } else {
      todo.push('Provide a reachable 10-digit mobile number for the local contact person');
    }

    // 5. Patient-to-Volunteer Ratio (+15pts in backend)
    const patients = Number(formData.expected_patient_count) || 0;
    const volunteers = Number(formData.local_volunteer_count) || 0;
    if (patients > 0 && volunteers >= Math.max(2, Math.ceil(patients / 40))) {
      completed.push(`Appropriate volunteer team assigned (${volunteers} helpers for ~${patients} patients)`);
    } else if (patients > 0) {
      todo.push(`Assign more local volunteers (recommend at least ${Math.max(3, Math.ceil(patients / 40))} helpers for ${patients} patients)`);
    } else {
      todo.push('Estimate expected patient count and assign community volunteers');
    }

    return { todo, completed };
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'venue_available' && !checked) {
      setFormData(prev => ({ ...prev, venue_available: false, venue_type: '' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Reverse geocoding via OpenStreetMap Nominatim
  const handleReverseGeocode = async (lat, lon) => {
    try {
      setGpsStatus('Identifying location details...');
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`);
      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        const postcode = addr.postcode || '';
        const place = addr.suburb || addr.village || addr.town || addr.city || addr.county || '';
        const state = addr.state || '';
        
        if (postcode && postcode.length === 6) {
          setFormData(prev => ({ ...prev, pincode: postcode }));
        }
        if (place || state) {
          setDetectedAddress(`${place}${place && state ? ', ' : ''}${state}`);
        }
        setGpsStatus(`📍 Pinned: Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`);
      }
    } catch {
      setGpsStatus(`📍 Pinned: Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`);
    }
  };

  // Live Device GPS Handler
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGpsStatus('Acquiring device GPS fix...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setPosition([lat, lon]);
        setGpsStatus(`✓ Live GPS Locked (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
        handleReverseGeocode(lat, lon);
      },
      (err) => {
        console.error(err);
        setGpsStatus('GPS access denied. Click or drag the pin on the map instead.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search by Pincode to jump map
  const handlePincodeSearch = async () => {
    if (!formData.pincode || formData.pincode.length < 5) return;
    setSearchingPincode(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${formData.pincode}&country=India&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setPosition([lat, lon]);
          setDetectedAddress(data[0].display_name.split(',').slice(0, 3).join(', '));
          setGpsStatus(`Jumped to pincode ${formData.pincode}`);
        } else {
          setGpsStatus('Pincode not found on map. You can drag the pin manually.');
        }
      }
    } catch {
      // ignore
    } finally {
      setSearchingPincode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.venue_available && !formData.venue_type) {
      setError('Please select a venue type since a venue is available.');
      setLoading(false);
      return;
    }
    
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
        <h1 className="text-3xl font-bold text-gray-900">Request a Medical Camp</h1>
        <p className="text-gray-500 mt-1">Pinpoint location, fill logistics requirements, and match with nearby hospitals.</p>
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
                <input type="text" name="health_focus_area" value={formData.health_focus_area} onChange={handleChange} required placeholder="e.g. Eye Screening, Pediatric Camp, General Health" className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Patient Count *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <input type="number" min="1" name="expected_patient_count" value={formData.expected_patient_count} onChange={handleChange} required placeholder="Estimated number of villagers" className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
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
                <option value="low">Low (Routine Health Camp)</option>
                <option value="medium">Medium (Seasonal / Priority Need)</option>
                <option value="high">High (Urgent Outbreak / Critical Need)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village Head / Panchayat Consent *</label>
              <select name="village_head_consent" value={formData.village_head_consent} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="confirmed">Confirmed (Formal consent obtained)</option>
                <option value="pending">Pending (In discussions with local head)</option>
                <option value="declined">Declined</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Confirmed consent boosts request trust score significantly.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Interactive Geolocation & Contact */}
        <div className="p-8 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Navigation className="w-5 h-5 mr-2 text-blue-600" />
                Camp Geolocation & Pin Selection
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Capture your live location or drag the pin on the map to specify the camp site.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                type="button" 
                onClick={handleGetCurrentLocation} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center"
              >
                <LocateFixed className="w-3.5 h-3.5 mr-1.5" />
                Use Live Device GPS
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Contact Person Name *</label>
              <input type="text" name="local_contact_name" value={formData.local_contact_name} onChange={handleChange} required placeholder="e.g. Village Representative" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Contact Phone Number *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input type="text" name="local_contact_phone" value={formData.local_contact_phone} onChange={handleChange} required placeholder="10-digit mobile number" className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder="6-digit pincode" className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <button
                  type="button"
                  onClick={handlePincodeSearch}
                  disabled={searchingPincode || !formData.pincode}
                  className="px-3.5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold flex items-center disabled:opacity-50 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 mr-1" />
                  {searchingPincode ? 'Locating...' : 'Jump to Pin'}
                </button>
              </div>
              {detectedAddress && (
                <p className="text-xs text-blue-700 font-medium mt-1">📍 {detectedAddress}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Volunteers Count</label>
              <input type="number" min="0" name="local_volunteer_count" value={formData.local_volunteer_count} onChange={handleChange} placeholder="0" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              <p className="text-xs text-gray-500 mt-1">Number of local volunteers available to assist doctors.</p>
            </div>
          </div>
          
          {/* Interactive Leaflet Map View */}
          <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-600 mb-2.5 px-1 gap-2">
              <span className="font-semibold text-gray-800 flex items-center">
                <MapPin className="w-3.5 h-3.5 text-red-500 mr-1" />
                Selected Coordinates: <span className="font-mono font-bold ml-1 text-blue-700">{position[0].toFixed(5)}° N, {position[1].toFixed(5)}° E</span>
              </span>
              <span className="text-gray-500 italic">
                {gpsStatus || 'Click map or drag the pin to set the exact camp venue.'}
              </span>
            </div>

            <div className="h-96 border border-gray-300 rounded-xl overflow-hidden shadow-inner relative z-0">
              <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer 
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                />
                <MapRecenter position={position} />
                <LocationPicker 
                  position={position} 
                  setPosition={setPosition} 
                  onReverseGeocode={handleReverseGeocode} 
                />
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Section 3: Facilities & Logistics */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Settings2 className="w-5 h-5 mr-2 text-blue-600" />
            Venue & Ground Infrastructure
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="venue_available" checked={formData.venue_available} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="font-medium text-gray-700">Dedicated venue is already arranged</span>
              </label>
              
              {formData.venue_available && (
                <div className="pl-8 pt-2 animate-in fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Type *</label>
                  <select name="venue_type" value={formData.venue_type} onChange={handleChange} required className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="">Select a venue type...</option>
                    <option value="community_hall">Community Hall</option>
                    <option value="school">Primary / Secondary School</option>
                    <option value="temple">Temple / Religious Community Hall</option>
                    <option value="open_ground">Open Ground / Shaded Pavilion</option>
                    <option value="other">Other Village Facility</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="electricity_available" checked={formData.electricity_available} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="font-medium text-gray-700">Electricity & Power Points Available</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="water_available" checked={formData.water_available} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="font-medium text-gray-700">Clean Drinking Water Available</span>
              </label>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Camp Details & Special Conditions</label>
              <textarea 
                name="additional_details" 
                value={formData.additional_details} 
                onChange={handleChange} 
                rows="3" 
                placeholder="Mention any specifics like prevalence of specific diseases, accessibility for elderly, road conditions, etc." 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Actionable suggestions for the Social Worker to strengthen their request */}
          <div className="mt-8 p-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                How to Strengthen Your Camp Request for Faster Matching
              </h4>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {recommendations.completed.length} / {recommendations.completed.length + recommendations.todo.length} Completed
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Nearby hospitals and NGOs prioritize requests with confirmed ground preparations. Complete these items to increase your request's acceptance chances:
            </p>

            <div className="space-y-2">
              {recommendations.todo.map((item, idx) => (
                <div key={idx} className="flex items-start text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60">
                  <Lightbulb className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Recommended:</strong> {item}</span>
                </div>
              ))}

              {recommendations.completed.map((item, idx) => (
                <div key={idx} className="flex items-start text-xs text-green-900 bg-green-50/80 p-2.5 rounded-xl border border-green-200/60">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Ready:</strong> {item}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Tickets are geo-matched against registered hospitals within 50 km radius.
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white py-3.5 px-8 rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg font-semibold text-base transition-all disabled:bg-blue-400 flex justify-center items-center">
            {loading ? 'Submitting Request...' : 'Submit Health Camp Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;
