(function bootstrapStorage(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const config = ns.config;
  const utils = ns.utils;
  const sampleData = ns.sampleData;

  function createInitialDatabase() {
    const seedReports = sampleData.seedReports();
    const seededUsers = sampleData.createCohortUsers(config.maxUsers, config.seedUsers);
    const now = utils.nowIso();
    return {
      version: config.version,
      sessionUserId: null,
      session: {
        userId: "",
        token: "",
        createdAt: now,
        lastActivityAt: "",
        expiresAt: ""
      },
      users: seededUsers.map(normalizeUser),
      reports: seedReports,
      drafts: {},
      preferences: {
        theme: "dark"
      },
      security: {
        loginAttempts: {},
        auditLog: []
      },
      analytics: {
        visits: [],
        dailyVisitors: {}
      },
      academicMemory: {
        lastUsedProfile: sampleData.collectAcademicProfiles(seedReports)[0] || null,
        profiles: sampleData.collectAcademicProfiles(seedReports)
      }
    };
  }

  function normalizeUser(user) {
    return Object.assign({
      id: utils.uid("user"),
      username: "",
      password: "",
      loginSecret: "",
      passwordHash: "",
      passwordVersion: 0,
      name: "",
      role: "Student Researcher",
      roleKey: "student",
      accessMode: "edit",
      department: "Department of Electrical and Electronic Engineering",
      email: "",
      studentId: "",
      level: "Level 2",
      term: "Term 1",
      section: "Section A",
      status: "active",
      createdAt: utils.nowIso(),
      lastLoginAt: ""
    }, user || {});
  }

  function normalizeReport(report) {
    const mergedStudent = Object.assign({}, utils.deepClone(config.defaultStudentProfile), report && report.student ? report.student : {});
    if (!mergedStudent.studentLevel || !mergedStudent.studentTerm) {
      const derived = utils.deriveLevelTermFromSemester(mergedStudent.studentSemester);
      mergedStudent.studentLevel = mergedStudent.studentLevel || derived.studentLevel;
      mergedStudent.studentTerm = mergedStudent.studentTerm || derived.studentTerm;
    }

    const normalized = Object.assign({
      featured: false,
      lockAcademicFields: false,
      versions: [],
      circuitDiagram: { dataUrl: "", caption: "" },
      dataTable: { headers: ["Parameter", "Measured", "Calculated", "Remarks"], rows: [] },
      student: mergedStudent,
      academic: {
        subjectName: "",
        subjectCode: "",
        teacherName: "",
        teacherDesignation: ""
      },
      sections: {
        objective: "",
        theory: "",
        apparatus: "",
        procedure: "",
        result: "",
        conclusion: "",
        references: ""
      }
    }, report || {});

    normalized.versions = utils.toArray(normalized.versions);
    normalized.dataTable = Object.assign({ headers: [], rows: [] }, normalized.dataTable || {});
    normalized.dataTable.headers = utils.toArray(normalized.dataTable.headers);
    normalized.dataTable.rows = utils.toArray(normalized.dataTable.rows);
    normalized.circuitDiagram = Object.assign({ dataUrl: "", caption: "" }, normalized.circuitDiagram || {});
    return normalized;
  }

  function normalizeProfile(profile) {
    return Object.assign({
      id: utils.uid("profile"),
      subjectName: "",
      subjectCode: "",
      teacherName: "",
      teacherDesignation: "",
      usageCount: 0,
      lastUsedAt: utils.nowIso(),
      categoryId: "circuits"
    }, profile || {});
  }

  function migrate(raw) {
    const database = Object.assign(createInitialDatabase(), raw || {});
    const previousVersion = raw && raw.version ? raw.version : 0;
    database.version = config.version;
    database.users = utils.toArray(database.users).map(normalizeUser);
    database.reports = utils.toArray(database.reports).map(normalizeReport);
    database.drafts = typeof database.drafts === "object" && database.drafts ? database.drafts : {};
    database.preferences = Object.assign({ theme: "dark" }, database.preferences || {});
    database.security = Object.assign({ loginAttempts: {}, auditLog: [] }, database.security || {});
    database.analytics = Object.assign({ visits: [], dailyVisitors: {} }, database.analytics || {});
    database.analytics.visits = utils.toArray(database.analytics.visits);
    database.analytics.dailyVisitors = typeof database.analytics.dailyVisitors === "object" && database.analytics.dailyVisitors
      ? database.analytics.dailyVisitors
      : {};
    database.session = Object.assign({ userId: database.sessionUserId || "", token: "", createdAt: "", lastActivityAt: "", expiresAt: "" }, database.session || {});
    database.academicMemory = Object.assign({ lastUsedProfile: null, profiles: [] }, database.academicMemory || {});
    database.academicMemory.profiles = utils.toArray(database.academicMemory.profiles).map(normalizeProfile);
    database.academicMemory.lastUsedProfile = database.academicMemory.lastUsedProfile
      ? normalizeProfile(database.academicMemory.lastUsedProfile)
      : database.academicMemory.profiles[0] || null;

    if (!database.sessionUserId && database.session.userId) {
      database.sessionUserId = database.session.userId;
    }
    if (!database.session.userId && database.sessionUserId) {
      database.session.userId = database.sessionUserId;
    }
    if (!database.sessionUserId && database.users[0]) {
      database.sessionUserId = database.users[0].id;
      database.session.userId = database.users[0].id;
    }

    if (previousVersion < 3) {
      database.sessionUserId = null;
      database.session = {
        userId: "",
        token: "",
        createdAt: utils.nowIso(),
        lastActivityAt: "",
        expiresAt: ""
      };
    }

    return database;
  }

  function readDatabase() {
    const raw = global.localStorage.getItem(config.storageKeys.database);
    if (!raw) {
      const seed = createInitialDatabase();
      writeDatabase(seed);
      return seed;
    }

    const parsed = utils.safeJsonParse(raw, null);
    const migrated = migrate(parsed);
    writeDatabase(migrated);
    return migrated;
  }

  function writeDatabase(database) {
    global.localStorage.setItem(config.storageKeys.database, JSON.stringify(database));
    return database;
  }

  function updateDatabase(updater) {
    const database = readDatabase();
    const nextState = updater(utils.deepClone(database)) || database;
    writeDatabase(nextState);
    return nextState;
  }

  ns.storage = {
    createInitialDatabase,
    normalizeProfile,
    normalizeReport,
    normalizeUser,
    readDatabase,
    updateDatabase,
    writeDatabase
  };
}(window));
