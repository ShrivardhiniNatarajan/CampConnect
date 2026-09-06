import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { IndianRupee, MapPin, Users, Calendar, Activity, ArrowRight, HeartPulse } from 'lucide-react';

const FundableCamps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundingAmount, setFundingAmount] = useState('');
  const [companyId, setCompanyId] = useState(''); // Ideally fetched from context/company list
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const res = await api.get('/camps/fundable');
        setCamps(res.data.camps || []);
        // Just setting a dummy company ID for UI demo if not fetched
        setCompanyId('1'); 
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCamps();
  }, []);

  const handleFund = async (campId) => {
    if (!fundingAmount) return alert('Please enter an amount');
    setProcessingId(campId);
    try {
      await api.post('/funding', {
        company_id: companyId,
        camp_id: campId,
        amount: fundingAmount
      });
      alert('Funding successful!');
      setCamps(prev => prev.filter(c => c.camp_id !== campId));
      setFundingAmount('');
    } catch (err) {
      alert(err.response?.data?.message || 'Funding failed');
    } finally {
      setProcessingId(null);
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
          <IndianRupee className="w-8 h-8 mr-3 text-blue-600" />
          Fundable Camps
        </h1>
        <p className="text-gray-500 mt-1">Discover and fund health camps that have been verified and accepted by organizations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {camps.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
            <HeartPulse className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No camps need funding right now</h3>
            <p className="text-gray-500 mt-1">Check back later when organizations accept new tickets.</p>
          </div>
        ) : (
          camps.map(camp => (
            <div key={camp.camp_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-100 px-3 py-1 rounded-full">Camp #{camp.camp_id}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket #{camp.ticket_id}</span>
                </div>
                <h3 className="font-bold text-xl text-gray-900 flex items-center mt-2">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  {camp.health_focus_area}
                </h3>
              </div>
              
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-center text-sm text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium">Pincode: {camp.pincode}</p>
                    <p className="text-xs text-gray-500">{camp.organization_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-700">
                  <Users className="w-5 h-5 mr-3 text-gray-400" />
                  <span>Targeting <span className="font-medium text-gray-900">{camp.expected_patient_count}</span> patients</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-700">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{new Date(camp.start_date).toLocaleDateString()} <ArrowRight className="inline w-3 h-3 text-gray-400 mx-1"/> {new Date(camp.end_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Commit Funding Amount (₹)</label>
                <div className="flex space-x-3">
                  <input 
                    type="number" 
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    placeholder="e.g. 50000" 
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    onClick={() => handleFund(camp.camp_id)} 
                    disabled={processingId === camp.camp_id}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold shadow-sm transition-colors disabled:bg-blue-400 flex items-center"
                  >
                    {processingId === camp.camp_id ? 'Processing...' : 'Fund Camp'}
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

export default FundableCamps;
