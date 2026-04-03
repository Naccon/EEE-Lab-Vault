/**
 * EEE Lab Vault — script.js
 * BAUST Khulna | Department of EEE
 *
 * Features:
 *  - Full CRUD for lab reports (localStorage)
 *  - Category filter, search, sort
 *  - Academic settings (student/teacher info)
 *  - PDF export (print-based)
 *  - DOCX export (HTML blob)
 *  - Local file system browser (File System Access API)
 *  - Auto-save draft
 *  - Toast notifications
 */

'use strict';

// ================================================================
//  CONSTANTS & STATE
// ================================================================

const STORAGE_KEY   = 'eee_lab_reports';
const SETTINGS_KEY  = 'eee_lab_settings';
const DRAFT_KEY     = 'eee_lab_draft';

const SUBJECT_CODES = {
  'Circuit Analysis'  : 'EEE-211',
  'Electronics I'     : 'EEE-213',
  'Power Systems'     : 'EEE-215',
  'Signals & Systems' : 'EEE-217',
  'Programming Lab'   : 'CSE-219',
  'Engineering Math'  : 'MATH-211',
};

let allReports      = [];   // master data array
let currentFilter   = 'all';
let currentSort     = 'date';
let currentViewId   = null; // report ID open in viewer
let deleteTargetId  = null; // pending delete
let draftTimer      = null; // auto-save timer handle
let localFolderHandle = null; // File System API handle

// ================================================================
//  INIT
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadReports();
  loadSettings();
  applySettings();
  renderReports();
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  // Restore draft indicator if draft exists
  const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  if (draft) {
    showToast('💾 Unsaved draft found — click "+ New Report" to resume.', 'warning');
  }
});

// ================================================================
//  STORAGE HELPERS
// ================================================================

function loadReports() {
  try {
    allReports = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    allReports = [];
  }
}

function saveReports() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allReports));
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSettingsData(data) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}

// ================================================================
//  TOAST NOTIFICATION
// ================================================================

let toastTimer = null;
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 3200);
}

// ================================================================
//  SETTINGS MODAL
// ================================================================

function openSettingsModal() {
  const s = loadSettings();
  document.getElementById('s_studentName').value = s.studentName || '';
  document.getElementById('s_studentId').value   = s.studentId   || '';
  document.getElementById('s_batch').value       = s.batch       || '2nd';
  document.getElementById('s_yearSem').value     = s.yearSem     || '2nd Year 1st Semester';
  document.getElementById('s_teacherName').value = s.teacherName || '';
  document.getElementById('s_teacherDes').value  = s.teacherDes  || 'Assistant Professor';
  document.getElementById('s_dept').value        = s.dept        || 'EEE';
  openModal('settingsModal');
}

function closeSettingsModal() {
  closeModal('settingsModal');
}

function saveSettings() {
  const s = {
    studentName : document.getElementById('s_studentName').value.trim(),
    studentId   : document.getElementById('s_studentId').value.trim(),
    batch       : document.getElementById('s_batch').value.trim(),
    yearSem     : document.getElementById('s_yearSem').value.trim(),
    teacherName : document.getElementById('s_teacherName').value.trim(),
    teacherDes  : document.getElementById('s_teacherDes').value.trim(),
    dept        : document.getElementById('s_dept').value.trim(),
  };
  if (!s.studentName) { showToast('Student name is required.', 'error'); return; }
  saveSettingsData(s);
  applySettings();
  closeSettingsModal();
  showToast('✔ Settings saved.', 'success');
}

function applySettings() {
  const s = loadSettings();
  if (s.studentName) {
    document.getElementById('heroStudentName').textContent = s.yearSem || '2nd Year, 1st Semester';
    document.getElementById('footerName').textContent = s.studentName + ' // EEE';
  }
}

// ================================================================
//  PUBLISH MODAL
// ================================================================

