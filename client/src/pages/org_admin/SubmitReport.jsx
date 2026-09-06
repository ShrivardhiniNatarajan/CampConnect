import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FileText, UploadCloud, Users, Hash } from 'lucide-react';

const SubmitReport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    camp_id: '',
    patients_served_count: '',
    summary_notes: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      setTimeout(() => navigate('/org-admin'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting report');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-blue-600" />
          Submit Camp Report
        </h1>
        <p className="text-gray-500 mt-1">Upload the final details and photographic proof of your completed camp.</p>
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

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Camp ID *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-4 w-4 text-gray-400" />
              </div>
              <input type="number" name="camp_id" value={formData.camp_id} onChange={handleChange} required placeholder="Enter ID of completed camp" className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
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
              <p className="text-xs text-gray-500 pt-2">PNG, JPG, GIF up to 5MB</p>
              {file && <p className="text-sm font-semibold text-green-600 mt-2">Selected: {file.name}</p>}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg font-semibold text-lg transition-all disabled:bg-blue-400 flex justify-center items-center">
            {loading ? 'Uploading Proof & Submitting...' : 'Submit Final Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitReport;
