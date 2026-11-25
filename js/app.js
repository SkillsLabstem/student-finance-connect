import { findForms, findDepartmentMatches, highlight } from './modules/search.js';
import { recordSelection, mostSelected } from './modules/popularity.js';
import { populateDepartmentSelector, renderDepartmentForms } from './modules/departments.js';

(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const state = { data: null, visibleResults: 6, activeResult: -1 };
  const deptById = (id) => state.data.departments.find((d) => d.id === id);
  const localFormUrl = (form) => `assets/forms/${encodeURIComponent(form.fileName || `${form.id}.pdf`)}`;

  fetch('data/catalog.json').then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }).then((data) => {
    state.data = data; init();
  }).catch((error) => {
    $('main').insertAdjacentHTML('afterbegin', `<div class="wrap"><p class="notice">Could not load the catalogue (${esc(error.message)}). Run a local server, for example <code>python -m http.server</code>.</p></div>`);
  });

  function init() {
    renderStats(); initFormDirectory(); renderDepartments(); renderFaculties(); renderFaq(); renderPopular(); bindEvents(); renderSearch();
  }
  function renderStats() {
    const d = state.data;
    $('stats').innerHTML = [[d.forms.length, 'Forms'], [d.departments.length, 'Departments'], [d.faculties.length, 'Faculties & colleges'], [d.guidance.length, 'Help topics']].map(([n, label]) => `<div class="stat"><b>${n}</b>${esc(label)}</div>`).join('');
  }
  function formRow(form, query = '') {
    const department = deptById(form.submitTo);
    const directoryDepartment = state.data.formDepartments.find((item) => item.id === form.directoryDepartmentId);
    return `<article class="form-row"><div><h3>${highlight(form.name, query)}</h3><p>${esc(form.description || '')}</p><small>${directoryDepartment ? esc(directoryDepartment.name) : department ? esc(department.name) : 'Department not specified'}${form.category ? ` · ${esc(form.category)}` : ''}</small></div><button class="btn" data-form="${esc(form.id)}">View details</button></article>`;
  }
  function initFormDirectory() {
    const selector = $('formDepartment');
    populateDepartmentSelector(state.data.formDepartments, selector);
    renderForms();
    selector.addEventListener('change', renderForms);
  }
  function renderForms() {
    const visibleData = { ...state.data, forms: state.data.forms.filter((form) => form.id !== 'general-request') };
    renderDepartmentForms(visibleData, $('formDepartment').value, esc, (form) => formRow(form));
  }
  function contactRows(department) {
    return `<dt>Email</dt><dd>${department.email ? `<a href="mailto:${esc(department.email)}">${esc(department.email)}</a>` : 'To be confirmed'}</dd><dt>Phone</dt><dd>${department.phone ? `<a href="tel:${esc(department.phone.replace(/[^\d+]/g, ''))}">${esc(department.phone)}</a>` : 'To be confirmed'}</dd><dt>Location</dt><dd>${esc(department.location)}</dd><dt>Hours</dt><dd>${esc(department.hours)}</dd>`;
  }
  function renderDepartments() {
    $('deptGrid').innerHTML = state.data.departments.map((d) => `<article class="card"><h3>${esc(d.name)}</h3><p>${esc(d.role)}</p><dl>${contactRows(d)}</dl>${d.verified ? '' : '<span class="tag warn">Contact details to be confirmed</span>'}</article>`).join('');
  }
  function renderFaculties() {
    const q = $('facultyFilter').value.toLowerCase().trim();
    const faculties = state.data.faculties.filter((f) => [f.name, f.abbr, f.type, f.description].join(' ').toLowerCase().includes(q));
    $('facultyGrid').innerHTML = faculties.length ? faculties.map((f) => `<article class="card"><span class="tag">${esc(f.type)}</span><h3>${esc(f.name)} (${esc(f.abbr)})</h3><p>${esc(f.description)}</p>${f.verified === false ? '<span class="tag warn">Unverified: confirm before use</span>' : ''}</article>`).join('') : '<p class="empty">No faculties match your search.</p>';
  }
  function renderFaq() {
    $('faq').innerHTML = state.data.guidance.map((g) => `<details><summary>${esc(g.q)}</summary><p>${esc(g.a)}</p><ol>${g.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>${g.verified === false ? '<span class="tag warn">Unverified guidance: confirm before use</span>' : ''}</details>`).join('');
  }
  let lastFocus = null;
  function openForm(id, fromSearch = false) {
    const form = state.data.forms.find((item) => item.id === id); if (!form) return;
    if (fromSearch) { recordSelection(form.id); renderPopular(); }
    const department = deptById(form.submitTo);
    const directoryDepartment = state.data.formDepartments.find((item) => item.id === form.directoryDepartmentId);
    $('modalBody').innerHTML = `<h3 id="modalTitle">${esc(form.name)}</h3><span class="tag">${esc(form.category)}</span><p>${esc(form.description)}</p>${form.timeFrame ? `<p><strong>Application period:</strong> ${esc(form.timeFrame)}</p>` : ''}${form.requirements?.length ? `<h4>What you need</h4><ul>${form.requirements.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : '<p>Read the official form for its current requirements and instructions.</p>'}<h4>How to submit</h4><p>${esc(form.method)}</p>${form.notes ? `<p><em>${esc(form.notes)}</em></p>` : ''}${department ? `<h4>Submit to: ${esc(department.name)}</h4><dl>${contactRows(department)}</dl>` : directoryDepartment ? `<p><strong>Directory department:</strong> ${esc(directoryDepartment.name)}. Confirm submission instructions in the official form.</p>` : '<p><strong>Responsible department:</strong> Not specified in the current catalogue.</p>'}<p class="notice">Verify this information with official UTech, Jamaica sources before submitting.</p><div class="actions"><button class="btn" id="copyBtn">Copy checklist</button>${form.sourceUrl ? `<a class="btn ghost" href="${esc(localFormUrl(form))}" download>Download PDF</a><a class="btn ghost" href="${esc(form.sourceUrl)}" target="_blank" rel="noopener noreferrer">View official source</a>` : ''}<button class="btn ghost" id="printBtn">Print</button></div><p id="copyMsg" aria-live="polite"></p>`;
    lastFocus = document.activeElement; $('modal').hidden = false; $('modalClose').focus();
    $('copyBtn').onclick = () => copy(`${form.name}\nSubmit to: ${department?.name || 'Not specified'}\nMethod: ${form.method}\nChecklist:\n${(form.requirements || []).map((r) => `- ${r}`).join('\n')}`).then(() => { $('copyMsg').textContent = 'Checklist copied.'; }, () => { $('copyMsg').textContent = 'Copy failed. Please select the text manually.'; });
    $('printBtn').onclick = () => window.print();
  }
  function closeModal() { $('modal').hidden = true; lastFocus?.focus(); }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => { const area = document.createElement('textarea'); area.value = text; document.body.appendChild(area); area.select(); try { document.execCommand('copy') ? resolve() : reject(); } catch (error) { reject(error); } area.remove(); });
  }
  function renderPopular() {
    const form = mostSelected(state.data.forms.filter((form) => form.id !== 'general-request'));
    $('popularForm').innerHTML = form ? `<h2>Most searched form <small>(on this browser)</small></h2>${formRow(form)}<p class="privacy-note">Based on selections saved on this browser only. Counts are not shared across visitors.</p>` : '<h2>Start with a form</h2><p>No search selections have been recorded on this browser yet. Search above or browse all forms below.</p>';
  }
  function renderSearch() {
    const query = $('globalSearch').value.trim(), box = $('searchResults');
    $('popularForm').hidden = Boolean(query);
    state.activeResult = -1; $('clearSearch').hidden = !query;
    if (!query) { box.innerHTML = ''; box.hidden = true; return; }
    if (query.length < 2) { box.innerHTML = '<p class="empty">Type at least two characters to see form suggestions.</p>'; box.hidden = false; return; }
    const matches = findForms(state.data.forms.filter((form) => form.id !== 'general-request'), state.data.departments, query, state.data.formDepartments).map((item) => ({ ...item, type: 'form' }));
    const q = query.toLowerCase();
    const otherMatches = [
      ...findDepartmentMatches(state.data.formDepartments, query).map(({ department }) => ({ title: department.name, subtitle: 'Forms department', departmentId: department.id, type: 'department' })),
      ...state.data.departments.filter((item) => [item.name, item.role].join(' ').toLowerCase().includes(q)).map((item) => ({ title: item.name, subtitle: 'Department contacts', target: 'departments', type: 'section' })),
      ...state.data.faculties.filter((item) => [item.name, item.abbr, item.description].join(' ').toLowerCase().includes(q)).map((item) => ({ title: item.name, subtitle: 'Faculties & colleges', target: 'faculties', type: 'section' })),
      ...state.data.guidance.filter((item) => [item.q, item.a, item.steps.join(' ')].join(' ').toLowerCase().includes(q)).map((item) => ({ title: item.q, subtitle: 'Help and guidance', target: 'help', type: 'section' }))
    ];
    const combined = [...matches, ...otherMatches];
    if (!combined.length) { box.innerHTML = '<p class="empty">No matching forms or help found. Try a shorter term or browse by department.</p>'; box.hidden = false; return; }
    const shown = combined.slice(0, state.visibleResults);
    box.innerHTML = `<div class="suggestion-list" role="listbox" aria-label="Form and help suggestions">${shown.map((item, index) => {
      const title = item.type === 'form' ? item.form.name : item.title;
      const subtitle = item.type === 'form' ? `${item.department ? esc(item.department.name) : 'Department not specified'} · ${esc(item.form.description || '')}` : item.subtitle;
      const attrs = item.type === 'form' ? `data-form="${esc(item.form.id)}"` : item.type === 'department' ? `data-form-department="${esc(item.departmentId)}"` : `data-section="${esc(item.target)}"`;
      return `<button class="result" role="option" aria-selected="false" id="suggestion-${index}" ${attrs}><span>${highlight(title, query)}</span><small>${subtitle}</small></button>`;
    }).join('')}</div>${combined.length > shown.length ? `<button class="show-more" id="showMore">Show ${Math.min(6, combined.length - shown.length)} more results</button>` : ''}`;
    box.hidden = false;
    $('showMore')?.addEventListener('click', () => { state.visibleResults += 6; renderSearch(); });
  }
  function bindEvents() {
    $('facultyFilter').addEventListener('input', renderFaculties);
    $('formsGrid').addEventListener('click', (event) => { const button = event.target.closest('[data-form]'); if (button) openForm(button.dataset.form); });
    $('popularForm').addEventListener('click', (event) => { const button = event.target.closest('[data-form]'); if (button) openForm(button.dataset.form); });
    $('globalSearch').addEventListener('input', () => { state.visibleResults = 6; renderSearch(); });
    $('globalSearch').addEventListener('keydown', (event) => {
      const options = [...$('searchResults').querySelectorAll('.result')];
      if (event.key === 'ArrowDown' && options.length) { event.preventDefault(); state.activeResult = (state.activeResult + 1) % options.length; options[state.activeResult].focus(); }
      if (event.key === 'Escape') { $('globalSearch').value = ''; renderSearch(); }
    });
    $('searchResults').addEventListener('keydown', (event) => {
      const options = [...$('searchResults').querySelectorAll('.result')], index = options.indexOf(document.activeElement);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); options[(index + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length]?.focus(); }
      if (event.key === 'Escape') { $('globalSearch').focus(); $('globalSearch').value = ''; renderSearch(); }
      if (event.key === 'Enter' && document.activeElement.matches('.result')) { event.preventDefault(); document.activeElement.click(); }
    });
    $('searchResults').addEventListener('click', (event) => { const button = event.target.closest('.result'); if (!button) return; if (button.dataset.form) openForm(button.dataset.form, true); else if (button.dataset.formDepartment) { $('formDepartment').value = button.dataset.formDepartment; renderForms(); $('forms').scrollIntoView({ behavior: 'smooth' }); } else if (button.dataset.section) document.getElementById(button.dataset.section)?.scrollIntoView({ behavior: 'smooth' }); });
    $('clearSearch').addEventListener('click', () => { $('globalSearch').value = ''; renderSearch(); $('globalSearch').focus(); });
    $('modalClose').addEventListener('click', closeModal); $('modal').addEventListener('click', (event) => { if (event.target === $('modal')) closeModal(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('modal').hidden) closeModal(); });
    const nav = $('nav'); $('menuBtn').addEventListener('click', function () { const open = nav.classList.toggle('open'); this.setAttribute('aria-expanded', open); });
    nav.addEventListener('click', (event) => { if (event.target.tagName === 'A') { nav.classList.remove('open'); $('menuBtn').setAttribute('aria-expanded', 'false'); } });
  }
  function setTheme(theme) { document.documentElement.setAttribute('data-theme', theme); $('themeBtn').textContent = theme === 'dark' ? 'Light' : 'Dark'; try { localStorage.setItem('sfc-theme', theme); } catch (_) {} }
  let savedTheme = null; try { savedTheme = localStorage.getItem('sfc-theme'); } catch (_) {}
  setTheme(savedTheme || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
})();
