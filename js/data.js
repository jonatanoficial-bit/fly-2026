// js/data.js
(function () {
  const STORAGE_KEY = "flysim_save_v2_econ";

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
    meta: { version: 3 },

    time: {
      day: 1,
      hour: 8, // 0..23
      autoSim: true, // simulação automática
      tickMinutes: 30 // cada tick = 30min de jogo
    },

    economy: {
      // custos base
      airportFeePerFlight: 2500, // taxa fixa por voo
      fuelPricePerUnit: 6, // preço por "unidade" (simples)
      salaryDailyMultiplier: 1, // 1 = paga 1x soma salários por dia

      // demanda / ocupação
      baseOccupancy: 0.68, // 68%
      repImpact: 0.002, // +0.2% por ponto de reputação acima/abaixo de 50
      lowConditionPenaltyAt: 70, // abaixo disso começa penalidade
      lowConditionPenaltyMax: 0.18, // até -18% ocupação
      delayChanceAtVeryLow: 0.25, // chance de "atraso" financeiro quando muito ruim

      // desgaste / manutenção
      conditionLossPerKm: 0.0018, // perde 0.18% a cada 100km
      maintenance: {
        baseCost: 80000,
        costPerConditionPoint: 6000, // custo para recuperar 1 ponto de condição
        hoursRequired: 10 // horas de jogo em manutenção
      }
    },

    company: {
      name: "Fly-202",
      cash: 10000000,
      fuel: 50000,
      co2Credits: 1000,
      reputation: 50
    },

    ledger: {
      // últimos lançamentos (máx 40)
      entries: []
    },

    airports: [
      { code: "GRU", city: "São Paulo", lat: -23.4356, lon: -46.4731 },
      { code: "GIG", city: "Rio de Janeiro", lat: -22.8099, lon: -43.2506 },
      { code: "BSB", city: "Brasília", lat: -15.8697, lon: -47.9208 },
      { code: "SSA", city: "Salvador", lat: -12.9086, lon: -38.3225 },
      { code: "CNF", city: "Belo Horizonte", lat: -19.6244, lon: -43.9719 },
      { code: "POA", city: "Porto Alegre", lat: -29.9939, lon: -51.1711 }
    ],

    aircraftCatalog: [
      { modelId: "CAT-A320", name: "A320 (Genérico)", manufacturer: "Airbus", seats: 180, rangeKm: 6100, cruiseKts: 450, price: 450000000, fuelBurnPerKm: 2.4 },
      { modelId: "CAT-B737", name: "737 (Genérico)", manufacturer: "Boeing", seats: 170, rangeKm: 5600, cruiseKts: 440, price: 430000000, fuelBurnPerKm: 2.3 },
      { modelId: "CAT-E195", name: "E195 (Genérico)", manufacturer: "Embraer", seats: 132, rangeKm: 4800, cruiseKts: 420, price: 280000000, fuelBurnPerKm: 1.8 }
    ],

    fleet: [
      {
        aircraftId: "AC-0001",
        modelId: "CAT-E195",
        tailNumber: "PP-FLY",
        condition: 92,
        status: "IDLE", // IDLE | ASSIGNED | MAINTENANCE
        maintenance: null // { endsAtDay, endsAtHour }
      }
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

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = safeParse(raw);
    if (!parsed) return structuredClone(DEFAULT_DATA);
    return { ...structuredClone(DEFAULT_DATA), ...parsed };
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function ledgerPush(data, entry) {
    const e = {
      id: uid("LED"),
      atDay: data.time?.day ?? 1,
      atHour: data.time?.hour ?? 0,
      ts: Date.now(),
      ...entry
    };
    data.ledger.entries = Array.isArray(data.ledger.entries) ? data.ledger.entries : [];
    data.ledger.entries.unshift(e);
    data.ledger.entries = data.ledger.entries.slice(0, 40);
  }

  function generateFlightsForRoutes(data) {
    const now = Date.now();
    const flights = [];

    const airports = data.airports || [];
    const fleet = data.fleet || [];
    const catalog = data.aircraftCatalog || [];

    for (const r of (data.routes || []).filter(x => x.active)) {
      const origin = airports.find(a => a.code === r.origin);
      const dest = airports.find(a => a.code === r.destination);
      if (!origin || !dest) continue;

      const aircraft = fleet.find(f => f.aircraftId === r.assignedAircraftId);
      if (!aircraft) continue;

      // se está em manutenção, não gera voos
      if (aircraft.status === "MAINTENANCE") continue;

      const model = catalog.find(m => m.modelId === aircraft.modelId);
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

          status: "SCHEDULED", // SCHEDULED | ACTIVE | COMPLETED
          depDay: data.time.day,
          depHour: 6 + i * Math.max(1, Math.floor(12 / n)), // distribui ao longo do dia
          etaHours: Math.max(1, Math.round(distanceKm / 750)), // aproximação

          speedKts: model.cruiseKts,
          altitudeFt: 28000,

          distanceKm,
          ticketPrice: r.ticketPrice,

          progress01: 0,
          position: { lat: origin.lat, lon: origin.lon },

          economy: {
            passengers: 0,
            occupancy01: 0,
            revenue: 0,
            costs: 0,
            profit: 0,
            delayed: false
          },

          createdAt: now
        });
      }
    }

    data.flights = flights;
    save(data);
  }

  // Boot
  const state = load();

  // garante estruturas
  state.ledger = state.ledger || { entries: [] };
  state.time = state.time || structuredClone(DEFAULT_DATA.time);
  state.economy = { ...structuredClone(DEFAULT_DATA.economy), ...(state.economy || {}) };

  // se não tem voos, gera
  if (!Array.isArray(state.flights) || state.flights.length === 0) {
    generateFlightsForRoutes(state);
  } else {
    save(state);
  }

  window.FlySimStore = {
    STORAGE_KEY,
    uid,
    load: () => load(),
    save: (d) => save(d),
    kmBetween,
    ledgerPush,
    generateFlightsForRoutes
  };

  window.flightData = state;
})();