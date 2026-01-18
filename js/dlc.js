// js/dlc.js
(function () {
  const DLC_DOC_PATH = { col: "public", doc: "dlc" };

  function stableIdFromParts(prefix, parts) {
    const raw = String(parts || "").trim().toUpperCase();
    const safe = raw.replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return `${prefix}-${safe || "AUTO"}`;
  }

  function normalizeArrayByKey(arr, key) {
    const map = new Map();
    for (const item of (arr || [])) {
      if (!item || item[key] == null) continue;
      map.set(item[key], item);
    }
    return map;
  }

  function mergeByKey(localArr, dlcArr, key) {
    const base = normalizeArrayByKey(localArr, key);
    const dlc = normalizeArrayByKey(dlcArr, key);
    for (const [k, v] of dlc.entries()) base.set(k, v);
    return Array.from(base.values());
  }

  function applyDLCToState(state, dlc) {
    if (!dlc || typeof dlc !== "object") return false;

    let changed = false;

    // Airports (key: code)
    if (Array.isArray(dlc.airports)) {
      const merged = mergeByKey(state.airports || [], dlc.airports, "code");
      state.airports = merged;
      changed = true;
    }

    // Aircraft Catalog (key: modelId)
    if (Array.isArray(dlc.aircraftCatalog)) {
      const merged = mergeByKey(state.aircraftCatalog || [], dlc.aircraftCatalog, "modelId");
      state.aircraftCatalog = merged;
      changed = true;
    }

    // Missions (key: id) — se vier sem id, cria
    if (Array.isArray(dlc.missions)) {
      const normalized = dlc.missions.map((m) => {
        if (m && m.id) return m;
        const parts = `${m?.title ?? "MS"}-${m?.difficulty ?? ""}-${m?.reward ?? ""}`;
        return { id: stableIdFromParts("MS", parts), ...m };
      });

      const merged = mergeByKey(state.missions || [], normalized, "id");
      state.missions = merged;
      changed = true;
    }

    // Candidates (key: id) — se vier sem id, cria
    if (Array.isArray(dlc.candidates)) {
      const normalized = dlc.candidates.map((c) => {
        if (c && c.id) return c;
        const parts = `${c?.name ?? "C"}-${c?.role ?? ""}-${c?.salary ?? ""}`;
        return { id: stableIdFromParts("C", parts), ...c };
      });

      const merged = mergeByKey(state.candidates || [], normalized, "id");
      state.candidates = merged;
      changed = true;
    }

    return changed;
  }

  function dispatchDLCUpdated(meta) {
    try {
      window.dispatchEvent(new CustomEvent("dlc-updated", { detail: meta || {} }));
    } catch {
      // fallback
      const ev = document.createEvent("Event");
      ev.initEvent("dlc-updated", true, true);
      window.dispatchEvent(ev);
    }
  }

  async function startRealtimeListener() {
    // precisa existir config e dados do jogo carregados
    if (!window.FIREBASE_CONFIG) {
      console.warn("[DLC] FIREBASE_CONFIG não encontrado. DLC realtime desativado.");
      return;
    }
    if (!window.flightData || !window.FlySimStore) {
      console.warn("[DLC] flightData/FlySimStore não encontrado. Verifique a ordem dos scripts.");
      return;
    }

    try {
      const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
      const { getFirestore, doc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

      // evita inicializar duas vezes
      const apps = getApps();
      const app = apps.length ? apps[0] : initializeApp(window.FIREBASE_CONFIG);

      const db = getFirestore(app);
      const ref = doc(db, DLC_DOC_PATH.col, DLC_DOC_PATH.doc);

      console.log("[DLC] Listener realtime ativo em public/dlc");

      onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) {
            console.warn("[DLC] Documento public/dlc ainda não existe. (Admin cria ao salvar)");
            return;
          }

          const dlc = snap.data();
          const state = window.flightData;

          const changed = applyDLCToState(state, dlc);
          if (!changed) return;

          // salva estado com DLC aplicado
          window.FlySimStore.save(state);

          // avisa UI/map
          dispatchDLCUpdated({ source: "firestore", updatedAt: Date.now() });

          console.log("[DLC] Atualização aplicada em tempo real.");
        },
        (err) => {
          console.warn("[DLC] Erro no realtime listener:", err);
        }
      );
    } catch (e) {
      console.warn("[DLC] Não foi possível iniciar listener realtime:", e);
    }
  }

  // inicia depois que a página carregar
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startRealtimeListener);
  } else {
    startRealtimeListener();
  }
})();