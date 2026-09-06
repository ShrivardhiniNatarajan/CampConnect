import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Activity, Calendar, Users, CheckCircle, Clock } from 'lucide-react';

const OrgHistory = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const res = await api.get('/camps/mine');
        // Only show camps that have a report submitted or are fully completed
        const historyCamps = (res.data.camps || []).filter(c => c.report_id || c.camp_status === 'completed');
        setCamps(historyCamps);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCamps();
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
          Camp History
        </h1>
        <p className="text-gray-500 mt-1">Review your completed camps and their verification status.</p>
      </div>

      <div className="space-y-4">
        {camps.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No history found</h3>
            <p className="text-gray-500 mt-1">You haven't completed any camps yet.</p>
          </div>
        ) : (
          camps.map(camp => (
            <div key={camp.camp_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-2 h-full ${camp.verified ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
              
              <div className="flex-1 pl-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Camp #{camp.camp_id}</span>
                    <h3 className="font-bold text-xl text-gray-900 mt-1 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-blue-500" />
                      {camp.health_focus_area}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold border flex items-center ${
                    camp.verified 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {camp.verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                    {camp.verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{new Date(camp.start_date).toLocaleDateString()} to {new Date(camp.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span>
                      <span className="font-bold text-gray-900">{camp.reported_patients || 0}</span> treated 
                      <span className="text-gray-400 text-xs ml-1">(Target: {camp.expected_patient_count})</span>
                    </span>
                  </div>
                </div>
              </div>

              {camp.proof_document_url && (
                <div className="w-full md:w-48 h-32 md:h-auto shrink-0 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative group">
                  <img src={camp.proof_document_url} alt="Proof" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <a href={camp.proof_document_url} target="_blank" rel="noreferrer" className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">View Proof</a>
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

export default OrgHistory;
