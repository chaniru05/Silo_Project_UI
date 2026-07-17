import React, { useState, useRef } from 'react';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updated: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role] = useState(user.role);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onUpdateUser({ ...user, name, email, avatar });
    setSaved(true);
    setTimeout(() => onClose(), 800);
  };

  const avatarSrc = avatar || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0a0f15] border border-[#1f2937] rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222a36]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg">manage_accounts</span>
            <h2 className="font-sans text-xs font-bold text-gray-200 uppercase tracking-wider">Profile Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 cursor-pointer">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-[#222a36]">
            <div className="relative shrink-0 group">
              <img
                src={avatarSrc}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border border-[#2d3748]"
              />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute inset-0 w-full h-full rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <span className="material-symbols-outlined text-white text-base">camera_alt</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold text-gray-200">{user.name}</h3>
              <p className="font-mono text-[9px] text-gray-500 uppercase">{role}</p>
            </div>
          </div>

          <div>
            <label className="font-mono text-[9px] text-gray-400 uppercase block mb-1">Full Name</label>
            <input
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-2 px-3 font-mono text-xs text-gray-100 transition-colors"
            />
          </div>

          <div>
            <label className="font-mono text-[9px] text-gray-400 uppercase block mb-1">Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-2 px-3 font-mono text-xs text-gray-100 transition-colors"
            />
          </div>

          <div>
            <label className="font-mono text-[9px] text-gray-400 uppercase block mb-1">Role</label>
            <input
              type="text" value={role} disabled
              className="w-full bg-[#11171e] border border-[#232c38] rounded-lg py-2 px-3 font-mono text-xs text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#222a36]">
          {saved && (
            <span className="font-mono text-[9px] text-emerald-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span> Saved
            </span>
          )}
          <button onClick={onClose}
            className="px-3 py-1.5 border border-[#2e3745] text-gray-400 hover:text-gray-200 rounded text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono font-bold uppercase rounded tracking-wider transition-colors cursor-pointer">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
