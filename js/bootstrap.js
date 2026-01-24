// js/bootstrap.js (SUBSTITUA INTEIRO)
// Bootstrap AAA: inicializa store/save, valida dados, inicia Map/UI/Game na ordem correta.
// Compatível com offline e Leaflet.
// Requer (se existirem): FlySimStore, MapModule, UIModule, GameModule

(function () {
  "use strict";

  // -------------------------
  // Helpers
  // -------------------------
  const log = (...a) => console.log("[BOOT]", ...a);
  const warn = (...a) => console.warn("[BOOT]", ...a);
  const err = (...a) => console.error("[BOOT]", ...a);

  function clamp01(v, fallback = 0.55) {
    const n = Number(v);
    if (Number.isNaN(n)) return fallback;
    return Math.max(0, Math.min(1, n));
  }

  function ensureArray(obj, key) {
    if (!obj[key] || !Array.isArray(obj[key])) obj[key] = [];
  }

  function ensureObj(obj, key) {
    if (!obj[key] || typeof obj[key] !== "object") obj[key] = {};
  }

  // -------------------------
  // Validate modules visibility (window.*)
  // -------------------------
  function assertWindowModules() {
    // Se algum módulo foi declarado com const no topo (não vai pro window),
    // isso aqui denuncia.
    const missing = [];
    if (!window.MapModule) missing.push("MapModule");
    if (!window.UIModule) missing.push("UIModule");
    if (!window.GameModule) missing.push("GameModule");

    if (missing.length) {
      warn("Módulos não encontrados em window:", missing.join(", "));
      warn("Se seus arquivos tiverem: const GameModule = ..., isso NÃO vira window.GameModule.");
      warn("Eles precisam ser definidos como: window.GameModule = (function(){ ... })();");
    }
  }

  // -------------------------
  // Load / Merge Save
  // -------------------------
  function loadSave() {
    let loaded = null;
    try {
      if (window.FlySimStore?.load) loaded = window.FlySimStore.load();
    } catch (e) {
      warn("Falha ao carregar save:", e);
      loaded = null;
    }

    if (loaded && typeof loaded === "object") {
      log("Save carregado do storage.");
      return loaded;
    }

    // Se não houver save, usa o que já existe em window.flightData (data.js)
    if (window.flightData && typeof window.flightData === "object") {
      log("Sem save — usando flightData inicial (data.js).");
      return window.flightData;
    }

    // fallback total
    log("Sem save e sem data.js — criando flightData mínimo.");
    return createDefaultData();
  }

  function createDefaultData() {
    return {
      company: {
        cash: 250000000,
        reputation01: 0.55,
        day: 1,
        minuteOfDay: 8 * 60,
        fuelPricePerUnit: 5.2
      },
      airports: [],
      routes: [],
      flights: [],
      fleet: [],
      staff: [],
      ledger: [],
      __ids: { flight: 1000, route: 100, fleet: 50, staff: 10 }
    };
  }

  function normalizeData(d) {
    if (!d || typeof d !== "object") d = createDefaultData();

    ensureObj(d, "company");
    ensureArray(d, "airports");
    ensureArray(d, "routes");
    ensureArray(d, "flights");
    ensureArray(d, "fleet");
    ensureArray(d, "staff");
    ensureArray(d, "ledger");
    ensureObj(d, "__ids");

    // company defaults
    const c = d.company;
    if (typeof c.cash !== "number") c.cash = 250000000;
    c.reputation01 = clamp01(c.reputation01, 0.55);
    if (typeof c.day !== "number") c.day = 1;
    if (typeof c.minuteOfDay !== "number") c.minuteOfDay = 8 * 60;
    if (typeof c.fuelPricePerUnit !== "number") c.fuelPricePerUnit = 5.2;

    // ids
    if (typeof d.__ids.flight !== "number") d.__ids.flight = 1000;
    if (typeof d.__ids.route !== "number") d.__ids.route = 100;
    if (typeof d.__ids.fleet !== "number") d.__ids.fleet = 50;
    if (typeof d.__ids.staff !== "number") d.__ids.staff = 10;

    // airports defaults (para economia)
    for (const ap of d.airports) {
      if (!ap) continue;
      if (typeof ap.demandBase !== "number") ap.demandBase = 0.55;
      if (typeof ap.hubLevel !== "number") ap.hubLevel = 3;
    }

    // fleet defaults
    for (const ac of d.fleet) {
      if (!ac) continue;
      if (typeof ac.condition01 !== "number") ac.condition01 = 0.92;
      if (!ac.status) ac.status = "ACTIVE";
    }

    // routes defaults
    for (const r of d.routes) {
      if (!r) continue;
      if (typeof r.frequencyPerDay !== "number") r.frequencyPerDay = 1;
      if (typeof r.ticketPrice !== "number") r.ticketPrice = 0;
      if (typeof r.active !== "boolean") r.active = true;
      if (!("aircraftId" in r)) r.aircraftId = null;
      if (!r.routeId) {
        d.__ids.route += 1;
        r.routeId = "R" + d.__ids.route;
      }
    }

    // flights defaults
    for (const f of d.flights) {
      if (!f) continue;
      if (!f.id) {
        d.__ids.flight += 1;
        f.id = "F" + d.__ids.flight;
      }
      if (!f.status) f.status = "AGENDADO";
      if (typeof f.progress01 !== "number") f.progress01 = 0;
      if (!f.position) f.position = null;
      if (!("lastResult" in f)) f.lastResult = null;
    }

    // ledger cap
    if (d.ledger.length > 60) d.ledger.length = 60;

    return d;
  }

  function saveNow(d) {
    try {
      if (window.FlySimStore?.save) window.FlySimStore.save(d);
    } catch (e) {
      warn("Falha ao salvar:", e);
    }
  }

  function fireUpdated() {
    try { window.dispatchEvent(new CustomEvent("game-updated")); } catch (_) {}
  }

  // -------------------------
  // Boot sequence
  // -------------------------
  function boot() {
    assertWindowModules();

    // 1) Load & normalize
    const data = normalizeData(loadSave());
    window.flightData = data;

    // save baseline (garante estrutura persistida)
    saveNow(window.flightData);

    // 2) Init modules in stable order
    // Map primeiro (pra UI poder focar)
    try {
      if (window.MapModule?.init) window.MapModule.init();
      else warn("MapModule.init() não encontrado.");
    } catch (e) {
      err("Erro iniciando MapModule:", e);
    }

    // UI depois (pra desenhar painel)
    try {
      if (window.UIModule?.init) window.UIModule.init();
      else {
        // compat: se não tiver init, tenta refresh
        warn("UIModule.init() não encontrado; tentando UIModule.refresh().");
        window.UIModule?.refresh?.();
      }
    } catch (e) {
      err("Erro iniciando UIModule:", e);
    }

    // Game por último (loop)
    try {
      if (window.GameModule?.init) window.GameModule.init();
      else warn("GameModule.init() não encontrado.");
    } catch (e) {
      err("Erro iniciando GameModule:", e);
    }

    fireUpdated();
    log("Bootstrap OK.");
  }

  // Espera DOM pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();