(function bootstrapBackend(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const config = ns.config;
  const utils = ns.utils;
  const storage = ns.storage;
  const validation = ns.validation;
  const sampleData = ns.sampleData;

  function withDelay(result) {
    return utils.delay(config.asyncDelayMs).then(() => utils.deepClone(result));
  }

  function getCategoryId(categoryId) {
    const valid = config.categories.some((category) => category.id === categoryId);
    return valid ? categoryId : "circuits";
  }

  function createSession(userId) {
    const now = Date.now();
    return {
      userId,
      token: utils.uid("session"),
      createdAt: new Date(now).toISOString(),
      lastActivityAt: new Date(now).toISOString(),
      expiresAt: new Date(now + config.security.sessionTimeoutMs).toISOString()
    };
  }

  function clearSession(database) {
    database.sessionUserId = null;
    database.session = {
      userId: "",
      token: "",
      createdAt: "",
      lastActivityAt: "",
      expiresAt: ""
    };
  }

  function isSessionExpired(session) {
    if (!session || !session.userId || !session.expiresAt) {
      return true;
    }
    return Date.now() > new Date(session.expiresAt).getTime();
  }

  async function hashPassword(username, password) {
    return utils.sha256Hex(`${utils.normalizeSearch(username)}::${password}`);
  }

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function getVisitorId() {
    const key = config.storageKeys.visitorId;
    let visitorId = global.localStorage.getItem(key);
    if (!visitorId) {
      visitorId = utils.uid("visitor");
      global.localStorage.setItem(key, visitorId);
    }
    return visitorId;
  }

  function getVisitorContext(currentUser) {
    const userAgent = global.navigator && global.navigator.userAgent ? global.navigator.userAgent : "Unavailable";
    return {
      visitorId: getVisitorId(),
      authState: currentUser ? "user" : "guest",
      userAgent,
      deviceType: utils.detectDeviceType(userAgent),
      ipAddress: "Unavailable in static mode",
      macAddress: "Unavailable in browser security model"
    };
  }

  async function ensureSecurityState(database) {
    let changed = false;

    for (const user of database.users) {
      if (!user.email && user.username) {
        user.email = user.username;
        changed = true;
      }
      if (!user.username && user.email) {
        user.username = user.email;
        changed = true;
      }
      if (!user.studentId && user.roleKey === "student") {
        user.studentId = user.loginSecret || user.password || "";
        changed = true;
      }
      if (!user.accessMode) {
        user.accessMode = user.roleKey === "super_admin" ? "super_admin" : "edit";
        changed = true;
      }
      if (!user.loginSecret) {
        if (user.roleKey === "student" && user.studentId) {
          user.loginSecret = user.studentId;
        } else if (user.password) {
          user.loginSecret = user.password;
        }
        changed = true;
      }
      if (!user.passwordHash && user.loginSecret) {
        user.passwordHash = await hashPassword(user.email || user.username, user.loginSecret);
        user.passwordVersion = 1;
        user.password = "";
        changed = true;
      }
      if (!user.status) {
        user.status = "active";
        changed = true;
      }
      if (!user.roleKey) {
        user.roleKey = utils.normalizeSearch(user.role).includes("super") ? "super_admin" : (utils.normalizeSearch(user.role).includes("admin") ? "admin" : "student");
        changed = true;
      }
    }

    if (!database.analytics) {
      database.analytics = { visits: [], dailyVisitors: {} };
      changed = true;
    }
    if (!Array.isArray(database.analytics.visits)) {
      database.analytics.visits = [];
      changed = true;
    }
    if (!database.analytics.dailyVisitors || typeof database.analytics.dailyVisitors !== "object") {
      database.analytics.dailyVisitors = {};
      changed = true;
    }

    if (changed) {
      storage.writeDatabase(database);
    }

    return database;
  }

  function recordAudit(database, action, actorId, details) {
    const actor = database.users.find((entry) => entry.id === actorId) || null;
    const visitorContext = getVisitorContext(actor);
    const logEntry = {
      id: utils.uid("audit"),
      action,
      actorId: actorId || "",
      at: utils.nowIso(),
      details: Object.assign({}, visitorContext, details || {})
    };
    database.security.auditLog.unshift(logEntry);
    database.security.auditLog = database.security.auditLog.slice(0, 200);
  }

  function trackVisit(database, currentUser) {
    const todayKey = getTodayKey();
    const context = getVisitorContext(currentUser);
    const dayRecord = database.analytics.dailyVisitors[todayKey] || {};
    if (!dayRecord[context.visitorId]) {
      dayRecord[context.visitorId] = {
        firstSeenAt: utils.nowIso(),
        authState: context.authState
      };
      database.analytics.dailyVisitors[todayKey] = dayRecord;
      database.analytics.visits.unshift({
        id: utils.uid("visit"),
        at: utils.nowIso(),
        actorId: currentUser ? currentUser.id : "",
        email: currentUser ? currentUser.email : "Guest Viewer",
        deviceType: context.deviceType,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        macAddress: context.macAddress,
        authState: context.authState,
        visitorId: context.visitorId
      });
      database.analytics.visits = database.analytics.visits.slice(0, 300);
      recordAudit(database, currentUser ? "USER_VIEW" : "GUEST_VIEW", currentUser ? currentUser.id : "", {
        authState: context.authState,
        page: "vault-home"
      });
      storage.writeDatabase(database);
    }
  }

  function buildTodayViewerCount(database) {
    const dayRecord = database.analytics && database.analytics.dailyVisitors
      ? database.analytics.dailyVisitors[getTodayKey()] || {}
      : {};
    return Object.keys(dayRecord).length;
  }

  function stripEditorOnlyFields(report) {
    const payload = utils.deepClone(report || {});
    delete payload.rememberAcademic;
    delete payload.reportVersionSourceId;
    delete payload.diagramUpload;
    return payload;
  }

  function normalizeAcademicProfile(report) {
    return storage.normalizeProfile({
      subjectName: report.academic.subjectName,
      subjectCode: report.academic.subjectCode,
      teacherName: report.academic.teacherName,
      teacherDesignation: report.academic.teacherDesignation,
      lastUsedAt: report.updatedAt,
      usageCount: 1,
      categoryId: report.categoryId
    });
  }

  function mergeAcademicProfiles(database, report) {
    const profile = normalizeAcademicProfile(report);
    const signature = [
      utils.normalizeSearch(profile.subjectName),
      utils.normalizeSearch(profile.subjectCode),
      utils.normalizeSearch(profile.teacherName),
      utils.normalizeSearch(profile.teacherDesignation)
    ].join("|");

    const existing = database.academicMemory.profiles.find((item) => {
      const itemSignature = [
        utils.normalizeSearch(item.subjectName),
        utils.normalizeSearch(item.subjectCode),
        utils.normalizeSearch(item.teacherName),
        utils.normalizeSearch(item.teacherDesignation)
      ].join("|");
      return itemSignature === signature;
    });

    if (existing) {
      existing.subjectName = profile.subjectName;
      existing.subjectCode = profile.subjectCode;
      existing.teacherName = profile.teacherName;
      existing.teacherDesignation = profile.teacherDesignation;
      existing.lastUsedAt = report.updatedAt;
      existing.usageCount = (existing.usageCount || 0) + 1;
      existing.categoryId = report.categoryId;
      database.academicMemory.lastUsedProfile = utils.deepClone(existing);
      return existing;
    }

    database.academicMemory.profiles.unshift(profile);
    database.academicMemory.lastUsedProfile = utils.deepClone(profile);
    return profile;
  }

  function buildAcademicSuggestions(database) {
    const dedupedMap = new Map();
    utils.toArray(database.academicMemory.profiles)
      .slice()
      .sort((left, right) => utils.compareDateDesc(left.lastUsedAt, right.lastUsedAt))
      .forEach((profile) => {
        const signature = [
          utils.normalizeSearch(profile.subjectName),
          utils.normalizeSearch(profile.subjectCode),
          utils.normalizeSearch(profile.teacherName),
          utils.normalizeSearch(profile.teacherDesignation)
        ].join("|");

        if (!dedupedMap.has(signature)) {
          dedupedMap.set(signature, utils.deepClone(profile));
          return;
        }

        const current = dedupedMap.get(signature);
        current.usageCount = (current.usageCount || 0) + (profile.usageCount || 0);
        if (utils.compareDateDesc(profile.lastUsedAt, current.lastUsedAt) < 0) {
          current.lastUsedAt = profile.lastUsedAt;
        }
      });

    const profiles = Array.from(dedupedMap.values());

    return {
      lastUsedProfile: database.academicMemory.lastUsedProfile || profiles[0] || null,
      profiles,
      subjectNames: utils.distinct(profiles.map((profile) => profile.subjectName)),
      subjectCodes: utils.distinct(profiles.map((profile) => profile.subjectCode)),
      teacherNames: utils.distinct(profiles.map((profile) => profile.teacherName)),
      teacherDesignations: utils.distinct([
        ...config.designationSuggestions,
        ...profiles.map((profile) => profile.teacherDesignation)
      ])
    };
  }

  function getCurrentUser(database) {
    const userId = database.session && database.session.userId ? database.session.userId : database.sessionUserId;
    if (!userId || isSessionExpired(database.session)) {
      clearSession(database);
      return null;
    }
    const user = database.users.find((entry) => entry.id === userId) || null;
    if (!user || user.status !== "active") {
      clearSession(database);
      return null;
    }
    return user;
  }

  function getVisibleUsers(database, currentUser) {
    if (!currentUser) {
      return [];
    }
    return utils.isAdmin(currentUser)
      ? database.users.slice(0, config.maxUsers)
      : [currentUser];
  }

  function getVisibleReports(database, currentUser) {
    if (!currentUser) {
      return database.reports.filter((report) => report.status === "published");
    }
    if (utils.isAdmin(currentUser)) {
      return database.reports;
    }
    return database.reports.filter((report) => report.status === "published" || report.authorId === currentUser.id);
  }

  function buildSecurityPayload(database, currentUser) {
    const session = database.session || {};
    const remainingMs = session.expiresAt ? Math.max(0, new Date(session.expiresAt).getTime() - Date.now()) : 0;
    return {
      sessionActive: Boolean(currentUser),
      sessionExpiresAt: session.expiresAt || "",
      lastActivityAt: session.lastActivityAt || "",
      sessionRemainingMs: remainingMs,
      timeoutMs: config.security.sessionTimeoutMs,
      canAdministerUsers: utils.isSuperAdmin(currentUser),
      roleKey: currentUser ? currentUser.roleKey : "viewer",
      accessMode: currentUser ? currentUser.accessMode : "viewer",
      todayViewerCount: buildTodayViewerCount(database)
    };
  }

  function buildUserDashboard(database, currentUser) {
    if (!utils.isSuperAdmin(currentUser)) {
      return null;
    }

    const users = getVisibleUsers(database, currentUser).map((user) => {
      const ownedReports = database.reports.filter((report) => report.authorId === user.id);
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        roleKey: user.roleKey,
        email: user.email,
        studentId: user.studentId || "",
        loginSecret: user.loginSecret || "",
        accessMode: user.accessMode || "edit",
        department: user.department,
        level: user.level,
        term: user.term,
        section: user.section,
        status: user.status,
        lastLoginAt: user.lastLoginAt || "",
        reportCount: ownedReports.length,
        draftCount: ownedReports.filter((report) => report.status === "draft").length,
        publishedCount: ownedReports.filter((report) => report.status === "published").length
      };
    }).slice(0, config.maxUsers);

    return {
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.status === "active").length,
      suspendedUsers: users.filter((user) => user.status !== "active").length,
      todayViewerCount: buildTodayViewerCount(database),
      activityLog: utils.toArray(database.security.auditLog).slice(0, 40).map((entry) => {
        const actor = database.users.find((user) => user.id === entry.actorId) || null;
        return {
          id: entry.id,
          action: entry.action,
          at: entry.at,
          actorName: actor ? actor.name : (entry.details && entry.details.authState === "guest" ? "Guest Viewer" : "Unknown User"),
          actorEmail: actor ? actor.email : "",
          authState: entry.details && entry.details.authState ? entry.details.authState : (actor ? "user" : "guest"),
          userAgent: entry.details && entry.details.userAgent ? entry.details.userAgent : "Unavailable",
          deviceType: entry.details && entry.details.deviceType ? entry.details.deviceType : "Unknown Device",
          ipAddress: entry.details && entry.details.ipAddress ? entry.details.ipAddress : "Unavailable in static mode",
          macAddress: entry.details && entry.details.macAddress ? entry.details.macAddress : "Unavailable in browser security model"
        };
      }),
      users
    };
  }

  function createVersionSnapshot(report) {
    const snapshot = utils.deepClone(report);
    snapshot.versions = [];
    return snapshot;
  }

  function composeBootPayload(database) {
    const currentUser = getCurrentUser(database);
    const visibleReports = getVisibleReports(database, currentUser);
    return {
      user: currentUser,
      users: getVisibleUsers(database, currentUser),
      reports: visibleReports.slice().sort((left, right) => utils.compareDateDesc(left.updatedAt, right.updatedAt)),
      draft: currentUser ? database.drafts[currentUser.id] || null : null,
      preferences: database.preferences,
      academicSuggestions: buildAcademicSuggestions(database),
      security: buildSecurityPayload(database, currentUser),
      dashboard: buildUserDashboard(database, currentUser)
    };
  }

  async function bootstrap() {
    const database = await ensureSecurityState(storage.readDatabase());
    if (isSessionExpired(database.session)) {
      clearSession(database);
      storage.writeDatabase(database);
    }
    const currentUser = getCurrentUser(database);
    trackVisit(database, currentUser);
    return withDelay(composeBootPayload(database));
  }

  async function login(credentials) {
    const check = validation.validateCredentials(credentials);
    if (!check.valid) {
      return Promise.reject({ message: "Email address and student ID or passcode are required.", errors: check.errors });
    }

    const database = await ensureSecurityState(storage.readDatabase());
    const usernameKey = utils.normalizeSearch(credentials.username);
    const attemptState = database.security.loginAttempts[usernameKey] || { count: 0, lockedUntil: "" };

    if (attemptState.lockedUntil && Date.now() < new Date(attemptState.lockedUntil).getTime()) {
      return Promise.reject({ message: "Too many failed login attempts. Please wait and try again.", errors: { password: "Account temporarily locked." } });
    }

    const user = database.users.find((entry) => (
      utils.normalizeSearch(entry.email || entry.username) === usernameKey
      || utils.normalizeSearch(entry.username) === usernameKey
    ));
    const expectedHash = user ? await hashPassword(user.email || user.username, credentials.password) : "";

    if (!user || user.passwordHash !== expectedHash) {
      const nextCount = (attemptState.count || 0) + 1;
      const nextState = {
        count: nextCount,
        lockedUntil: nextCount >= config.security.loginMaxAttempts
          ? new Date(Date.now() + config.security.loginLockoutMs).toISOString()
          : ""
      };
      database.security.loginAttempts[usernameKey] = nextState;
      recordAudit(database, "LOGIN_FAILED", "", { username: credentials.username, count: nextCount });
      storage.writeDatabase(database);
      return Promise.reject({ message: "Incorrect email address or passcode.", errors: { password: "Authentication failed." } });
    }

    if (user.status !== "active") {
      return Promise.reject({ message: "This account is not active. Contact the super admin.", errors: { username: "Account unavailable." } });
    }

    database.security.loginAttempts[usernameKey] = { count: 0, lockedUntil: "" };
    database.sessionUserId = user.id;
    database.session = createSession(user.id);
    user.lastLoginAt = utils.nowIso();
    recordAudit(database, "LOGIN_SUCCESS", user.id, { username: user.username });
    storage.writeDatabase(database);
    return withDelay(composeBootPayload(database));
  }

  async function logout() {
    const database = storage.readDatabase();
    recordAudit(database, "LOGOUT", database.session && database.session.userId ? database.session.userId : "", {});
    clearSession(database);
    storage.writeDatabase(database);
    return withDelay({ ok: true });
  }

  async function touchSession() {
    const database = storage.readDatabase();
    const currentUser = getCurrentUser(database);
    if (!currentUser) {
      clearSession(database);
      storage.writeDatabase(database);
      return withDelay({ ok: false, expired: true });
    }
    database.session.lastActivityAt = utils.nowIso();
    database.session.expiresAt = new Date(Date.now() + config.security.sessionTimeoutMs).toISOString();
    storage.writeDatabase(database);
    return withDelay({ ok: true, security: buildSecurityPayload(database, currentUser) });
  }

  async function updateTheme(theme) {
    const database = storage.readDatabase();
    database.preferences.theme = theme === "light" ? "light" : "dark";
    storage.writeDatabase(database);
    return withDelay({ theme: database.preferences.theme });
  }

  async function saveDraft(userId, draftPayload) {
    const database = storage.readDatabase();
    database.drafts[userId] = {
      savedAt: utils.nowIso(),
      payload: utils.deepClone(draftPayload || {})
    };
    recordAudit(database, "SAVE_DRAFT", userId, { hasReportId: Boolean(draftPayload && draftPayload.currentReportId) });
    storage.writeDatabase(database);
    return withDelay(database.drafts[userId]);
  }

  async function clearDraft(userId) {
    const database = storage.readDatabase();
    delete database.drafts[userId];
    storage.writeDatabase(database);
    return withDelay({ ok: true });
  }

  async function saveReport(reportPayload) {
    const payload = stripEditorOnlyFields(reportPayload);
    const database = await ensureSecurityState(storage.readDatabase());
    const existingIndex = database.reports.findIndex((report) => report.id === payload.id);
    const previousReport = existingIndex >= 0 ? database.reports[existingIndex] : null;
    const currentUser = getCurrentUser(database);
    if (!currentUser) {
      return Promise.reject({ message: "Your session expired. Please sign in again." });
    }
    if (!utils.canEditContent(currentUser)) {
      return Promise.reject({ message: "Your account is in read-only mode. Editing is disabled by the super admin." });
    }
    if (previousReport && !utils.canManageReport(currentUser, previousReport)) {
      return Promise.reject({ message: "You do not have permission to edit this report." });
    }

    const normalizedReport = storage.normalizeReport({
      ...payload,
      id: payload.id || utils.uid("report"),
      categoryId: getCategoryId(payload.categoryId),
      authorId: previousReport ? previousReport.authorId : (currentUser ? currentUser.id : "user-student"),
      updatedAt: utils.nowIso(),
      createdAt: previousReport ? previousReport.createdAt : utils.nowIso()
    });

    const check = validation.validateReport(normalizedReport, previousReport);
    if (!check.valid) {
      return Promise.reject({ message: "Please fix the highlighted fields before saving.", errors: check.errors });
    }

    if (previousReport) {
      const snapshot = createVersionSnapshot(previousReport);
      normalizedReport.versions = utils.toArray(previousReport.versions);
      normalizedReport.versions.unshift({
        id: utils.uid("version"),
        savedAt: utils.nowIso(),
        summary: previousReport.summary,
        title: previousReport.title,
        status: previousReport.status,
        snapshot
      });
    } else {
      normalizedReport.versions = [];
    }

    if (existingIndex >= 0) {
      database.reports.splice(existingIndex, 1, normalizedReport);
    } else {
      database.reports.unshift(normalizedReport);
    }

    if (reportPayload.rememberAcademic !== false) {
      mergeAcademicProfiles(database, normalizedReport);
    }

    if (currentUser) {
      delete database.drafts[currentUser.id];
    }

    recordAudit(database, previousReport ? "UPDATE_REPORT" : "CREATE_REPORT", currentUser.id, {
      reportId: normalizedReport.id,
      title: normalizedReport.title
    });
    storage.writeDatabase(database);
    return withDelay({
      report: normalizedReport,
      payload: composeBootPayload(database)
    });
  }

  async function deleteReport(reportId) {
    const database = storage.readDatabase();
    const currentUser = getCurrentUser(database);
    const report = database.reports.find((entry) => entry.id === reportId);
    if (!currentUser || !report || !utils.canManageReport(currentUser, report)) {
      return Promise.reject({ message: "You do not have permission to delete this report." });
    }
    database.reports = database.reports.filter((entry) => entry.id !== reportId);
    recordAudit(database, "DELETE_REPORT", currentUser.id, { reportId });
    storage.writeDatabase(database);
    return withDelay(composeBootPayload(database));
  }

  async function duplicateReport(reportId) {
    const database = storage.readDatabase();
    const currentUser = getCurrentUser(database);
    const source = database.reports.find((report) => report.id === reportId);
    if (!source) {
      return Promise.reject({ message: "Report not found." });
    }
    if (!currentUser) {
      return Promise.reject({ message: "Your session expired. Please sign in again." });
    }
    if (!utils.canEditContent(currentUser)) {
      return Promise.reject({ message: "Your account is in read-only mode. Duplicating reports is disabled." });
    }
    if (source.status !== "published" && !utils.canManageReport(currentUser, source)) {
      return Promise.reject({ message: "You do not have permission to duplicate this draft." });
    }

    const clone = utils.deepClone(source);
    clone.id = utils.uid("report");
    clone.title = source.title + " (Copy)";
    clone.status = "draft";
    clone.featured = false;
    clone.createdAt = utils.nowIso();
    clone.updatedAt = clone.createdAt;
    clone.authorId = currentUser ? currentUser.id : source.authorId;
    clone.versions = [];
    database.reports.unshift(clone);
    recordAudit(database, "DUPLICATE_REPORT", currentUser.id, { sourceReportId: reportId, cloneReportId: clone.id });
    storage.writeDatabase(database);
    return withDelay({
      report: clone,
      payload: composeBootPayload(database)
    });
  }

  async function toggleReportStatus(reportId) {
    const database = storage.readDatabase();
    const currentUser = getCurrentUser(database);
    const report = database.reports.find((entry) => entry.id === reportId);
    if (!currentUser || !report || !utils.canManageReport(currentUser, report)) {
      return Promise.reject({ message: "Report not found." });
    }

    report.status = report.status === "published" ? "draft" : "published";
    report.updatedAt = utils.nowIso();
    recordAudit(database, "TOGGLE_REPORT_STATUS", currentUser.id, { reportId, status: report.status });
    storage.writeDatabase(database);
    return withDelay({
      report,
      payload: composeBootPayload(database)
    });
  }

  async function restoreVersion(reportId, versionId) {
    const database = storage.readDatabase();
    const currentUser = getCurrentUser(database);
    const report = database.reports.find((entry) => entry.id === reportId);
    if (!currentUser || !report || !utils.canManageReport(currentUser, report)) {
      return Promise.reject({ message: "You do not have permission to restore this report." });
    }

    const version = utils.toArray(report.versions).find((entry) => entry.id === versionId);
    if (!version || !version.snapshot) {
      return Promise.reject({ message: "Version not found." });
    }

    const snapshot = storage.normalizeReport(version.snapshot);
    snapshot.id = report.id;
    snapshot.updatedAt = utils.nowIso();
    snapshot.versions = utils.toArray(report.versions).filter((entry) => entry.id !== versionId);
    snapshot.versions.unshift({
      id: utils.uid("version"),
      savedAt: utils.nowIso(),
      summary: report.summary,
      title: report.title,
      status: report.status,
      snapshot: createVersionSnapshot(report)
    });

    const index = database.reports.findIndex((entry) => entry.id === reportId);
    database.reports.splice(index, 1, snapshot);
    recordAudit(database, "RESTORE_REPORT_VERSION", currentUser.id, { reportId, versionId });
    storage.writeDatabase(database);
    return withDelay({
      report: snapshot,
      payload: composeBootPayload(database)
    });
  }

  async function seedUserCohort() {
    const database = await ensureSecurityState(storage.readDatabase());
    const currentUser = getCurrentUser(database);
    if (!utils.isSuperAdmin(currentUser)) {
      return Promise.reject({ message: "Super admin access is required." });
    }
    database.users = sampleData.createCohortUsers(config.maxUsers, database.users).map(storage.normalizeUser);
    await ensureSecurityState(database);
    recordAudit(database, "SEED_USER_COHORT", currentUser.id, { totalUsers: database.users.length });
    storage.writeDatabase(database);
    return withDelay(composeBootPayload(database));
  }

  async function toggleUserStatus(userId) {
    const database = storage.readDatabase();
    const currentUser = getCurrentUser(database);
    if (!utils.isSuperAdmin(currentUser)) {
      return Promise.reject({ message: "Super admin access is required." });
    }
    const user = database.users.find((entry) => entry.id === userId);
    if (!user) {
      return Promise.reject({ message: "User not found." });
    }
    if (user.id === currentUser.id) {
      return Promise.reject({ message: "You cannot change your own admin status from this dashboard." });
    }
    user.status = user.status === "active" ? "suspended" : "active";
    recordAudit(database, "TOGGLE_USER_STATUS", currentUser.id, { userId, status: user.status });
    storage.writeDatabase(database);
    return withDelay(composeBootPayload(database));
  }

  async function updateUserAccount(userId, patch) {
    const database = await ensureSecurityState(storage.readDatabase());
    const currentUser = getCurrentUser(database);
    if (!utils.isSuperAdmin(currentUser)) {
      return Promise.reject({ message: "Super admin access is required." });
    }

    const user = database.users.find((entry) => entry.id === userId);
    if (!user) {
      return Promise.reject({ message: "User not found." });
    }
    if (user.id === currentUser.id && patch.accessMode && patch.accessMode !== "super_admin") {
      return Promise.reject({ message: "The active super admin cannot remove their own elevated access here." });
    }

    const nextEmail = utils.normalizeText(patch.email || user.email);
    const nextStudentId = utils.normalizeText(patch.studentId || user.studentId || patch.loginSecret || user.loginSecret);
    let nextSecret = utils.normalizeText(patch.loginSecret || user.loginSecret);
    if (!nextEmail) {
      return Promise.reject({ message: "Email address is required for managed users." });
    }
    if (!utils.isLikelyEmail(nextEmail)) {
      return Promise.reject({ message: "Please enter a valid email address for this account." });
    }
    const duplicateEmail = database.users.find((entry) => entry.id !== user.id && utils.normalizeSearch(entry.email || entry.username) === utils.normalizeSearch(nextEmail));
    if (duplicateEmail) {
      return Promise.reject({ message: "That email address is already assigned to another user." });
    }

    if (user.roleKey === "student") {
      if (!nextStudentId) {
        return Promise.reject({ message: "Student ID is required for student accounts." });
      }
      nextSecret = nextStudentId;
    }

    if (!nextSecret) {
      return Promise.reject({ message: "Password or student ID is required for managed users." });
    }

    user.email = nextEmail;
    user.username = nextEmail;
    user.studentId = nextStudentId || user.studentId;
    user.loginSecret = nextSecret;
    if (user.roleKey === "student") {
      user.studentId = nextStudentId;
    }
    if (patch.accessMode && user.roleKey !== "super_admin") {
      user.accessMode = patch.accessMode === "read" ? "read" : "edit";
    }
    user.passwordHash = await hashPassword(user.email, user.loginSecret);
    recordAudit(database, "UPDATE_USER_ACCOUNT", currentUser.id, {
      userId,
      email: user.email,
      accessMode: user.accessMode
    });
    storage.writeDatabase(database);
    return withDelay(composeBootPayload(database));
  }

  async function getAcademicSuggestions() {
    const database = storage.readDatabase();
    return withDelay(buildAcademicSuggestions(database));
  }

  ns.backend = {
    bootstrap,
    clearDraft,
    deleteReport,
    duplicateReport,
    getAcademicSuggestions,
    login,
    logout,
    restoreVersion,
    saveDraft,
    saveReport,
    seedUserCohort,
    toggleUserStatus,
    updateUserAccount,
    touchSession,
    toggleReportStatus,
    updateTheme
  };
}(window));
