import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const FundingHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/funding/mine');
        setHistory(res.data.funding_records || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Funding History</h1>
      <div className="space-y-4">
        {history.length === 0 ? <p>No funding history found.</p> : null}
        {history.map(record => (
          <div key={record.funding_id} className="bg-white p-6 rounded-lg shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Amount: ₹{Number(record.amount_committed).toLocaleString()}</h3>
              <p className="text-sm text-gray-600 mt-1">Camp ID: {record.camp_id} | Company ID: {record.company_id}</p>
              <p className="text-sm text-gray-600">Committed At: {new Date(record.committed_at).toLocaleString()}</p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm uppercase font-semibold ${
                record.status === 'utilized' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {record.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FundingHistory;
