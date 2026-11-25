const STORAGE_KEY = 'sfc-form-selection-counts-v1';

function readCounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([id, count]) => typeof id === 'string' && Number.isSafeInteger(count) && count > 0));
  } catch (_) { return {}; }
}

let counts = readCounts();
function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(counts)); } catch (_) {} }
export function recordSelection(id) { counts[id] = (counts[id] || 0) + 1; persist(); }
export function mostSelected(forms) {
  return forms.filter((form) => counts[form.id] > 0).sort((a, b) => counts[b.id] - counts[a.id] || a.name.localeCompare(b.name))[0] || null;
}
