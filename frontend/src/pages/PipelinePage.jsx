import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, CheckCircle2, XCircle, Box, Code2, ImageIcon, ChevronDown, Download, History, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';

const ModelViewer = lazy(() => import('../components/viewer/ModelViewer.jsx'));

const BORDER   = '1px solid rgba(255,255,255,0.07)';
const V_BORDER = '1px solid rgba(124,58,237,0.2)';

const STEPS = [
  { id: 1, icon: Box,      label: 'Shap-E Mesh',    desc: 'AI converts text into a 3D mesh' },
  { id: 2, icon: Code2,    label: 'bpy Script',      desc: 'Groq writes a Blender Python script' },
  { id: 3, icon: Sparkles, label: 'Blender Render',  desc: 'Blender executes and renders the scene' },
];

function BpyHighlight({ code }) {
  if (!code) return null;
  return code.split('\n').map((line, i) => {
    const colored = line
      .replace(/\b(import|from|def|class|return|if|else|for|in|True|False|None)\b/g, '<span class="tok-kw">$1</span>')
      .replace(/\b([a-z_]+)\s*(?=\()/g, '<span class="tok-fn">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="tok-str">"$1"</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-num">$1</span>')
      .replace(/(#.*)/g, '<span class="tok-cm">$1</span>');
    return (
      <span key={i} className="flex gap-4">
        <span className="select-none text-right" style={{ color: 'rgba(255,255,255,0.2)', minWidth: '2rem', fontSize: '10px' }}>{i + 1}</span>
        <span dangerouslySetInnerHTML={{ __html: colored }} />{'\n'}
      </span>
    );
  });
}

export default function PipelinePage() {
  const [prompt,      setPrompt]      = useState('');
  const [running,     setRunning]     = useState(false);
  const [progress,    setProgress]    = useState(null);
  const [result,      setResult]      = useState(null);
  const [history,     setHistory]     = useState([]);
  const [showCode,    setShowCode]    = useState(false);
  const [showLog,     setShowLog]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    api.get('/pipeline').then(d => setHistory(d.pipelines)).catch(() => {});
  }, []);

  const run = async () => {
    if (!prompt.trim() || running) return;
    setRunning(true); setResult(null);
    setProgress({ step: 0, label: 'Starting pipeline…', percent: 5 });

    try {
      for await (const event of api.pipelineStream(prompt.trim())) {
        if (event.event === 'status') {
          setProgress({ step: event.step, label: event.label, percent: event.percent });
        }
        if (event.event === 'done') {
          setResult(event);
          setProgress({ step: 3, label: event.label, percent: 100 });
          api.get('/pipeline').then(d => setHistory(d.pipelines)).catch(() => {});
        }
        if (event.event === 'error') {
          setProgress(p => ({ ...p, label: `Error: ${event.label}`, failed: true }));
        }
      }
    } catch (err) {
      setProgress(p => ({ ...p, label: `Failed: ${err.message}`, failed: true }));
    }
    setRunning(false);
  };

  const loadHistory = async id => {
    const { pipeline } = await api.get(`/pipeline/${id}`);
    setResult({
      renderUrl: pipeline.renderPath ? `/output/renders/${pipeline.renderPath.split(/[\\/]/).pop()}` : null,
      bpyCode:   pipeline.bpyCode,
      log:       pipeline.log,
      success:   pipeline.status === 'done',
      meshPath:  pipeline.meshPath,
    });
    setProgress({ step: 3, label: pipeline.status === 'done' ? 'Done ✓' : 'Failed', percent: 100, failed: pipeline.status === 'failed' });
    setShowHistory(false);
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#07070c' }}>
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.18)', border: V_BORDER, boxShadow: '0 0 14px rgba(124,58,237,0.2)' }}>
                <Zap size={16} style={{ color: '#a78bfa' }} />
              </div>
              <h1 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>AI Pipeline</h1>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: V_BORDER }}>Level 5</span>
            </div>
            <p className="text-xs ml-11" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Text → 3D Mesh → Blender Script → Rendered Image
            </p>
          </div>
          <button onClick={() => setShowHistory(v => !v)} className="btn-outline text-xs gap-1.5">
            <History size={12} />History ({history.length})
          </button>
        </div>

        {/* History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <div className="rounded-xl overflow-hidden" style={{ border: BORDER }}>
                {!history.length && (
                  <p className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No runs yet</p>
                )}
                {history.map(p => (
                  <button key={p._id} onClick={() => loadHistory(p._id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-t4"
                    style={{ borderBottom: BORDER }}>
                    <span className="text-xs font-medium capitalize"
                      style={{ color: p.status === 'done' ? '#10b981' : p.status === 'failed' ? '#f43f5e' : '#a78bfa' }}>
                      {p.status}
                    </span>
                    <span className="text-sm flex-1 truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{p.prompt}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt */}
        <div className="rounded-xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
          <label className="label">Scene Description</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. a futuristic space station with solar panels, glowing engines, and docking bays"
            rows={3} disabled={running} className="field resize-none mb-4" />

          <AnimatePresence>
            {progress && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: progress.failed ? '#fca5a5' : 'rgba(255,255,255,0.6)' }}>
                    {progress.label}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{progress.percent}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full"
                    animate={{ width: `${progress.percent}%` }} transition={{ duration: 0.5 }}
                    style={{ background: progress.failed ? '#f43f5e' : 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <button onClick={run} disabled={!prompt.trim() || running} className="btn-primary gap-2">
              {running ? <><Loader2 size={14} className="animate-spin" />Running…</> : <><Zap size={14} />Run Pipeline</>}
            </button>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Takes 2–5 min · Needs Blender + Python installed
            </p>
          </div>
        </div>

        {/* Step indicators */}
        {progress && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {STEPS.map(step => {
              const done   = progress.step > step.id || (progress.step === step.id && progress.percent === 100 && !progress.failed);
              const active = progress.step === step.id && running;
              const failed = progress.failed && progress.step === step.id;
              return (
                <div key={step.id} className="rounded-xl p-3 transition-all"
                  style={{
                    background: done ? 'rgba(16,185,129,0.07)' : active ? 'rgba(124,58,237,0.1)' : failed ? 'rgba(244,63,94,0.07)' : 'rgba(255,255,255,0.03)',
                    border: done ? '1px solid rgba(16,185,129,0.25)' : active ? V_BORDER : failed ? '1px solid rgba(244,63,94,0.25)' : BORDER,
                  }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {done   ? <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                     : failed ? <XCircle size={12} style={{ color: '#f43f5e' }} />
                     : active ? <Loader2 size={12} style={{ color: '#a78bfa' }} className="animate-spin" />
                     : <step.icon size={12} style={{ color: 'rgba(255,255,255,0.28)' }} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: done ? '#10b981' : active ? '#a78bfa' : failed ? '#f43f5e' : 'rgba(255,255,255,0.28)' }}>
                      Step {step.id}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium leading-tight"
                    style={{ color: done || active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)' }}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* Render image */}
              {result.renderUrl && (
                <div className="rounded-xl overflow-hidden" style={{ border: V_BORDER }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: V_BORDER, background: 'rgba(124,58,237,0.06)' }}>
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#c4b5fd' }}>
                      <ImageIcon size={13} />Rendered Output
                    </div>
                    <a href={result.renderUrl} download className="btn-outline text-xs gap-1.5">
                      <Download size={11} />Download
                    </a>
                  </div>
                  <img src={result.renderUrl} alt="Render" className="w-full object-cover"
                    style={{ maxHeight: 480 }} onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}

              {/* 3D viewer */}
              {result.meshPath && (
                <div className="rounded-xl overflow-hidden" style={{ border: BORDER, background: 'rgba(255,255,255,0.03)' }}>
                  <div className="px-4 py-3 flex items-center gap-2 text-sm font-medium" style={{ borderBottom: BORDER, color: 'rgba(255,255,255,0.7)' }}>
                    <Box size={13} style={{ color: '#a78bfa' }} />3D Model Preview
                    <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>Drag to orbit · Scroll to zoom</span>
                  </div>
                  <div className="p-3">
                    <Suspense fallback={<div className="h-64 flex items-center justify-center rounded-xl" style={{ background: 'rgba(124,58,237,0.05)', border: BORDER }}><Loader2 size={16} className="animate-spin" style={{ color: '#7c3aed' }} /></div>}>
                      <ModelViewer objUrl={`/output/meshes/${result.meshPath.split(/[\\/]/).pop()}`} height="280px" />
                    </Suspense>
                  </div>
                </div>
              )}

              {/* bpy code */}
              {result.bpyCode && (
                <div className="rounded-xl overflow-hidden" style={{ border: BORDER }}>
                  <button onClick={() => setShowCode(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-t4"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <Code2 size={13} style={{ color: '#a78bfa' }} />Generated bpy Script
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>({result.bpyCode.split('\n').length} lines)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(result.bpyCode); }}
                        className="text-xs px-2 py-0.5 rounded cursor-pointer"
                        style={{ color: '#a78bfa', border: V_BORDER, background: 'rgba(124,58,237,0.08)' }}>Copy</span>
                      <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)', transform: showCode ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {showCode && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden" style={{ borderTop: BORDER }}>
                        <pre className="text-xs font-mono leading-relaxed p-4 overflow-x-auto max-h-96 whitespace-pre"
                          style={{ background: '#0a0a12', color: 'rgba(255,255,255,0.7)' }}>
                          <BpyHighlight code={result.bpyCode} />
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Log */}
              {result.log && (
                <div className="rounded-xl overflow-hidden" style={{ border: BORDER }}>
                  <button onClick={() => setShowLog(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-t4 text-sm font-medium"
                    style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)' }}>
                    Execution Log
                    <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)', transform: showLog ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
                  </button>
                  <AnimatePresence>
                    {showLog && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden" style={{ borderTop: BORDER }}>
                        <pre className="text-[11px] font-mono leading-relaxed p-4 max-h-48 overflow-y-auto"
                          style={{ background: '#05050a', color: '#86efac' }}>
                          {result.log}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!progress && !result && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: BORDER }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(124,58,237,0.12)', border: V_BORDER, boxShadow: '0 0 20px rgba(124,58,237,0.1)' }}>
              <Zap size={24} style={{ color: '#a78bfa' }} />
            </div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Full AI 3D Pipeline</h3>
            <p className="text-sm mb-6 max-w-sm mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Type a scene description and RealMind will automatically generate a 3D mesh, write a Blender script, execute it, and show the rendered result.
            </p>
            <div className="grid grid-cols-3 gap-3 text-left">
              {STEPS.map(s => (
                <div key={s.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
                  <s.icon size={14} style={{ color: '#7c3aed', marginBottom: 8 }} />
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</p>
                  <p className="text-[10px] leading-snug" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
