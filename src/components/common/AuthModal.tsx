import React, { useState } from 'react';
import { X, Phone, ShieldCheck, LogIn, User, KeyRound, Sparkles, CheckCircle2, Eye, EyeOff, Crown, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuthModal: React.FC = () => {
  const {
    showAuthModal, setShowAuthModal,
    authModalTab, setAuthModalTab,
    loginCustomer,
    sendAdminOtp, verifyAdminOtp, registerMainAdmin,
    pendingAdminData, setPendingAdminData,
    currentUser
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLoggedIn, setCustomerLoggedIn] = useState(false);

  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [newMainAdminName, setNewMainAdminName] = useState('');
  const [showRegisterMainAdmin, setShowRegisterMainAdmin] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [displayedOtp, setDisplayedOtp] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!showAuthModal) return null;

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || customerPhone.replace(/\D/g,'').length < 10) return;
    loginCustomer(customerName.trim(), customerPhone.trim());
    setCustomerLoggedIn(true);
    setTimeout(() => { setCustomerLoggedIn(false); setShowAuthModal(false); }, 1200);
  };

  const handleSendAdminOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const result = sendAdminOtp(adminName, adminPhone);
    if (result === 'UNAUTHORIZED') {
      setErrorMessage('This phone number is not registered as an admin.');
      setShowRegisterMainAdmin(true);
      return;
    }
    setDisplayedOtp(result);
    setOtpSent(true);
  };

  const handleRegisterAsMainAdmin = () => {
    if (!adminPhone || adminPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number above first.');
      return;
    }
    setErrorMessage('');
    const otp = registerMainAdmin(newMainAdminName || 'Main Admin', adminPhone);
    setDisplayedOtp(otp);
    setOtpSent(true);
    setShowRegisterMainAdmin(false);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const ok = verifyAdminOtp(otpInput);
    if (!ok) { setErrorMessage('Invalid OTP. Please try again.'); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Sign In</h2>
            <p className="text-xs text-slate-400">{authModalTab === 'customer' ? 'Login to book a cab' : 'Admin secure access'}</p>
          </div>
          <button onClick={() => setShowAuthModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 m-4 rounded-xl gap-1">
          <button onClick={() => setAuthModalTab('customer')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${authModalTab === 'customer' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            ðŸ‘¤ Customer
          </button>
          <button onClick={() => setAuthModalTab('admin')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${authModalTab === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            ðŸ” Admin
          </button>
        </div>

        <div className="px-5 pb-6">
          {/* CUSTOMER */}
          {authModalTab === 'customer' && (
            customerLoggedIn ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-800">Logged in successfully!</p>
                <p className="text-xs text-slate-500">You can now book any car.</p>
              </div>
            ) : (
              <form onSubmit={handleCustomerLogin} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-2"><User className="w-6 h-6 text-blue-600" /></div>
                  <h3 className="text-base font-bold text-slate-800">Welcome!</h3>
                  <p className="text-xs text-slate-500">Sign in to book your cab instantly</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Your Full Name *</label>
                  <input type="text" required placeholder="e.g. Rahul Mohapatra" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="tel" required placeholder="10-digit mobile number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pl-9 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 cursor-pointer shadow-md">
                  <LogIn className="w-4 h-4" />Continue & Book
                </button>
                <p className="text-[11px] text-slate-400 text-center">Your info is used only for booking confirmation via WhatsApp.</p>
              </form>
            )
          )}

          {/* ADMIN */}
          {authModalTab === 'admin' && (
            !otpSent ? (
              <form onSubmit={handleSendAdminOtp} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-2"><ShieldCheck className="w-6 h-6 text-white" /></div>
                  <h3 className="text-base font-bold text-slate-800">Admin Access</h3>
                  <p className="text-xs text-slate-500">Restricted to registered admin phones only</p>
                </div>
                {errorMessage && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Admin Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Registered admin phone"
                      value={adminPhone}
                      onChange={e => setAdminPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pl-9 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] px-1">
                  <span className="text-slate-400">Need Main Admin access?</span>
                  <button
                    type="button"
                    onClick={() => setShowRegisterMainAdmin(!showRegisterMainAdmin)}
                    className="text-amber-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    {showRegisterMainAdmin ? 'Hide setup' : 'Add this phone as Main Admin'}
                  </button>
                </div>

                {showRegisterMainAdmin && (
                  <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-900">Register as Main Admin</h4>
                        <p className="text-[11px] text-amber-700">Add this phone number as Main Admin with full control.</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-600">Your Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Biswadeep (Owner)"
                        value={newMainAdminName}
                        onChange={e => setNewMainAdminName(e.target.value)}
                        className="w-full border border-amber-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRegisterAsMainAdmin}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" /> Add & Login as Main Admin
                    </button>
                  </div>
                )}

                <button type="submit" className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 cursor-pointer shadow-md">
                  <KeyRound className="w-4 h-4" />Send OTP
                </button>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800 text-center">
                  🔒 Registered admin phones have instant access. If this is your agency, use "Add this phone as Main Admin" above.
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-2"><Sparkles className="w-6 h-6 text-emerald-600" /></div>
                  <h3 className="text-base font-bold text-slate-800">Enter OTP</h3>
                  <p className="text-xs text-slate-500">Sent to {adminPhone}</p>
                </div>
                {errorMessage && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">{errorMessage}</div>}
                <div className="p-4 bg-slate-900 rounded-2xl text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Your OTP Code</p>
                  <div className="text-3xl font-mono font-black text-white tracking-[0.3em]">{displayedOtp || pendingAdminData?.otp}</div>
                  <p className="text-[10px] text-slate-400 mt-1">(In production this would be sent via SMS)</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 text-center">Enter 4-digit OTP</label>
                  <input type="text" required autoFocus maxLength={4} placeholder="â— â— â— â—" value={otpInput} onChange={e => setOtpInput(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-center font-mono font-black text-2xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 cursor-pointer shadow-md">
                  <ShieldCheck className="w-4 h-4" />Verify & Open Admin Panel
                </button>
                <button type="button" onClick={() => { setOtpSent(false); setOtpInput(''); setPendingAdminData(null); setDisplayedOtp(null); setErrorMessage(''); }}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer">
                  â† Change Phone Number
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
};