function openPublishModal(editId = null) {
  const modal = document.getElementById('publishModal');

  if (editId) {
    // EDIT mode
    const r = allReports.find(x => x.id === editId);
    if (!r) return;
    document.getElementById('modalTitle').textContent = '// Edit Lab Report';
    document.getElementById('editReportId').value  = r.id;
    document.getElementById('f_category').value    = r.category    || '';
    document.getElementById('f_subjectCode').value = r.subjectCode || '';
    document.getElementById('f_title').value       = r.title       || '';
    document.getElementById('f_expNo').value       = r.expNo       || '';
    document.getElementById('f_date').value        = r.date        || '';
    document.getElementById('f_teacherName').value = r.teacherName || '';
    document.getElementById('f_teacherDes').value  = r.teacherDes  || '';
    document.getElementById('f_objective').value   = r.objective   || '';
    document.getElementById('f_theory').value      = r.theory      || '';
    document.getElementById('f_apparatus').value   = r.apparatus   || '';
    document.getElementById('f_data').value        = r.data        || '';
    document.getElementById('f_results').value     = r.results     || '';
    document.getElementById('f_conclusion').value  = r.conclusion  || '';
    document.getElementById('f_status').value      = r.status      || 'DONE';
    clearFormErrors();
  } else {
    // NEW mode — check for draft
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    document.getElementById('modalTitle').textContent = '// New Lab Report';
    document.getElementById('editReportId').value = '';
    if (draft) {
      populateFormFromObj(draft);
      showToast('📂 Draft restored.', 'warning');
    } else {
      clearForm();
      // Auto-fill from settings
      const s = loadSettings();
      if (s.teacherName) document.getElementById('f_teacherName').value = s.teacherName;
      if (s.teacherDes)  document.getElementById('f_teacherDes').value  = s.teacherDes;
      document.getElementById('f_date').value = new Date().toISOString().slice(0,10);
    }
  }
  openModal('publishModal');
  // Start auto-save draft every 20s
  clearInterval(draftTimer);
  draftTimer = setInterval(autoSaveDraft, 20000);
}

function closePublishModal() {
  clearInterval(draftTimer);
  closeModal('publishModal');
}

function clearForm() {
  ['f_category','f_subjectCode','f_title','f_expNo','f_date',
   'f_teacherName','f_teacherDes','f_objective','f_theory',
   'f_apparatus','f_data','f_results','f_conclusion'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('f_status').value = 'DONE';
  clearFormErrors();
}

function populateFormFromObj(obj) {
  const fields = ['category','subjectCode','title','expNo','date',
    'teacherName','teacherDes','objective','theory',
    'apparatus','data','results','conclusion','status'];
  fields.forEach(f => {
    const el = document.getElementById('f_' + f);
    if (el && obj[f] !== undefined) el.value = obj[f];
  });
}

function clearFormErrors() {
  document.querySelectorAll('#publishModal .error').forEach(el => el.classList.remove('error'));
}

// Auto-fill subject code when category changes
function updateSubjectCode() {
  const cat  = document.getElementById('f_category').value;
  const code = SUBJECT_CODES[cat] || '';
  const codeEl = document.getElementById('f_subjectCode');
  if (!codeEl.value || Object.values(SUBJECT_CODES).includes(codeEl.value)) {
    codeEl.value = code;
  }
}

// Auto-save draft to localStorage
function autoSaveDraft() {
  const editId = document.getElementById('editReportId').value;
  if (editId) return; // Don't draft-save edits
  const draft = collectFormData();
  if (draft.title || draft.objective) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }
}

function saveDraft() {
  autoSaveDraft();
  showToast('💾 Draft saved.', 'warning');
}

// ================================================================
//  FORM COLLECTION & VALIDATION
// ================================================================

