import { auth } from './firebase.js';

const BASE = 'https://rm-3.onrender.com/api';

async function getHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return {
    Authorization:  `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function req(method, path, body) {
  const headers = await getHeaders();
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  get:    (p)    => req('GET',    p),
  post:   (p, b) => req('POST',   p, b),
  patch:  (p, b) => req('PATCH',  p, b),
  delete: (p)    => req('DELETE', p),

  // Chat SSE stream — handles delta + attachment events
  async stream(path, body, onDelta, onAttachment, onDone) {
    const headers = await getHeaders();
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const reader = res.body.getReader();
    const dec    = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = dec.decode(value).split('\n').filter(l => l.startsWith('data:'));
      for (const line of lines) {
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(payload);
          if (parsed.delta)      onDelta(parsed.delta);
          if (parsed.attachment) onAttachment(parsed.attachment);
        } catch {}
      }
    }
    onDone();
  },

  // Pipeline SSE — async generator of events
  async *pipelineStream(prompt) {
    const headers = await getHeaders();
    const res = await fetch(`${BASE}/pipeline/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
    });
    const reader = res.body.getReader();
    const dec    = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = dec.decode(value).split('\n').filter(l => l.startsWith('data:'));
      for (const line of lines) {
        try { yield JSON.parse(line.slice(5).trim()); } catch {}
      }
    }
  },
};
