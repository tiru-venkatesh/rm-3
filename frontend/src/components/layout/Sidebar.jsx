import { NavLink, useNavigate } from 'react-router-dom';
import {
  Cpu, Layers, Zap, MessageSquare,
  ImageIcon, Box, User, Plus, Trash2,
} from 'lucide-react';
import { useEffect } from 'react';
import { useAuth, useChat } from '../../store/index.js';
import { logout } from '../../services/firebase.js';
import { api } from '../../services/api.js';

const NAV = [
  { to: '/scene',    icon: Layers,        label: 'Scene Planner', badge: 'AI'  },
  { to: '/pipeline', icon: Zap,           label: 'AI Pipeline',   badge: 'L5'  },
  { to: '/chat',     icon: MessageSquare, label: 'Chat' },
  { to: '/images',   icon: ImageIcon,     label: 'Images' },
  { to: '/blender',  icon: Box,           label: 'Blender' },
  { to: '/profile',  icon: User,          label: 'Profile' },
];

const BORDER = '1px solid rgba(255,255,255,0.06)';
const BG     = '#0e0e15';

export default function Sidebar() {
  const nav  = useNavigate();
  const { user } = useAuth();
  const { sessions, setSessions, setActiveChatId } = useChat();

  useEffect(() => {
    api.get('/chat').then(d => setSessions(d.sessions)).catch(() => {});
  }, []);

  const newChat = async () => {
    const { session } = await api.post('/chat/session', { type: 'primary' });
    setSessions(prev => [session, ...prev]);
    setActiveChatId(session._id);
    nav(`/chat/${session._id}`);
  };

  const delChat = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    await api.delete(`/chat/${id}`);
    setSessions(prev => prev.filter(s => s._id !== id));
  };

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full"
      style={{ background: BG, borderRight: BORDER }}>

      {/* Logo */}
      <div className="h-14 px-4 flex items-center gap-2.5 flex-shrink-0"
        style={{ borderBottom: BORDER }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 0 12px rgba(124,58,237,0.2)' }}>
          <Cpu size={14} style={{ color: '#a78bfa' }} />
        </div>
        <span className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>RealMind AI</span>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>v3</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive ? 'text-t1' : 'text-t3 hover:text-t2 hover:bg-t4'
              }`}
            style={({ isActive }) => isActive ? {
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.2)',
              color: '#c4b5fd',
            } : {}}>
            {({ isActive }) => (
              <>
                <Icon size={14} strokeWidth={1.8}
                  style={isActive ? { color: '#a78bfa' } : {}} />
                {label}
                {badge && (
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Chat history */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.22)' }}>
              History
            </span>
            <button onClick={newChat} title="New chat"
              className="p-0.5 rounded transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
              <Plus size={12} />
            </button>
          </div>
          {sessions.slice(0, 20).map(s => (
            <NavLink key={s._id} to={`/chat/${s._id}`}
              className={({ isActive }) =>
                `group flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-t4 text-t2' : 'text-t3 hover:bg-t4 hover:text-t2'
                }`}>
              <MessageSquare size={10} className="flex-shrink-0" />
              <span className="truncate flex-1 text-xs">{s.title}</span>
              <button onClick={e => delChat(e, s._id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 transition-all"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                <Trash2 size={9} />
              </button>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: BORDER }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-colors hover:bg-t4"
          onClick={logout}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
            {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {user?.displayName || 'User'}
            </p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Sign out</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