function collectFormData() {
  return {
    category    : document.getElementById('f_category').value.trim(),
    subjectCode : document.getElementById('f_subjectCode').value.trim(),
    title       : document.getElementById('f_title').value.trim(),
    expNo       : document.getElementById('f_expNo').value.trim(),
    date        : document.getElementById('f_date').value,
    teacherName : document.getElementById('f_teacherName').value.trim(),
    teacherDes  : document.getElementById('f_teacherDes').value.trim(),
    objective   : document.getElementById('f_objective').value.trim(),
    theory      : document.getElementById('f_theory').value.trim(),
    apparatus   : document.getElementById('f_apparatus').value.trim(),
    data        : document.getElementById('f_data').value.trim(),
    results     : document.getElementById('f_results').value.trim(),
    conclusion  : document.getElementById('f_conclusion').value.trim(),
    status      : document.getElementById('f_status').value,
  };
}

function validateForm(data) {
  const required = {
    f_category  : data.category,
    f_title     : data.title,
    f_expNo     : data.expNo,
    f_date      : data.date,
    f_objective : data.objective,
    f_teacherName: data.teacherName,
  };
  let valid = true;
  clearFormErrors();
  for (const [id, val] of Object.entries(required)) {
    const el = document.getElementById(id);
    if (!val) {
      el.classList.add('error');
      el.focus();
      valid = false;
      break;
    }
  }
  return valid;
}

// ================================================================
//  CREATE / UPDATE REPORT
// ================================================================

function submitReport() {
  const data = collectFormData();
  if (!validateForm(data)) {
    showToast('⚠ Please fill in all required fields.', 'error');
    return;
  }

  const editId = document.getElementById('editReportId').value;

  if (editId) {
    // UPDATE existing
    const idx = allReports.findIndex(r => r.id === editId);
    if (idx !== -1) {
      allReports[idx] = { ...allReports[idx], ...data, updatedAt: Date.now() };
      showToast('✔ Report updated successfully.', 'success');
    }
  } else {
    // CREATE new
    const newReport = {
      id        : 'r_' + Date.now(),
      createdAt : Date.now(),
      updatedAt : Date.now(),
      ...data,
    };
    allReports.unshift(newReport);
    localStorage.removeItem(DRAFT_KEY); // clear draft on publish
    showToast('⚡ Report published!', 'success');
  }

  saveReports();
  clearInterval(draftTimer);
  closePublishModal();
  renderReports();

  // Refresh viewer if it's open
  if (currentViewId === editId) openReport(editId);
}

// ================================================================
//  DELETE REPORT
// ================================================================

function askDelete(id, title, event) {
  if (event) event.stopPropagation();
  deleteTargetId = id;
  document.getElementById('deleteReportTitle').textContent = title;
  openModal('deleteModal');
}

function confirmDelete() {
  if (!deleteTargetId) return;
  allReports = allReports.filter(r => r.id !== deleteTargetId);
  saveReports();
  closeModal('deleteModal');
  if (currentViewId === deleteTargetId) closeReport();
  deleteTargetId = null;
  renderReports();
  showToast('🗑 Report deleted.', 'error');
}

function deleteCurrentReport() {
  if (!currentViewId) return;
  const r = allReports.find(x => x.id === currentViewId);
  if (r) askDelete(r.id, r.title);
}

// ================================================================
//  RENDER REPORTS
// ================================================================

function renderReports() {
  updateStats();
  updateCategoryCounts();
  updateTopbarBadge();

  let list = [...allReports];

  // Filter by category
  if (currentFilter !== 'all') {
    list = list.filter(r => r.category === currentFilter);
  }

  // Filter by search
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  if (q) {
    list = list.filter(r =>
      (r.title       || '').toLowerCase().includes(q) ||
      (r.category    || '').toLowerCase().includes(q) ||
      (r.expNo       || '').toLowerCase().includes(q) ||
      (r.objective   || '').toLowerCase().includes(q)
    );
  }

  // Sort
  if (currentSort === 'date') {
    list.sort((a, b) => b.createdAt - a.createdAt);
  } else if (currentSort === 'subject') {
    list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  } else if (currentSort === 'done') {
    list = list.filter(r => r.status === 'DONE');
    list.sort((a, b) => b.createdAt - a.createdAt);
  } else if (currentSort === 'draft') {
    list = list.filter(r => r.status === 'DRAFT');
    list.sort((a, b) => b.createdAt - a.createdAt);
  }

  const grid  = document.getElementById('reportGrid');
  const empty = document.getElementById('emptyState');

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = list.map(r => renderCard(r)).join('');
  }
}

