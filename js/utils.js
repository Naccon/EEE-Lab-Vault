(function bootstrapUtils(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const config = ns.config;

  function deepClone(value) {
    if (typeof global.structuredClone === "function") {
      return global.structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix) {
    const base = Math.random().toString(36).slice(2, 9);
    const stamp = Date.now().toString(36);
    return [prefix || "id", stamp, base].join("-");
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function delay(ms) {
    return new Promise((resolve) => {
      global.setTimeout(resolve, ms);
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function nl2br(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function isAdmin(user) {
    return Boolean(config && config.ENABLE_ADMIN && user && user.roleKey === "super_admin");
  }

  function isSuperAdmin(user) {
    return Boolean(user && user.roleKey === "super_admin");
  }

  function canEditContent(user) {
    return Boolean(config && config.ENABLE_ADMIN && isAdmin(user));
  }

  function normalizeSearch(value) {
    return normalizeText(value).toLowerCase();
  }

  function isLikelyEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(value));
  }

  function detectDeviceType(userAgent) {
    const ua = normalizeSearch(userAgent);
    if (!ua) {
      return "Unknown Device";
    }
    if (/tablet|ipad|playbook|silk/.test(ua)) {
      return "Tablet";
    }
    if (/mobi|android|iphone|phone/.test(ua)) {
      return "Mobile";
    }
    return "Desktop";
  }

  function slugify(value) {
    return normalizeSearch(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "lab-report";
  }

  function formatDate(dateValue, fallback) {
    if (!dateValue) {
      return fallback || "N/A";
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return fallback || dateValue;
    }

    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function formatDateTime(dateValue, fallback) {
    if (!dateValue) {
      return fallback || "N/A";
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return fallback || dateValue;
    }

    return parsed.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function compareDateDesc(left, right) {
    return new Date(right || 0).getTime() - new Date(left || 0).getTime();
  }

  function humanizeStatus(status) {
    return status === "published" ? "Published" : "Draft";
  }

  function getInitials(name) {
    const tokens = normalizeText(name).split(" ").filter(Boolean);
    return tokens.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "EE";
  }

  function debounce(fn, waitMs) {
    let timer = null;

    return function debounced(...args) {
      if (timer) {
        global.clearTimeout(timer);
      }

      timer = global.setTimeout(() => {
        timer = null;
        fn.apply(this, args);
      }, waitMs);
    };
  }

  function throttle(fn, waitMs) {
    let lastRun = 0;
    let timer = null;
    let lastArgs = null;

    return function throttled(...args) {
      const now = Date.now();
      const remaining = waitMs - (now - lastRun);
      lastArgs = args;

      if (remaining <= 0) {
        if (timer) {
          global.clearTimeout(timer);
          timer = null;
        }
        lastRun = now;
        fn.apply(this, args);
        return;
      }

      if (!timer) {
        timer = global.setTimeout(() => {
          timer = null;
          lastRun = Date.now();
          fn.apply(this, lastArgs);
        }, remaining);
      }
    };
  }

  function objectHasContent(record) {
    return Object.values(record || {}).some((value) => normalizeText(value).length > 0);
  }

  function safeJsonParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function sanitizeDataUrl(value) {
    const stringValue = String(value || "");
    return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(stringValue) || /^data:image\/svg\+xml/.test(stringValue)
      ? stringValue
      : "";
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });
  }

  async function sha256Hex(value) {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(String(value || ""));
    const digest = await global.crypto.subtle.digest("SHA-256", buffer);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function deriveLevelTermFromSemester(value) {
    const source = normalizeText(value);
    if (!source) {
      return {
        studentLevel: "Level 2",
        studentTerm: "Term 1"
      };
    }

    const lower = source.toLowerCase();
    const yearMatch = lower.match(/(\d+)/);
    const semesterMatch = lower.match(/,\s*(\d+)/) || lower.match(/semester\s*(\d+)/) || lower.match(/term\s*(\d+)/);

    return {
      studentLevel: yearMatch ? `Level ${yearMatch[1]}` : "Level 2",
      studentTerm: semesterMatch ? `Term ${semesterMatch[1]}` : "Term 1"
    };
  }

  function canManageReport(user, report) {
    if (!user || !report) {
      return false;
    }
    return isAdmin(user);
  }

  function parseRichTextToHtml(value) {
    const raw = String(value || "").replace(/\r/g, "");
    const lines = raw.split("\n");
    const blocks = [];
    let index = 0;

    function renderInline(text) {
      return escapeHtml(text)
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.+?)__/g, "<u>$1</u>")
        .replace(/\{\{formula:(.+?)\}\}/g, (_match, formula) => `<span class="formula-inline">${String(formula).replace(/ /g, "&nbsp;")}</span>`);
    }

    while (index < lines.length) {
      const line = lines[index];
      if (!normalizeText(line)) {
        index += 1;
        continue;
      }

      if (line.trim().startsWith("|")) {
        const tableLines = [];
        while (index < lines.length && lines[index].trim().startsWith("|")) {
          tableLines.push(lines[index]);
          index += 1;
        }

        const rows = tableLines
          .map((tableLine) => tableLine.trim())
          .filter(Boolean)
          .map((tableLine) => tableLine.split("|").slice(1, -1).map((cell) => cell.trim()));

        if (rows.length >= 2) {
          const header = rows[0];
          const bodyRows = rows.slice(2);
          blocks.push(`
            <div class="rich-table-shell">
              <table class="data-table">
                <thead><tr>${header.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>
                <tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
              </table>
            </div>
          `);
        } else {
          blocks.push(`<p>${renderInline(tableLines.join("\n"))}</p>`);
        }
        continue;
      }

      const paragraphLines = [];
      while (index < lines.length && normalizeText(lines[index]) && !lines[index].trim().startsWith("|")) {
        paragraphLines.push(lines[index]);
        index += 1;
      }
      blocks.push(`<p>${renderInline(paragraphLines.join("\n"))}</p>`);
    }

    return blocks.join("");
  }

  function stripRichText(value) {
    const raw = String(value || "").replace(/\r/g, "");
    return raw
      .split("\n")
      .map((line) => {
        if (!line.trim().startsWith("|")) {
          return line;
        }
        return line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim())
          .join(" | ");
      })
      .join("\n")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/\{\{formula:(.+?)\}\}/g, (_match, formula) => String(formula).replace(/ /g, "\u00A0"))
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function base64ToUint8Array(dataUrl) {
    const parts = String(dataUrl || "").split(",");
    const base64 = parts.length > 1 ? parts[1] : parts[0] || "";
    const binary = global.atob(base64);
    const array = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      array[index] = binary.charCodeAt(index);
    }
    return array;
  }

  function toDataUrlFromSvg(svgMarkup) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup);
  }

  function chunkText(value, maxLength) {
    const words = String(value || "").split(/\s+/).filter(Boolean);
    if (!words.length) {
      return [""];
    }

    const chunks = [];
    let current = "";

    words.forEach((word) => {
      const proposal = current ? current + " " + word : word;
      if (proposal.length > maxLength && current) {
        chunks.push(current);
        current = word;
      } else {
        current = proposal;
      }
    });

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }

  function distinct(values) {
    return Array.from(new Set(toArray(values).filter(Boolean)));
  }

  function lastUpdatedPhrase(dateValue) {
    if (!dateValue) {
      return "No updates yet";
    }

    const distance = Date.now() - new Date(dateValue).getTime();
    const minutes = Math.max(1, Math.round(distance / 60000));
    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  ns.utils = {
    base64ToUint8Array,
    canEditContent,
    canManageReport,
    chunkText,
    compareDateDesc,
    debounce,
    detectDeviceType,
    deepClone,
    delay,
    deriveLevelTermFromSemester,
    distinct,
    escapeHtml,
    formatDate,
    formatDateTime,
    getInitials,
    humanizeStatus,
    isAdmin,
    isLikelyEmail,
    isSuperAdmin,
    lastUpdatedPhrase,
    nl2br,
    normalizeSearch,
    normalizeText,
    nowIso,
    objectHasContent,
    parseRichTextToHtml,
    readFileAsDataUrl,
    safeJsonParse,
    sanitizeDataUrl,
    sha256Hex,
    slugify,
    stripRichText,
    throttle,
    toArray,
    toDataUrlFromSvg,
    uid
  };
}(window));
