import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Sparkles, Loader2, Box, Sun, Camera, Code2, ChevronDown, Trash2, Edit2, Check, X } from 'lucide-react';
import { api } from '../services/api.js';

const BORDER   = '1px solid rgba(255,255,255,0.07)';
const V_BORDER = '1px solid rgba(124,58,237,0.2)';

const EXAMPLES = [
  'A futuristic space station with rotating rings and solar panels',
  'A medieval stone castle at night with torches and fog',
  'A sci-fi underground laboratory with holographic displays',
];

function BpyHighlight({ code }) {
  if (!code) return <span style={{ color: 'rgba(255,255,255,0.25)' }}>No code generated.</span>;
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

function CollapsibleSection({ title, icon: Icon, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-t4"
        style={{ borderBottom: open ? BORDER : 'none' }}>
        <Icon size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
        <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{title}</span>
        {count !== undefined && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>{count}</span>
        )}
        <motion.div className="ml-auto" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ObjectCard({ object, index, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [name,    setName]    = useState(object.name || `Object ${index + 1}`);

  const save = () => { onUpdate({ name }); setEditing(false); };

  const MCOLORS = { metal: '#94a3b8', wood: '#92400e', glass: '#7dd3fc', concrete: '#9ca3af', plastic: '#c084fc', emission: '#fde68a' };
  const mc = MCOLORS[object.material?.type?.toLowerCase()] || '#7c3aed';

  return (
    <div className="rounded-xl overflow-hidden mt-2" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${mc}20`, border: `1px solid ${mc}40` }}>
          <Box size={12} style={{ color: mc }} />
        </div>
        <div className="flex-1 min-w-0">
          {editing
            ? <input value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                className="field text-xs py-0.5 px-2 h-6 w-full" autoFocus />
            : <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>{name}</p>
          }
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{object.primitive || 'MESH'} · {object.material?.type || 'default'}</p>
        </div>
        <div className="flex items-center gap-1">
          {editing
            ? <><button onClick={save} className="p-1 rounded hover:bg-t4" style={{ color: '#10b981' }}><Check size={11} /></button>
                <button onClick={() => setEditing(false)} className="p-1 rounded hover:bg-t4" style={{ color: 'rgba(255,255,255,0.3)' }}><X size={11} /></button></>
            : <><button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-t4 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}><Edit2 size={11} /></button>
                <button onClick={onDelete} className="p-1 rounded hover:bg-t4 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.color='#f43f5e'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.3)'}><Trash2 size={11} /></button>
                <button onClick={() => setOpen(v => !v)} className="p-1 rounded hover:bg-t4 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <ChevronDown size={11} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
                </button></>
          }
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-1 grid grid-cols-2 gap-2" style={{ borderTop: BORDER }}>
          {[
            { label: 'Position',  value: (object.position || [0,0,0]).join(', ') },
            { label: 'Scale',     value: (object.scale    || [1,1,1]).join(', ') },
            { label: 'Roughness', value: object.material?.roughness ?? 0.5 },
            { label: 'Metallic',  value: object.material?.metallic  ?? 0 },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
              <p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{String(value)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScenePlannerPage() {
  const [prompt,     setPrompt]     = useState('');
  const [blueprint,  setBlueprint]  = useState(null);
  const [bpyCode,    setBpyCode]    = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress,   setProgress]   = useState(null);
  const [activeTab,  setActiveTab]  = useState('blueprint');

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true); setBlueprint(null); setBpyCode('');
    setProgress({ label: 'Analyzing prompt…', pct: 10 });

    try {
      setProgress({ label: 'Generating scene blueprint…', pct: 45 });
      const data = await api.post('/scene/blueprint', { prompt: prompt.trim() });
      setProgress({ label: 'Building bpy script…', pct: 80 });
      await new Promise(r => setTimeout(r, 400));
      setBlueprint(data.blueprint);
      setBpyCode(data.bpyCode || '');
      setProgress({ label: 'Done ✓', pct: 100 });
      setTimeout(() => setProgress(null), 1200);
    } catch (err) {
      setProgress({ label: `Error: ${err.message}`, pct: 0, error: true });
      setTimeout(() => setProgress(null), 3000);
    }
    setGenerating(false);
  };

  const updateObject = (idx, updates) => {
    setBlueprint(prev => {
      const objects = [...prev.objects];
      objects[idx] = { ...objects[idx], ...updates };
      return { ...prev, objects };
    });
  };

  const deleteObject = idx => {
    setBlueprint(prev => ({ ...prev, objects: prev.objects.filter((_, i) => i !== idx) }));
  };

  const TABS = [
    { id: 'blueprint', icon: Layers, label: 'Blueprint' },
    { id: 'code',      icon: Code2,  label: 'bpy Script' },
  ];

  return (
    <div className="flex h-full overflow-hidden">

      {/* Left panel */}
      <div className="w-80 flex-shrink-0 flex flex-col h-full" style={{ background: '#0e0e15', borderRight: BORDER }}>
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: BORDER }}>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={15} style={{ color: '#a78bfa' }} />
            <h1 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Scene Planner</h1>
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: V_BORDER }}>AI</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Describe scene → get blueprint + bpy script</p>
        </div>

        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: BORDER }}>
          <label className="label">Scene Description</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate(); }}
            placeholder="Describe your 3D scene in detail…"
            rows={4} className="field resize-none mb-3" />

          <AnimatePresence>
            {progress && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: progress.error ? '#fca5a5' : 'rgba(255,255,255,0.55)' }}>{progress.label}</span>
                  <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>{progress.pct}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full"
                    animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.4 }}
                    style={{ background: progress.error ? '#f43f5e' : 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={generate} disabled={!prompt.trim() || generating} className="btn-primary w-full">
            {generating ? <><Loader2 size={13} className="animate-spin" />Generating…</> : <><Sparkles size={13} />Generate Blueprint</>}
          </button>
          <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.22)' }}>⌘ + Enter to generate</p>
        </div>

        {/* Examples */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: BORDER }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Examples</p>
          <div className="space-y-1.5">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setPrompt(ex)}
                className="w-full text-left text-xs px-2.5 py-2 rounded-lg transition-colors leading-snug"
                style={{ background: 'rgba(255,255,255,0.03)', border: BORDER, color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Scene hierarchy */}
        <div className="flex-1 overflow-y-auto py-2">
          {blueprint ? (
            <div>
              <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2"
                style={{ color: 'rgba(255,255,255,0.28)' }}>
                <Layers size={10} />Scene Hierarchy
              </p>
              {[
                { label: 'Objects', icon: Box,    items: blueprint.objects || [], color: '#7c3aed' },
                { label: 'Lights',  icon: Sun,    items: blueprint.lights  || [], color: '#fbbf24' },
                { label: 'Camera',  icon: Camera, items: blueprint.camera ? [blueprint.camera] : [], color: '#a78bfa' },
              ].map(({ label, icon: Icon, items, color }) => (
                <div key={label}>
                  <div className="px-4 py-1.5 flex items-center gap-2">
                    <Icon size={10} style={{ color }} />
                    <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                    <span className="ml-auto text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>{items.length}</span>
                  </div>
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-6 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, opacity: 0.7 }} />
                      <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {item.name || item.type || `${label.slice(0,-1)} ${i+1}`}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-3">
              <Box size={22} style={{ color: 'rgba(124,58,237,0.3)' }} />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Scene objects appear here after generation</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 flex-shrink-0"
          style={{ borderBottom: BORDER, background: '#0e0e15', height: '48px' }}>
          {TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={activeTab === id
                ? { background: 'rgba(124,58,237,0.12)', border: V_BORDER, color: '#c4b5fd' }
                : { color: 'rgba(255,255,255,0.35)' }}>
              <Icon size={12} />{label}
            </button>
          ))}
          {blueprint && (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {blueprint.objects?.length || 0} obj · {blueprint.lights?.length || 0} lights
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">

          {/* Empty */}
          {!blueprint && !generating && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.1)', border: V_BORDER, boxShadow: '0 0 20px rgba(124,58,237,0.1)' }}>
                <Layers size={26} style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>No blueprint yet</h3>
                <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Enter a scene description and click Generate. RealMind will create a structured blueprint with objects, lighting, camera, and a ready-to-run bpy script.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2 w-full max-w-md">
                {[{ icon: Box, label: 'Objects' }, { icon: Sun, label: 'Lighting' }, { icon: Camera, label: 'Camera' }].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
                    <Icon size={14} style={{ color: '#7c3aed', margin: '0 auto 6px' }} />
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skeleton loading */}
          {generating && !blueprint && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {[1,2,3].map(i => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: 'rgba(124,58,237,0.12)' }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: '60%' }} />
                      <div className="h-2.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', width: '40%' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3].map(j => <div key={j} className="h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Blueprint tab */}
          <AnimatePresence mode="wait">
            {blueprint && activeTab === 'blueprint' && (
              <motion.div key="bp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto space-y-4">

                {/* Scene info */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={13} style={{ color: '#a78bfa' }} />
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Scene</span>
                    <span className="ml-auto text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{blueprint.render?.engine || 'CYCLES'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Background', value: blueprint.scene?.background || '#000000' },
                      { label: 'Resolution', value: `${blueprint.render?.resolution?.[0] || 1920}×${blueprint.render?.resolution?.[1] || 1080}` },
                      { label: 'Samples',    value: blueprint.render?.samples || 256 },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
                        <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>{label}</p>
                        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.75)' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Objects */}
                <CollapsibleSection title="Objects" icon={Box} count={blueprint.objects?.length} defaultOpen>
                  <div className="space-y-1 pt-1">
                    {blueprint.objects?.map((obj, i) => (
                      <ObjectCard key={i} index={i} object={obj}
                        onUpdate={u => updateObject(i, u)} onDelete={() => deleteObject(i)} />
                    ))}
                    {!blueprint.objects?.length && <p className="text-xs text-center py-3" style={{ color: 'rgba(255,255,255,0.28)' }}>No objects</p>}
                  </div>
                </CollapsibleSection>

                {/* Lights */}
                <CollapsibleSection title="Lighting" icon={Sun} count={blueprint.lights?.length}>
                  <div className="space-y-2 pt-1">
                    {blueprint.lights?.map((light, i) => (
                      <div key={i} className="rounded-lg p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
                        <Sun size={12} style={{ color: '#fbbf24', flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>{light.name || `Light ${i+1}`}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{light.type} · strength {light.strength || 1}</p>
                        </div>
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: light.color || '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }} />
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Camera */}
                <CollapsibleSection title="Camera" icon={Camera}>
                  <div className="rounded-lg p-3 mt-2 grid grid-cols-2 gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
                    {[
                      { label: 'Type',     value: blueprint.camera?.type || 'PERSP' },
                      { label: 'FOV',      value: `${blueprint.camera?.fov || 50}°` },
                      { label: 'Position', value: (blueprint.camera?.position || [4,3,6]).join(', ') },
                      { label: 'DOF',      value: blueprint.camera?.dof ? 'ON' : 'OFF' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
                        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </motion.div>
            )}

            {/* bpy code tab */}
            {blueprint && activeTab === 'code' && (
              <motion.div key="code" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className="max-w-4xl mx-auto">
                <div className="rounded-xl overflow-hidden" style={{ border: BORDER }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: BORDER, background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      <Code2 size={13} style={{ color: '#a78bfa' }} />
                      <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Generated bpy Script</span>
                      <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>({bpyCode.split('\n').length} lines)</span>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(bpyCode)}
                      className="text-xs px-2.5 py-1 rounded"
                      style={{ color: '#a78bfa', border: V_BORDER, background: 'rgba(124,58,237,0.08)' }}>
                      Copy
                    </button>
                  </div>
                  <pre className="text-xs font-mono leading-relaxed p-5 overflow-x-auto whitespace-pre"
                    style={{ background: '#0a0a12', color: 'rgba(255,255,255,0.7)' }}>
                    <BpyHighlight code={bpyCode} />
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