function renderCard(r) {
  const tagClass = 'tag-' + (r.category || 'default').toLowerCase().replace(/[^a-z0-9]/g, '-');
  const statusClass = r.status === 'DRAFT' ? 'status-draft' : 'status-done';
  const dateStr  = r.date ? new Date(r.date + 'T00:00:00').toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) : '—';
  const excerpt  = escapeHtml(r.objective || '').substring(0, 120) + (r.objective && r.objective.length > 120 ? '…' : '');

  return `
  <div class="report-card" onclick="openReport('${r.id}')">
    <div class="card-actions">
      <button class="card-action-btn" onclick="openPublishModal('${r.id}');event.stopPropagation()" title="Edit">✏</button>
      <button class="card-action-btn del" onclick="askDelete('${r.id}', '${escapeAttr(r.title)}', event)" title="Delete">🗑</button>
    </div>
    <div class="report-num">${escapeHtml(r.subjectCode || r.category || '')} // ${escapeHtml(r.expNo || '')}</div>
    <span class="card-tag ${tagClass}">${escapeHtml(r.category || '')}</span>
    <div class="report-title">${escapeHtml(r.title || 'Untitled Report')}</div>
    <div class="report-excerpt">${excerpt || '<em style="color:var(--muted)">No objective written.</em>'}</div>
    <div class="report-footer">
      <span class="report-date">${dateStr}</span>
      <span class="report-status ${statusClass}">${r.status || 'DONE'}</span>
    </div>
  </div>`;
}

// ================================================================
//  STATS & COUNTS
// ================================================================

function updateStats() {
  const total   = allReports.length;
  const done    = allReports.filter(r => r.status === 'DONE').length;
  const draft   = allReports.filter(r => r.status === 'DRAFT').length;
  const subjects = new Set(allReports.map(r => r.category).filter(Boolean)).size;
  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statSubjects').textContent = subjects;
  document.getElementById('statDone').textContent    = done;
  document.getElementById('statDraft').textContent   = draft;
}

function updateCategoryCounts() {
  const counts = {};
  allReports.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
  document.getElementById('count-all').textContent = allReports.length;

  ['Circuit Analysis','Electronics I','Power Systems',
   'Signals & Systems','Programming Lab','Engineering Math'].forEach(cat => {
    const el = document.getElementById('count-' + cat);
    if (el) el.textContent = counts[cat] || 0;
  });
}

function updateTopbarBadge() {
  document.getElementById('reportCountBadge').textContent = allReports.length + ' REPORTS';
}

// ================================================================
//  FILTER & SORT
// ================================================================

function filterCat(cat, el) {
  document.querySelectorAll('.cat-item').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentFilter = cat;
  document.getElementById('currentCatTitle').textContent = cat === 'all' ? 'All Reports' : cat;
  renderReports();
}

function sortReports(type, el) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentSort = type;
  renderReports();
}

function handleSearch(val) {
  renderReports();
}

// ================================================================
//  REPORT VIEWER
// ================================================================

