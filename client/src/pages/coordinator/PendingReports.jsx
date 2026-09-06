import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const PendingReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/pending');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleVerify = async (id) => {
    if (!window.confirm('Are you sure you want to verify this report? This action cannot be undone.')) return;
    
    try {
      await api.post(`/reports/${id}/verify`);
      alert('Report verified successfully!');
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify report');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pending Reports</h1>
      <div className="space-y-6">
        {reports.length === 0 ? <p>No pending reports to verify.</p> : null}
        {reports.map(report => (
          <div key={report.report_id} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-2">Camp #{report.camp_id} - {report.organization_name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500 block">Submitted By</span>
                    <span className="font-medium">{report.submitted_by_name} ({report.submitted_by_phone})</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Patients Served</span>
                    <span className="font-medium text-lg">{report.patients_served_count}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block">Summary Notes</span>
                    <p className="bg-gray-50 p-3 rounded mt-1">{report.summary_notes || 'N/A'}</p>
                  </div>
                </div>
                
                {report.proof_document_url && (
                  <div className="mt-4">
                    <span className="text-gray-500 block mb-2">Proof Document</span>
                    <a href={report.proof_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View Proof Image/Document
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col justify-center border-l md:pl-6">
                <button 
                  onClick={() => handleVerify(report.report_id)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium whitespace-nowrap shadow-sm transition"
                >
                  Verify Report
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingReports;
