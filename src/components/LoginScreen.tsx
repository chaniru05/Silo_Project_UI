import React, { useState } from 'react';
import { User } from '../types';
import { initialUsers } from '../data/mockData';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('marcus.thorne@apexavian.lk');
  const [password, setPassword] = useState<string>('••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authLogs, setAuthLogs] = useState<string[]>([]);
  const [authError, setAuthError] = useState<string>('');

  const runAuthSequencer = (selectedUser: User) => {
    setIsAuthenticating(true);
    setAuthError('');
    setAuthLogs([]);

    const steps = [
      'SECURE HANDSHAKE: INITIATING COLD CONNECTION...',
      'ENCRYPT: SHA-256 SYMMETRIC TUNNEL OPENED [PORT 3000]',
      'RESOLVING: telemetry.colombo-hq.apexavian.lk... 10.209.4.15',
      'AUTHORIZING SECURE KEYRING IDENTIFIER...',
      'MUTUAL SSL HANDSHAKE COMPLETED SUCCESSFUL',
      'PROFILE DISCOVERED: MARCUS THORNE // CLASS A-ADMIN',
      'DECRYPTING CENTRAL INVENTORY MATRIX DATABASE...',
      'BOOTING HIGH-FIDELITY GAGE INTEGRATOR...',
      'READY: launching terminal control session...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setAuthLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onLoginSuccess(selectedUser);
        }, 300);
      }
    }, 150);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setAuthError('Please provide a valid terminal login identifier.');
      return;
    }

    // Try to match email with a user in our database
    const matchedUser = initialUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (matchedUser) {
      runAuthSequencer(matchedUser);
    } else {
      setAuthError('Access Denied: Unrecognized terminal user identifier.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070a0e] text-[#dde3ee] flex items-center justify-center relative overflow-hidden industrial-grid p-4">
      {/* Visual cyber design grids / glow overlays */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="scanline" />

      {/* Login Card Panel */}
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

        {!isAuthenticating ? (
          <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
            {authError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-2.5 text-red-400 font-mono text-[10px] leading-relaxed">
                ✕ {authError}
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] text-gray-400 uppercase block mb-1">
                Access Identifier (Email)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-gray-500 absolute left-3 top-2.5 text-lg">
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
                <span className="material-symbols-outlined text-gray-500 absolute left-3 top-2.5 text-lg">
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
                  className="absolute right-3 top-2 text-gray-500 hover:text-gray-300 cursor-pointer"
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

            {/* Quick Testing Profiles Section */}
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
        ) : (
          /* Authentication Sequencer Logs overlay */
          <div className="space-y-4">
            <div className="bg-[#05070a] border border-[#1f2937] rounded-lg p-4 font-mono text-[9px] text-amber-500 text-left h-56 overflow-y-auto custom-scrollbar flex flex-col justify-end space-y-1">
              <div className="flex-1 flex flex-col justify-start space-y-1">
                {authLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-1">
                    <span className="text-gray-600 font-bold">&gt;</span>
                    <span className={log && typeof log === 'string' && (log.includes('GRANTED') || log.includes('COMPLETED') || log.includes('SUCCESSFUL') || log.includes('READY')) ? 'text-emerald-400 font-bold' : ''}>
                      {log}
                    </span>
                  </div>
                ))}
                {authLogs.length < 9 && (
                  <div className="w-1.5 h-3 bg-amber-500 animate-pulse mt-1" />
                )}
              </div>
            </div>

            <div className="text-center font-mono text-[10px] text-gray-400">
              Establishing direct secure link with Colombo command node...
            </div>
          </div>
        )}
      </div>

      {/* Cyber system labels and layout anchors */}
      <div className="absolute bottom-4 left-6 hidden md:block font-mono text-[8px] text-gray-600 uppercase">
        APEX AVIAN INDUSTRIAL SECURED INFRASTRUCTURE // COLOMBO, SL
      </div>
      <div className="absolute bottom-4 right-6 hidden md:block font-mono text-[8px] text-gray-600 uppercase">
        SYSTEM SECURITY CLASSIFIED: LEVEL 4-ALPHA AUTHENTICATION
      </div>
    </div>
  );
};
