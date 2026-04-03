(function bootstrapAuth(global) {
  const ns = global.EEEVault = global.EEEVault || {};

  function openAuth(dom) {
    if (!dom || !dom.authGate) {
      return;
    }
    dom.authGate.classList.remove("hidden");
    dom.authGate.setAttribute("aria-hidden", "false");
  }

  function closeAuth(dom) {
    if (!dom || !dom.authGate) {
      return;
    }
    dom.authGate.classList.add("hidden");
    dom.authGate.setAttribute("aria-hidden", "true");
  }

  function clearAuthAlert(dom) {
    if (!dom || !dom.authAlert) {
      return;
    }
    dom.authAlert.classList.add("hidden");
    dom.authAlert.textContent = "";
  }

  function showAuthAlert(dom, message) {
    if (!dom || !dom.authAlert) {
      return;
    }
    dom.authAlert.textContent = message;
    dom.authAlert.classList.remove("hidden");
  }

  ns.auth = {
    clearAuthAlert,
    closeAuth,
    openAuth,
    showAuthAlert
  };
}(window));
