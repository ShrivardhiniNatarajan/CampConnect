import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, CheckSquare, ExternalLink, Activity, Calendar } from 'lucide-react';

const CoordHistory = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports/verified');
        setReports(res.data.reports || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <History className="w-8 h-8 mr-3 text-blue-600" />
          Verification History
        </h1>
        <p className="text-gray-500 mt-1">A log of all the camp reports you have successfully verified.</p>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No history found</h3>
            <p className="text-gray-500 mt-1">You haven't verified any reports yet.</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report.report_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
              
              <div className="flex-1 pl-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Report #{report.report_id} | Camp #{report.camp_id}</span>
                    <h3 className="font-bold text-xl text-gray-900 mt-1 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-blue-500" />
                      {report.organization_name}
                    </h3>
                  </div>
                  <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs uppercase font-bold flex items-center">
                    <CheckSquare className="w-3 h-3 mr-1" /> Verified
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase">Patients Served</span>
                    <span className="font-bold text-gray-900">{report.patients_served_count}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase">Verified On</span>
                    <span className="font-bold text-gray-900">{new Date(report.verified_at).toLocaleString()}</span>
                  </div>
                </div>

                {report.summary_notes && (
                  <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg italic">
                    "{report.summary_notes}"
                  </div>
                )}
              </div>

              {report.proof_document_url && (
                <div className="w-full md:w-48 h-32 md:h-auto shrink-0 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative group">
                  <img src={report.proof_document_url} alt="Proof" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <a href={report.proof_document_url} target="_blank" rel="noreferrer" className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">View Proof</a>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CoordHistory;
