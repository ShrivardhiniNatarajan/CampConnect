import React, { useState } from 'react';
import api from '../../services/api';

const SubmitReport = () => {
  const [formData, setFormData] = useState({
    camp_id: '',
    patients_served_count: '',
    summary_notes: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('camp_id', formData.camp_id);
      data.append('patients_served_count', formData.patients_served_count);
      data.append('summary_notes', formData.summary_notes);
      if (file) {
        data.append('proof_photo', file);
      }

      await api.post('/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Report submitted successfully');
      setFormData({ camp_id: '', patients_served_count: '', summary_notes: '' });
      setFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Submit Camp Report</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Camp ID</label>
          <input type="number" required className="w-full px-3 py-2 border rounded" value={formData.camp_id} onChange={e => setFormData({...formData, camp_id: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Patients Served</label>
          <input type="number" required className="w-full px-3 py-2 border rounded" value={formData.patients_served_count} onChange={e => setFormData({...formData, patients_served_count: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Summary Notes</label>
          <textarea className="w-full px-3 py-2 border rounded" rows="4" value={formData.summary_notes} onChange={e => setFormData({...formData, summary_notes: e.target.value})}></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Proof Photo (Optional)</label>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="w-full" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default SubmitReport;
