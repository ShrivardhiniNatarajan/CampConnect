import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FundableCamps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundingData, setFundingData] = useState({ camp_id: null, company_id: '', amount: '' });

  const fetchCamps = async () => {
    try {
      const res = await api.get('/camps/fundable');
      setCamps(res.data.camps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const handleFund = async (e) => {
    e.preventDefault();
    try {
      await api.post('/funding', fundingData);
      alert('Successfully funded camp!');
      setFundingData({ camp_id: null, company_id: '', amount: '' });
      fetchCamps();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fund camp');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Fundable Camps</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {camps.length === 0 ? <p>No fundable camps available.</p> : null}
          {camps.map(camp => (
            <div key={camp.camp_id} className="bg-white p-6 rounded-lg shadow-sm border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Camp #{camp.camp_id}</h3>
                <p className="text-sm text-gray-600 mt-1">Ticket: {camp.ticket_id} | Org: {camp.org_id}</p>
                <p className="text-sm text-gray-600">Start: {new Date(camp.start_date).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setFundingData({ ...fundingData, camp_id: camp.camp_id })}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Select to Fund
              </button>
            </div>
          ))}
        </div>

        {fundingData.camp_id && (
          <div className="bg-white p-6 rounded-lg shadow border h-fit">
            <h3 className="text-xl font-bold mb-4">Fund Camp #{fundingData.camp_id}</h3>
            <form onSubmit={handleFund} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your Company ID</label>
                <input type="number" required className="w-full px-3 py-2 border rounded" value={fundingData.company_id} onChange={e => setFundingData({...fundingData, company_id: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount to Commit</label>
                <input type="number" required className="w-full px-3 py-2 border rounded" value={fundingData.amount} onChange={e => setFundingData({...fundingData, amount: e.target.value})} />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">Submit Funding</button>
                <button type="button" onClick={() => setFundingData({ camp_id: null, company_id: '', amount: '' })} className="bg-gray-300 px-4 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundableCamps;
