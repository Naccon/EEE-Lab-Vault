(function bootstrapEntry(global) {
  const MANIFEST_URL = "./reports/manifest.json";

  async function fetchJsonStrict(url) {
    const response = await global.fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unable to load ${url}`);
    }

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("Invalid JSON:", error);
      throw new Error(`Invalid JSON in ${url}`);
    }
  }

  function showStartupError(message) {
    const loadingOverlay = global.document.getElementById("loadingOverlay");
    const autosaveTopStatus = global.document.getElementById("autosaveTopStatus");
    const securitySummary = global.document.getElementById("securitySummary");
    const reportsGrid = global.document.getElementById("reportsGrid");
    const emptyState = global.document.getElementById("emptyState");
    const emptyStateCopy = global.document.getElementById("emptyStateCopy");

    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
      loadingOverlay.setAttribute("aria-hidden", "true");
    }

    if (autosaveTopStatus) {
      autosaveTopStatus.textContent = "Manifest error";
    }

    if (securitySummary) {
      securitySummary.innerHTML = `<div class="memory-chip">${String(message || "Unable to load repository data.")}</div>`;
    }

    if (reportsGrid) {
      reportsGrid.innerHTML = "";
      reportsGrid.classList.add("hidden");
    }

    if (emptyStateCopy) {
      emptyStateCopy.textContent = String(message || "Unable to load repository data.");
    }

    if (emptyState) {
      emptyState.classList.remove("hidden");
    }
  }

  async function validateSubjectFile(code) {
    if (!code) {
      throw new Error("Missing subject code");
    }

    const subjectUrl = `./reports/${code}/subject.json`;
    const response = await global.fetch(subjectUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unable to load ${subjectUrl}`);
    }

    const text = await response.text();

    try {
      JSON.parse(text);
    } catch (error) {
      console.error("Invalid JSON:", error);
      throw new Error(`Invalid JSON in ${subjectUrl}`);
    }
  }

  global.addEventListener("DOMContentLoaded", async () => {
    try {
      const data = await fetchJsonStrict(MANIFEST_URL);
      console.log("Manifest loaded:", data);
      console.log("Subjects:", data.subjects);

      const subjects = Array.isArray(data.subjects) ? data.subjects : [];

      subjects.forEach((subject) => {
        const code = subject && typeof subject === "object" ? subject.code : "";
        if (!code) {
          console.warn("Skipping invalid subject:", subject);
        }
      });

      for (const subject of subjects) {
        const code = subject && typeof subject === "object" ? subject.code : "";
        if (!code) {
          continue;
        }

        try {
          await validateSubjectFile(code);
        } catch (error) {
          console.warn(`Skipping subject ${code}:`, error);
        }
      }

      if (global.EEEVault && global.EEEVault.app && typeof global.EEEVault.app.bootstrap === "function") {
        await global.EEEVault.app.bootstrap();
        return;
      }

      throw new Error("Application bootstrap is unavailable.");
    } catch (error) {
      console.error("Invalid JSON:", error);
      showStartupError(error.message || "Unable to load repository data.");
    }
  });
}(window));
