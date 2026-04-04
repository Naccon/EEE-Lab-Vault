(function bootstrapApp(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const config = ns.config;
  const utils = ns.utils;
  let templates = ns.templates;
  let backend = ns.backend;
  let exporters = ns.exporters;
  let auth = ns.auth;
  const coverLogoPath = "./assets/Logo_BAUSTK.svg";

  function refreshServices() {
    templates = global.EEEVault && global.EEEVault.templates ? global.EEEVault.templates : templates;
    backend = global.EEEVault && global.EEEVault.backend ? global.EEEVault.backend : backend;
    exporters = global.EEEVault && global.EEEVault.exporters ? global.EEEVault.exporters : exporters;
    auth = global.EEEVault && global.EEEVault.auth ? global.EEEVault.auth : auth;
  }

  const state = {
    user: null,
    users: [],
    reports: [],
    draft: null,
    security: {
      sessionActive: false,
      sessionExpiresAt: "",
      lastActivityAt: "",
      sessionRemainingMs: 0,
      timeoutMs: 0,
      canAdministerUsers: false,
      roleKey: "viewer",
      accessMode: "viewer"
    },
    dashboard: null,
    dashboardSearch: "",
    academicSuggestions: {
      lastUsedProfile: null,
      profiles: [],
      subjectNames: [],
      subjectCodes: [],
      teacherNames: [],
      teacherDesignations: []
    },
    filters: {
      search: "",
      category: "all",
      status: "all",
      subject: "all",
      level: "all",
      term: "all",
      teacherCategory: "all",
      sort: "newest",
      quick: "all"
    },
    ui: {
      theme: "dark",
      loading: false
    },
    editor: {
      mode: "create",
      currentReportId: null,
      dirty: false,
      currentSuggestedProfile: null
    },
    viewerReportId: null,
    historyReportId: null,
    confirm: null
  };

  const dom = {};
  let autosaveRunner = null;
  const richTextFieldIds = ["summary", "objective", "theory", "apparatus", "procedure", "result", "conclusion", "references"];
  let coverLogoPngPromise = null;

  function cacheDom() {
    const get = (id) => global.document.getElementById(id);
    dom.body = global.document.body;
    dom.globalSearch = get("globalSearch");
    dom.themeToggle = get("themeToggle");
    dom.openAuthBtn = get("openAuthBtn");
    dom.openDashboardBtn = get("openDashboardBtn");
    dom.openEditorBtn = get("openEditorBtn");
    dom.emptyCreateBtn = get("emptyCreateBtn");
    dom.resumeDraftBtn = get("resumeDraftBtn");
    dom.autosaveTopStatus = get("autosaveTopStatus");
    dom.metricTotalReports = get("metricTotalReports");
    dom.metricPublishedReports = get("metricPublishedReports");
    dom.metricDraftReports = get("metricDraftReports");
    dom.metricAcademicProfiles = get("metricAcademicProfiles");
    dom.metricTodayViewers = get("metricTodayViewers");
    dom.profileSummary = get("profileSummary");
    dom.securitySummary = get("securitySummary");
    dom.categoryList = get("categoryList");
    dom.academicMemoryList = get("academicMemoryList");
    dom.statsGrid = get("statsGrid");
    dom.quickFilterChips = get("quickFilterChips");
    dom.statusFilter = get("statusFilter");
    dom.subjectFilter = get("subjectFilter");
    dom.levelFilter = get("levelFilter");
    dom.termFilter = get("termFilter");
    dom.teacherCategoryFilter = get("teacherCategoryFilter");
    dom.sortFilter = get("sortFilter");
    dom.featuredMount = get("featuredMount");
    dom.resultsSummary = get("resultsSummary");
    dom.reportsGrid = get("reportsGrid");
    dom.emptyState = get("emptyState");
    dom.emptyStateCopy = get("emptyStateCopy");
    dom.toastStack = get("toastStack");
    dom.loadingOverlay = get("loadingOverlay");
    dom.loadingMessage = get("loadingMessage");

    dom.editorModal = get("editorModal");
    dom.viewerModal = get("viewerModal");
    dom.historyModal = get("historyModal");
    dom.dashboardModal = get("dashboardModal");
    dom.confirmModal = get("confirmModal");
    dom.authGate = get("authGate");

    dom.reportForm = get("reportForm");
    dom.reportId = get("reportId");
    dom.reportVersionSourceId = get("reportVersionSourceId");
    dom.editorTitle = get("editorTitle");
    dom.autosaveStatus = get("autosaveStatus");
    dom.formAlert = get("formAlert");
    dom.autosaveRestoreBanner = get("autosaveRestoreBanner");
    dom.reportCategory = get("reportCategory");
    dom.studentLevel = get("studentLevel");
    dom.studentTerm = get("studentTerm");
    dom.subjectName = get("subjectName");
    dom.subjectCode = get("subjectCode");
    dom.teacherName = get("teacherName");
    dom.teacherDesignation = get("teacherDesignation");
    dom.rememberAcademic = get("rememberAcademic");
    dom.lockAcademicFields = get("lockAcademicFields");
    dom.profileSuggestionBar = get("profileSuggestionBar");
    dom.diagramUpload = get("diagramUpload");
    dom.diagramCaption = get("diagramCaption");
    dom.diagramPreview = get("diagramPreview");
    dom.clearDiagramBtn = get("clearDiagramBtn");
    dom.addTableRowBtn = get("addTableRowBtn");
    dom.tableRows = get("tableRows");
    dom.saveWorkspaceBtn = get("saveWorkspaceBtn");
    dom.resetFormBtn = get("resetFormBtn");
    dom.saveReportBtn = get("saveReportBtn");

    dom.viewerModalTitle = get("viewerModalTitle");
    dom.viewerContent = get("viewerContent");
    dom.viewerEditBtn = get("viewerEditBtn");
    dom.viewerToggleStatusBtn = get("viewerToggleStatusBtn");
    dom.viewerDuplicateBtn = get("viewerDuplicateBtn");
    dom.viewerHistoryBtn = get("viewerHistoryBtn");
    dom.viewerPdfBtn = get("viewerPdfBtn");
    dom.viewerDocxBtn = get("viewerDocxBtn");
    dom.viewerDeleteBtn = get("viewerDeleteBtn");
    dom.historyList = get("historyList");
    dom.dashboardSeedBtn = get("dashboardSeedBtn");
    dom.dashboardSearch = get("dashboardSearch");
    dom.dashboardStats = get("dashboardStats");
    dom.dashboardUserList = get("dashboardUserList");
    dom.dashboardLogs = get("dashboardLogs");
    dom.confirmTitle = get("confirmTitle");
    dom.confirmMessage = get("confirmMessage");
    dom.confirmCancelBtn = get("confirmCancelBtn");
    dom.confirmOkBtn = get("confirmOkBtn");

    dom.authForm = get("authForm");
    dom.authUsername = get("authUsername");
    dom.authPassword = get("authPassword");
    dom.authAlert = get("authAlert");
    dom.cancelAuthBtn = get("cancelAuthBtn");

    dom.subjectNameSuggestions = get("subjectNameSuggestions");
    dom.subjectCodeSuggestions = get("subjectCodeSuggestions");
    dom.teacherNameSuggestions = get("teacherNameSuggestions");
    dom.teacherDesignationSuggestions = get("teacherDesignationSuggestions");
  }

  function setLoading(active, message) {
    state.ui.loading = active;
    dom.loadingOverlay.classList.toggle("hidden", !active);
    dom.loadingOverlay.setAttribute("aria-hidden", active ? "false" : "true");
    dom.loadingMessage.textContent = message || "Processing request...";
  }

  function updateBodyModalState() {
    const anyOpen = [dom.editorModal, dom.viewerModal, dom.historyModal, dom.dashboardModal, dom.confirmModal]
      .some((element) => element.classList.contains("is-open"));
    dom.body.classList.toggle("modal-open", anyOpen);
  }

  function openModal(name) {
    const element = dom[name + "Modal"];
    if (!element) {
      return;
    }
    element.classList.add("is-open");
    element.setAttribute("aria-hidden", "false");
    updateBodyModalState();
  }

  function closeModal(name) {
    const element = dom[name + "Modal"];
    if (!element) {
      return;
    }
    element.classList.remove("is-open");
    element.setAttribute("aria-hidden", "true");
    updateBodyModalState();
  }

  function showToast(title, copy, tone) {
    const item = global.document.createElement("article");
    item.className = "toast " + (tone ? "is-" + tone : "");
    item.innerHTML = `
      <div class="toast-title">${utils.escapeHtml(title)}</div>
      <div class="toast-copy">${utils.escapeHtml(copy || "")}</div>
    `;
    dom.toastStack.appendChild(item);
    global.setTimeout(() => item.remove(), 3200);
  }

  function clearValidation() {
    dom.formAlert.classList.add("hidden");
    dom.formAlert.textContent = "";
    Array.from(dom.reportForm.querySelectorAll(".field-error")).forEach((element) => element.remove());
    Array.from(dom.reportForm.querySelectorAll(".field.has-error")).forEach((element) => element.classList.remove("has-error"));
    Array.from(dom.reportForm.querySelectorAll(".field-input.is-invalid")).forEach((element) => element.classList.remove("is-invalid"));
  }

  function attachFieldError(fieldId, message) {
    const input = dom.reportForm.querySelector(`[name="${fieldId}"]`) || global.document.getElementById(fieldId);
    if (!input) {
      return;
    }
    const field = input.closest(".field");
    if (field) {
      field.classList.add("has-error");
      const note = field.querySelector(".field-error") || global.document.createElement("div");
      note.className = "field-error";
      note.textContent = message;
      field.appendChild(note);
    }
    input.classList.add("is-invalid");
  }

  function showValidation(errors) {
    clearValidation();
    const messages = Object.values(errors || {});
    if (!messages.length) {
      return;
    }
    dom.formAlert.textContent = messages[0];
    dom.formAlert.classList.remove("hidden");
    Object.keys(errors).forEach((field) => attachFieldError(field, errors[field]));
  }

  function emitInput(textarea) {
    textarea.dispatchEvent(new global.Event("input", { bubbles: true }));
    textarea.focus();
  }

  function wrapSelection(textarea, prefix, suffix, placeholder) {
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selected = textarea.value.slice(start, end);
    const insertion = prefix + (selected || placeholder || "") + suffix;
    textarea.setRangeText(insertion, start, end, "end");
    const selectionStart = start + prefix.length;
    const selectionEnd = selectionStart + (selected || placeholder || "").length;
    textarea.setSelectionRange(selectionStart, selectionEnd);
    emitInput(textarea);
  }

  function insertBlock(textarea, block) {
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const prefix = start > 0 && textarea.value.charAt(start - 1) !== "\n" ? "\n" : "";
    const suffix = end < textarea.value.length && textarea.value.charAt(end) !== "\n" ? "\n" : "";
    textarea.setRangeText(prefix + block + suffix, start, end, "end");
    emitInput(textarea);
  }

  function applyRichTextCommand(textarea, command) {
    if (!textarea) {
      return;
    }

    if (command === "bold") {
      wrapSelection(textarea, "**", "**", "bold text");
      return;
    }
    if (command === "underline") {
      wrapSelection(textarea, "__", "__", "underlined text");
      return;
    }
    if (command === "formula") {
      wrapSelection(textarea, "{{formula:", "}}", "V = I x R");
      return;
    }
    if (command === "table") {
      insertBlock(textarea, [
        "| Column 1 | Column 2 |",
        "| --- | --- |",
        "| Value 1 | Value 2 |"
      ].join("\n"));
    }
  }

  function mountRichTextToolbars() {
    richTextFieldIds.forEach((fieldId) => {
      const textarea = global.document.getElementById(fieldId);
      if (!textarea || textarea.dataset.toolbarReady === "true") {
        return;
      }

      const toolbar = global.document.createElement("div");
      toolbar.className = "editor-toolbar";
      toolbar.innerHTML = `
        <button class="mini-btn" type="button" data-command="bold">Bold</button>
        <button class="mini-btn" type="button" data-command="underline">Underline</button>
        <button class="mini-btn" type="button" data-command="formula">No-Break Formula</button>
        <button class="mini-btn" type="button" data-command="table">Insert Table</button>
        <span class="editor-toolbar-note">Formula keeps equations on one line in the viewer and print export.</span>
      `;
      toolbar.addEventListener("click", (event) => {
        const button = event.target.closest("[data-command]");
        if (!button) {
          return;
        }
        applyRichTextCommand(textarea, button.getAttribute("data-command"));
      });
      textarea.parentNode.insertBefore(toolbar, textarea);
      textarea.dataset.toolbarReady = "true";
    });
  }

  function setTheme(theme) {
    state.ui.theme = theme === "light" ? "light" : "dark";
    dom.body.setAttribute("data-theme", state.ui.theme);
    dom.themeToggle.textContent = state.ui.theme === "dark" ? "Light Mode" : "Dark Mode";
  }

  function getOwnedCounts() {
    const owned = state.reports.filter((report) => report.authorId === (state.user && state.user.id));
    return {
      owned: owned.length,
      drafts: owned.filter((report) => report.status === "draft").length,
      published: owned.filter((report) => report.status === "published").length
    };
  }

  function computeStats() {
    return {
      total: state.reports.length,
      draft: state.reports.filter((report) => report.status === "draft").length,
      published: state.reports.filter((report) => report.status === "published").length,
      locked: 0
    };
  }

  function computeCategoryCounts() {
    const counts = { all: state.reports.length };
    config.categories.forEach((category) => {
      if (category.id !== "all") {
        counts[category.id] = state.reports.filter((report) => report.categoryId === category.id).length;
      }
    });
    return counts;
  }

  function getFilteredReports() {
    let results = state.reports.slice();

    if (state.filters.category !== "all") {
      results = results.filter((report) => report.categoryId === state.filters.category);
    }
    if (state.filters.status !== "all") {
      results = results.filter((report) => report.status === state.filters.status);
    }
    if (state.filters.subject !== "all") {
      results = results.filter((report) => report.academic.subjectName === state.filters.subject);
    }
    if (state.filters.level !== "all") {
      results = results.filter((report) => report.student.studentLevel === state.filters.level);
    }
    if (state.filters.term !== "all") {
      results = results.filter((report) => report.student.studentTerm === state.filters.term);
    }
    if (state.filters.teacherCategory !== "all") {
      results = results.filter((report) => report.academic.teacherDesignation === state.filters.teacherCategory);
    }
    if (state.filters.quick === "locked") {
      results = results.filter((report) => report.lockAcademicFields);
    } else if (state.filters.quick === "published" || state.filters.quick === "draft") {
      results = results.filter((report) => report.status === state.filters.quick);
    }
    if (state.filters.search) {
      const query = utils.normalizeSearch(state.filters.search);
      results = results.filter((report) => {
        const haystack = [
          report.title,
          report.summary,
          report.academic.subjectName,
          report.academic.subjectCode,
          report.academic.teacherName,
          report.academic.teacherDesignation,
          report.sections.result,
          report.sections.objective
        ].map(utils.normalizeSearch).join(" ");
        return haystack.includes(query);
      });
    }

    switch (state.filters.sort) {
      case "oldest":
        results.sort((left, right) => utils.compareDateDesc(left.updatedAt, right.updatedAt) * -1);
        break;
      case "title":
        results.sort((left, right) => left.title.localeCompare(right.title));
        break;
      case "subject":
        results.sort((left, right) => left.academic.subjectName.localeCompare(right.academic.subjectName));
        break;
      default:
        results.sort((left, right) => utils.compareDateDesc(left.updatedAt, right.updatedAt));
        break;
    }

    return results;
  }

  function getReportById(reportId) {
    return state.reports.find((report) => report.id === reportId) || null;
  }

  function getFeaturedReport() {
    return state.reports.find((report) => report.featured)
      || state.reports.find((report) => report.status === "published")
      || state.reports[0]
      || null;
  }

  function renderSubjectOptions() {
    const subjects = utils.distinct(state.reports.map((report) => report.academic.subjectName)).sort((left, right) => left.localeCompare(right));
    dom.subjectFilter.innerHTML = `<option value="all">All Subjects</option>${subjects.map((subject) => `
      <option value="${utils.escapeHtml(subject)}">${utils.escapeHtml(subject)}</option>
    `).join("")}`;
    dom.subjectFilter.value = subjects.includes(state.filters.subject) ? state.filters.subject : "all";
  }

  function renderAcademicFilterOptions() {
    const levels = utils.distinct(state.reports.map((report) => report.student.studentLevel)).sort((left, right) => left.localeCompare(right));
    const terms = utils.distinct(state.reports.map((report) => report.student.studentTerm)).sort((left, right) => left.localeCompare(right));
    const teacherCategories = utils.distinct(state.reports.map((report) => report.academic.teacherDesignation)).sort((left, right) => left.localeCompare(right));

    dom.levelFilter.innerHTML = `<option value="all">All Levels</option>${levels.map((level) => `
      <option value="${utils.escapeHtml(level)}">${utils.escapeHtml(level)}</option>
    `).join("")}`;
    dom.termFilter.innerHTML = `<option value="all">All Terms</option>${terms.map((term) => `
      <option value="${utils.escapeHtml(term)}">${utils.escapeHtml(term)}</option>
    `).join("")}`;
    dom.teacherCategoryFilter.innerHTML = `<option value="all">All Categories</option>${teacherCategories.map((designation) => `
      <option value="${utils.escapeHtml(designation)}">${utils.escapeHtml(designation)}</option>
    `).join("")}`;

    dom.levelFilter.value = levels.includes(state.filters.level) ? state.filters.level : "all";
    dom.termFilter.value = terms.includes(state.filters.term) ? state.filters.term : "all";
    dom.teacherCategoryFilter.value = teacherCategories.includes(state.filters.teacherCategory) ? state.filters.teacherCategory : "all";
  }

  function renderCategoryOptions() {
    dom.reportCategory.innerHTML = config.categories
      .filter((category) => category.id !== "all")
      .map((category) => `<option value="${category.id}">${utils.escapeHtml(category.name)}</option>`)
      .join("");
  }

  function renderLevelTermOptions() {
    dom.studentLevel.innerHTML = `<option value="">Select Level</option>${config.levelOptions.map((level) => `
      <option value="${utils.escapeHtml(level)}">${utils.escapeHtml(level)}</option>
    `).join("")}`;
    dom.studentTerm.innerHTML = `<option value="">Select Term</option>${config.termOptions.map((term) => `
      <option value="${utils.escapeHtml(term)}">${utils.escapeHtml(term)}</option>
    `).join("")}`;
  }

  function renderUserDashboard() {
    if (!state.dashboard) {
      dom.dashboardStats.innerHTML = "";
      dom.dashboardUserList.innerHTML = templates.renderUserDashboard(null, "");
      dom.dashboardLogs.innerHTML = templates.renderActivityLog(null);
      return;
    }

    dom.dashboardStats.innerHTML = `
      <article class="stat-card"><span class="stat-value">${state.dashboard.totalReports}</span><span class="stat-label">Total Reports</span></article>
      <article class="stat-card"><span class="stat-value">${state.dashboard.publishedReports}</span><span class="stat-label">Published</span></article>
      <article class="stat-card"><span class="stat-value">${state.dashboard.draftReports}</span><span class="stat-label">Drafts</span></article>
      <article class="stat-card"><span class="stat-value">${state.dashboard.todayViewerCount}</span><span class="stat-label">Watching Today</span></article>
    `;
    dom.dashboardUserList.innerHTML = templates.renderUserDashboard(state.dashboard, "");
    dom.dashboardLogs.innerHTML = templates.renderActivityLog(state.dashboard);
  }

  function renderDatalists() {
    const mount = (list, values) => {
      list.innerHTML = utils.toArray(values).map((value) => `<option value="${utils.escapeHtml(value)}"></option>`).join("");
    };
    mount(dom.subjectNameSuggestions, state.academicSuggestions.subjectNames);
    mount(dom.subjectCodeSuggestions, state.academicSuggestions.subjectCodes);
    mount(dom.teacherNameSuggestions, state.academicSuggestions.teacherNames);
    mount(dom.teacherDesignationSuggestions, state.academicSuggestions.teacherDesignations);
  }

  function renderDashboard() {
    const stats = computeStats();
    const categoryCounts = computeCategoryCounts();
    const filteredReports = getFilteredReports();
    const featuredReport = getFeaturedReport();

    dom.metricTotalReports.textContent = String(stats.total);
    dom.metricPublishedReports.textContent = String(stats.published);
    dom.metricDraftReports.textContent = String(stats.draft);
    dom.metricAcademicProfiles.textContent = String(utils.toArray(state.academicSuggestions.profiles).length);
    dom.metricTodayViewers.textContent = String(state.security.todayViewerCount || 0);
    dom.profileSummary.innerHTML = templates.renderProfileSummary(state.user, getOwnedCounts());
    dom.securitySummary.innerHTML = templates.renderSecuritySummary(state.security);
    dom.categoryList.innerHTML = templates.renderCategories(config.categories, categoryCounts, state.filters.category);
    dom.academicMemoryList.innerHTML = templates.renderAcademicMemory(state.academicSuggestions);
    dom.statsGrid.innerHTML = templates.renderStats(stats);
    dom.quickFilterChips.innerHTML = templates.renderQuickFilters(state.filters.quick);
    dom.featuredMount.innerHTML = templates.renderFeatured(featuredReport);
    dom.reportsGrid.innerHTML = templates.renderReportsGrid(filteredReports, state.user);
    dom.resultsSummary.textContent = `${filteredReports.length} report${filteredReports.length === 1 ? "" : "s"} shown`;
    dom.emptyState.classList.toggle("hidden", filteredReports.length !== 0);
    dom.reportsGrid.classList.toggle("hidden", filteredReports.length === 0);
    dom.resumeDraftBtn.classList.toggle("hidden", !state.draft);
    dom.openDashboardBtn.classList.toggle("hidden", !config.ENABLE_ADMIN || !state.security.canAdministerUsers);
    const canCreateReports = Boolean(state.user && utils.canEditContent(state.user));
    dom.openEditorBtn.classList.toggle("hidden", !canCreateReports);
    dom.emptyCreateBtn.classList.toggle("hidden", !canCreateReports);
    dom.openEditorBtn.hidden = !canCreateReports;
    dom.emptyCreateBtn.hidden = !canCreateReports;
    dom.openEditorBtn.setAttribute("aria-hidden", canCreateReports ? "false" : "true");
    dom.emptyCreateBtn.setAttribute("aria-hidden", canCreateReports ? "false" : "true");
    if (dom.emptyStateCopy) {
      dom.emptyStateCopy.textContent = canCreateReports
        ? "Try another search term, switch category, or create a new report."
        : "Try another search term or switch category.";
    }
    dom.openAuthBtn.classList.toggle("hidden", !config.ENABLE_ADMIN);
    dom.openAuthBtn.hidden = !config.ENABLE_ADMIN;
    dom.openAuthBtn.textContent = state.user ? "Sign Out" : "Sign In";
    renderSubjectOptions();
    renderAcademicFilterOptions();
    renderDatalists();
    renderUserDashboard();
  }

  function setAutosaveStatus(message, topMessage) {
    dom.autosaveStatus.textContent = message;
    dom.autosaveTopStatus.textContent = topMessage || message;
  }

  function createTableRow(rowValues, index) {
    const row = global.document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
      <span class="table-row-index">${index + 1}</span>
      <input class="field-input table-cell-input" type="text" data-col="0" value="${utils.escapeHtml(rowValues[0] || "")}" placeholder="Value">
      <input class="field-input table-cell-input" type="text" data-col="1" value="${utils.escapeHtml(rowValues[1] || "")}" placeholder="Value">
      <input class="field-input table-cell-input" type="text" data-col="2" value="${utils.escapeHtml(rowValues[2] || "")}" placeholder="Value">
      <input class="field-input table-cell-input" type="text" data-col="3" value="${utils.escapeHtml(rowValues[3] || "")}" placeholder="Value">
      <div class="table-row-actions">
        <button class="mini-btn" type="button" data-action="remove-table-row">Remove</button>
      </div>
    `;
    return row;
  }

  function refreshTableRowIndices() {
    Array.from(dom.tableRows.children).forEach((row, index) => {
      const badge = row.querySelector(".table-row-index");
      if (badge) {
        badge.textContent = String(index + 1);
      }
    });
  }

  function setTableRows(rows) {
    dom.tableRows.innerHTML = "";
    const items = utils.toArray(rows).length ? rows : [["", "", "", ""]];
    items.forEach((row, index) => dom.tableRows.appendChild(createTableRow(row, index)));
    refreshTableRowIndices();
  }

  function addTableRow(values) {
    if (dom.tableRows.children.length >= config.maxDataRows) {
      showToast("Row limit reached", `Only ${config.maxDataRows} rows are allowed per report table.`, "warning");
      return;
    }
    dom.tableRows.appendChild(createTableRow(values || ["", "", "", ""], dom.tableRows.children.length));
    refreshTableRowIndices();
  }

  function setDiagramPreview(dataUrl, caption) {
    const safeUrl = utils.sanitizeDataUrl(dataUrl);
    dom.diagramPreview.dataset.value = safeUrl;
    dom.diagramPreview.classList.toggle("empty", !safeUrl);
    dom.diagramPreview.innerHTML = safeUrl
      ? `<img src="${safeUrl}" alt="${utils.escapeHtml(caption || "Circuit diagram preview")}">`
      : '<div class="diagram-preview-placeholder">No diagram uploaded yet</div>';
  }

  function updateAcademicLockState() {
    [dom.subjectName, dom.subjectCode, dom.teacherName, dom.teacherDesignation].forEach((element) => {
      element.disabled = false;
    });
  }

  function findAcademicProfile(subjectName, subjectCode) {
    const subjectKey = utils.normalizeSearch(subjectName);
    const codeKey = utils.normalizeSearch(subjectCode);
    return utils.toArray(state.academicSuggestions.profiles).find((profile) => (
      (subjectKey && utils.normalizeSearch(profile.subjectName) === subjectKey)
      || (codeKey && utils.normalizeSearch(profile.subjectCode) === codeKey)
    )) || null;
  }

  function renderAcademicSuggestion(profile) {
    state.editor.currentSuggestedProfile = profile;
    if (!profile) {
      dom.profileSuggestionBar.classList.add("hidden");
      dom.profileSuggestionBar.innerHTML = "";
      return;
    }
    dom.profileSuggestionBar.classList.remove("hidden");
    dom.profileSuggestionBar.innerHTML = templates.renderAcademicSuggestion(profile);
  }

  function buildCoverDefaults() {
    const lastUsed = state.academicSuggestions.lastUsedProfile || {};
    const today = new Date().toISOString().slice(0, 10);
    const yearSemester = state.user
      ? [state.user.level, state.user.term].filter(Boolean).join(", ")
      : [config.defaultStudentProfile.studentLevel, config.defaultStudentProfile.studentTerm].join(", ");
    const reportElements = dom.reportForm && dom.reportForm.elements ? dom.reportForm.elements : null;
    const courseCode = reportElements ? reportElements.namedItem("subjectCode") : null;
    const courseTitle = reportElements ? reportElements.namedItem("subjectName") : null;
    const experimentNo = reportElements ? reportElements.namedItem("experimentNo") : null;
    const experimentDate = reportElements ? reportElements.namedItem("experimentDate") : null;
    const experimentName = reportElements ? reportElements.namedItem("title") : null;
    const studentName = reportElements ? reportElements.namedItem("studentName") : null;
    const studentId = reportElements ? reportElements.namedItem("studentId") : null;
    const levelField = reportElements ? reportElements.namedItem("studentLevel") : null;
    const termField = reportElements ? reportElements.namedItem("studentTerm") : null;
    const teacherName = reportElements ? reportElements.namedItem("teacherName") : null;
    const teacherDesignation = reportElements ? reportElements.namedItem("teacherDesignation") : null;
    const department = reportElements ? reportElements.namedItem("studentDepartment") : null;
    const activeYearSemester = [levelField && levelField.value, termField && termField.value]
      .filter(Boolean)
      .join(", ");

    return {
      coverStyle: "classic",
      courseCode: (courseCode && courseCode.value.trim()) || lastUsed.subjectCode || "",
      courseTitle: (courseTitle && courseTitle.value.trim()) || lastUsed.subjectName || "",
      experimentNo: (experimentNo && experimentNo.value.trim()) || "",
      experimentName: (experimentName && experimentName.value.trim()) || "",
      experimentDate: (experimentDate && experimentDate.value) || today,
      studentName: (studentName && studentName.value.trim()) || (state.user && state.user.name ? state.user.name : config.defaultStudentProfile.studentName),
      studentId: (studentId && studentId.value.trim()) || (state.user && state.user.studentId ? state.user.studentId : config.defaultStudentProfile.studentId),
      batch: "",
      yearSemester: activeYearSemester || yearSemester,
      teacherName: (teacherName && teacherName.value.trim()) || lastUsed.teacherName || "",
      teacherDesignation: (teacherDesignation && teacherDesignation.value.trim()) || lastUsed.teacherDesignation || "",
      department: (department && department.value.trim()) || (state.user && state.user.department ? state.user.department : config.defaultStudentProfile.studentDepartment)
    };
  }

  function fillCoverForm(values) {
    const data = values || buildCoverDefaults();
    Object.keys(data).forEach((key) => {
      const field = dom.coverForm && dom.coverForm.elements ? dom.coverForm.elements.namedItem(key) : null;
      if (field) {
        field.value = data[key] || "";
      }
    });
    renderCoverPreview();
  }

  function serializeCoverForm() {
    return {
      coverStyle: dom.coverForm.elements.namedItem("coverStyle").value,
      courseCode: dom.coverForm.elements.namedItem("courseCode").value.trim(),
      courseTitle: dom.coverForm.elements.namedItem("courseTitle").value.trim(),
      experimentNo: dom.coverForm.elements.namedItem("experimentNo").value.trim(),
      experimentName: dom.coverForm.elements.namedItem("experimentName").value.trim(),
      experimentDate: dom.coverForm.elements.namedItem("experimentDate").value,
      studentName: dom.coverForm.elements.namedItem("studentName").value.trim(),
      studentId: dom.coverForm.elements.namedItem("studentId").value.trim(),
      batch: dom.coverForm.elements.namedItem("batch").value.trim(),
      yearSemester: dom.coverForm.elements.namedItem("yearSemester").value.trim(),
      teacherName: dom.coverForm.elements.namedItem("teacherName").value.trim(),
      teacherDesignation: dom.coverForm.elements.namedItem("teacherDesignation").value.trim(),
      department: dom.coverForm.elements.namedItem("department").value.trim()
    };
  }

  function getCoverLogoMarkup() {
    return `<div class="cover-page-logo-frame"><img class="cover-page-logo-image" src="${coverLogoPath}" alt="Bangladesh Army University of Science and Technology, Khulna logo"></div>`;
  }

  function getCoverTheme(style) {
    const themes = {
      classic: {
        previewClass: "is-classic",
        pageClass: "is-classic",
        primary: [21, 63, 122],
        secondary: [59, 75, 100],
        softFill: [247, 249, 252],
        accentLabel: "Classic Blue"
      },
      blackwhite: {
        previewClass: "is-blackwhite",
        pageClass: "is-blackwhite",
        primary: [20, 20, 20],
        secondary: [70, 70, 70],
        softFill: [250, 250, 250],
        accentLabel: "Black & White"
      },
      formal: {
        previewClass: "is-formal",
        pageClass: "is-formal",
        primary: [104, 78, 31],
        secondary: [79, 68, 50],
        softFill: [250, 247, 239],
        accentLabel: "Formal Gold"
      },
      emerald: {
        previewClass: "is-emerald",
        pageClass: "is-emerald",
        primary: [29, 89, 72],
        secondary: [56, 81, 72],
        softFill: [242, 249, 246],
        accentLabel: "Emerald Academic"
      }
    };
    return themes[style] || themes.classic;
  }

  function loadCoverLogoPng() {
    if (coverLogoPngPromise) {
      return coverLogoPngPromise;
    }

    coverLogoPngPromise = global.fetch(coverLogoPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Logo unavailable");
        }
        return response.text();
      })
      .then((svgMarkup) => new Promise((resolve, reject) => {
        const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup);
        const image = new global.Image();
        image.onload = () => {
          try {
            const canvas = global.document.createElement("canvas");
            canvas.width = 520;
            canvas.height = 520;
            const context = canvas.getContext("2d");
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 30, 30, canvas.width - 60, canvas.height - 60);
            resolve(canvas.toDataURL("image/png"));
          } catch (error) {
            reject(error);
          }
        };
        image.onerror = () => reject(new Error("Unable to load logo"));
        image.src = svgDataUrl;
      }))
      .catch(() => "");

    return coverLogoPngPromise;
  }

  function renderCoverPreview() {
    const data = serializeCoverForm();
    const theme = getCoverTheme(data.coverStyle);
    dom.coverPreview.className = `cover-preview-page ${theme.pageClass}`;
    dom.coverPreview.innerHTML = `
      <div class="cover-page-inner ${theme.previewClass}">
        <div class="cover-page-border"></div>
        <div class="cover-page-topline">
          <div class="cover-page-brand-full">Bangladesh Army University of Science and Technology, Khulna</div>
          <div class="cover-page-brand-ring">${utils.escapeHtml(theme.accentLabel)} Cover Style</div>
          ${getCoverLogoMarkup()}
        </div>
        <div class="cover-page-title">Lab Report</div>
        <div class="cover-page-remarks">Remarks</div>
        <div class="cover-detail-list">
          <div class="cover-detail-row"><span class="cover-detail-label">Course Code</span><span class="cover-detail-value">${utils.escapeHtml(data.courseCode || "-")}</span></div>
          <div class="cover-detail-row"><span class="cover-detail-label">Course Title</span><span class="cover-detail-value">${utils.escapeHtml(data.courseTitle || "-")}</span></div>
          <div class="cover-detail-row"><span class="cover-detail-label">Experiment No</span><span class="cover-detail-value">${utils.escapeHtml(data.experimentNo || "-")}</span></div>
          <div class="cover-detail-row"><span class="cover-detail-label">Experiment Name</span><span class="cover-detail-value">${utils.escapeHtml(data.experimentName || "-")}</span></div>
          <div class="cover-detail-row"><span class="cover-detail-label">Date of Experiment</span><span class="cover-detail-value">${utils.escapeHtml(utils.formatDate(data.experimentDate, "-"))}</span></div>
        </div>
        <div class="cover-columns">
          <div>
            <div class="cover-column-title">Submitted by</div>
            <div class="cover-column-copy">
              <div><strong>Name of Student:</strong> ${utils.escapeHtml(data.studentName || "-")}</div>
              <div><strong>Student ID:</strong> ${utils.escapeHtml(data.studentId || "-")}</div>
              <div><strong>Batch:</strong> ${utils.escapeHtml(data.batch || "-")}</div>
              <div><strong>Year & Semester:</strong> ${utils.escapeHtml(data.yearSemester || "-")}</div>
            </div>
          </div>
          <div>
            <div class="cover-column-title">Submitted to</div>
            <div class="cover-column-copy">
              <div><strong>Name of Teacher:</strong> ${utils.escapeHtml(data.teacherName || "-")}</div>
              <div><strong>Designation:</strong> ${utils.escapeHtml(data.teacherDesignation || "-")}</div>
              <div><strong>Department:</strong> ${utils.escapeHtml(data.department || "-")}</div>
            </div>
          </div>
        </div>
        <div class="cover-footer-block">
          <div class="cover-signature">
            <div class="cover-signature-line"></div>
            <div>Signature of the Teacher</div>
          </div>
        </div>
      </div>
    `;
  }

  function openCoverGenerator() {
    fillCoverForm(buildCoverDefaults());
    openModal("cover");
  }

  async function downloadCoverPdf() {
    if (!global.jspdf || !global.jspdf.jsPDF) {
      showToast("PDF unavailable", "The PDF library is not loaded right now.", "danger");
      return;
    }

    const data = serializeCoverForm();
    const doc = new global.jspdf.jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = 210;
    const margin = 18;
    let y = 16;
    const logoPng = await loadCoverLogoPng();
    const theme = getCoverTheme(data.coverStyle);

    const centerText = (text, size, weight, atY) => {
      doc.setFont("helvetica", weight);
      doc.setFontSize(size);
      const width = doc.getTextWidth(text);
      doc.text(text, (pageWidth - width) / 2, atY);
    };

    doc.setDrawColor(...theme.primary);
    doc.setLineWidth(0.6);
    doc.rect(10, 10, 190, 277);

    doc.setDrawColor(...theme.secondary);
    doc.roundedRect(24, y - 2, 162, 16, 6, 6);
    centerText("Bangladesh Army University of", 11, "bold", y + 4.5);
    centerText("Science and Technology, Khulna", 11, "bold", y + 10);
    doc.setLineWidth(0.4);
    doc.setDrawColor(...theme.primary);
    doc.line(margin, y + 18, pageWidth - margin, y + 18);
    y += 26;

    if (logoPng) {
      try {
        doc.addImage(logoPng, "PNG", (pageWidth / 2) - 20, y - 2, 40, 40);
      } catch (error) {
        doc.circle(pageWidth / 2, y + 18, 18);
        doc.circle(pageWidth / 2, y + 18, 15.5);
        doc.setFontSize(8);
        centerText("University Logo", 8, "normal", y + 19.5);
      }
    } else {
      doc.circle(pageWidth / 2, y + 18, 18);
      doc.circle(pageWidth / 2, y + 18, 15.5);
      doc.setFontSize(8);
      centerText("University Logo", 8, "normal", y + 19.5);
    }
    y += 46;

    centerText("Lab Report", 20, "bold", y);
    y += 6;
    centerText(theme.accentLabel + " Style", 10, "normal", y);
    y += 6;
    doc.setFillColor(...theme.softFill);
    doc.rect(margin, y, pageWidth - (margin * 2), 18, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Remarks", margin + 4, y + 6);
    y += 28;

    const rows = [
      ["Course Code", data.courseCode || "-"],
      ["Course Title", data.courseTitle || "-"],
      ["Experiment No", data.experimentNo || "-"],
      ["Experiment Name", data.experimentName || "-"],
      ["Date of Experiment", utils.formatDate(data.experimentDate, "-")]
    ];
    rows.forEach((row) => {
      doc.setDrawColor(...theme.secondary);
      doc.setLineWidth(0.2);
      doc.roundedRect(28, y - 5.5, 154, 11, 3, 3);
      centerText(row[0], 10.5, "bold", y - 0.2);
      centerText(row[1], 11, "normal", y + 4.3);
      y += 14;
    });

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Submitted by", margin, y);
    doc.text("Submitted to", 112, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(...theme.secondary);
    doc.line(margin, y + 2, 92, y + 2);
    doc.line(112, y + 2, 192, y + 2);
    y += 8;
    doc.setFont("helvetica", "normal");
    [
      ["Name of Student", data.studentName || "-"],
      ["Student ID", data.studentId || "-"],
      ["Batch", data.batch || "-"],
      ["Year & Semester", data.yearSemester || "-"]
    ].forEach((row, index) => {
      doc.setFont("helvetica", "bold");
      doc.text(row[0], margin, y + (index * 8));
      doc.setFont("helvetica", "normal");
      doc.text(": " + row[1], margin + 34, y + (index * 8));
    });
    [
      ["Name of Teacher", data.teacherName || "-"],
      ["Designation", data.teacherDesignation || "-"],
      ["Department", data.department || "-"]
    ].forEach((row, index) => {
      doc.setFont("helvetica", "bold");
      doc.text(row[0], 112, y + (index * 8));
      doc.setFont("helvetica", "normal");
      doc.text(": " + row[1], 145, y + (index * 8));
    });

    doc.line(140, 278, 190, 278);
    doc.text("Signature of the Teacher", 146, 284);
    doc.save("Lab_Report_Cover_Page.pdf");
    showToast("Cover page ready", "The A4 lab report cover page PDF has been downloaded.", "success");
  }

  function confirmAction(options) {
    dom.confirmTitle.textContent = options.title || "Confirm Action";
    dom.confirmMessage.textContent = options.message || "Are you sure?";
    openModal("confirm");
    return new Promise((resolve) => {
      state.confirm = { resolve };
    });
  }

  function resolveConfirm(value) {
    if (state.confirm && typeof state.confirm.resolve === "function") {
      state.confirm.resolve(Boolean(value));
    }
    state.confirm = null;
    closeModal("confirm");
  }

  function applyAcademicProfile(profile, options) {
    if (!profile) {
      return;
    }

    const force = Boolean(options && options.force);
    const current = {
      subjectName: dom.subjectName.value,
      subjectCode: dom.subjectCode.value,
      teacherName: dom.teacherName.value,
      teacherDesignation: dom.teacherDesignation.value
    };
    const differs = ["subjectName", "subjectCode", "teacherName", "teacherDesignation"]
      .some((field) => utils.normalizeText(current[field]) && utils.normalizeText(current[field]) !== utils.normalizeText(profile[field]));

    const writeProfile = () => {
      dom.subjectName.value = profile.subjectName || dom.subjectName.value;
      dom.subjectCode.value = profile.subjectCode || dom.subjectCode.value;
      dom.teacherName.value = profile.teacherName || dom.teacherName.value;
      dom.teacherDesignation.value = profile.teacherDesignation || dom.teacherDesignation.value;
      state.editor.dirty = true;
      renderAcademicSuggestion(null);
      showToast("Academic profile applied", "Saved metadata was filled into the form.", "success");
    };

    if (force && differs) {
      confirmAction({
        title: "Replace academic fields?",
        message: "This will overwrite the current subject and teacher values with the saved academic profile."
      }).then((confirmed) => {
        if (confirmed) {
          writeProfile();
        }
      });
      return;
    }

    writeProfile();
  }

  function evaluateAcademicSuggestion(autoApply) {
    const profile = findAcademicProfile(dom.subjectName.value, dom.subjectCode.value);
    if (!profile) {
      renderAcademicSuggestion(null);
      return;
    }

    const missingTeacher = !utils.normalizeText(dom.teacherName.value) && !utils.normalizeText(dom.teacherDesignation.value);
    const missingCode = !utils.normalizeText(dom.subjectCode.value);
    if (autoApply && (missingTeacher || missingCode)) {
      applyAcademicProfile(profile, { force: false });
      return;
    }

    const differs = ["subjectCode", "teacherName", "teacherDesignation"].some((field) => (
      utils.normalizeText(dom[field].value)
      && utils.normalizeText(dom[field].value) !== utils.normalizeText(profile[field])
    ));
    renderAcademicSuggestion(differs ? profile : null);
  }

  function buildNewReportDefaults() {
    const lastUsed = state.academicSuggestions.lastUsedProfile || {};
    return {
      id: "",
      categoryId: lastUsed.categoryId || "circuits",
      status: "draft",
      title: "",
      summary: "",
      experimentNo: "",
      experimentDate: new Date().toISOString().slice(0, 10),
      student: {
        studentName: state.user && state.user.name ? state.user.name : config.defaultStudentProfile.studentName,
        studentId: state.user && state.user.studentId ? state.user.studentId : config.defaultStudentProfile.studentId,
        studentLevel: state.user && state.user.level ? state.user.level : config.defaultStudentProfile.studentLevel,
        studentTerm: state.user && state.user.term ? state.user.term : config.defaultStudentProfile.studentTerm,
        studentSection: state.user && state.user.section ? state.user.section : config.defaultStudentProfile.studentSection,
        studentDepartment: state.user && state.user.department ? state.user.department : config.defaultStudentProfile.studentDepartment,
        institution: config.defaultStudentProfile.institution
      },
      academic: {
        subjectName: lastUsed.subjectName || "",
        subjectCode: lastUsed.subjectCode || "",
        teacherName: lastUsed.teacherName || "",
        teacherDesignation: lastUsed.teacherDesignation || ""
      },
      lockAcademicFields: false,
      rememberAcademic: true,
      sections: {
        objective: "",
        theory: "",
        apparatus: "",
        procedure: "",
        result: "",
        conclusion: "",
        references: ""
      },
      circuitDiagram: {
        dataUrl: "",
        caption: ""
      },
      dataTable: {
        headers: ["Parameter", "Measured", "Calculated", "Remarks"],
        rows: [["", "", "", ""]]
      }
    };
  }

  function fillForm(report) {
    const data = report || buildNewReportDefaults();
    clearValidation();
    dom.reportId.value = data.id || "";
    dom.reportVersionSourceId.value = data.reportVersionSourceId || "";
    dom.reportForm.elements.namedItem("title").value = data.title || "";
    dom.reportCategory.value = data.categoryId || "circuits";
    dom.reportForm.elements.namedItem("status").value = data.status || "draft";
    dom.reportForm.elements.namedItem("experimentNo").value = data.experimentNo || "";
    dom.reportForm.elements.namedItem("experimentDate").value = data.experimentDate || "";
    dom.reportForm.elements.namedItem("summary").value = data.summary || "";

    dom.reportForm.elements.namedItem("studentName").value = data.student.studentName || "";
    dom.reportForm.elements.namedItem("studentId").value = data.student.studentId || "";
    dom.reportForm.elements.namedItem("studentLevel").value = data.student.studentLevel || "";
    dom.reportForm.elements.namedItem("studentTerm").value = data.student.studentTerm || "";
    dom.reportForm.elements.namedItem("studentSection").value = data.student.studentSection || "";
    dom.reportForm.elements.namedItem("studentDepartment").value = data.student.studentDepartment || "";
    dom.reportForm.elements.namedItem("institution").value = data.student.institution || "";

    dom.subjectName.value = data.academic.subjectName || "";
    dom.subjectCode.value = data.academic.subjectCode || "";
    dom.teacherName.value = data.academic.teacherName || "";
    dom.teacherDesignation.value = data.academic.teacherDesignation || "";
    dom.rememberAcademic.checked = data.rememberAcademic !== false;
    if (dom.lockAcademicFields) {
      dom.lockAcademicFields.checked = false;
    }
    updateAcademicLockState();

    dom.reportForm.elements.namedItem("objective").value = data.sections.objective || "";
    dom.reportForm.elements.namedItem("theory").value = data.sections.theory || "";
    dom.reportForm.elements.namedItem("apparatus").value = data.sections.apparatus || "";
    dom.reportForm.elements.namedItem("procedure").value = data.sections.procedure || "";
    dom.reportForm.elements.namedItem("result").value = data.sections.result || "";
    dom.reportForm.elements.namedItem("conclusion").value = data.sections.conclusion || "";
    dom.reportForm.elements.namedItem("references").value = data.sections.references || "";

    Array.from(global.document.querySelectorAll(".table-header-input")).forEach((input, index) => {
      input.value = utils.toArray(data.dataTable.headers)[index] || "";
    });
    setTableRows(data.dataTable.rows);
    dom.diagramCaption.value = data.circuitDiagram.caption || "";
    setDiagramPreview(data.circuitDiagram.dataUrl, data.circuitDiagram.caption);
    renderAcademicSuggestion(null);
    state.editor.dirty = false;
    setAutosaveStatus("Autosave idle", "Vault ready");
  }

  function serializeForm() {
    const headers = Array.from(global.document.querySelectorAll(".table-header-input")).map((input) => input.value.trim());
    const rows = Array.from(dom.tableRows.children)
      .map((row) => Array.from(row.querySelectorAll(".table-cell-input")).map((input) => input.value.trim()))
      .filter((row) => row.some((cell) => utils.normalizeText(cell)));

    return {
      id: dom.reportId.value || undefined,
      reportVersionSourceId: dom.reportVersionSourceId.value || undefined,
      title: dom.reportForm.elements.namedItem("title").value.trim(),
      categoryId: dom.reportCategory.value,
      status: dom.reportForm.elements.namedItem("status").value,
      summary: dom.reportForm.elements.namedItem("summary").value.trim(),
      experimentNo: dom.reportForm.elements.namedItem("experimentNo").value.trim(),
      experimentDate: dom.reportForm.elements.namedItem("experimentDate").value,
      lockAcademicFields: false,
      rememberAcademic: dom.rememberAcademic.checked,
      student: {
        studentName: dom.reportForm.elements.namedItem("studentName").value.trim(),
        studentId: dom.reportForm.elements.namedItem("studentId").value.trim(),
        studentLevel: dom.reportForm.elements.namedItem("studentLevel").value.trim(),
        studentTerm: dom.reportForm.elements.namedItem("studentTerm").value.trim(),
        studentSection: dom.reportForm.elements.namedItem("studentSection").value.trim(),
        studentDepartment: dom.reportForm.elements.namedItem("studentDepartment").value.trim(),
        institution: dom.reportForm.elements.namedItem("institution").value.trim()
      },
      academic: {
        subjectName: dom.subjectName.value.trim(),
        subjectCode: dom.subjectCode.value.trim(),
        teacherName: dom.teacherName.value.trim(),
        teacherDesignation: dom.teacherDesignation.value.trim()
      },
      sections: {
        objective: dom.reportForm.elements.namedItem("objective").value.trim(),
        theory: dom.reportForm.elements.namedItem("theory").value.trim(),
        apparatus: dom.reportForm.elements.namedItem("apparatus").value.trim(),
        procedure: dom.reportForm.elements.namedItem("procedure").value.trim(),
        result: dom.reportForm.elements.namedItem("result").value.trim(),
        conclusion: dom.reportForm.elements.namedItem("conclusion").value.trim(),
        references: dom.reportForm.elements.namedItem("references").value.trim()
      },
      circuitDiagram: {
        dataUrl: dom.diagramPreview.dataset.value || "",
        caption: dom.diagramCaption.value.trim()
      },
      dataTable: {
        headers,
        rows
      }
    };
  }

  async function persistWorkspaceDraft(silent) {
    if (!state.user) {
      return;
    }
    try {
      state.draft = await backend.saveDraft(state.user.id, {
        report: serializeForm(),
        mode: state.editor.mode,
        currentReportId: state.editor.currentReportId
      });
      setAutosaveStatus("Workspace autosaved", "Autosaved");
      if (!silent) {
        showToast("Workspace saved", "Editor state was saved locally.", "success");
      }
    } catch (error) {
      setAutosaveStatus("Autosave failed", "Autosave issue");
      if (!silent) {
        showToast("Autosave failed", "Unable to persist the workspace.", "danger");
      }
    }
  }

  function scheduleAutosave() {
    if (!state.user || !dom.editorModal.classList.contains("is-open")) {
      return;
    }
    setAutosaveStatus("Typing detected", "Typing");
    autosaveRunner();
  }

  function showDraftRestoreBanner() {
    if (!state.draft || state.editor.mode !== "create") {
      dom.autosaveRestoreBanner.classList.add("hidden");
      dom.autosaveRestoreBanner.innerHTML = "";
      return;
    }
    dom.autosaveRestoreBanner.classList.remove("hidden");
    dom.autosaveRestoreBanner.innerHTML = `
      <span>Recovered an auto-saved draft from ${utils.escapeHtml(utils.formatDateTime(state.draft.savedAt))}.</span>
      <button class="btn btn-secondary" type="button" data-action="restore-workspace">Restore Draft</button>
    `;
  }

  function restoreWorkspaceDraft() {
    if (!state.draft || !state.draft.payload || !state.draft.payload.report) {
      return;
    }
    fillForm(state.draft.payload.report);
    dom.editorTitle.textContent = "Recovered Auto-Saved Draft";
    setAutosaveStatus("Recovered auto-save", "Draft restored");
    dom.autosaveRestoreBanner.classList.add("hidden");
    showToast("Draft restored", "Your auto-saved workspace was loaded back into the editor.", "success");
  }

  function populatePayload(payload) {
    state.user = payload.user || null;
    state.users = utils.toArray(payload.users);
    state.reports = utils.toArray(payload.reports);
    state.draft = payload.draft || null;
    state.security = payload.security || state.security;
    state.dashboard = payload.dashboard || null;
    state.academicSuggestions = payload.academicSuggestions || state.academicSuggestions;
    setTheme(payload.preferences && payload.preferences.theme ? payload.preferences.theme : "dark");
    renderDashboard();
    if (state.user) {
      auth.closeAuth(dom);
    }
  }

  function openEditor(report, options) {
    if (!config.ENABLE_ADMIN) {
      showToast("Admin disabled", "Editing is disabled in config.js.", "warning");
      return false;
    }
    if (!state.user) {
      auth.openAuth(dom);
      showToast("Sign in required", "Please sign in to create or edit reports.", "warning");
      return false;
    }
    if (!utils.canEditContent(state.user)) {
      showToast("Read-only account", "The super admin has set this account to read-only mode, so editing is disabled.", "warning");
      return false;
    }
    closeModal("viewer");
    const source = report ? utils.deepClone(report) : buildNewReportDefaults();
    state.editor.mode = report ? "edit" : "create";
    state.editor.currentReportId = report ? report.id : null;
    dom.editorTitle.textContent = report ? "Edit Report" : "Create New Report";
    fillForm(source);
    openModal("editor");
    showDraftRestoreBanner();
    if (options && options.focusField) {
      const field = global.document.getElementById(options.focusField);
      if (field) {
        field.focus();
      }
    }
    return true;
  }

  function closeEditor() {
    closeModal("editor");
    renderAcademicSuggestion(null);
  }

  function openViewer(reportId) {
    const report = getReportById(reportId);
    if (!report) {
      return;
    }
    const canManage = utils.canManageReport(state.user, report);
    const canDuplicate = Boolean(state.user && utils.canEditContent(state.user) && (report.status === "published" || canManage));
    state.viewerReportId = report.id;
    dom.viewerModalTitle.textContent = report.title;
    dom.viewerContent.innerHTML = templates.renderViewer(report);
    dom.viewerEditBtn.classList.toggle("hidden", !canManage);
    dom.viewerToggleStatusBtn.classList.toggle("hidden", !canManage);
    dom.viewerHistoryBtn.classList.toggle("hidden", !canManage);
    dom.viewerDeleteBtn.classList.toggle("hidden", !canManage);
    dom.viewerDuplicateBtn.classList.toggle("hidden", !canDuplicate);
    dom.viewerToggleStatusBtn.textContent = report.status === "published" ? "Move to Draft" : "Publish";
    openModal("viewer");
  }

  function renderHistoryModal(reportId) {
    const report = getReportById(reportId);
    if (!report) {
      return;
    }
    state.historyReportId = report.id;
    dom.historyList.innerHTML = templates.renderHistory(report);
    openModal("history");
  }

  async function saveReport(event) {
    if (event) {
      event.preventDefault();
    }

    clearValidation();
    setLoading(true, "Saving report...");
    try {
      const response = await backend.saveReport(serializeForm());
      populatePayload(response.payload);
      closeEditor();
      showToast("Report saved", "Your report was saved successfully.", "success");
      openViewer(response.report.id);
    } catch (error) {
      showValidation(error.errors || {});
      showToast("Save blocked", error.message || "Please review the form fields.", "danger");
    } finally {
      setLoading(false);
    }
  }

  async function deleteReport(reportId) {
    const confirmed = await confirmAction({
      title: "Delete report?",
      message: "This removes the report from local storage. Continue only if you are sure."
    });
    if (!confirmed) {
      return;
    }

    setLoading(true, "Deleting report...");
    try {
      const payload = await backend.deleteReport(reportId);
      populatePayload(payload);
      closeModal("viewer");
      closeModal("history");
      showToast("Report deleted", "The report was removed from the vault.", "success");
    } catch (error) {
      showToast("Delete failed", error.message || "Unable to delete the report.", "danger");
    } finally {
      setLoading(false);
    }
  }

  async function toggleCurrentReportStatus() {
    if (!state.viewerReportId) {
      return;
    }
    setLoading(true, "Updating report status...");
    try {
      const response = await backend.toggleReportStatus(state.viewerReportId);
      populatePayload(response.payload);
      openViewer(response.report.id);
      showToast("Status updated", "The report lifecycle state was changed.", "success");
    } catch (error) {
      showToast("Update failed", error.message || "Unable to change report status.", "danger");
    } finally {
      setLoading(false);
    }
  }

  async function duplicateCurrentReport() {
    if (!state.viewerReportId) {
      return;
    }
    setLoading(true, "Duplicating report...");
    try {
      const response = await backend.duplicateReport(state.viewerReportId);
      populatePayload(response.payload);
      showToast("Draft duplicated", "A draft copy was created from the current report.", "success");
      openEditor(response.report);
    } catch (error) {
      showToast("Duplicate failed", error.message || "Unable to duplicate the report.", "danger");
    } finally {
      setLoading(false);
    }
  }

  async function restoreVersion(versionId) {
    if (!state.historyReportId || !versionId) {
      return;
    }
    const confirmed = await confirmAction({
      title: "Restore this version?",
      message: "The current report will be replaced with the selected historical snapshot, and the current state will be saved to history."
    });
    if (!confirmed) {
      return;
    }

    setLoading(true, "Restoring version...");
    try {
      const response = await backend.restoreVersion(state.historyReportId, versionId);
      populatePayload(response.payload);
      closeModal("history");
      openViewer(response.report.id);
      showToast("Version restored", "The selected revision is now active.", "success");
    } catch (error) {
      showToast("Restore failed", error.message || "Unable to restore that version.", "danger");
    } finally {
      setLoading(false);
    }
  }

  async function exportCurrent(format) {
    const report = getReportById(state.viewerReportId);
    if (!report) {
      return;
    }
    try {
      if (format === "pdf") {
        const result = await exporters.exportPdf(report);
        showToast("PDF export ready", result.fallback ? "Print preview opened as a fallback." : "The PDF download has started.", "success");
      } else {
        const result = await exporters.exportDocx(report);
        showToast("DOCX export ready", result.fallback ? "Print preview opened as a fallback." : "The DOCX download has started.", "success");
      }
    } catch (error) {
      showToast("Export failed", error.message || "Unable to export the report right now.", "danger");
    }
  }

  async function refreshSessionActivity() {
    if (!state.user) {
      return;
    }
    try {
      const response = await backend.touchSession();
      if (response.expired) {
        state.user = null;
        state.dashboard = null;
        state.security = {
          sessionActive: false,
          sessionExpiresAt: "",
          lastActivityAt: "",
          sessionRemainingMs: 0,
          timeoutMs: config.security.sessionTimeoutMs,
          canAdministerUsers: false,
          roleKey: "viewer",
          accessMode: "viewer"
        };
        renderDashboard();
        showToast("Session expired", "Viewer mode is still available. Sign in again only when you want to keep editing.", "warning");
        return;
      }
      if (response.security) {
        state.security = response.security;
        renderDashboard();
      }
    } catch (error) {
      showToast("Security refresh failed", "Unable to refresh the local session timer.", "warning");
    }
  }

  async function handleThemeToggle() {
    const nextTheme = state.ui.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      await backend.updateTheme(nextTheme);
    } catch (error) {
      showToast("Theme save failed", "The theme changed, but the preference could not be stored.", "warning");
    }
  }

  async function handleLogin(username, password) {
    if (!config.ENABLE_ADMIN) {
      showToast("Admin disabled", "Admin access is disabled in config.js.", "warning");
      return;
    }
    auth.clearAuthAlert(dom);
    setLoading(true, "Signing in...");
    try {
      const payload = await backend.login({ username, password });
      state.dashboardSearch = "";
      dom.authPassword.value = "";
      populatePayload(payload);
      auth.closeAuth(dom);
      showToast("Access granted", "You are signed into the local vault.", "success");
    } catch (error) {
      auth.showAuthAlert(dom, error.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthAction() {
    if (!config.ENABLE_ADMIN) {
      showToast("Admin disabled", "Login is currently disabled by configuration.", "warning");
      return;
    }
    if (!state.user) {
      auth.openAuth(dom);
      return;
    }

    setLoading(true, "Signing out...");
    try {
      await backend.logout();
      const payload = await backend.bootstrap();
      populatePayload(payload);
      auth.closeAuth(dom);
      dom.authPassword.value = "";
      showToast("Signed out", "Guest mode is active now. Report creation is hidden.", "success");
    } catch (error) {
      showToast("Sign out failed", error.message || "Unable to switch to guest mode right now.", "danger");
    } finally {
      setLoading(false);
    }
  }

  function handleReportGridClick(event) {
    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      const reportId = actionButton.getAttribute("data-report-id");
      const action = actionButton.getAttribute("data-action");
      if (action === "edit") {
        const report = getReportById(reportId);
        if (report) {
          openEditor(report);
        }
      }
      if (action === "view") {
        openViewer(reportId);
      }
      return;
    }
    const card = event.target.closest("[data-report-id]");
    if (card) {
      openViewer(card.getAttribute("data-report-id"));
    }
  }

  function bindEvents() {
    autosaveRunner = utils.debounce(() => persistWorkspaceDraft(true), config.autosaveDelayMs);
    const touchSession = utils.throttle(() => {
      refreshSessionActivity();
    }, config.security.touchThrottleMs);

    dom.globalSearch.addEventListener("input", utils.debounce((event) => {
      state.filters.search = event.target.value;
      renderDashboard();
    }, 180));
    dom.statusFilter.addEventListener("change", (event) => {
      state.filters.status = event.target.value;
      renderDashboard();
    });
    dom.subjectFilter.addEventListener("change", (event) => {
      state.filters.subject = event.target.value;
      renderDashboard();
    });
    dom.levelFilter.addEventListener("change", (event) => {
      state.filters.level = event.target.value;
      renderDashboard();
    });
    dom.termFilter.addEventListener("change", (event) => {
      state.filters.term = event.target.value;
      renderDashboard();
    });
    dom.teacherCategoryFilter.addEventListener("change", (event) => {
      state.filters.teacherCategory = event.target.value;
      renderDashboard();
    });
    dom.sortFilter.addEventListener("change", (event) => {
      state.filters.sort = event.target.value;
      renderDashboard();
    });
    dom.categoryList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) {
        return;
      }
      state.filters.category = button.getAttribute("data-category");
      renderDashboard();
    });
    dom.quickFilterChips.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-quick-filter]");
      if (!chip) {
        return;
      }
      state.filters.quick = chip.getAttribute("data-quick-filter");
      renderDashboard();
    });
    dom.reportsGrid.addEventListener("click", handleReportGridClick);
    dom.featuredMount.addEventListener("click", (event) => {
      const card = event.target.closest("[data-report-id]");
      if (card) {
        openViewer(card.getAttribute("data-report-id"));
      }
    });
    dom.openEditorBtn.addEventListener("click", () => openEditor(null, { focusField: "reportTitle" }));
    dom.openDashboardBtn.addEventListener("click", () => {
      if (!config.ENABLE_ADMIN) {
        showToast("Admin disabled", "The admin console is disabled in config.js.", "warning");
        return;
      }
      renderUserDashboard();
      openModal("dashboard");
    });
    dom.emptyCreateBtn.addEventListener("click", () => openEditor(null, { focusField: "reportTitle" }));
    dom.resumeDraftBtn.addEventListener("click", () => {
      if (openEditor(null)) {
        restoreWorkspaceDraft();
      }
    });
    dom.themeToggle.addEventListener("click", handleThemeToggle);
    dom.openAuthBtn.addEventListener("click", handleAuthAction);
    dom.cancelAuthBtn.addEventListener("click", () => auth.closeAuth(dom));
    dom.authForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleLogin(dom.authUsername.value, dom.authPassword.value);
    });
    global.document.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.getAttribute("data-close-modal");
        if (target === "editor") {
          closeEditor();
        } else if (target === "dashboard") {
          closeModal("dashboard");
        } else if (target === "confirm") {
          resolveConfirm(false);
        } else {
          closeModal(target);
        }
      });
    });
    dom.confirmCancelBtn.addEventListener("click", () => resolveConfirm(false));
    dom.confirmOkBtn.addEventListener("click", () => resolveConfirm(true));

    dom.reportForm.addEventListener("submit", saveReport);
    dom.saveWorkspaceBtn.addEventListener("click", () => persistWorkspaceDraft(false));
    dom.resetFormBtn.addEventListener("click", async () => {
      const confirmed = await confirmAction({
        title: "Reset current form?",
        message: "This clears editor values. Your auto-saved workspace will remain until it is overwritten."
      });
      if (confirmed) {
        fillForm(buildNewReportDefaults());
      }
    });
    dom.reportForm.addEventListener("input", () => {
      state.editor.dirty = true;
      scheduleAutosave();
    });
    dom.reportForm.addEventListener("change", (event) => {
      state.editor.dirty = true;
      scheduleAutosave();
      if (event.target === dom.subjectName || event.target === dom.subjectCode) {
        evaluateAcademicSuggestion(true);
      }
    });
    dom.profileSuggestionBar.addEventListener("click", (event) => {
      const button = event.target.closest('[data-action="apply-profile"]');
      if (button && state.editor.currentSuggestedProfile) {
        applyAcademicProfile(state.editor.currentSuggestedProfile, { force: true });
      }
    });
    dom.diagramUpload.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      try {
        const dataUrl = await utils.readFileAsDataUrl(file);
        setDiagramPreview(dataUrl, file.name);
        if (!dom.diagramCaption.value) {
          dom.diagramCaption.value = "FIG. 01 - " + file.name;
        }
        state.editor.dirty = true;
        scheduleAutosave();
      } catch (error) {
        showToast("Upload failed", "Unable to read the selected image.", "danger");
      }
    });
    dom.clearDiagramBtn.addEventListener("click", () => {
      dom.diagramUpload.value = "";
      setDiagramPreview("", "");
      state.editor.dirty = true;
      scheduleAutosave();
    });
    dom.addTableRowBtn.addEventListener("click", () => {
      addTableRow();
      state.editor.dirty = true;
    });
    dom.tableRows.addEventListener("click", (event) => {
      const button = event.target.closest('[data-action="remove-table-row"]');
      if (!button) {
        return;
      }
      const row = button.closest(".table-row");
      if (row && dom.tableRows.children.length > 1) {
        row.remove();
        refreshTableRowIndices();
        state.editor.dirty = true;
        scheduleAutosave();
      }
    });
    dom.autosaveRestoreBanner.addEventListener("click", (event) => {
      const button = event.target.closest('[data-action="restore-workspace"]');
      if (button) {
        restoreWorkspaceDraft();
      }
    });

    dom.viewerEditBtn.addEventListener("click", () => {
      const report = getReportById(state.viewerReportId);
      if (report) {
        openEditor(report);
      }
    });
    dom.viewerToggleStatusBtn.addEventListener("click", toggleCurrentReportStatus);
    dom.viewerDuplicateBtn.addEventListener("click", duplicateCurrentReport);
    dom.viewerHistoryBtn.addEventListener("click", () => renderHistoryModal(state.viewerReportId));
    dom.viewerPdfBtn.addEventListener("click", () => exportCurrent("pdf"));
    dom.viewerDocxBtn.addEventListener("click", () => exportCurrent("docx"));
    dom.viewerDeleteBtn.addEventListener("click", () => deleteReport(state.viewerReportId));
    dom.historyList.addEventListener("click", (event) => {
      const button = event.target.closest('[data-action="restore-version"]');
      if (button) {
        restoreVersion(button.getAttribute("data-version-id"));
      }
    });

    global.document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal("cover");
        closeModal("dashboard");
        closeModal("history");
        closeModal("viewer");
        if (dom.confirmModal.classList.contains("is-open")) {
          resolveConfirm(false);
        }
      }
    });
    ["click", "input", "keydown"].forEach((eventName) => {
      global.document.addEventListener(eventName, touchSession, { passive: true });
    });
    global.addEventListener("beforeunload", (event) => {
      if (state.editor.dirty && dom.editorModal.classList.contains("is-open")) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
  }

  async function bootstrap() {
    refreshServices();
    cacheDom();
    mountRichTextToolbars();
    renderCategoryOptions();
    renderLevelTermOptions();
    bindEvents();
    setTableRows([["", "", "", ""]]);
    setDiagramPreview("", "");
    auth.closeAuth(dom);
    setLoading(true, "Booting vault...");
    try {
      const payload = await backend.bootstrap();
      populatePayload(payload);
      setAutosaveStatus("Vault ready", "Vault ready");
    } catch (error) {
      showToast("Boot failed", "Unable to initialize the local vault database.", "danger");
    } finally {
      setLoading(false);
    }
  }

  ns.app = {
    bootstrap,
    state
  };
}(window));
