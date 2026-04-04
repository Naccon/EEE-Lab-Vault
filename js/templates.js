(function bootstrapTemplates(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const utils = ns.utils;
  const config = ns.config;

  function renderProfileSummary(user, counts) {
    if (!user) {
      return `
        <div class="memory-card is-empty">
          Viewer mode is active. Browse published reports freely, then sign in only when you need drafts, editing, or admin controls.
        </div>
      `;
    }

    return `
      <div class="profile-card-title">
        <div class="profile-user">
          <div class="profile-avatar">${utils.escapeHtml(utils.getInitials(user.name))}</div>
          <div>
            <div class="profile-name">${utils.escapeHtml(user.name)}</div>
            <div class="profile-role">${utils.escapeHtml(user.role)}</div>
          </div>
        </div>
      </div>
      <div class="profile-meta">
        <span>${utils.escapeHtml(user.department)}</span>
        <span>${utils.escapeHtml(user.email)}</span>
        <span>${utils.escapeHtml(user.level)} // ${utils.escapeHtml(user.term)} // ${utils.escapeHtml(user.section)}</span>
        <span>Managed reports: ${counts.owned}</span>
      </div>
      <div class="profile-badges">
        <span class="pill">Drafts ${counts.drafts}</span>
        <span class="pill">Published ${counts.published}</span>
        <span class="pill">Super Admin Access</span>
      </div>
    `;
  }

  function renderSecuritySummary(security) {
    if (!security || !security.sessionActive) {
      return `
        <article class="memory-card is-security">
          <div class="memory-title">Viewer mode active</div>
          <div class="memory-caption">Published reports remain open to everyone. Sign in only to create drafts, edit reports, or manage users.</div>
          <div class="memory-pills">
            <span class="pill">Watching today: ${security && security.todayViewerCount ? security.todayViewerCount : 0}</span>
          </div>
        </article>
      `;
    }

    const minutesRemaining = Math.max(1, Math.round((security.sessionRemainingMs || 0) / 60000));
    return `
      <article class="memory-card is-security">
        <div class="memory-title">Session secured</div>
        <div class="memory-caption">Expires in approximately ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}</div>
        <div class="memory-pills">
          <span class="pill">Super admin controls enabled</span>
          <span class="pill">Watching today: ${security.todayViewerCount || 0}</span>
          <span class="pill">Activity tracked locally</span>
        </div>
      </article>
    `;
  }

  function renderCategories(categories, counts, activeCategory) {
    return categories.map((category) => {
      const total = counts[category.id] || 0;
      return `
        <button class="category-item ${activeCategory === category.id ? "is-active" : ""}" type="button" data-category="${category.id}">
          <span class="category-icon">${utils.escapeHtml(category.icon)}</span>
          <span class="category-meta">
            <span class="category-name">${utils.escapeHtml(category.name)}</span>
            <span class="category-code">${utils.escapeHtml(category.code)}</span>
          </span>
          <span class="category-count">${total}</span>
        </button>
      `;
    }).join("");
  }

  function renderAcademicMemory(suggestions) {
    const profiles = utils.toArray(suggestions && suggestions.profiles).slice(0, 4);
    if (!profiles.length) {
      return `<div class="memory-card is-empty">Academic suggestions will appear after you save reports.</div>`;
    }

    return profiles.map((profile, index) => `
      <article class="memory-card">
        <div class="memory-head">
          <span class="memory-index">${index + 1}</span>
          <div class="memory-meta">
            <div class="memory-title">${utils.escapeHtml(profile.subjectName)}</div>
            <div class="memory-caption">${utils.escapeHtml(profile.subjectCode)} // ${utils.escapeHtml(profile.teacherName)}</div>
          </div>
        </div>
        <div class="memory-pills">
          <span class="pill">${utils.escapeHtml(profile.teacherDesignation)}</span>
          <span class="pill">Used ${profile.usageCount || 1}x</span>
        </div>
      </article>
    `).join("");
  }

  function renderStats(stats) {
    return `
      <article class="stat-card">
        <span class="stat-value">${stats.total}</span>
        <span class="stat-label">Total Reports</span>
      </article>
      <article class="stat-card">
        <span class="stat-value">${stats.published}</span>
        <span class="stat-label">Published</span>
      </article>
      <article class="stat-card">
        <span class="stat-value">${stats.draft}</span>
        <span class="stat-label">Drafts</span>
      </article>
      <article class="stat-card">
        <span class="stat-value">${stats.locked}</span>
        <span class="stat-label">Locked Fields</span>
      </article>
    `;
  }

  function renderQuickFilters(activeFilter) {
    return config.quickFilters.map((filter) => `
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
      <article class="featured-card" data-report-id="${report.id}">
        <div class="featured-top">
          <div class="report-seq">${utils.escapeHtml(report.academic.subjectCode)} // ${utils.escapeHtml(report.experimentNo)}</div>
          <div class="report-card-actions">
            <span class="report-tag">${utils.escapeHtml(report.academic.subjectName)}</span>
            <span class="report-tag ${report.status === "published" ? "is-published" : "is-draft"}">${utils.escapeHtml(utils.humanizeStatus(report.status))}</span>
          </div>
        </div>
        <h3 class="featured-title">${utils.escapeHtml(report.title)}</h3>
        <p class="featured-copy">${utils.escapeHtml(report.summary)}</p>
        <div class="featured-meta">
          <div class="meta-box">
            <span class="meta-label">Faculty</span>
            <span class="meta-value">${utils.escapeHtml(report.academic.teacherName)}</span>
          </div>
          <div class="meta-box">
            <span class="meta-label">Designation</span>
            <span class="meta-value">${utils.escapeHtml(report.academic.teacherDesignation)}</span>
          </div>
          <div class="meta-box">
            <span class="meta-label">Last Updated</span>
            <span class="meta-value">${utils.escapeHtml(utils.formatDate(report.updatedAt))}</span>
          </div>
          <div class="meta-box">
            <span class="meta-label">Lifecycle</span>
            <span class="meta-value">${report.status === "published" ? "Ready for export" : "Needs review"}</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderReportCard(report, currentUser) {
    const canManage = utils.canManageReport(currentUser, report);
    return `
      <article class="report-card" data-report-id="${report.id}">
        <div class="report-card-header">
          <span class="report-seq">${utils.escapeHtml(report.academic.subjectCode)} // ${utils.escapeHtml(report.experimentNo)}</span>
          <span class="report-tag ${report.status === "published" ? "is-published" : "is-draft"}">${utils.escapeHtml(utils.humanizeStatus(report.status))}</span>
        </div>
        <div class="card-meta-row">
          <span class="report-tag">${utils.escapeHtml(report.academic.subjectName)}</span>
        </div>
        <h3 class="report-card-title">${utils.escapeHtml(report.title)}</h3>
        <p class="report-card-summary">${utils.escapeHtml(report.summary)}</p>
        <div class="report-card-footer">
          <div>
            <div class="report-seq">${utils.escapeHtml(utils.formatDate(report.experimentDate))}</div>
            <div class="report-seq">${utils.escapeHtml(report.academic.teacherName)}</div>
          </div>
          <div class="report-card-actions">
            ${canManage ? `<button class="mini-btn" type="button" data-action="edit" data-report-id="${report.id}">Edit</button>` : ""}
            <button class="mini-btn" type="button" data-action="view" data-report-id="${report.id}">Open</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderReportsGrid(reports, currentUser) {
    return reports.map((report) => renderReportCard(report, currentUser)).join("");
  }

  function renderDataTable(report) {
    const headers = utils.toArray(report.dataTable.headers);
    const rows = utils.toArray(report.dataTable.rows);
    return `
      <div class="data-table-shell">
        <table class="data-table">
          <thead>
            <tr>${headers.map((header) => `<th>${utils.escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>${utils.toArray(row).map((cell) => `<td>${utils.escapeHtml(cell)}</td>`).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRichCopy(value, fallback) {
    const html = utils.parseRichTextToHtml(value || "");
    return html || `<p>${utils.escapeHtml(fallback || "Not provided.")}</p>`;
  }

  function renderViewer(report) {
    const sectionCards = config.reportSections.map((section) => `
      <article class="report-section-card" id="section-${section.key}">
        <h3>${utils.escapeHtml(section.title)}</h3>
        <div class="report-rich-copy">${renderRichCopy(report.sections[section.key], "Not provided.")}</div>
      </article>
    `).join("");

    return `
      <div class="report-paper">
        <header class="report-paper-header">
          <div class="report-card-actions">
            <span class="report-tag">${utils.escapeHtml(report.academic.subjectName)}</span>
            <span class="report-tag ${report.status === "published" ? "is-published" : "is-draft"}">${utils.escapeHtml(utils.humanizeStatus(report.status))}</span>
          </div>
          <h1 class="viewer-title">${utils.escapeHtml(report.title)}</h1>
          <div class="viewer-summary report-rich-copy">${renderRichCopy(report.summary, "Not provided.")}</div>
          <div class="viewer-meta-grid">
            <div class="meta-box"><span class="meta-label">Experiment</span><span class="meta-value">${utils.escapeHtml(report.experimentNo)}</span></div>
            <div class="meta-box"><span class="meta-label">Date</span><span class="meta-value">${utils.escapeHtml(utils.formatDate(report.experimentDate))}</span></div>
            <div class="meta-box"><span class="meta-label">Subject Code</span><span class="meta-value">${utils.escapeHtml(report.academic.subjectCode)}</span></div>
            <div class="meta-box"><span class="meta-label">Faculty</span><span class="meta-value">${utils.escapeHtml(report.academic.teacherName)}</span></div>
          </div>
        </header>

        <div class="report-sections">
          <article class="toc-card">
            <h3>Table of Contents</h3>
            <ol class="toc-list">
              <li>Student Information</li>
              <li>Academic Metadata</li>
              <li>Objective</li>
              <li>Theory</li>
              <li>Apparatus / Materials</li>
              <li>Procedure</li>
              <li>Circuit Diagram</li>
              <li>Data Table</li>
              <li>Result</li>
              <li>Conclusion</li>
              <li>References / Notes</li>
            </ol>
          </article>

          <article class="report-section-card">
            <h3>Student Information</h3>
            <div class="report-academic-grid">
              <div class="report-academic-box"><span class="report-academic-label">Student Name</span>${utils.escapeHtml(report.student.studentName)}</div>
              <div class="report-academic-box"><span class="report-academic-label">Student ID</span>${utils.escapeHtml(report.student.studentId)}</div>
              <div class="report-academic-box"><span class="report-academic-label">Level</span>${utils.escapeHtml(report.student.studentLevel)}</div>
              <div class="report-academic-box"><span class="report-academic-label">Term</span>${utils.escapeHtml(report.student.studentTerm)}</div>
              <div class="report-academic-box"><span class="report-academic-label">Section</span>${utils.escapeHtml(report.student.studentSection)}</div>
              <div class="report-academic-box"><span class="report-academic-label">Department</span>${utils.escapeHtml(report.student.studentDepartment)}</div>
              <div class="report-academic-box"><span class="report-academic-label">Institution</span>${utils.escapeHtml(report.student.institution)}</div>
            </div>
          </article>

          <article class="report-section-card">
            <h3>Academic Metadata</h3>
            <div class="report-academic-grid">
              <div class="report-academic-box"><span class="report-academic-label">Subject Name</span>${utils.escapeHtml(report.academic.subjectName)}</div>
              <div class="report-academic-box"><span class="report-academic-label">Subject Code</span>${utils.escapeHtml(report.academic.subjectCode)}</div>
              <div class="report-academic-box"><span class="report-academic-label">Faculty Name</span>${utils.escapeHtml(report.academic.teacherName)}</div>
              <div class="report-academic-box"><span class="report-academic-label">Designation</span>${utils.escapeHtml(report.academic.teacherDesignation)}</div>
            </div>
          </article>

          ${sectionCards}

          <article class="report-section-card diagram-card">
            <h3>Circuit Diagram</h3>
            ${report.circuitDiagram.dataUrl
              ? `<img src="${report.circuitDiagram.dataUrl}" alt="Circuit diagram for ${utils.escapeHtml(report.title)}">`
              : "<p>No circuit diagram uploaded for this report.</p>"}
            ${report.circuitDiagram.caption ? `<div class="diagram-caption">${utils.escapeHtml(report.circuitDiagram.caption)}</div>` : ""}
          </article>

          <article class="report-section-card">
            <h3>Data Table</h3>
            ${renderDataTable(report)}
          </article>
        </div>
      </div>
    `;
  }

  function renderHistory(report) {
    const versions = utils.toArray(report.versions);
    if (!versions.length) {
      return `<div class="memory-card is-empty">No previous versions are available for this report yet.</div>`;
    }

    return versions.map((entry, index) => `
      <article class="history-card">
        <div>
          <div class="history-title">Revision ${versions.length - index}</div>
          <div class="history-meta">Saved ${utils.escapeHtml(utils.formatDateTime(entry.savedAt))} // ${utils.escapeHtml(utils.humanizeStatus(entry.status))}</div>
        </div>
        <div class="history-body">${utils.escapeHtml(entry.summary || entry.title || "Snapshot without summary.")}</div>
        <div class="history-actions">
          <span class="report-seq">${utils.escapeHtml(entry.title || "Untitled Snapshot")}</span>
          <button class="btn btn-secondary" type="button" data-action="restore-version" data-version-id="${entry.id}">Restore This Version</button>
        </div>
      </article>
    `).join("");
  }

  function renderAcademicSuggestion(profile) {
    if (!profile) {
      return "";
    }

    return `
      <strong>Suggested profile:</strong>
      ${utils.escapeHtml(profile.subjectName)}
      (${utils.escapeHtml(profile.subjectCode)})
      with ${utils.escapeHtml(profile.teacherName)}.
      <button class="btn btn-secondary" type="button" data-action="apply-profile">Apply</button>
    `;
  }

  function renderUserDashboard(dashboard, searchTerm) {
    if (!dashboard) {
      return `<div class="memory-card is-empty">Super admin access is required to view the admin console.</div>`;
    }
    return `
      <article class="dashboard-user-card">
        <div class="dashboard-user-head">
          <div>
            <div class="dashboard-user-title">${utils.escapeHtml(dashboard.adminName || "Super Admin")}</div>
            <div class="dashboard-user-subtitle">${utils.escapeHtml(dashboard.adminEmail || "")}</div>
          </div>
          <div class="profile-badges">
            <span class="status-pill is-admin">super admin</span>
            <span class="status-pill is-active">active</span>
          </div>
        </div>
        <div class="dashboard-user-grid">
          <div class="meta-box"><span class="meta-label">Total Reports</span><span class="meta-value">${dashboard.totalReports || 0}</span></div>
          <div class="meta-box"><span class="meta-label">Published</span><span class="meta-value">${dashboard.publishedReports || 0}</span></div>
          <div class="meta-box"><span class="meta-label">Drafts</span><span class="meta-value">${dashboard.draftReports || 0}</span></div>
          <div class="meta-box"><span class="meta-label">Watching Today</span><span class="meta-value">${dashboard.todayViewerCount || 0}</span></div>
        </div>
        <div class="dashboard-user-note">
          Admin access can be turned on or off directly with the ENABLE_ADMIN flag in config.js.
        </div>
      </article>
    `;
  }

  function renderActivityLog(dashboard) {
    if (!dashboard) {
      return `<div class="memory-card is-empty">Super admin access is required to inspect activity logs.</div>`;
    }

    const logs = utils.toArray(dashboard.activityLog);
    if (!logs.length) {
      return `<div class="memory-card is-empty">No tracked activity is available yet.</div>`;
    }

    return logs.map((entry) => `
      <article class="activity-log-card">
        <div class="activity-log-head">
          <div>
            <div class="activity-log-title">${utils.escapeHtml(entry.action.replace(/_/g, " "))}</div>
            <div class="activity-log-meta">${utils.escapeHtml(utils.formatDateTime(entry.at))} // ${utils.escapeHtml(entry.actorName || "Guest Viewer")}</div>
          </div>
          <span class="status-pill ${entry.authState === "guest" ? "is-readonly" : "is-admin"}">${utils.escapeHtml(entry.authState)}</span>
        </div>
        <div class="activity-log-grid">
          <div class="meta-box"><span class="meta-label">Device</span><span class="meta-value">${utils.escapeHtml(entry.deviceType)}</span></div>
          <div class="meta-box"><span class="meta-label">IP Address</span><span class="meta-value">${utils.escapeHtml(entry.ipAddress)}</span></div>
          <div class="meta-box"><span class="meta-label">MAC Address</span><span class="meta-value">${utils.escapeHtml(entry.macAddress)}</span></div>
          <div class="meta-box"><span class="meta-label">Email</span><span class="meta-value">${utils.escapeHtml(entry.actorEmail || "Guest")}</span></div>
        </div>
        <div class="activity-log-agent">${utils.escapeHtml(entry.userAgent)}</div>
      </article>
    `).join("");
  }

  ns.templates = {
    renderAcademicMemory,
    renderAcademicSuggestion,
    renderCategories,
    renderFeatured,
    renderHistory,
    renderProfileSummary,
    renderQuickFilters,
    renderReportsGrid,
    renderSecuritySummary,
    renderStats,
    renderActivityLog,
    renderUserDashboard,
    renderViewer
  };
}(window));
