import { useEffect, useState } from 'react';
import { MessageSquare, ImageIcon, Box, Zap, Loader2, LogOut } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../store/index.js';
import { logout } from '../services/firebase.js';

const BORDER   = '1px solid rgba(255,255,255,0.07)';
const V_BORDER = '1px solid rgba(124,58,237,0.2)';

export default function ProfilePage() {
  const { user }           = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/user/profile').then(d => setProfile(d)).catch(() => {});
  }, []);

  if (!profile) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={18} className="animate-spin" style={{ color: '#7c3aed' }} />
    </div>
  );

  const stats = [
    { icon: MessageSquare, label: 'Chat Sessions',   value: profile.stats.chats },
    { icon: ImageIcon,     label: 'Images',           value: profile.stats.images },
    { icon: Box,           label: 'Scripts',          value: profile.stats.scripts },
    { icon: Zap,           label: 'Pipelines',        value: profile.stats.pipelines },
  ];

  const usage = [
    { label: 'Messages sent',    value: profile.user.usage?.messages  || 0 },
    { label: 'Images generated', value: profile.user.usage?.images    || 0 },
    { label: 'Scripts created',  value: profile.user.usage?.scripts   || 0 },
    { label: 'Pipelines run',    value: profile.user.usage?.pipelines || 0 },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full">
      <h1 className="text-base font-semibold mb-6" style={{ color: 'rgba(255,255,255,0.85)' }}>Profile</h1>

      {/* User card */}
      <div className="rounded-xl p-5 mb-5 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-semibold flex-shrink-0"
          style={{ background: 'rgba(124,58,237,0.15)', border: V_BORDER, color: '#a78bfa', boxShadow: '0 0 20px rgba(124,58,237,0.1)' }}>
          {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {user?.displayName || profile.user.name || 'User'}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{user?.email}</p>
          <span className="inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: V_BORDER }}>
            {profile.user.plan} plan
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl px-3 py-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
            <Icon size={14} style={{ color: '#7c3aed', margin: '0 auto 8px' }} />
            <p className="text-xl font-semibold font-mono" style={{ color: 'rgba(255,255,255,0.9)' }}>{value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Usage */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
        <div className="px-4 py-3" style={{ borderBottom: BORDER }}>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Usage Totals</p>
        </div>
        {usage.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: BORDER }}>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</span>
            <span className="text-sm font-mono font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={logout}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
        style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#fca5a5' }}>
        <LogOut size={14} />Sign out
      </button>
    </div>
  );
}
