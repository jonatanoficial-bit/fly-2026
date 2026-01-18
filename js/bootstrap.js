// js/bootstrap.js
(function () {
  const MAX_WAIT_MS = 12000;
  const STEP_MS = 150;

  const debugPanel = document.getElementById("debugPanel");
  const debugText = document.getElementById("debugText");

  function showDebug(title, err) {
    if (!debugPanel || !debugText) return;
    debugPanel.style.display = "block";
    const msg =
      `${title}\n\n` +
      (err ? (err.stack || err.message || String(err)) : "") +
      `\n\nChecagens:\n` +
      `- Leaflet (window.L): ${!!window.L}\n` +
      `- flightData: ${!!window.flightData}\n` +
      `- UIModule: ${!!window.UIModule}\n` +
      `- MapModule: ${!!window.MapModule}\n` +
      `- GameModule: ${!!window.GameModule}\n`;
    debugText.textContent = msg;
  }

  // Captura erros globais para aparecer no celular
  window.addEventListener("error", (e) => {
    showDebug("Erro JavaScript detectado", e.error || e.message);
  });

  window.addEventListener("unhandledrejection", (e) => {
    showDebug("Promise rejeitada (unhandledrejection)", e.reason);
  });

  function hideMapLoading() {
    const el = document.getElementById("mapLoading");
    if (el) el.style.display = "none";
  }

  function ready() {
    return !!window.L && !!window.flightData && !!window.UIModule && !!window.MapModule;
  }

  function initApp() {
    try {
      // UI
      window.UIModule.init();

      // Mapa
      window.MapModule.init({
        mapId: "map",
        center: [-23.55052, -46.633308],
        zoom: 4
      });

      hideMapLoading();

      // Botões HUD
      const btnCenter = document.getElementById("btnCenter");
      const btnRoutes = document.getElementById("btnRoutes");
      const btnFleet = document.getElementById("btnFleet");
      const btnPanel = document.getElementById("btnPanel");

      if (btnCenter) btnCenter.onclick = () => window.MapModule.centerOnCompany();
      if (btnRoutes) btnRoutes.onclick = () => { window.UIModule.openPanel(); window.UIModule.selectTab("routes"); };
      if (btnFleet) btnFleet.onclick = () => { window.UIModule.openPanel(); window.UIModule.selectTab("fleet"); };
      if (btnPanel) btnPanel.onclick = () => window.UIModule.openPanel();

      // Help overlay (se existir)
      const help = document.getElementById("flightHelp");
      const btnHelp = document.getElementById("btnHelp");
      const btnCloseHelp = document.getElementById("btnCloseHelp");

      if (btnHelp && help) btnHelp.onclick = () => help.classList.remove("hidden");
      if (btnCloseHelp && help) btnCloseHelp.onclick = () => help.classList.add("hidden");

      console.log("[BOOT] App inicializado OK.");
    } catch (e) {
      showDebug("Falha ao inicializar o app", e);
    }
  }

  async function waitAndBoot() {
    const start = Date.now();
    while (!ready() && Date.now() - start < MAX_WAIT_MS) {
      await new Promise(r => setTimeout(r, STEP_MS));
    }

    if (!ready()) {
      showDebug(
        "Dependências não carregaram a tempo",
        new Error("Provável falha ao carregar Leaflet (CDN), ou erro em algum JS.")
      );
      return;
    }

    initApp();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitAndBoot);
  } else {
    waitAndBoot();
  }
})();