function openReport(id) {
  const r = allReports.find(x => x.id === id);
  if (!r) return;
  currentViewId = id;

  document.getElementById('viewerCat').textContent   = r.category || 'Report';
  document.getElementById('viewerTitle').textContent  = r.title || 'Untitled';

  const dateStr = r.date
    ? new Date(r.date + 'T00:00:00').toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'})
    : '—';

  const s = loadSettings();

  const section = (title, content) => content ? `
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>` : '';

  document.getElementById('viewerContent').innerHTML = `
    <div class="report-header-block">
      <div class="report-header-meta">
        <span>${escapeHtml(r.subjectCode || r.category || '')}</span>
        <span>${escapeHtml(r.expNo || '')}</span>
        <span>DATE: ${dateStr}</span>
        <span class="report-status ${r.status === 'DRAFT' ? 'status-draft' : 'status-done'}">${r.status || 'DONE'}</span>
      </div>
      <div class="report-full-title">${escapeHtml(r.title || '')}</div>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:0.8rem;font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:var(--muted);">
        <span>👤 ${escapeHtml(s.studentName || 'Student')} | ${escapeHtml(s.studentId || '')}</span>
        <span>📚 ${escapeHtml(s.yearSem || '2nd Year 1st Semester')}</span>
        <span>👨‍🏫 ${escapeHtml(r.teacherName || '')} ${r.teacherDes ? '(' + escapeHtml(r.teacherDes) + ')' : ''}</span>
      </div>
    </div>
    <div class="report-body">
      ${section('1. Objective', r.objective)}
      ${section('2. Theory & Background', r.theory)}
      ${section('3. Apparatus / Equipment', r.apparatus)}
      ${section('4. Experimental Data / Observations', r.data)}
      ${section('5. Results & Discussion', r.results)}
      ${section('6. Conclusion', r.conclusion)}
    </div>`;

  document.getElementById('reportViewer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeReport() {
  document.getElementById('reportViewer').classList.remove('open');
  document.body.style.overflow = '';
  currentViewId = null;
}

function editCurrentReport() {
  if (!currentViewId) return;
  closeReport();
  setTimeout(() => openPublishModal(currentViewId), 100);
}

// ================================================================
//  EXPORT — PDF (print-based, academic layout)
// ================================================================

function exportCurrentPDF() {
  if (!currentViewId) return;
  const r = allReports.find(x => x.id === currentViewId);
  if (!r) return;
  exportPDF(r);
}

function exportPDF(r) {
  const s = loadSettings();
  const dateStr = r.date ? new Date(r.date + 'T00:00:00').toLocaleDateString('en-GB', {day:'2-digit', month:'long', year:'numeric'}) : '—';

  const section = (num, title, content) => content ? `
    <div class="section">
      <h2>${num}. ${title}</h2>
      <p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Lab Report — ${escapeHtml(r.title)}</title>
<style>
  @page { size: A4; margin: 25mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #111; background: #fff; }

  /* COVER PAGE */
  .cover { page-break-after: always; text-align: center; padding-top: 20mm; }
  .cover-uni { font-size: 13pt; font-weight: bold; letter-spacing: 0.03em; margin-bottom: 4mm; }
  .cover-dept { font-size: 11pt; color: #333; margin-bottom: 10mm; border-bottom: 2px solid #000; padding-bottom: 4mm; display: inline-block; padding-inline: 10mm; }
  .cover-big { font-size: 20pt; font-weight: bold; margin: 12mm 0 6mm; letter-spacing: 0.05em; text-decoration: underline; }
  .cover-table { width: 90%; margin: 8mm auto; border-collapse: collapse; text-align: left; }
  .cover-table td { padding: 4px 8px; font-size: 11pt; vertical-align: top; }
  .cover-table .label { font-weight: bold; white-space: nowrap; width: 40%; }
  .cover-table .colon { width: 5%; }
  .sub-section { width: 90%; margin: 8mm auto; }
  .sub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #333; }
  .sub-col { padding: 8px; border-right: 1px solid #333; }
  .sub-col:last-child { border-right: none; }
  .sub-col h3 { font-size: 11pt; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #aaa; padding-bottom: 3px; text-decoration: underline; }
  .sub-row { display: flex; gap: 6px; font-size: 10.5pt; margin-bottom: 4px; }
  .sub-label { font-weight: bold; flex-shrink: 0; }
  .remarks-section { width: 90%; margin: 8mm auto; }
  .remarks-section h3 { font-size: 11pt; font-weight: bold; margin-bottom: 4mm; }
  .remarks-box { border: 1.5px solid #333; height: 38mm; padding: 4mm; font-size: 10pt; color: #888; }
  .sig-section { width: 90%; margin: 10mm auto 0; text-align: right; }
  .sig-line { border-top: 1.5px solid #333; width: 65mm; display: inline-block; margin-bottom: 3px; }
  .sig-label { font-size: 10.5pt; font-weight: bold; }

  /* REPORT PAGES */
  .report-page { padding: 0; }
  .report-page h1 { font-size: 14pt; margin-bottom: 6mm; padding-bottom: 3mm; border-bottom: 2px solid #333; }
  .section { margin-bottom: 8mm; }
  .section h2 { font-size: 12pt; font-weight: bold; border-left: 3px solid #333; padding-left: 4mm; margin-bottom: 3mm; }
  .section p { font-size: 11pt; line-height: 1.8; text-align: justify; }

  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-uni">Bangladesh Army University of Science and Technology, Khulna</div>
  <div class="cover-dept">Department of Electrical and Electronic Engineering</div>

  <table class="cover-table">
    <tr><td class="label">Course Code</td><td class="colon">:</td><td>${escapeHtml(r.subjectCode || '')}</td></tr>
    <tr><td class="label">Course Title</td><td class="colon">:</td><td>${escapeHtml(r.category || '')}</td></tr>
    <tr><td class="label">Experiment No.</td><td class="colon">:</td><td>${escapeHtml(r.expNo || '')}</td></tr>
    <tr><td class="label">Experiment Name</td><td class="colon">:</td><td>${escapeHtml(r.title || '')}</td></tr>
    <tr><td class="label">Date of Experiment</td><td class="colon">:</td><td>${dateStr}</td></tr>
  </table>

  <div class="cover-big">Lab Report</div>

  <div class="sub-section">
    <div class="sub-grid">
      <div class="sub-col">
        <h3>Submitted by</h3>
        <div class="sub-row"><span class="sub-label">Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</span> ${escapeHtml(s.studentName || '')}</div>
        <div class="sub-row"><span class="sub-label">Student ID :</span> ${escapeHtml(s.studentId || '')}</div>
        <div class="sub-row"><span class="sub-label">Batch&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</span> ${escapeHtml(s.batch || '2nd')}</div>
        <div class="sub-row"><span class="sub-label">Year &amp; Sem :</span> ${escapeHtml(s.yearSem || '2nd Year 1st Semester')}</div>
      </div>
      <div class="sub-col">
        <h3>Submitted to</h3>
        <div class="sub-row"><span class="sub-label">Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</span> ${escapeHtml(r.teacherName || '')}</div>
        <div class="sub-row"><span class="sub-label">Designation :</span> ${escapeHtml(r.teacherDes || '')}</div>
        <div class="sub-row"><span class="sub-label">Department :</span> ${escapeHtml(s.dept || 'EEE')}</div>
      </div>
    </div>
  </div>

  <div class="remarks-section">
    <h3>Remarks</h3>
    <div class="remarks-box">Remarks:</div>
  </div>

  <div class="sig-section">
    <div class="sig-line"></div><br>
    <div class="sig-label">Signature of the Teacher</div>
  </div>
</div>

<!-- REPORT CONTENT -->
<div class="report-page">
  <h1>${escapeHtml(r.expNo || '')} — ${escapeHtml(r.title || '')}</h1>
  ${section('1','Objective', r.objective)}
  ${section('2','Theory & Background', r.theory)}
  ${section('3','Apparatus / Equipment', r.apparatus)}
  ${section('4','Experimental Data / Observations', r.data)}
  ${section('5','Results & Discussion', r.results)}
  ${section('6','Conclusion', r.conclusion)}
</div>

<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

// ================================================================
//  EXPORT — DOCX (HTML blob method)
// ================================================================

function exportCurrentDOCX() {
  if (!currentViewId) return;
  const r = allReports.find(x => x.id === currentViewId);
  if (!r) return;
  exportDOCX(r);
}

function exportDOCX(r) {
  const s = loadSettings();
  const dateStr = r.date ? new Date(r.date + 'T00:00:00').toLocaleDateString('en-GB', {day:'2-digit', month:'long', year:'numeric'}) : '—';

  const section = (num, title, content) => content ? `
    <h2>${num}. ${title}</h2>
    <p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>` : '';

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
    xmlns:w='urn:schemas-microsoft-com:office:word'
    xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Lab Report</title>
<style>
  body { font-family: 'Times New Roman'; font-size: 12pt; }
  h1   { font-size: 16pt; text-align: center; text-decoration: underline; }
  h2   { font-size: 13pt; border-left: 3px solid #333; padding-left: 6px; }
  p    { line-height: 1.8; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #555; padding: 4px 8px; }
  .cover { text-align: center; margin-bottom: 30px; }
  .label { font-weight: bold; }
  .page-break { page-break-after: always; }
</style>
</head>
<body>
<div class="cover">
  <p><b>Bangladesh Army University of Science and Technology, Khulna</b></p>
  <p>Department of Electrical and Electronic Engineering</p>
  <br>
  <table style="width:80%;margin:auto;border:none;">
    <tr><td class="label" style="border:none">Course Code</td><td style="border:none">: ${escapeHtml(r.subjectCode || '')}</td></tr>
    <tr><td class="label" style="border:none">Course Title</td><td style="border:none">: ${escapeHtml(r.category || '')}</td></tr>
    <tr><td class="label" style="border:none">Experiment No.</td><td style="border:none">: ${escapeHtml(r.expNo || '')}</td></tr>
    <tr><td class="label" style="border:none">Experiment Name</td><td style="border:none">: ${escapeHtml(r.title || '')}</td></tr>
    <tr><td class="label" style="border:none">Date</td><td style="border:none">: ${dateStr}</td></tr>
  </table>
  <br><h1>Lab Report</h1><br>
  <table style="width:80%;margin:auto;">
    <tr>
      <th>Submitted by</th><th>Submitted to</th>
    </tr>
    <tr>
      <td>
        <b>Name:</b> ${escapeHtml(s.studentName || '')}<br>
        <b>ID:</b> ${escapeHtml(s.studentId || '')}<br>
        <b>Batch:</b> ${escapeHtml(s.batch || '')}<br>
        <b>Year &amp; Sem:</b> ${escapeHtml(s.yearSem || '')}
      </td>
      <td>
        <b>Name:</b> ${escapeHtml(r.teacherName || '')}<br>
        <b>Designation:</b> ${escapeHtml(r.teacherDes || '')}<br>
        <b>Department:</b> ${escapeHtml(s.dept || 'EEE')}
      </td>
    </tr>
  </table>
  <br>
  <p><b>Remarks:</b></p>
  <table style="width:80%;margin:auto;"><tr><td style="height:60px;">&nbsp;</td></tr></table>
  <br>
  <p style="text-align:right;">________________________________<br><b>Signature of the Teacher</b></p>
</div>
<div class="page-break"></div>
<h1>${escapeHtml(r.expNo || '')} — ${escapeHtml(r.title || '')}</h1>
${section('1','Objective', r.objective)}
${section('2','Theory & Background', r.theory)}
${section('3','Apparatus / Equipment', r.apparatus)}
${section('4','Experimental Data / Observations', r.data)}
${section('5','Results & Discussion', r.results)}
${section('6','Conclusion', r.conclusion)}
</body>
</html>`;

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Lab_Report_${(r.expNo || 'EXP').replace(/[^a-zA-Z0-9]/g,'_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('⬇ DOCX downloaded.', 'success');
}

// ================================================================
//  LOCAL FILE SYSTEM BROWSER
// ================================================================

function openLocalFilesPanel() {
  openModal('localFilesModal');
}

async function browseLocalFolder() {
  if (!window.showDirectoryPicker) {
    showToast('⚠ File System Access API not supported in this browser. Use Chrome or Edge.', 'error');
    return;
  }
  try {
    localFolderHandle = await window.showDirectoryPicker({ mode: 'read' });
    document.getElementById('localFolderPath').value = localFolderHandle.name;
    await listLocalFiles(localFolderHandle);
    // Also update sidebar
    await updateSidebarLocalFiles(localFolderHandle);
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast('⚠ Folder access denied or failed: ' + err.message, 'error');
    }
  }
}

async function listLocalFiles(dirHandle) {
  const container = document.getElementById('localFilesResult');
  container.innerHTML = '<div style="color:var(--muted);font-family:\'Share Tech Mono\',monospace;font-size:0.65rem;padding:0.5rem;">Loading files…</div>';

  const files = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const ext = entry.name.split('.').pop().toLowerCase();
      if (['html','pdf','doc','docx','txt'].includes(ext)) {
        let size = '—';
        try {
          const file = await entry.getFile();
          size = formatSize(file.size);
          files.push({ name: entry.name, ext, size, handle: entry });
        } catch { /* skip */ }
      }
    }
  }

  if (files.length === 0) {
    container.innerHTML = '<div style="color:var(--muted);font-family:\'Share Tech Mono\',monospace;font-size:0.65rem;padding:1rem;">No HTML/PDF/DOCX files found in this folder.</div>';
    return;
  }

  container.innerHTML = files.map((f, i) => `
    <div class="local-file-card" onclick="openLocalFile(${i})">
      <div class="lf-icon">${fileIcon(f.ext)}</div>
      <div class="lf-info">
        <div class="lf-name" title="${escapeAttr(f.name)}">${escapeHtml(f.name)}</div>
        <div class="lf-meta">${f.size}</div>
      </div>
      <div class="lf-type">${f.ext.toUpperCase()}</div>
    </div>`).join('');

  // Store file list for openLocalFile()
  window._localFiles = files;
}

