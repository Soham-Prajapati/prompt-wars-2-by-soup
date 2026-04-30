// Centralised API client for ElectIQ backend
const API_BASE = import.meta.env.VITE_API_URL || 'https://electiq-api-965904724674.asia-south1.run.app';

function getSessionId() {
  const key = 'electiq_session_id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const created = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  window.localStorage.setItem(key, created)
  return created
}

async function parseApiError(res) {
  try {
    const data = await res.json()
    if (data?.detail) return `${data.detail} (HTTP ${res.status})`
  } catch (_) {
    // Ignore parse failures and fall back to status.
  }
  return `HTTP ${res.status}`
}

export async function chatStream(payload, onChunk, onSources, onDone, onError) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await parseApiError(res));
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === 'text') onChunk(parsed.content);
          else if (parsed.type === 'sources') onSources(parsed.sources);
          else if (parsed.type === 'done') onDone();
          else if (parsed.type === 'error') onError(parsed.content);
        } catch (_) {}
      }
    }
    onDone();
  } catch (err) {
    onError(err.message);
  }
}

export async function trackEvent(event_name, props = {}) {
  try {
    await fetch(`${API_BASE}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name,
        session_id: getSessionId(),
        page: window.location.pathname,
        props,
      }),
    })
  } catch (_) {
    // Telemetry should never block user workflows.
  }
}

export async function factCheck(text, language = 'English') {
  const res = await fetch(`${API_BASE}/factcheck`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function getTimeline() {
  const res = await fetch(`${API_BASE}/timeline`);
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function getEvmData() {
  const res = await fetch(`${API_BASE}/evm-data`);
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function getQuiz(topic) {
  const res = await fetch(`${API_BASE}/quiz/${encodeURIComponent(topic)}`);
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function getPromises(q = '') {
  const res = await fetch(`${API_BASE}/accountability/promises?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function getAccountabilityReports() {
  const res = await fetch(`${API_BASE}/accountability/reports`);
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function submitAccountabilityReport(formData) {
  const res = await fetch(`${API_BASE}/accountability/submit`, {
    method: 'POST',
    body: formData, // multipart/form-data
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
  return res.json();
}

// Client-side EXIF stripping via Canvas API
export function stripExif(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        resolve(new File([blob], `upload_${Date.now()}.jpg`, { type: 'image/jpeg' }));
        URL.revokeObjectURL(img.src);
      }, 'image/jpeg', 0.85);
    };
    img.src = URL.createObjectURL(file)
  })
}

// Aliases used by pages
export const getReports = getAccountabilityReports
export const submitReport = submitAccountabilityReport
