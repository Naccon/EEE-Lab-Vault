(function bootstrapTemplates(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const utils = ns.utils;

  function renderProfileSummary(subjects, reports) {
    return `
      <div class="memory-card">
        <div class="memory-title">Repository Source</div>
        <div class="memory-caption">${subjects.length} subject folder${subjects.length === 1 ? "" : "s"} discovered</div>
        <div class="memory-pills">
          <span class="pill">${reports.length} report${reports.length === 1 ? "" : "s"}</span>
          <span class="pill">Git-based metadata</span>
        </div>
      </div>
    `;
  }

  function renderSecuritySummary(warnings) {
    if (!warnings.length) {
      return `
        <article class="memory-card is-security">
          <div class="memory-title">Static GitHub Pages Mode</div>
          <div class="memory-caption">Reports are loaded from JSON files and linked repository documents.</div>
          <div class="memory-pills">
            <span class="pill">No sign-in required</span>
            <span class="pill">No server writes</span>
          </div>
        </article>
      `;
    }

    return `
      <article class="memory-card is-security">
        <div class="memory-title">Static Load Warnings</div>
        <div class="memory-caption">${utils.escapeHtml(warnings[0])}</div>
        <div class="memory-pills">
          <span class="pill">${warnings.length} warning${warnings.length === 1 ? "" : "s"}</span>
          <span class="pill">Check JSON / file paths</span>
        </div>
      </article>
    `;
  }

  function renderCategories(subjects, activeSubject) {
    const items = [{ subjectCode: "all", subjectName: "All Subjects" }].concat(subjects);
    return items.map((subject) => `
      <button class="category-item ${activeSubject === subject.subjectCode ? "is-active" : ""}" type="button" data-subject-code="${utils.escapeHtml(subject.subjectCode)}">
        <span class="category-icon">${utils.escapeHtml(subject.subjectCode === "all" ? "ALL" : subject.subjectCode.slice(0, 3))}</span>
        <span class="category-meta">
          <span class="category-name">${utils.escapeHtml(subject.subjectName || "All Subjects")}</span>
          <span class="category-code">${utils.escapeHtml(subject.subjectCode === "all" ? "GLOBAL" : subject.subjectCode)}</span>
        </span>
      </button>
    `).join("");
  }

  function renderAcademicMemory(subjects) {
    if (!subjects.length) {
      return `<div class="memory-card is-empty">Add subject folders and JSON files under /reports to populate the vault.</div>`;
    }

    return subjects.slice(0, 6).map((subject, index) => `
      <article class="memory-card">
        <div class="memory-head">
          <span class="memory-index">${index + 1}</span>
          <div class="memory-meta">
            <div class="memory-title">${utils.escapeHtml(subject.subjectName)}</div>
            <div class="memory-caption">${utils.escapeHtml(subject.subjectCode)}</div>
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderStats(stats) {
    return `
      <article class="stat-card"><span class="stat-value">${stats.totalReports}</span><span class="stat-label">Total Reports</span></article>
      <article class="stat-card"><span class="stat-value">${stats.pdfCount}</span><span class="stat-label">PDF Linked</span></article>
      <article class="stat-card"><span class="stat-value">${stats.docxCount}</span><span class="stat-label">DOCX Linked</span></article>
      <article class="stat-card"><span class="stat-value">${stats.subjects}</span><span class="stat-label">Subjects</span></article>
    `;
  }

  function renderQuickFilters(activeFilter) {
    const filters = [
      { id: "all", label: "All Reports" },
      { id: "pdf", label: "Has PDF" },
      { id: "docx", label: "Has DOCX" },
      { id: "missing", label: "Missing Files" }
    ];
    return filters.map((filter) => `
      <button class="chip ${activeFilter === filter.id ? "is-active" : ""}" type="button" data-quick-filter="${filter.id}">
        ${utils.escapeHtml(filter.label)}
      </button>
    `).join("");
  }

  function renderFeatured(report) {
    if (!report) {
      return "";
    }

    return `
      <article class="featured-card" data-report-id="${utils.escapeHtml(report.id)}">
        <div class="featured-top">
          <div class="report-seq">${utils.escapeHtml(report.subjectCode)} // ${utils.escapeHtml(report.experimentNo || "No experiment no")}</div>
          <div class="report-card-actions">
            <span class="report-tag">${utils.escapeHtml(report.subjectName)}</span>
            <span class="report-tag ${report.status === "draft" ? "is-draft" : "is-published"}">${utils.escapeHtml(utils.humanizeStatus(report.status))}</span>
          </div>
        </div>
        <h3 class="featured-title">${utils.escapeHtml(report.title)}</h3>
        <p class="featured-copy">${utils.escapeHtml(report.executiveSummary || "No executive summary was provided in this report JSON.")}</p>
        <div class="featured-meta">
          <div class="meta-box"><span class="meta-label">Faculty</span><span class="meta-value">${utils.escapeHtml(report.faculty.facultyName || "Not specified")}</span></div>
          <div class="meta-box"><span class="meta-label">Designation</span><span class="meta-value">${utils.escapeHtml(report.faculty.designation || "Not specified")}</span></div>
          <div class="meta-box"><span class="meta-label">Date</span><span class="meta-value">${utils.escapeHtml(utils.formatDate(report.experimentDate, "Not dated"))}</span></div>
          <div class="meta-box"><span class="meta-label">Files</span><span class="meta-value">${report.files.length}</span></div>
        </div>
      </article>
    `;
  }

  function renderFilePills(report) {
    if (!report.files.length) {
      return `<span class="report-tag is-draft">No linked files</span>`;
    }
    return report.files.map((file) => `
      <span class="report-tag ${file.exists ? "is-published" : "is-draft"}">${utils.escapeHtml(file.type.toUpperCase())}${file.exists ? "" : " missing"}</span>
    `).join("");
  }

  function renderReportCard(report) {
    return `
      <article class="report-card" data-report-id="${utils.escapeHtml(report.id)}">
        <div class="report-card-header">
          <span class="report-seq">${utils.escapeHtml(report.subjectCode)} // ${utils.escapeHtml(report.experimentNo || "N/A")}</span>
          <span class="report-tag ${report.status === "draft" ? "is-draft" : "is-published"}">${utils.escapeHtml(utils.humanizeStatus(report.status))}</span>
        </div>
        <div class="card-meta-row">
          <span class="report-tag">${utils.escapeHtml(report.subjectName)}</span>
          ${renderFilePills(report)}
        </div>
        <h3 class="report-card-title">${utils.escapeHtml(report.title)}</h3>
        <p class="report-card-summary">${utils.escapeHtml(report.executiveSummary || "No executive summary available.")}</p>
        <div class="report-card-footer">
          <div>
            <div class="report-seq">${utils.escapeHtml(utils.formatDate(report.experimentDate, "Not dated"))}</div>
            <div class="report-seq">${utils.escapeHtml(report.faculty.facultyName || "Faculty not specified")}</div>
          </div>
          <div class="report-card-actions">
            <button class="mini-btn" type="button" data-action="view" data-report-id="${utils.escapeHtml(report.id)}">Open</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderReportsGrid(reports) {
    return reports.map(renderReportCard).join("");
  }

  function renderFileActions(report) {
    if (!report.files.length) {
      return `<div class="memory-card is-empty">No linked PDF or DOCX files are listed for this report.</div>`;
    }

    return `
      <div class="viewer-file-grid">
        ${report.files.map((file) => `
          <article class="memory-card">
            <div class="memory-title">${utils.escapeHtml(file.label)}</div>
            <div class="memory-caption">${utils.escapeHtml(file.type.toUpperCase())} // ${file.exists ? "Ready" : "Missing"}</div>
            <div class="report-card-actions">
              ${file.type === "pdf" && file.exists ? `<a class="mini-btn" href="${utils.escapeHtml(file.path)}" target="_blank" rel="noopener noreferrer">Open</a>` : ""}
              ${file.exists ? `<a class="mini-btn" href="${utils.escapeHtml(file.path)}" download>Download</a>` : `<span class="report-tag is-draft">File missing</span>`}
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderViewer(report) {
    return `
      <div class="report-paper">
        <header class="report-paper-header">
          <div class="report-card-actions">
            <span class="report-tag">${utils.escapeHtml(report.subjectName)}</span>
            <span class="report-tag ${report.status === "draft" ? "is-draft" : "is-published"}">${utils.escapeHtml(utils.humanizeStatus(report.status))}</span>
          </div>
          <h1 class="viewer-title">${utils.escapeHtml(report.title)}</h1>
          <div class="viewer-summary report-rich-copy"><p>${utils.escapeHtml(report.executiveSummary || "No executive summary available.")}</p></div>
          <div class="viewer-meta-grid">
            <div class="meta-box"><span class="meta-label">Subject Name</span><span class="meta-value">${utils.escapeHtml(report.subjectName || "Not provided")}</span></div>
            <div class="meta-box"><span class="meta-label">Subject Code</span><span class="meta-value">${utils.escapeHtml(report.subjectCode || "Not provided")}</span></div>
            <div class="meta-box"><span class="meta-label">Experiment No</span><span class="meta-value">${utils.escapeHtml(report.experimentNo || "Not provided")}</span></div>
            <div class="meta-box"><span class="meta-label">Date</span><span class="meta-value">${utils.escapeHtml(utils.formatDate(report.experimentDate, "Not dated"))}</span></div>
            <div class="meta-box"><span class="meta-label">Faculty Name</span><span class="meta-value">${utils.escapeHtml(report.faculty.facultyName || "Optional / not provided")}</span></div>
            <div class="meta-box"><span class="meta-label">Designation</span><span class="meta-value">${utils.escapeHtml(report.faculty.designation || "Optional / not provided")}</span></div>
            <div class="meta-box"><span class="meta-label">Student Name</span><span class="meta-value">${utils.escapeHtml(report.student.studentName || "Not provided")}</span></div>
            <div class="meta-box"><span class="meta-label">Student ID</span><span class="meta-value">${utils.escapeHtml(report.student.studentId || "Not provided")}</span></div>
            <div class="meta-box"><span class="meta-label">Level</span><span class="meta-value">${utils.escapeHtml(report.student.studentLevel || "Not provided")}</span></div>
            <div class="meta-box"><span class="meta-label">Term</span><span class="meta-value">${utils.escapeHtml(report.student.studentTerm || "Not provided")}</span></div>
            <div class="meta-box"><span class="meta-label">Source JSON</span><span class="meta-value">${utils.escapeHtml(report.sourceJson)}</span></div>
          </div>
        </header>
        <div class="report-sections">
          <article class="report-section-card">
            <h3>Linked Files</h3>
            ${renderFileActions(report)}
          </article>
        </div>
      </div>
    `;
  }

  ns.templates = {
    renderAcademicMemory,
    renderCategories,
    renderFeatured,
    renderProfileSummary,
    renderQuickFilters,
    renderReportsGrid,
    renderSecuritySummary,
    renderStats,
    renderViewer
  };
}(window));
