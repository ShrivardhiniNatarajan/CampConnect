import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Building2, Banknote, Calendar, ArrowRight } from 'lucide-react';

const FundingHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/funding/mine');
        // FIX: The backend returns res.data.funding, not res.data.funding_records
        setHistory(res.data.funding || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <History className="w-8 h-8 mr-3 text-blue-600" />
          Funding History
        </h1>
        <p className="text-gray-500 mt-1">Track all your committed and utilized CSR funds.</p>
      </div>
      
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
            <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No funding history</h3>
            <p className="text-gray-500 mt-1">You haven't funded any camps yet.</p>
          </div>
        ) : (
          history.map(record => (
            <div key={record.funding_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
              
              <div className="flex-1 space-y-3 w-full pl-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-2xl text-gray-900 flex items-center">
                    ₹{Number(record.amount_committed).toLocaleString('en-IN')}
                  </h3>
                  <span className={`px-4 py-1.5 rounded-full text-xs uppercase font-bold border ${
                    record.status === 'utilized' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {record.status}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <Building2 className="w-5 h-5 mr-3 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Implementing Org</p>
                      <p className="font-medium text-gray-900">{record.organization_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 mr-3 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Camp Dates</p>
                      <p className="font-medium text-gray-900 text-sm">
                        {new Date(record.start_date).toLocaleDateString()} <ArrowRight className="inline w-3 h-3 text-gray-400 mx-1"/> {new Date(record.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
                  <span>Committed via {record.company_name} on {new Date(record.committed_at).toLocaleDateString()}</span>
                  <span>Camp ID #{record.camp_id}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FundingHistory;
