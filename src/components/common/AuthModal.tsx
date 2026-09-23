import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuthModal: React.FC = () => {
  const { 
    showAuthModal, 
    setShowAuthModal, 
    authModalTab, 
    setAuthModalTab,
    loginCustomer,
    sendAdminOtp,
    verifyAdminOtp,
    pendingAdminData,
    setPendingAdminData
  } = useApp();

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Admin Form State
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [displayedOtp, setDisplayedOtp] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState('');

  if (!showAuthModal) return null;

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    loginCustomer(customerName, customerPhone);
  };

  const handleSendAdminOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!adminName.trim()) {
      setErrorMessage('Please enter Admin Name.');
      return;
    }
    if (!adminPhone.trim() || adminPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const otp = sendAdminOtp(adminName, adminPhone);
    setDisplayedOtp(otp);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const verified = verifyAdminOtp(otpInput);
    if (!verified) {
      setErrorMessage('Invalid OTP code. Please check the code or use master code 1234.');
    }
  };

  const closeModal = () => {
    setShowAuthModal(false);
    setPendingAdminData(null);
    setDisplayedOtp(null);
    setErrorMessage('');
    setOtpInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                {authModalTab === 'admin' ? 'Admin / Owner Login' : 'Customer Sign In'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {authModalTab === 'admin' ? 'OTP Verification for Multi-Admin Access' : 'Save your profile for 1-click cab bookings'}
              </p>
            </div>
          </div>

          <button 
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => {
              setAuthModalTab('customer');
              setPendingAdminData(null);
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              authModalTab === 'customer' 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👤 Customer Login
          </button>

          <button
            onClick={() => {
              setAuthModalTab('admin');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              authModalTab === 'admin' 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👑 Admin OTP Login
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200 mb-4">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. CUSTOMER LOGIN FORM */}
          {authModalTab === 'customer' && (
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Mohapatra"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-clean text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 98610 23456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input-clean text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-2.5 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Continue as Customer</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-slate-500 text-center">
                Your name & phone will be automatically filled when booking any car.
              </p>
            </form>
          )}

          {/* 2. ADMIN OTP LOGIN FORM */}
          {authModalTab === 'admin' && (
            <div>
              {!pendingAdminData ? (
                /* Step 1: Name & Phone */
                <form onSubmit={handleSendAdminOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Admin Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Biswadeep Biswal"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="input-clean text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Admin Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 94370 12345"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      className="input-clean text-xs font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary py-2.5 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Send Login OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-800 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" /> Multiple Admin Support
                    </p>
                    <p>Any designated manager/owner can sign in with their name and phone.</p>
                  </div>
                </form>
              ) : (
                /* Step 2: OTP Entry */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  
                  {/* Simulated OTP Notification Banner */}
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-1 text-center animate-in zoom-in-95">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                      OTP Sent to {pendingAdminData.phone}
                    </span>
                    <div className="text-xl font-mono font-black text-emerald-700 tracking-widest">
                      {displayedOtp || pendingAdminData.otp}
                    </div>
                    <span className="text-[10px] text-emerald-700 block">
                      (Enter the 4-digit code above or use master code 1234)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 text-center">
                      Enter 4-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={4}
                      placeholder="• • • •"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="input-clean text-center font-mono font-black text-lg tracking-widest"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary py-2.5 text-xs font-bold shadow-md cursor-pointer"
                  >
                    Verify OTP & Open Admin Panel
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPendingAdminData(null); setOtpInput(''); }}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    ← Change Name or Phone Number
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
