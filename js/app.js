(function bootstrapApp(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const config = ns.config;
  const utils = ns.utils;
  const backend = ns.backend;
  const templates = ns.templates;

  const state = {
    reports: [],
    subjects: [],
    warnings: [],
    selectedReportId: "",
    filters: {
      search: "",
      status: "all",
      subject: "all",
      level: "all",
      term: "all",
      facultyCategory: "all",
      sort: "newest",
      quick: "all"
    },
    ui: {
      theme: "dark"
    }
  };

  const dom = {};

  function cacheDom() {
    const get = (id) => global.document.getElementById(id);
    dom.body = global.document.body;
    dom.globalSearch = get("globalSearch");
    dom.themeToggle = get("themeToggle");
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
    dom.viewerModal = get("viewerModal");
    dom.viewerModalTitle = get("viewerModalTitle");
    dom.viewerContent = get("viewerContent");
    dom.loadingOverlay = get("loadingOverlay");
    dom.loadingMessage = get("loadingMessage");
    dom.toastStack = get("toastStack");
  }

  function setTheme(theme) {
    state.ui.theme = theme === "light" ? "light" : "dark";
    dom.body.setAttribute("data-theme", state.ui.theme);
    dom.themeToggle.textContent = state.ui.theme === "dark" ? "Light Mode" : "Dark Mode";
  }

  function setLoading(active, message) {
    dom.loadingOverlay.classList.toggle("hidden", !active);
    dom.loadingOverlay.setAttribute("aria-hidden", active ? "false" : "true");
    dom.loadingMessage.textContent = message || "Loading reports...";
  }

  function showToast(title, copy, tone) {
    const item = global.document.createElement("article");
    item.className = "toast " + (tone ? `is-${tone}` : "");
    item.innerHTML = `
      <div class="toast-title">${utils.escapeHtml(title)}</div>
      <div class="toast-copy">${utils.escapeHtml(copy || "")}</div>
    `;
    dom.toastStack.appendChild(item);
    global.setTimeout(() => item.remove(), 3200);
  }

  function closeViewer() {
    dom.viewerModal.classList.remove("is-open");
    dom.viewerModal.setAttribute("aria-hidden", "true");
    dom.body.classList.remove("modal-open");
  }

  function openViewer(reportId) {
    const report = state.reports.find((entry) => entry.id === reportId);
    if (!report) {
      showToast("Report unavailable", "The selected report could not be found in the loaded manifest.", "warning");
      return;
    }
    state.selectedReportId = report.id;
    dom.viewerModalTitle.textContent = report.title;
    dom.viewerContent.innerHTML = templates.renderViewer(report);
    dom.viewerModal.classList.add("is-open");
    dom.viewerModal.setAttribute("aria-hidden", "false");
    dom.body.classList.add("modal-open");
  }

  function computeVisitorCount() {
    const key = `${config.storageKeys.visitorId}.today.${new Date().toISOString().slice(0, 10)}`;
    if (!global.localStorage.getItem(key)) {
      global.localStorage.setItem(key, utils.uid("visit"));
    }
    return 1;
  }

  function computeStats() {
    return {
      totalReports: state.reports.length,
      published: state.reports.filter((report) => report.status === "published").length,
      draft: state.reports.filter((report) => report.status === "draft").length,
      pdfCount: state.reports.filter((report) => report.files.some((file) => file.type === "pdf" && file.exists)).length,
      docxCount: state.reports.filter((report) => report.files.some((file) => file.type === "docx" && file.exists)).length,
      subjects: state.subjects.length
    };
  }

  function getFilteredReports() {
    let results = state.reports.slice();

    if (state.filters.status !== "all") {
      results = results.filter((report) => report.status === state.filters.status);
    }
    if (state.filters.subject !== "all") {
      results = results.filter((report) => report.subjectName === state.filters.subject || report.subjectCode === state.filters.subject);
    }
    if (state.filters.level !== "all") {
      results = results.filter((report) => report.student.studentLevel === state.filters.level);
    }
    if (state.filters.term !== "all") {
      results = results.filter((report) => report.student.studentTerm === state.filters.term);
    }
    if (state.filters.facultyCategory !== "all") {
      results = results.filter((report) => report.faculty.designation === state.filters.facultyCategory);
    }
    if (state.filters.quick === "pdf") {
      results = results.filter((report) => report.files.some((file) => file.type === "pdf"));
    } else if (state.filters.quick === "docx") {
      results = results.filter((report) => report.files.some((file) => file.type === "docx"));
    } else if (state.filters.quick === "missing") {
      results = results.filter((report) => report.files.some((file) => !file.exists));
    }
    if (state.filters.search) {
      const query = utils.normalizeSearch(state.filters.search);
      results = results.filter((report) => {
        const haystack = [
          report.title,
          report.subjectName,
          report.subjectCode,
          report.faculty.facultyName,
          report.faculty.designation,
          report.executiveSummary,
          report.experimentNo
        ].map(utils.normalizeSearch).join(" ");
        return haystack.includes(query);
      });
    }

    if (state.filters.sort === "oldest") {
      results.sort((left, right) => new Date(left.experimentDate || 0).getTime() - new Date(right.experimentDate || 0).getTime());
    } else if (state.filters.sort === "title") {
      results.sort((left, right) => left.title.localeCompare(right.title));
    } else if (state.filters.sort === "subject") {
      results.sort((left, right) => left.subjectName.localeCompare(right.subjectName));
    } else {
      results.sort((left, right) => utils.compareDateDesc(left.experimentDate, right.experimentDate));
    }

    return results;
  }

  function renderSelectOptions() {
    const subjects = utils.distinct(state.reports.map((report) => report.subjectName || report.subjectCode).filter(Boolean)).sort((a, b) => a.localeCompare(b));
    const levels = utils.distinct(state.reports.map((report) => report.student.studentLevel).filter(Boolean)).sort((a, b) => a.localeCompare(b));
    const terms = utils.distinct(state.reports.map((report) => report.student.studentTerm).filter(Boolean)).sort((a, b) => a.localeCompare(b));
    const designations = utils.distinct(state.reports.map((report) => report.faculty.designation).filter(Boolean)).sort((a, b) => a.localeCompare(b));

    dom.subjectFilter.innerHTML = `<option value="all">All Subjects</option>${subjects.map((item) => `<option value="${utils.escapeHtml(item)}">${utils.escapeHtml(item)}</option>`).join("")}`;
    dom.levelFilter.innerHTML = `<option value="all">All Levels</option>${levels.map((item) => `<option value="${utils.escapeHtml(item)}">${utils.escapeHtml(item)}</option>`).join("")}`;
    dom.termFilter.innerHTML = `<option value="all">All Terms</option>${terms.map((item) => `<option value="${utils.escapeHtml(item)}">${utils.escapeHtml(item)}</option>`).join("")}`;
    dom.teacherCategoryFilter.innerHTML = `<option value="all">All Categories</option>${designations.map((item) => `<option value="${utils.escapeHtml(item)}">${utils.escapeHtml(item)}</option>`).join("")}`;

    dom.subjectFilter.value = subjects.includes(state.filters.subject) ? state.filters.subject : "all";
    dom.levelFilter.value = levels.includes(state.filters.level) ? state.filters.level : "all";
    dom.termFilter.value = terms.includes(state.filters.term) ? state.filters.term : "all";
    dom.teacherCategoryFilter.value = designations.includes(state.filters.facultyCategory) ? state.filters.facultyCategory : "all";
  }

  function renderDashboard() {
    const stats = computeStats();
    const filteredReports = getFilteredReports();
    const featuredReport = filteredReports[0] || state.reports[0] || null;

    dom.autosaveTopStatus.textContent = "Repository ready";
    dom.metricTotalReports.textContent = String(stats.totalReports);
    dom.metricPublishedReports.textContent = String(stats.published);
    dom.metricDraftReports.textContent = String(stats.draft);
    dom.metricAcademicProfiles.textContent = String(stats.subjects);
    dom.metricTodayViewers.textContent = String(computeVisitorCount());
    dom.profileSummary.innerHTML = templates.renderProfileSummary(state.subjects, state.reports);
    dom.securitySummary.innerHTML = templates.renderSecuritySummary(state.warnings);
    dom.categoryList.innerHTML = templates.renderCategories(state.subjects, state.filters.subject);
    dom.academicMemoryList.innerHTML = templates.renderAcademicMemory(state.subjects);
    dom.statsGrid.innerHTML = templates.renderStats(stats);
    dom.quickFilterChips.innerHTML = templates.renderQuickFilters(state.filters.quick);
    dom.featuredMount.innerHTML = templates.renderFeatured(featuredReport);
    dom.reportsGrid.innerHTML = templates.renderReportsGrid(filteredReports);
    dom.resultsSummary.textContent = `${filteredReports.length} report${filteredReports.length === 1 ? "" : "s"} shown`;
    dom.emptyState.classList.toggle("hidden", filteredReports.length !== 0);
    dom.reportsGrid.classList.toggle("hidden", filteredReports.length === 0);
    dom.emptyStateCopy.textContent = state.warnings.length
      ? state.warnings[0]
      : "Add JSON metadata under /reports and linked PDF / DOCX files to populate the vault.";
    renderSelectOptions();
  }

  function bindEvents() {
    dom.themeToggle.addEventListener("click", () => {
      setTheme(state.ui.theme === "dark" ? "light" : "dark");
    });
    dom.globalSearch.addEventListener("input", (event) => {
      state.filters.search = event.target.value;
      renderDashboard();
    });
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
      state.filters.facultyCategory = event.target.value;
      renderDashboard();
    });
    dom.sortFilter.addEventListener("change", (event) => {
      state.filters.sort = event.target.value;
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
    dom.categoryList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-subject-code]");
      if (!button) {
        return;
      }
      const value = button.getAttribute("data-subject-code");
      state.filters.subject = value === "all" ? "all" : value;
      renderDashboard();
    });
    dom.reportsGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='view']");
      const card = event.target.closest("[data-report-id]");
      if (button) {
        openViewer(button.getAttribute("data-report-id"));
        return;
      }
      if (card) {
        openViewer(card.getAttribute("data-report-id"));
      }
    });
    dom.featuredMount.addEventListener("click", (event) => {
      const card = event.target.closest("[data-report-id]");
      if (card) {
        openViewer(card.getAttribute("data-report-id"));
      }
    });
    global.document.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.getAttribute("data-close-modal") === "viewer") {
          closeViewer();
        }
      });
    });
    global.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeViewer();
      }
    });
  }

  async function bootstrap() {
    cacheDom();
    setTheme("dark");
    bindEvents();
    setLoading(true, "Loading repository manifest...");
    try {
      const payload = await backend.bootstrap();
      state.reports = utils.toArray(payload.reports);
      state.subjects = utils.toArray(payload.subjects);
      state.warnings = utils.toArray(payload.warnings);
      renderDashboard();
      if (state.warnings.length) {
        showToast("Manifest loaded with warnings", state.warnings[0], "warning");
      } else {
        showToast("Repository ready", "Static report metadata loaded from the repository.", "success");
      }
    } catch (error) {
      state.reports = [];
      state.subjects = [];
      state.warnings = [error.message || "Unable to load the repository manifest."];
      renderDashboard();
      showToast("Load failed", error.message || "Unable to load repository data.", "danger");
    } finally {
      setLoading(false);
    }
  }

  ns.app = {
    bootstrap
  };
}(window));
