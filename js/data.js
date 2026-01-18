// js/data.js
(async function () {
  const STORAGE_KEY = "flysim_save_v1";
  const DLC_DOC_PATH = { col: "public", doc: "dlc" };

  function uid(prefix) {
    return `${prefix}-${Math.random().toString(16).slice(2, 8)}${Date.now().toString(16).slice(-4)}`.toUpperCase();
  }

  function kmBetween(a, b) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
  }

  const DEFAULT_DATA = {
    meta: { version: 2 },

    company: {
      name: "Fly-202",
      cash: 10000000,
      fuel: 50000,
      co2Credits: 1000,
      reputation: 50
    },

    airports: [
      { code: "GRU", city: "São Paulo", lat: -23.4356, lon: -46.4731 },
      { code: "GIG", city: "Rio de Janeiro", lat: -22.8099, lon: -43.2506 },
      { code: "BSB", city: "Brasília", lat: -15.8697, lon: -47.9208 },
      { code: "SSA", city: "Salvador", lat: -12.9086, lon: -38.3225 },
      { code: "CNF", city: "Belo Horizonte", lat: -19.6244, lon: -43.9719 },
      { code: "POA", city: "Porto Alegre", lat: -29.9939, lon: -51.1711 }
    ],

    // Catálogo local (fallback). DLC do Firestore entra junto.
    aircraftCatalog: [
      { modelId: "CAT-A320", name: "A320 (Genérico)", manufacturer: "Airbus", seats: 180, rangeKm: 6100, cruiseKts: 450, price: 450000000, fuelBurnPerKm: 2.4 },
      { modelId: "CAT-B737", name: "737 (Genérico)", manufacturer: "Boeing", seats: 170, rangeKm: 5600, cruiseKts: 440, price: 430000000, fuelBurnPerKm: 2.3 },
      { modelId: "CAT-E195", name: "E195 (Genérico)", manufacturer: "Embraer", seats: 132, rangeKm: 4800, cruiseKts: 420, price: 280000000, fuelBurnPerKm: 1.8 }
    ],

    fleet: [
      { aircraftId: "AC-0001", modelId: "CAT-E195", tailNumber: "PP-FLY", condition: 92, status: "IDLE" }
    ],

    staff: [
      { id: "ST-001", name: "João", role: "Piloto", salary: 18000, morale: 82 },
      { id: "ST-002", name: "Marcos", role: "Mecânico", salary: 9000, morale: 76 }
    ],

    candidates: [
      { id: "C-001", name: "Ana", role: "Piloto", salary: 17500, morale: 70 },
      { id: "C-002", name: "Bruno", role: "Comissário", salary: 6500, morale: 78 },
      { id: "C-003", name: "Carla", role: "Mecânico", salary: 9200, morale: 74 },
      { id: "C-004", name: "Diego", role: "Comissário", salary: 6400, morale: 82 }
    ],

    routes: [
      { routeId: "RT-001", origin: "GRU", destination: "GIG", ticketPrice: 420, frequencyPerDay: 2, assignedAircraftId: "AC-0001", active: true }
    ],

    flights: [],

    missions: [
      { id: "MS-001", title: "Carga Express", reward: 120000, difficulty: "Média", description: "Entregar carga sensível no prazo." },
      { id: "MS-002", title: "Voo VIP", reward: 220000, difficulty: "Alta", description: "Transportar passageiro VIP com conforto máximo." }
    ]
  };

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }

  function loadLocal() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = safeParse(raw);
    if (!parsed) return structuredClone(DEFAULT_DATA);
    return { ...structuredClone(DEFAULT_DATA), ...parsed };
  }

  function saveLocal(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function normalizeArrayByKey(arr, key) {
    const map = new Map();
    for (const item of (arr || [])) {
      if (!item || item[key] == null) continue;
      map.set(item[key], item);
    }
    return map;
  }

  // Mescla arrays por chave (DLC sobrescreve locais pelo mesmo ID)
  function mergeByKey(localArr, dlcArr, key) {
    const base = normalizeArrayByKey(localArr, key);
    const dlc = normalizeArrayByKey(dlcArr, key);
    for (const [k, v] of dlc.entries()) base.set(k, v);
    return Array.from(base.values());
  }

  // ====== VOOS ======
  function generateFlightsForRoutes(data) {
    const now = Date.now();
    const flights = [];

    for (const r of (data.routes || []).filter(x => x.active)) {
      const origin = (data.airports || []).find(a => a.code === r.origin);
      const dest = (data.airports || []).find(a => a.code === r.destination);
      if (!origin || !dest) continue;

      const aircraft = (data.fleet || []).find(f => f.aircraftId === r.assignedAircraftId);
      if (!aircraft) continue;

      const model = (data.aircraftCatalog || []).find(m => m.modelId === aircraft.modelId);
      if (!model) continue;

      const distanceKm = kmBetween(
        { lat: origin.lat, lon: origin.lon },
        { lat: dest.lat, lon: dest.lon }
      );

      const n = Math.max(1, Math.min(12, Number(r.frequencyPerDay || 1)));
      for (let i = 0; i < n; i++) {
        const flightId = uid("FL");
        const flightNumber = `VA ${Math.floor(100 + Math.random() * 900)}`;

        flights.push({
          id: flightId,
          flightNumber,
          routeId: r.routeId,
          aircraftId: aircraft.aircraftId,

          origin,
          destination: dest,

          status: "ATIVO",
          speedKts: model.cruiseKts,
          altitudeFt: 28000,

          distanceKm,
          ticketPrice: r.ticketPrice,

          progress01: Math.random() * 0.2,
          position: {
            lat: origin.lat + (Math.random() - 0.5) * 0.2,
            lon: origin.lon + (Math.random() - 0.5) * 0.2
          },

          createdAt: now
        });
      }
    }

    data.flights = flights;
    saveLocal(data);
  }

  // ====== Firestore DLC (leitura pública) ======
  async function loadDLCFromFirestore() {
    // Se não tiver config, apenas fallback
    if (!window.FIREBASE_CONFIG) return null;

    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
      const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

      const app = initializeApp(window.FIREBASE_CONFIG);
      const db = getFirestore(app);
      const ref = doc(db, DLC_DOC_PATH.col, DLC_DOC_PATH.doc);

      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return snap.data();
    } catch (e) {
      console.warn("DLC Firestore indisponível (offline ou erro):", e);
      return null;
    }
  }

  // ===== Boot =====
  const state = loadLocal();

  // carrega DLC e aplica
  const dlc = await loadDLCFromFirestore();
  if (dlc) {
    // airports por code
    state.airports = mergeByKey(state.airports, dlc.airports, "code");
    // catálogo por modelId
    state.aircraftCatalog = mergeByKey(state.aircraftCatalog, dlc.aircraftCatalog, "modelId");
    // missions por id (se vierem sem id, não mescla por id; admin-firebase pode salvar sem id)
    if (Array.isArray(dlc.missions)) {
      // se não tiver id, cria id estável
      const normalized = dlc.missions.map((m) => {
        if (m && m.id) return m;
        const h = `${m?.title ?? "MS"}-${m?.difficulty ?? ""}-${m?.reward ?? ""}`.replace(/\s+/g, "-");
        return { id: `MS-${h}`.toUpperCase(), ...m };
      });
      state.missions = mergeByKey(state.missions, normalized, "id");
    }
    // candidates por id (se vierem sem id, cria)
    if (Array.isArray(dlc.candidates)) {
      const normalized = dlc.candidates.map((c) => {
        if (c && c.id) return c;
        const h = `${c?.name ?? "C"}-${c?.role ?? ""}-${c?.salary ?? ""}`.replace(/\s+/g, "-");
        return { id: `C-${h}`.toUpperCase(), ...c };
      });
      state.candidates = mergeByKey(state.candidates, normalized, "id");
    }

    // salva o state com DLC aplicado (não perde save)
    saveLocal(state);
  }

  // se não tem voos, gera
  if (!state.flights || state.flights.length === 0) {
    generateFlightsForRoutes(state);
  } else {
    saveLocal(state);
  }

  // APIs globais
  window.FlySimStore = {
    STORAGE_KEY,
    uid,
    load: () => loadLocal(),
    save: (d) => saveLocal(d),
    kmBetween,
    generateFlightsForRoutes
  };

  window.flightData = state;
})();