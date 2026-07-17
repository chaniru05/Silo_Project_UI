import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { initialUsers } from '../data/mockData';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

type AuthScreen = 'login' | '2fa' | 'loading';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('marcus.thorne@apexavian.lk');
  const [password, setPassword] = useState<string>('••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [otp, setOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setAuthError('Please provide a valid terminal login identifier.');
      return;
    }
    const user = initialUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setMatchedUser(user);
      setAuthError('');
      setScreen('2fa');
    } else {
      setAuthError('Access Denied: Unrecognized terminal user identifier.');
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length < 6) {
      setOtpError('Please enter the complete 6-digit code.');
      return;
    }
    setOtpError('');
    setScreen('loading');
  };

  useEffect(() => {
    if (screen !== 'loading' || !matchedUser) return;
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 5;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [screen, matchedUser]);

  useEffect(() => {
    if (loadingProgress >= 100 && matchedUser) {
      const t = setTimeout(() => onLoginSuccess(matchedUser), 200);
      return () => clearTimeout(t);
    }
  }, [loadingProgress, matchedUser, onLoginSuccess]);

  const otpDigits = Array.from({ length: 6 }, (_, i) => otp[i] || '');

  const handleOtpChange = (val: string, idx: number) => {
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 6);
      setOtp(pasted);
      const next = document.getElementById(`otp-${Math.min(pasted.length, 5)}`);
      next?.focus();
      return;
    }
    if (!/^\d*$/.test(val)) return;
    const newOtp = otp.split('');
    newOtp[idx] = val;
    setOtp(newOtp.join(''));
    if (val && idx < 5) {
      const next = document.getElementById(`otp-${idx + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const prev = document.getElementById(`otp-${idx - 1}`);
      prev?.focus();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070a0e] text-[#dde3ee] flex items-center justify-center relative overflow-hidden industrial-grid p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="scanline" />

      <div className="w-full max-w-md bg-[#0a0f15]/95 border border-[#1f2937] rounded-xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.6)] relative z-10 p-6">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center font-black text-black shadow-[0_0_20px_rgba(245,166,35,0.4)] mx-auto mb-3 text-lg">
            AA
          </div>
          <h2 className="font-sans text-lg font-black tracking-tight text-white uppercase">
            Apex Avian Industrial
          </h2>
          <p className="font-mono text-[9px] text-amber-500 uppercase tracking-widest mt-1">
            Secure Feed Telemetry & Gate Hub Terminal
          </p>
        </div>

        {screen === 'login' && (
          <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
            {authError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-2.5 text-red-400 font-mono text-[10px] leading-relaxed">
                &#10005; {authError}
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] text-gray-400 uppercase block mb-1">
                Access Identifier (Email)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                  account_circle
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-2 pl-10 pr-4 font-mono text-xs text-gray-100 placeholder-gray-600 transition-colors"
                  placeholder="name@apexavian.lk"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] text-gray-400 uppercase block mb-1">
                Security Passcode
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                  vpn_key
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-2 pl-10 pr-10 font-mono text-xs text-gray-100 placeholder-gray-600 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-sans text-xs font-bold uppercase rounded-lg shadow-lg tracking-wider transition-colors duration-150 cursor-pointer"
            >
              Sign In To Terminal
            </button>

            <div className="pt-4 border-t border-[#1a212a] mt-6">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-2 text-center">
                Fast-Auth Dev Credentials
              </span>
              <div className="grid grid-cols-2 gap-2">
                {initialUsers.slice(0, 4).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setEmail(user.email);
                      setPassword('avian-secure-key-2026');
                    }}
                    className="p-2 bg-[#10151c] hover:bg-[#151c25] border border-[#1e2733] hover:border-amber-500/30 rounded text-left transition-all cursor-pointer"
                  >
                    <span className="font-sans text-[10px] font-bold text-gray-200 block truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="font-mono text-[8px] text-gray-500 uppercase block truncate">
                      {user.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {screen === '2fa' && (
          <div className="space-y-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-2xl">verified_user</span>
              <h3 className="font-sans text-sm font-black text-gray-200 uppercase tracking-tight">
                Two-Factor Auth
              </h3>
            </div>
            <p className="font-mono text-[9px] text-gray-400 leading-relaxed">
              A 6-digit verification code has been sent to your registered authenticator device.
            </p>

            {otpError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-red-400 font-mono text-[10px]">
                &#10005; {otpError}
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={idx === 0 ? 6 : 1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  className="w-10 h-12 bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg text-center font-mono text-sm text-gray-100 transition-colors"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-sans text-xs font-bold uppercase rounded-lg shadow-lg tracking-wider transition-colors duration-150 cursor-pointer"
            >
              Verify &amp; Continue
            </button>

            <div className="flex items-center justify-between text-[9px] font-mono">
              <button
                onClick={() => { setScreen('login'); setOtp(''); setOtpError(''); }}
                className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              >
                &#8592; Back to Login
              </button>
              <span className="text-gray-600">Code expires in 2:59</span>
            </div>
          </div>
        )}

        {screen === 'loading' && (
          <div className="space-y-6 py-6 text-center">
            <div className="w-14 h-14 mx-auto border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <div>
              <h3 className="font-sans text-xs font-bold text-gray-200 uppercase tracking-wider">
                Authenticating Session
              </h3>
              <p className="font-mono text-[9px] text-gray-500 mt-1">
                Establishing secure link with Colombo command node...
              </p>
            </div>
            <div className="w-full bg-[#11171e] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${Math.min(loadingProgress, 100)}%` }}
              />
            </div>
            <div className="font-mono text-[8px] text-gray-600">
              {Math.min(loadingProgress, 100)}% complete
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-6 hidden md:block font-mono text-[8px] text-gray-600 uppercase">
        APEX AVIAN INDUSTRIAL SECURED INFRASTRUCTURE // COLOMBO, SL
      </div>
      <div className="absolute bottom-4 right-6 hidden md:block font-mono text-[8px] text-gray-600 uppercase">
        Developed by Team Zynthera
      </div>
    </div>
  );
};
