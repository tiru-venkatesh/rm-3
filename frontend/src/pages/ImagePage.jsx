import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Download, Trash2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';

const BORDER = '1px solid rgba(255,255,255,0.07)';
const V_BORDER = '1px solid rgba(124,58,237,0.2)';

export default function ImagePage() {
  const [prompt,  setPrompt]  = useState('');
  const [count,   setCount]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [images,  setImages]  = useState([]);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/image').then(d => setImages(d.images)).catch(() => {});
  }, []);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setError(''); setLoading(true);
    try {
      const { images: newImgs } = await api.post('/image/generate', { prompt: prompt.trim(), count });
      setImages(prev => [...newImgs, ...prev]);
      setPrompt('');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const remove = async id => {
    await api.delete(`/image/${id}`);
    setImages(prev => prev.filter(i => i._id !== id));
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* Left — controls */}
      <div className="w-72 flex-shrink-0 flex flex-col overflow-y-auto"
        style={{ background: '#0e0e15', borderRight: BORDER }}>
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: BORDER }}>
          <h2 className="text-sm font-semibold flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.85)' }}>
            <Sparkles size={14} style={{ color: '#a78bfa' }} />
            Image Generator
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Pollinations AI · Free · No API key needed
          </p>
        </div>

        <div className="px-4 py-4 space-y-4 flex-1">
          <div>
            <label className="label">Prompt</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your image in detail…"
              rows={5} className="field resize-none" />
          </div>

          <div>
            <label className="label">Count: {count}</label>
            <input type="range" min={1} max={4} value={count}
              onChange={e => setCount(+e.target.value)}
              className="w-full" style={{ accentColor: '#7c3aed' }} />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-lg"
              style={{ color: '#fca5a5', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button onClick={generate} disabled={!prompt.trim() || loading} className="btn-primary w-full">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {loading ? 'Generating…' : 'Generate'}
          </button>

          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Images are generated via Pollinations.ai
          </p>
        </div>
      </div>

      {/* Right — gallery */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading && (
          <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.08)', border: V_BORDER, color: '#a78bfa' }}>
            <Loader2 size={14} className="animate-spin flex-shrink-0" />
            <span className="text-sm">Generating {count} image{count > 1 ? 's' : ''}…</span>
          </div>
        )}

        {!images.length && !loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: BORDER }}>
              <ImageIcon size={20} style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Your generated images will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {images.map((img, idx) => (
                <motion.div key={img._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl overflow-hidden group"
                  style={{ background: 'rgba(255,255,255,0.03)', border: BORDER }}>
                  <div className="aspect-square relative overflow-hidden"
                    style={{ background: 'rgba(124,58,237,0.08)' }}>
                    <img src={img.url} alt={img.prompt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={e => { e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.2);font-size:12px">Load error</div>'; }} />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <a href={img.url} download={`realmind-${idx}.jpg`} target="_blank" rel="noreferrer"
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'rgba(124,58,237,0.8)' }}>
                        <Download size={13} className="text-white" />
                      </a>
                      <button onClick={() => remove(img._id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'rgba(244,63,94,0.8)' }}>
                        <Trash2 size={13} className="text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{img.prompt}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
