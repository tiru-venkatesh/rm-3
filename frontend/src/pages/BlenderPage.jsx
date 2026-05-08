import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Play, Loader2, CheckCircle2, XCircle, Clock, Copy, ChevronDown, Plus } from 'lucide-react';
import { api } from '../services/api.js';

const BORDER   = '1px solid rgba(255,255,255,0.07)';
const V_BORDER = '1px solid rgba(124,58,237,0.2)';

const STATUS = {
  generated: { icon: Clock,       color: 'rgba(255,255,255,0.3)',  label: 'Ready'   },
  running:   { icon: Loader2,     color: '#fbbf24',                label: 'Running', spin: true },
  done:      { icon: CheckCircle2,color: '#10b981',                label: 'Done'    },
  failed:    { icon: XCircle,     color: '#f43f5e',                label: 'Failed'  },
};

function BpyHighlight({ code }) {
  if (!code) return <span style={{ color: 'rgba(255,255,255,0.25)' }}>No code yet.</span>;
  return code.split('\n').map((line, i) => {
    const colored = line
      .replace(/\b(import|from|def|class|return|if|else|elif|for|in|True|False|None|not|and|or|with|as|try|except)\b/g, '<span class="tok-kw">$1</span>')
      .replace(/\b([a-z_]+)\s*(?=\()/g, '<span class="tok-fn">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="tok-str">"$1"</span>')
      .replace(/'([^']*)'/g, "<span class='tok-str'>'$1'</span>")
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-num">$1</span>')
      .replace(/(#.*)/g, '<span class="tok-cm">$1</span>');
    return (
      <span key={i} className="flex gap-4">
        <span className="select-none text-right" style={{ color: 'rgba(255,255,255,0.2)', minWidth: '2rem', fontSize: '10px' }}>{i + 1}</span>
        <span dangerouslySetInnerHTML={{ __html: colored }} />
        {'\n'}
      </span>
    );
  });
}

export default function BlenderPage() {
  const [prompt,     setPrompt]     = useState('');
  const [title,      setTitle]      = useState('');
  const [scripts,    setScripts]    = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [detail,     setDetail]     = useState(null);
  const [generating, setGenerating] = useState(false);
  const [running,    setRunning]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [showLog,    setShowLog]    = useState(false);

  useEffect(() => {
    api.get('/blender').then(d => setScripts(d.scripts)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/blender/${selected}`).then(d => setDetail(d.script)).catch(() => {});
  }, [selected]);

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    try {
      const { script } = await api.post('/blender/generate', { prompt: prompt.trim(), title: title.trim() });
      setScripts(prev => [script, ...prev]);
      setSelected(script._id);
      setPrompt(''); setTitle('');
    } catch (err) { alert(err.message); }
    setGenerating(false);
  };

  const run = async () => {
    if (!detail || running) return;
    setRunning(true);
    setDetail(prev => ({ ...prev, status: 'running' }));
    try {
      const { script } = await api.post(`/blender/${detail._id}/run`);
      setDetail(script);
      setScripts(prev => prev.map(s => s._id === script._id ? { ...s, status: script.status } : s));
    } catch (err) { alert(err.message); }
    setRunning(false);
  };

  const copy = () => {
    if (!detail) return;
    navigator.clipboard.writeText(detail.code);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* Left sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col" style={{ background: '#0e0e15', borderRight: BORDER }}>
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: BORDER }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <Box size={14} style={{ color: '#a78bfa' }} />Blender Scripts
          </h2>
        </div>

        {/* Generator */}
        <div className="px-3 py-3 space-y-2 flex-shrink-0" style={{ borderBottom: BORDER }}>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Title (optional)" className="field text-xs" />
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="Describe what to build in Blender…"
            rows={4} className="field text-xs resize-none" />
          <button onClick={generate} disabled={!prompt.trim() || generating} className="btn-primary w-full text-xs">
            {generating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
            {generating ? 'Generating…' : 'Generate Script'}
          </button>
        </div>

        {/* Script list */}
        <div className="flex-1 overflow-y-auto">
          {scripts.map(s => {
            const S = STATUS[s.status] || STATUS.generated;
            return (
              <button key={s._id} onClick={() => setSelected(s._id)}
                className="w-full text-left px-3 py-3 transition-colors"
                style={{
                  borderBottom: BORDER,
                  background: selected === s._id ? 'rgba(124,58,237,0.08)' : 'transparent',
                  borderLeft: selected === s._id ? '2px solid #7c3aed' : '2px solid transparent',
                }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <S.icon size={11} style={{ color: S.color, flexShrink: 0 }}
                    className={S.spin ? 'animate-spin' : ''} />
                  <span className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {s.title}
                  </span>
                </div>
                <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.prompt}</p>
              </button>
            );
          })}
          {!scripts.length && (
            <p className="px-4 py-8 text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
              No scripts yet — generate one above
            </p>
          )}
        </div>
      </div>

      {/* Right — code + log */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!detail ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Box size={36} style={{ color: 'rgba(124,58,237,0.3)', margin: '0 auto 12px' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Generate or select a script
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="h-12 px-4 flex items-center gap-3 flex-shrink-0"
              style={{ borderBottom: BORDER, background: 'rgba(14,14,21,0.9)' }}>
              <span className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {detail.title}
              </span>
              <span className="text-xs" style={{ color: STATUS[detail.status]?.color }}>
                · {STATUS[detail.status]?.label}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={copy} className="btn-outline text-xs gap-1.5">
                  <Copy size={11} />{copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={run} disabled={running} className="btn-primary text-xs gap-1.5">
                  {running ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                  {running ? 'Running…' : 'Run in Blender'}
                </button>
              </div>
            </div>

            {/* Code */}
            <div className="flex-1 overflow-auto p-4 min-h-0">
              <pre className="text-xs font-mono leading-relaxed p-4 rounded-xl overflow-x-auto whitespace-pre"
                style={{ background: '#0a0a12', border: V_BORDER, color: 'rgba(255,255,255,0.75)' }}>
                <BpyHighlight code={detail.code} />
              </pre>
            </div>

            {/* Log collapsible */}
            {detail.log && (
              <div className="flex-shrink-0" style={{ borderTop: BORDER }}>
                <button onClick={() => setShowLog(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors hover:bg-t4"
                  style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(14,14,21,0.9)' }}>
                  Execution Log
                  <ChevronDown size={12}
                    style={{ transform: showLog ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'rgba(255,255,255,0.3)' }} />
                </button>
                <AnimatePresence>
                  {showLog && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden" style={{ borderTop: BORDER }}>
                      <pre className="text-[11px] font-mono leading-relaxed p-4 max-h-44 overflow-y-auto"
                        style={{ background: '#05050a', color: '#86efac' }}>
                        {detail.log}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
