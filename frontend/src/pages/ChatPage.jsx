import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, User, ArrowUp, Loader2, SplitSquareHorizontal, Plus, X, MessageSquare } from 'lucide-react';
import { api } from '../services/api.js';
import { useChat } from '../store/index.js';

const BORDER = '1px solid rgba(255,255,255,0.07)';
const V_BORDER = '1px solid rgba(124,58,237,0.25)';

function Bubble({ msg, isLast, streaming }) {
  const isAI = msg.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16 }}
      className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>

      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
        style={isAI
          ? { background: 'rgba(124,58,237,0.18)', border: V_BORDER }
          : { background: 'rgba(255,255,255,0.06)', border: BORDER }}>
        {isAI
          ? <Bot  size={13} style={{ color: '#a78bfa' }} />
          : <User size={13} style={{ color: 'rgba(255,255,255,0.5)' }} />}
      </div>

      <div className={`max-w-[80%] ${isAI ? '' : 'flex flex-col items-end'}`}>
        <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={isAI
            ? { background: 'rgba(255,255,255,0.04)', border: BORDER, color: 'rgba(255,255,255,0.85)' }
            : { background: 'rgba(124,58,237,0.22)', border: V_BORDER, color: 'rgba(255,255,255,0.9)' }}>
          {isAI && isLast && streaming && msg.content === '' ? (
            <span className="flex gap-1 items-center h-4">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: '#7c3aed', animationDelay: `${i * 0.12}s` }} />
              ))}
            </span>
          ) : isAI ? (
            <div className="md-body text-sm">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            <p>{msg.content}</p>
          )}
        </div>

        {/* Attachments */}
        {msg.attachments?.length > 0 && (
          <div className="mt-2 space-y-2 max-w-sm w-full">
            {msg.attachments.map((att, i) => att.type === 'image' && (
              <img key={i} src={att.url} alt="AI generated"
                className="rounded-xl w-full object-cover"
                style={{ border: V_BORDER }}
                onError={e => { e.target.style.display = 'none'; }} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChatPane({ chatId, placeholder, compact }) {
  const { messages, pushMessage, appendDelta, appendAttachment, setMessages, streaming, setStreaming } = useChat();
  const [input, setInput] = useState('');
  const taRef             = useRef(null);
  const bottomRef         = useRef(null);
  const msgs              = messages[chatId] || [];

  useEffect(() => {
    if (!chatId) return;
    api.get(`/chat/${chatId}`)
      .then(d => setMessages(chatId, d.session.messages))
      .catch(() => {});
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || !chatId || streaming) return;
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';

    pushMessage(chatId, { role: 'user', content: text, attachments: [] });
    pushMessage(chatId, { role: 'assistant', content: '', attachments: [] });
    setStreaming(true);

    await api.stream(
      `/chat/${chatId}/stream`,
      { content: text },
      delta       => appendDelta(chatId, delta),
      attachment  => appendAttachment(chatId, attachment),
      ()          => setStreaming(false)
    );
  };

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onInput = e => {
    setInput(e.target.value);
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 140) + 'px';
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 min-h-0">
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <Bubble key={i} msg={m} isLast={i === msgs.length - 1} streaming={streaming} />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-4 flex-shrink-0"
        style={{ borderTop: BORDER, background: 'rgba(14,14,21,0.8)' }}>
        <div className="flex items-end gap-2 rounded-xl px-3 py-2.5 transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: BORDER }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'}
          onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
          <textarea ref={taRef} value={input} onChange={onInput} onKeyDown={onKey} rows={1}
            placeholder={placeholder || 'Message RealMind AI…'}
            className={`flex-1 bg-transparent outline-none resize-none min-h-5 ${compact ? 'text-xs' : 'text-sm'}`}
            style={{ color: 'rgba(255,255,255,0.85)', caretColor: '#7c3aed' }}
            onInput={e => e.currentTarget.style.height = 'auto' || (e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 140) + 'px')} />
          <button onClick={send} disabled={!input.trim() || streaming}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-35"
            style={{ background: '#7c3aed', boxShadow: '0 0 10px rgba(124,58,237,0.3)' }}>
            <ArrowUp size={13} className="text-white" />
          </button>
        </div>
        <p className={`text-center mt-1.5 ${compact ? 'text-[9px]' : 'text-[10px]'}`}
          style={{ color: 'rgba(255,255,255,0.2)' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { id } = useParams();
  const nav    = useNavigate();
  const { sessions, setSessions, setActiveChatId } = useChat();
  const [analyzeId, setAnalyzeId] = useState(null);

  const newChat = async () => {
    const { session } = await api.post('/chat/session', { type: 'primary' });
    setSessions(prev => [session, ...prev]);
    setActiveChatId(session._id);
    nav(`/chat/${session._id}`);
  };

  const openAnalysis = async () => {
    const { session } = await api.post('/chat/session', { type: 'secondary', linkedChatId: id });
    setAnalyzeId(session._id);
  };

  if (!id) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 0 24px rgba(124,58,237,0.12)' }}>
        <MessageSquare size={24} style={{ color: '#a78bfa' }} />
      </div>
      <div>
        <h2 className="text-base font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.9)' }}>AI Chat</h2>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Ask about 3D modeling, Blender Python scripting, engineering concepts, or request image generation.
        </p>
      </div>
      <button onClick={newChat} className="btn-primary mt-2">
        <Plus size={14} />New Chat
      </button>
    </div>
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-12 px-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: BORDER, background: 'rgba(14,14,21,0.8)' }}>
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Chat</span>
          {!analyzeId && (
            <button onClick={openAnalysis} className="btn-outline text-xs gap-1.5">
              <SplitSquareHorizontal size={12} />Analyze
            </button>
          )}
        </div>
        <ChatPane chatId={id} />
      </div>

      <AnimatePresence>
        {analyzeId && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col overflow-hidden flex-shrink-0"
            style={{ borderLeft: '1px solid rgba(124,58,237,0.2)', background: 'rgba(14,14,21,0.95)' }}>
            <div className="h-12 px-4 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: BORDER, background: 'rgba(14,14,21,0.8)' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Analysis</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Secondary AI — reviews output</p>
              </div>
              <button onClick={() => setAnalyzeId(null)}
                className="p-1 rounded transition-colors hover:bg-t4"
                style={{ color: 'rgba(255,255,255,0.35)' }}>
                <X size={13} />
              </button>
            </div>
            <ChatPane chatId={analyzeId} placeholder="Ask about structure, improvements…" compact />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
