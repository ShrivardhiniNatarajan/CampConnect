import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { HeartPulse, User, Phone, Lock, Briefcase, Mail, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, KeyRound, Building2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  
  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'social_worker',
    // Credential & Verification fields
    org_reg_number: '',
    org_name: '',
    company_cin: '',
    company_name: '',
    coordinator_badge_id: '',
    field_worker_id: ''
  });

  // OTP Verification Flow State
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Step 1: Send OTP to phone
      const res = await api.post('/auth/send-otp', { phone: formData.phone });
      setStep('otp');
      setDevOtpHint(res.data.dev_otp || '');
      setSuccess(
        res.data.sent_via_sms
          ? `✓ Verification code sent directly to your phone (${formData.phone}) via SMS!`
          : 'Verification code generated! Enter the 6-digit code below to confirm your number.'
      );
    } catch (err) {
      const msg = err.response?.data?.message || (err.message && err.message.toLowerCase().includes('network')
        ? 'Cannot reach backend server. Please make sure the backend is running on http://localhost:5000'
        : (err.message || 'Could not send verification OTP. Check phone number.'));
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Step 2: Verify the OTP with JWT authentication
      const verifyRes = await api.post('/auth/verify-otp', {
        phone: formData.phone,
        otp: otp.trim()
      });

      if (verifyRes.data?.token) {
        localStorage.setItem('phone_verification_token', verifyRes.data.token);
      }

      // Step 3: Attempt database registration
      try {
        const regRes = await api.post('/auth/register', {
          ...formData,
          otp: otp.trim()
        });

        if (regRes.data?.token) {
          localStorage.setItem('token', regRes.data.token);
          if (regRes.data.user) {
            localStorage.setItem('user', JSON.stringify(regRes.data.user));
          }
        }

        setSuccess('Phone verified and account created with JWT authentication! Redirecting...');
        setTimeout(() => {
          navigate('/', { state: { registeredPhone: formData.phone } });
        }, 1500);
      } catch (dbErr) {
        const msg = dbErr.response?.data?.message || '';
        if (msg.includes('Database') || msg.includes('offline') || msg.includes('ECONNREFUSED')) {
          setSuccess(`✓ Phone ${formData.phone} verified with JWT authentication! (Note: Database is on your other system; connect MySQL to persist account).`);
        } else {
          setError(msg || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { phone: formData.phone });
      if (res.data.dev_otp) {
        setDevOtpHint(res.data.dev_otp);
      }
      setSuccess(
        res.data.sent_via_sms
          ? `✓ New OTP sent to your phone (${formData.phone}) via SMS!`
          : 'New OTP code generated.'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <HeartPulse className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'register' ? 'Create an Account' : 'Verify Phone Number'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'register' ? (
            <>
              Or{' '}
              <Link to="/" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                sign in to your existing account
              </Link>
            </>
          ) : (
            `A 6-digit OTP was sent to ${formData.phone}`
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fade-in">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-fade-in flex items-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          {/* STEP 1: Registration Form with Role Verification */}
          {step === 'register' && (
            <form className="space-y-5" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Full Name *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    placeholder="Dr. Rajesh Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Phone Number *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    placeholder="9876543210 (10 digits)"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">An OTP will be sent to verify this number.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Email Address (Optional)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    placeholder="rajesh@hospital.org"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Password *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Role *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="pl-10 block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none"
                  >
                    <option value="social_worker">Social Worker (Field Representative)</option>
                    <option value="org_admin">Organization Admin (Hospital / NGO)</option>
                    <option value="csr_admin">CSR Admin (Corporate Sponsor)</option>
                    <option value="coordinator">Platform Coordinator</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Credential Verification Inputs */}
              {formData.role === 'org_admin' && (
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-3">
                  <div className="flex items-center text-xs font-bold text-blue-900 uppercase tracking-wide">
                    <Building2 className="w-4 h-4 mr-1 text-blue-600" />
                    Organization Verification Details
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">NGO Darpan ID / Clinical Registration No.</label>
                    <input
                      type="text"
                      name="org_reg_number"
                      value={formData.org_reg_number}
                      onChange={handleChange}
                      placeholder="e.g. TN/2023/0192834 or CEA-HOSP-782"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {formData.role === 'csr_admin' && (
                <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 space-y-3">
                  <div className="flex items-center text-xs font-bold text-purple-900 uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 mr-1 text-purple-600" />
                    Corporate CSR Credentials
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Corporate CIN / MCA CSR-1 Reg. No.</label>
                    <input
                      type="text"
                      name="company_cin"
                      value={formData.company_cin}
                      onChange={handleChange}
                      placeholder="e.g. L17110MH1973PLC019786 or CSR00012345"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {formData.role === 'coordinator' && (
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 space-y-3">
                  <div className="flex items-center text-xs font-bold text-amber-900 uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 mr-1 text-amber-600" />
                    Coordinator Verification
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Coordinator Official Badge / Staff ID</label>
                    <input
                      type="text"
                      name="coordinator_badge_id"
                      value={formData.coordinator_badge_id}
                      onChange={handleChange}
                      placeholder="e.g. CC-COORD-9821"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-xs text-amber-800">
                    Coordinator accounts require verification approval before signing off camp reports.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 mt-2"
              >
                {loading ? 'Sending Verification OTP...' : (
                  <>
                    Continue to Phone Verification
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Phone OTP Verification Screen */}
          {step === 'otp' && (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="text-center">
                <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-full mb-3">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Enter Verification Code</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit OTP code sent to <strong>{formData.phone}</strong> to confirm you own this number.
                </p>
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
                  className="w-full text-center tracking-widest text-3xl font-mono py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying OTP...' : 'Verify Phone & Finish Registration'}
              </button>

              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep('register')}
                  className="text-gray-500 hover:text-gray-800 transition-colors"
                >
                  ← Edit Phone / Details
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
