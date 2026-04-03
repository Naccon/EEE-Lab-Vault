(function bootstrapEntry(global) {
  global.addEventListener("DOMContentLoaded", () => {
    if (global.EEEVault && global.EEEVault.app && typeof global.EEEVault.app.bootstrap === "function") {
      global.EEEVault.app.bootstrap();
    }
  });
}(window));
