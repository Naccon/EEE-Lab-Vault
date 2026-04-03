(function bootstrapConfig(global) {
  const ns = global.EEEVault = global.EEEVault || {};

  ns.config = Object.freeze({
    version: 5,
    appName: "EEE Lab Vault",
    storageKeys: {
      database: "eee-lab-vault.database",
      visitorId: "eee-lab-vault.visitor-id"
    },
    maxUsers: 100,
    categories: [
      { id: "all", name: "All Categories", icon: "ALL", code: "GLOBAL" },
      { id: "circuits", name: "Circuit Analysis", icon: "CIR", code: "EEE-CIR" },
      { id: "electronics", name: "Electronics", icon: "ELC", code: "EEE-ELX" },
      { id: "power", name: "Power Systems", icon: "PWR", code: "EEE-PWR" },
      { id: "signals", name: "Signals & Systems", icon: "SIG", code: "EEE-SIG" },
      { id: "programming", name: "Programming Lab", icon: "COD", code: "EEE-CSE" },
      { id: "math", name: "Engineering Mathematics", icon: "MTH", code: "EEE-MTH" }
    ],
    quickFilters: [
      { id: "all", label: "All Reports" },
      { id: "published", label: "Published" },
      { id: "draft", label: "Drafts" },
      { id: "locked", label: "Locked" }
    ],
    reportSections: [
      { key: "objective", title: "Objective" },
      { key: "theory", title: "Theory" },
      { key: "apparatus", title: "Apparatus / Materials" },
      { key: "procedure", title: "Procedure" },
      { key: "result", title: "Result" },
      { key: "conclusion", title: "Conclusion" },
      { key: "references", title: "References / Notes" }
    ],
    subjectCodePattern: /^[A-Za-z]{2,6}\s?-?\s?\d{3,4}[A-Za-z]?$/,
    minTitleLength: 6,
    maxDataRows: 25,
    autosaveDelayMs: 900,
    asyncDelayMs: 140,
    draftRetentionHours: 72,
    security: {
      sessionTimeoutMs: 1000 * 60 * 30,
      touchThrottleMs: 1000 * 60 * 2,
      loginMaxAttempts: 5,
      loginLockoutMs: 1000 * 60 * 10
    },
    levelOptions: ["Level 1", "Level 2", "Level 3", "Level 4"],
    termOptions: ["Term 1", "Term 2"],
    designationSuggestions: [
      "Lecturer, Department of EEE",
      "Senior Lecturer, Department of EEE",
      "Assistant Professor, Department of EEE",
      "Associate Professor, Department of EEE",
      "Professor, Department of EEE"
    ],
    seedUsers: [
      {
        id: "user-student",
        username: "student@vault.local",
        email: "student@vault.local",
        studentId: "2024-EEE-001",
        loginSecret: "2024-EEE-001",
        name: "Naccon",
        role: "Student Researcher",
        roleKey: "student",
        accessMode: "edit",
        department: "Department of Electrical and Electronic Engineering",
        level: "Level 2",
        term: "Term 1",
        section: "Section A",
        status: "active"
      },
      {
        id: "user-superadmin",
        username: "superadmin@vault.local",
        email: "superadmin@vault.local",
        studentId: "SUPER-ADMIN-001",
        loginSecret: "SUPER-ADMIN-001",
        name: "Naimi Super Admin",
        role: "Super Admin",
        roleKey: "super_admin",
        accessMode: "super_admin",
        department: "EEE Digital Archive",
        level: "Admin",
        term: "System",
        section: "Control",
        status: "active"
      }
    ],
    defaultStudentProfile: {
      studentName: "Naccon",
      studentId: "2024-EEE-001",
      studentLevel: "Level 2",
      studentTerm: "Term 1",
      studentSection: "Section A",
      studentDepartment: "Department of Electrical and Electronic Engineering",
      institution: "Bangladesh Army University of Science and Technology, Khulna"
    }
  });
}(window));
