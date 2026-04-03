(function bootstrapValidation(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const config = ns.config;
  const utils = ns.utils;

  function addError(errors, field, message) {
    if (!errors[field]) {
      errors[field] = message;
    }
  }

  function validateReport(report, previousReport) {
    const errors = {};
    const normalizedTitle = utils.normalizeText(report.title);
    const summary = utils.normalizeText(utils.stripRichText(report.summary));

    if (normalizedTitle.length < config.minTitleLength) {
      addError(errors, "title", `Title must be at least ${config.minTitleLength} characters.`);
    }

    if (!report.categoryId) {
      addError(errors, "categoryId", "Please select a category.");
    }

    if (!utils.normalizeText(report.experimentNo)) {
      addError(errors, "experimentNo", "Experiment number is required.");
    }

    if (!utils.normalizeText(report.experimentDate)) {
      addError(errors, "experimentDate", "Experiment date is required.");
    }

    if (!summary) {
      addError(errors, "summary", "Executive summary is required.");
    }

    const student = report.student || {};
    ["studentName", "studentId", "studentLevel", "studentTerm", "studentSection", "studentDepartment", "institution"].forEach((field) => {
      if (!utils.normalizeText(student[field])) {
        addError(errors, field, "This student information field is required.");
      }
    });

    const academic = report.academic || {};
    if (!utils.normalizeText(academic.subjectName)) {
      addError(errors, "subjectName", "Subject name is required.");
    }
    if (!utils.normalizeText(academic.subjectCode)) {
      addError(errors, "subjectCode", "Subject code is required.");
    } else if (!config.subjectCodePattern.test(utils.normalizeText(academic.subjectCode))) {
      addError(errors, "subjectCode", "Subject code should look like EEE 2103 or CSE-1101.");
    }
    if (!utils.normalizeText(academic.teacherName)) {
      addError(errors, "teacherName", "Teacher name is required.");
    }
    if (!utils.normalizeText(academic.teacherDesignation)) {
      addError(errors, "teacherDesignation", "Teacher designation is required.");
    }

    const sections = report.sections || {};
    ["objective", "theory", "result", "conclusion"].forEach((field) => {
      if (!utils.normalizeText(utils.stripRichText(sections[field]))) {
        addError(errors, field, "This report section is required.");
      }
    });

    const headers = utils.toArray(report.dataTable && report.dataTable.headers);
    const rows = utils.toArray(report.dataTable && report.dataTable.rows);

    if (headers.length !== 4 || headers.some((header) => !utils.normalizeText(header))) {
      addError(errors, "dataTableHeaders", "All four table headers are required.");
    }

    const meaningfulRows = rows.filter((row) => utils.toArray(row).some((cell) => utils.normalizeText(cell)));
    if (!meaningfulRows.length) {
      addError(errors, "dataTableRows", "At least one data table row is required.");
    }

    if (meaningfulRows.length > config.maxDataRows) {
      addError(errors, "dataTableRows", `Data table supports up to ${config.maxDataRows} rows.`);
    }

    if (previousReport && previousReport.lockAcademicFields) {
      const before = previousReport.academic || {};
      const changed = [
        "subjectName",
        "subjectCode",
        "teacherName",
        "teacherDesignation"
      ].some((field) => utils.normalizeText(before[field]) !== utils.normalizeText(academic[field]));

      if (changed) {
        addError(errors, "lockAcademicFields", "Academic fields are locked for this report. Unlock before editing them.");
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  function validateCredentials(credentials) {
    const errors = {};
    if (!utils.normalizeText(credentials.username)) {
      addError(errors, "username", "Email address is required.");
    }
    if (!utils.normalizeText(credentials.password)) {
      addError(errors, "password", "Student ID or passcode is required.");
    }
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  ns.validation = {
    validateCredentials,
    validateReport
  };
}(window));