async function openLocalFile(index) {
  const files = window._localFiles;
  if (!files || !files[index]) return;
  const f = files[index];
  try {
    const file = await f.handle.getFile();
    const url  = URL.createObjectURL(file);
    window.open(url, '_blank');
  } catch (err) {
    showToast('⚠ Could not open file: ' + err.message, 'error');
  }
}

async function updateSidebarLocalFiles(dirHandle) {
  const container = document.getElementById('localFilesList');
  container.innerHTML = '';
  let count = 0;
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && count < 8) {
      const ext = entry.name.split('.').pop().toLowerCase();
      if (['html','pdf','doc','docx'].includes(ext)) {
        const div = document.createElement('div');
        div.className = 'local-file-item';
        div.innerHTML = `<span class="local-file-icon">${fileIcon(ext)}</span>${escapeHtml(entry.name)}`;
        div.onclick = async () => {
          try {
            const file = await entry.getFile();
            const url  = URL.createObjectURL(file);
            window.open(url, '_blank');
          } catch {}
        };
        container.appendChild(div);
        count++;
      }
    }
  }
  if (count === 0) {
    container.innerHTML = '<div class="local-empty">No report files found.</div>';
  }
}

function fileIcon(ext) {
  const icons = { html:'🌐', pdf:'📄', doc:'📝', docx:'📝', txt:'📃' };
  return icons[ext] || '📁';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ================================================================
//  MODAL HELPERS
// ================================================================

function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  // Only restore scroll if no other modal/viewer is open
  const anyOpen = document.querySelector('.modal-overlay.open, .report-viewer.open');
  if (!anyOpen) document.body.style.overflow = '';
}

function closeOnOverlay(event, id) {
  if (event.target === document.getElementById(id)) closeModal(id);
}

// ESC key closes topmost
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('reportViewer').classList.contains('open')) { closeReport(); return; }
  ['deleteModal','localFilesModal','settingsModal','publishModal'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.classList.contains('open')) closeModal(id);
  });
});

// ================================================================
//  UTILITY
// ================================================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ================================================================
//  SERVER.JS INTEGRATION NOTICE
//  (Node.js backend for folder access — see server.js)
//  When server.js is running on localhost:3001, the app can
//  optionally POST to /api/list-folder to get file listings
//  without the File System Access API.
// ================================================================
