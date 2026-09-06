import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FileText, UploadCloud, Users, Hash, Activity, Calendar } from 'lucide-react';

const SubmitReport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    camp_id: '',
    patients_served_count: '',
    summary_notes: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [campsLoading, setCampsLoading] = useState(true);
  const [myCamps, setMyCamps] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const res = await api.get('/camps/mine');
        // Filter to only show camps that are planned or ongoing and need a report
        const activeCamps = (res.data.camps || []).filter(c => c.camp_status === 'planned' || c.camp_status === 'ongoing');
        setMyCamps(activeCamps);
      } catch (err) {
        console.error(err);
      } finally {
        setCampsLoading(false);
      }
    };
    fetchCamps();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectCamp = (campId) => {
    setFormData(prev => ({ ...prev, camp_id: campId }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!file) {
      setError('Proof photo is required.');
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('camp_id', formData.camp_id);
    data.append('patients_served_count', formData.patients_served_count);
    data.append('summary_notes', formData.summary_notes);
    data.append('proof_photo', file);

    try {
      const res = await api.post('/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(res.data.message);
      setMyCamps(prev => prev.filter(c => c.camp_id.toString() !== formData.camp_id.toString()));
      setTimeout(() => {
        setSuccess('');
        setFormData({ camp_id: '', patients_served_count: '', summary_notes: '' });
        setFile(null);
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(typeof msg === 'string' ? msg : (msg?.message || 'Error submitting report'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-blue-600" />
          Submit Camp Report
        </h1>
        <p className="text-gray-500 mt-1">Upload the final details and photographic proof of your completed camp.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Report Form */}
        <div className="lg:w-1/2 space-y-4">
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

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Camp ID *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="number" name="camp_id" value={formData.camp_id} onChange={handleChange} required placeholder="Select from list or enter ID" className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Patients Served *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="number" name="patients_served_count" value={formData.patients_served_count} onChange={handleChange} required placeholder="Actual number of people treated" className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Summary & Notes</label>
              <textarea name="summary_notes" value={formData.summary_notes} onChange={handleChange} rows="4" placeholder="How did the camp go? Any special observations?" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Proof Photograph *</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none px-2 py-1 shadow-sm">
                      <span>Upload a file</span>
                      <input type="file" onChange={(e) => setFile(e.target.files[0])} required accept="image/*" className="sr-only" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 pt-2">PNG, JPG up to 5MB</p>
                  {file && <p className="text-sm font-semibold text-green-600 mt-2 truncate max-w-[200px] mx-auto">{file.name}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg font-semibold text-lg transition-all disabled:bg-blue-400 flex justify-center items-center">
                {loading ? 'Submitting...' : 'Submit Final Report'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Accepted Camps History */}
        <div className="lg:w-1/2">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            Your Active Camps
          </h2>
          
          {campsLoading ? (
            <div className="flex items-center justify-center h-32 bg-white rounded-2xl border border-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : myCamps.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-500">You don't have any active camps waiting for a report.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 pb-4 custom-scrollbar">
              {myCamps.map(camp => (
                <div key={camp.camp_id} className={`bg-white rounded-xl p-5 border shadow-sm transition-all ${formData.camp_id === camp.camp_id.toString() ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Camp #{camp.camp_id}</span>
                    <button 
                      onClick={() => handleSelectCamp(camp.camp_id.toString())}
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold transition-colors"
                    >
                      Select Camp
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-500" />
                    {camp.health_focus_area}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-gray-700">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      {camp.expected_patient_count} target
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(camp.start_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default SubmitReport;
