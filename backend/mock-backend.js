(function bootstrapStaticBackend(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const config = ns.config;
  const utils = ns.utils;

  function resolveUrl(path, base) {
    return new URL(path, base || global.location.href).toString();
  }

  async function fetchJson(path, base) {
    const url = resolveUrl(path, base);
    const response = await global.fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load ${url}`);
    }
    return response.json();
  }

  async function checkAsset(path, base) {
    const url = resolveUrl(path, base);
    try {
      const headResponse = await global.fetch(url, { method: "HEAD", cache: "no-store" });
      if (headResponse.ok) {
        return { exists: true, url };
      }
    } catch (error) {
      // Fall through to GET validation.
    }

    try {
      const response = await global.fetch(url, { method: "GET", cache: "no-store" });
      return { exists: response.ok, url };
    } catch (error) {
      return { exists: false, url };
    }
  }

  async function normalizeFiles(files, reportBaseUrl) {
    const entries = [];
    const pdf = files && files.pdf ? files.pdf : null;
    const docx = files && files.docx ? files.docx : null;

    if (pdf && pdf.path) {
      const asset = await checkAsset(pdf.path, reportBaseUrl);
      entries.push({
        type: "pdf",
        label: pdf.label || "PDF",
        path: asset.url,
        exists: asset.exists
      });
    }

    if (docx && docx.path) {
      const asset = await checkAsset(docx.path, reportBaseUrl);
      entries.push({
        type: "docx",
        label: docx.label || "DOCX",
        path: asset.url,
        exists: asset.exists
      });
    }

    return entries;
  }

  async function loadReport(subjectMeta, reportRef, reportsIndexUrl) {
    const reportPath = reportRef.path || reportRef.file || `${reportRef.id}.json`;
    const reportUrl = resolveUrl(reportPath, reportsIndexUrl);
    const reportJson = await fetchJson(reportPath, reportsIndexUrl);
    const files = await normalizeFiles(reportJson.files || {}, reportUrl);

    return {
      id: reportJson.id || reportRef.id || utils.slugify(`${subjectMeta.subjectCode || subjectMeta.code}-${reportPath}`),
      title: utils.normalizeText(reportJson.title || `Experiment ${reportJson.experimentNo || ""}`) || "Untitled Report",
      status: utils.normalizeText(reportJson.status || "published").toLowerCase() === "draft" ? "draft" : "published",
      subjectName: utils.normalizeText(reportJson.subjectName || subjectMeta.subjectName || ""),
      subjectCode: utils.normalizeText(reportJson.subjectCode || subjectMeta.subjectCode || subjectMeta.code || ""),
      experimentNo: utils.normalizeText(reportJson.experimentNo || reportRef.experimentNo || ""),
      experimentDate: utils.normalizeText(reportJson.experimentDate || reportRef.experimentDate || ""),
      executiveSummary: utils.normalizeText(reportJson.executiveSummary || reportJson.summary || reportRef.executiveSummary || ""),
      student: {
        studentName: utils.normalizeText(reportJson.student && reportJson.student.studentName),
        studentId: utils.normalizeText(reportJson.student && reportJson.student.studentId),
        studentLevel: utils.normalizeText(reportJson.student && reportJson.student.studentLevel),
        studentTerm: utils.normalizeText(reportJson.student && reportJson.student.studentTerm)
      },
      faculty: {
        facultyName: utils.normalizeText(reportJson.faculty && reportJson.faculty.facultyName) || utils.normalizeText(reportJson.academic && reportJson.academic.teacherName),
        designation: utils.normalizeText(reportJson.faculty && reportJson.faculty.designation) || utils.normalizeText(reportJson.academic && reportJson.academic.teacherDesignation)
      },
      files,
      folderCode: utils.normalizeText(subjectMeta.subjectCode || subjectMeta.code || ""),
      folderTitle: utils.normalizeText(subjectMeta.subjectName || ""),
      sourceJson: reportUrl
    };
  }

  async function loadSubject(subjectEntry, manifestUrl) {
    const subjectRoot = subjectEntry.path || `${subjectEntry.code}/`;
    const subjectUrl = resolveUrl(subjectRoot, manifestUrl);
    const subjectMeta = await fetchJson(subjectEntry.subject || "subject.json", subjectUrl);
    const reportsIndexPath = subjectEntry.index || "reports_index.json";
    const reportsIndex = await fetchJson(reportsIndexPath, subjectUrl);
    const items = utils.toArray(reportsIndex.reports);
    const reports = [];
    const warnings = [];

    for (const item of items) {
      try {
        reports.push(await loadReport(subjectMeta, item, resolveUrl(reportsIndexPath, subjectUrl)));
      } catch (error) {
        warnings.push(`Skipped a report in ${subjectMeta.subjectCode || subjectEntry.code}: ${error.message}`);
      }
    }

    return {
      subject: {
        subjectName: utils.normalizeText(subjectMeta.subjectName || subjectEntry.subjectName || ""),
        subjectCode: utils.normalizeText(subjectMeta.subjectCode || subjectEntry.code || ""),
        folderPath: subjectRoot
      },
      reports,
      warnings
    };
  }

  async function bootstrap() {
    const manifestUrl = resolveUrl(config.reportsManifestPath || "./reports/manifest.json");
    const manifest = await fetchJson(config.reportsManifestPath || "./reports/manifest.json");
    const subjectEntries = utils.toArray(manifest.subjects);
    const subjects = [];
    const reports = [];
    const warnings = [];

    for (const subjectEntry of subjectEntries) {
      try {
        const loaded = await loadSubject(subjectEntry, manifestUrl);
        subjects.push(loaded.subject);
        reports.push(...loaded.reports);
        warnings.push(...loaded.warnings);
      } catch (error) {
        warnings.push(`Skipped subject ${subjectEntry.code || subjectEntry.path || "unknown"}: ${error.message}`);
      }
    }

    return {
      manifestLoadedAt: utils.nowIso(),
      subjects,
      reports,
      warnings
    };
  }

  ns.backend = {
    bootstrap
  };
}(window));
