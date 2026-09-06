import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckSquare, ExternalLink, MapPin, Users, Calendar, Activity, CheckCircle } from 'lucide-react';

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
    try {
      await api.post(`/reports/${id}/verify`);
      alert('Report verified successfully');
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <CheckSquare className="w-8 h-8 mr-3 text-blue-600" />
          Pending Verifications
        </h1>
        <p className="text-gray-500 mt-1">Review camp completion reports and verify proof documents.</p>
      </div>

      <div className="space-y-6">
        {reports.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-gray-500 mt-1">There are no pending reports waiting for your verification.</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report.report_id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow">
              
              <div className="lg:w-1/3 flex flex-col justify-center">
                {report.proof_document_url ? (
                  <div className="rounded-xl overflow-hidden shadow-inner border border-gray-200">
                    <img src={report.proof_document_url} alt="Camp Proof" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="bg-gray-100 w-full h-48 rounded-xl flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                    No image provided
                  </div>
                )}
                {report.proof_document_url && (
                  <a href={report.proof_document_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-3 flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 mr-1" /> View Full Image
                  </a>
                )}
              </div>

              <div className="lg:w-2/3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Report #{report.report_id} | Camp #{report.camp_id}</span>
                      <h3 className="font-bold text-xl text-gray-900 mt-1 flex items-center">
                        {report.organization_name}
                      </h3>
                    </div>
                    <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full text-xs uppercase font-bold">
                      Pending
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <span className="text-xs font-bold text-blue-600 uppercase block mb-1">Reported Patients</span>
                      <span className="text-xl font-bold text-gray-900">{report.patients_served_count}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Expected Patients</span>
                      <span className="text-xl font-bold text-gray-700">{report.expected_patient_count}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-1">Summary Notes</h4>
                    <p className="text-gray-600 text-sm italic">{report.summary_notes || "No notes provided."}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">Submitted on {new Date(report.submitted_at).toLocaleDateString()}</span>
                  <button onClick={() => handleVerify(report.report_id)} className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 font-semibold shadow-sm transition-colors flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2" />
                    Verify Report
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PendingReports;
