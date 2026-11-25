const norm = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}

function scoreForm(form, department, directoryDepartment, query) {
  const q = norm(query);
  const title = norm(form.name);
  if (title === q) return 1000;
  if (title.startsWith(q)) return 800;
  const titleWords = title.split(/[^a-z0-9]+/).filter(Boolean);
  if (!q.includes(' ') && titleWords.some((word) => word.startsWith(q))) return 650;
  if (title.includes(q)) return 500;
  const fields = [title, norm(form.aliases?.join(' ')), norm(form.keywords?.join(' ')), norm(form.description), norm(form.category), norm(department?.name), norm(directoryDepartment?.name)].filter(Boolean);
  const words = fields.join(' ').split(/[^a-z0-9]+/).filter(Boolean);
  if (!q.includes(' ') && words.some((word) => word === q)) return 420;
  if (fields.some((field) => field.includes(q))) return 300;
  const qWords = q.split(/\s+/).filter(Boolean);
  let best = 0;
  const titleTokens = title.split(/[^a-z0-9]+/).filter(Boolean);
  if (qWords.length > 1) {
    let matched = 0;
    for (const qWord of qWords) {
      if (titleTokens.some((word) => word === qWord || word.startsWith(qWord))) { matched++; continue; }
      const maxDistance = qWord.length >= 8 ? 2 : qWord.length >= 3 ? 1 : 0;
      if (maxDistance && titleTokens.some((word) => { const d = editDistance(qWord, word); return d > 0 && d <= maxDistance; })) matched++;
    }
    if (matched === qWords.length) return 240;
    if (matched > 0) best = 90 + matched * 12;
  }
  for (const field of fields) {
    for (const word of field.split(/[^a-z0-9]+/).filter(Boolean)) {
      const distance = editDistance(q, word);
      if (qWords.length === 1 && distance <= Math.max(1, Math.floor(q.length / 4))) best = Math.max(best, 180 - distance * 35);
    }
  }
  return best;
}

export function findForms(forms, departments, query, directoryDepartments = []) {
  if (!norm(query)) return [];
  return forms.map((form) => {
    const department = departments.find((d) => d.id === form.submitTo) || directoryDepartments.find((d) => d.id === form.directoryDepartmentId);
    return { form, department, score: scoreForm(form, departments.find((d) => d.id === form.submitTo), directoryDepartments.find((d) => d.id === form.directoryDepartmentId), query) };
  }).filter((item) => item.score >= 105).sort((a, b) => b.score - a.score || a.form.name.localeCompare(b.form.name));
}

export function highlight(text, query) {
  const safe = String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const q = String(query || '').trim();
  if (q.length < 2) return safe;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${escaped})`, 'ig'), '<mark>$1</mark>');
}

export function findDepartmentMatches(departments, query) {
  const q = norm(query);
  if (!q) return [];
  return departments.map((department) => {
    const name = norm(department.name);
    let score = name === q ? 1000 : name.startsWith(q) ? 800 : name.includes(q) ? 500 : 0;
    if (!score && q.length >= 4) {
      const words = name.split(/[^a-z0-9]+/).filter(Boolean);
      if (words.some((word) => editDistance(q, word) <= (q.length >= 8 ? 2 : 1))) score = 180;
    }
    return { department, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.department.name.localeCompare(b.department.name));
}
