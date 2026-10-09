import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { HeartPulse, Lock, Phone, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP Verification Modal state if phone was unverified
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [resending, setResending] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.registeredPhone) {
      setPhone(location.state.registeredPhone);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(phone, password);
      
      switch (user.role) {
        case 'social_worker': navigate('/social-worker'); break;
        case 'org_admin': navigate('/org-admin'); break;
        case 'csr_admin': navigate('/csr-admin'); break;
        case 'coordinator': navigate('/coordinator'); break;
        default: navigate('/');
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'PHONE_NOT_VERIFIED') {
        setNeedsOtp(true);
        setError('Your phone number has not been verified yet. Please enter the OTP to verify.');
        // Automatically request a resend OTP for convenience
        try {
          const res = await api.post('/auth/resend-otp', { phone });
          if (res.data.dev_otp) setDevOtpHint(res.data.dev_otp);
        } catch {
          // ignore resend error
        }
      } else {
        setError(errData?.message || 'Login failed. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp: otp.trim() });
      if (res.data?.token && res.data?.user) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setOtpSuccess('Phone verified with JWT authentication! Signing you in...');
        const user = res.data.user;
        setTimeout(() => {
          switch (user.role) {
            case 'social_worker': navigate('/social-worker'); break;
            case 'org_admin': navigate('/org-admin'); break;
            case 'csr_admin': navigate('/csr-admin'); break;
            case 'coordinator': navigate('/coordinator'); break;
            default: navigate('/');
          }
        }, 800);
        return;
      }

      setOtpSuccess('Phone verified! Signing you in...');
      setNeedsOtp(false);
      // Auto-attempt login now that it's verified
      const user = await login(phone, password);
      switch (user.role) {
        case 'social_worker': navigate('/social-worker'); break;
        case 'org_admin': navigate('/org-admin'); break;
        case 'csr_admin': navigate('/csr-admin'); break;
        case 'coordinator': navigate('/coordinator'); break;
        default: navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code.');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { phone });
      if (res.data.dev_otp) setDevOtpHint(res.data.dev_otp);
      setOtpSuccess('New verification code sent to your phone.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <HeartPulse className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">CampConnect</h2>
          <p className="text-gray-500 mt-2 text-center">Sign in to coordinate rural health camps.</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {otpSuccess && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm font-medium border border-green-100 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
            {otpSuccess}
          </div>
        )}

        {!needsOtp ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 transition-all font-semibold text-lg mt-4 shadow-md hover:shadow-lg disabled:bg-blue-400"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2 font-medium">Quick Demo Accounts (password: password123):</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setPhone('9876543210'); setPassword('password123'); }}
                  className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium text-left truncate transition-colors"
                >
                  👷 Social Worker
                </button>
                <button
                  type="button"
                  onClick={() => { setPhone('9876543220'); setPassword('password123'); }}
                  className="px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium text-left truncate transition-colors"
                >
                  🏥 Hospital Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setPhone('9876543230'); setPassword('password123'); }}
                  className="px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium text-left truncate transition-colors"
                >
                  🏢 CSR Sponsor
                </button>
                <button
                  type="button"
                  onClick={() => { setPhone('9876543240'); setPassword('password123'); }}
                  className="px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-medium text-left truncate transition-colors"
                >
                  📋 Coordinator
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex p-3 bg-amber-100 text-amber-600 rounded-full mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">Phone Verification Required</h3>
              <p className="text-xs text-gray-500 mt-1">Please enter the OTP sent to <strong>{phone}</strong></p>
            </div>

            {devOtpHint && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <span className="text-xs font-semibold text-amber-800 block">⚡ Development Mode Active</span>
                <span className="text-lg font-mono font-bold text-amber-900 tracking-wider">Your OTP: {devOtpHint}</span>
              </div>
            )}

            <div>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="• • • • • •"
                className="w-full text-center tracking-widest text-2xl font-mono py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP & Log In'}
            </button>

            <div className="flex justify-between items-center text-xs pt-2">
              <button
                type="button"
                onClick={() => setNeedsOtp(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                ← Back to Login
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Resending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
