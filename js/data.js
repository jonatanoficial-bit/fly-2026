(function () {
  const STORAGE_KEY = "flysim_save_v1";

  function uid(prefix) {
    return `${prefix}-${Math.random().toString(16).slice(2, 8)}${Date.now().toString(16).slice(-4)}`.toUpperCase();
  }

  function kmBetween(a, b) {
    // Haversine simples (km)
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
    meta: { version: 1 },

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

    // Catálogo de modelos (pode ser expandido via Admin depois)
    aircraftCatalog: [
      { modelId: "CAT-A320", name: "A320 (Genérico)", manufacturer: "Airbus", seats: 180, rangeKm: 6100, cruiseKts: 450, price: 450000000, fuelBurnPerKm: 2.4 },
      { modelId: "CAT-B737", name: "737 (Genérico)", manufacturer: "Boeing", seats: 170, rangeKm: 5600, cruiseKts: 440, price: 430000000, fuelBurnPerKm: 2.3 },
      { modelId: "CAT-E195", name: "E195 (Genérico)", manufacturer: "Embraer", seats: 132, rangeKm: 4800, cruiseKts: 420, price: 280000000, fuelBurnPerKm: 1.8 }
    ],

    // Aeronaves compradas
    fleet: [
      {
        aircraftId: "AC-0001",
        modelId: "CAT-E195",
        tailNumber: "PP-FLY",
        condition: 92,
        status: "IDLE" // IDLE | ASSIGNED | MAINTENANCE
      }
    ],

    // Funcionários
    staff: [
      { id: "ST-001", name: "João", role: "Piloto", salary: 18000, morale: 82 },
      { id: "ST-002", name: "Marcos", role: "Mecânico", salary: 9000, morale: 76 }
    ],

    // Pool de candidatos para contratar
    candidates: [
      { id: "C-001", name: "Ana", role: "Piloto", salary: 17500, morale: 70 },
      { id: "C-002", name: "Bruno", role: "Comissário", salary: 6500, morale: 78 },
      { id: "C-003", name: "Carla", role: "Mecânico", salary: 9200, morale: 74 },
      { id: "C-004", name: "Diego", role: "Comissário", salary: 6400, morale: 82 }
    ],

    // Rotas criadas pelo jogador (a partir daqui geram voos)
    routes: [
      {
        routeId: "RT-001",
        origin: "GRU",
        destination: "GIG",
        ticketPrice: 420,
        frequencyPerDay: 2,
        assignedAircraftId: "AC-0001",
        active: true
      }
    ],

    // Voos ativos/planejados (gerados)
    flights: [],

    missions: [
      { id: "MS-001", title: "Carga Express", reward: 120000, difficulty: "Média", description: "Entregar carga sensível no prazo." },
      { id: "MS-002", title: "Voo VIP", reward: 220000, difficulty: "Alta", description: "Transportar passageiro VIP com conforto máximo." }
    ]
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_DATA);
      const parsed = JSON.parse(raw);
      return { ...structuredClone(DEFAULT_DATA), ...parsed };
    } catch {
      return structuredClone(DEFAULT_DATA);
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // Gera voos do dia com base nas rotas ativas
  function generateFlightsForRoutes(data) {
    const now = Date.now();
    const flights = [];

    for (const r of data.routes.filter(x => x.active)) {
      const origin = data.airports.find(a => a.code === r.origin);
      const dest = data.airports.find(a => a.code === r.destination);
      if (!origin || !dest) continue;

      const aircraft = data.fleet.find(f => f.aircraftId === r.assignedAircraftId);
      if (!aircraft) continue;

      const model = data.aircraftCatalog.find(m => m.modelId === aircraft.modelId);
      if (!model) continue;

      const distanceKm = kmBetween(
        { lat: origin.lat, lon: origin.lon },
        { lat: dest.lat, lon: dest.lon }
      );

      // cria N voos por dia (simples)
      for (let i = 0; i < Math.max(1, r.frequencyPerDay); i++) {
        const flightId = uid("FL");
        const flightNumber = `VA ${Math.floor(100 + Math.random() * 900)}`;

        // começa perto da origem
        const position = {
          lat: origin.lat + (Math.random() - 0.5) * 0.2,
          lon: origin.lon + (Math.random() - 0.5) * 0.2
        };

        flights.push({
          id: flightId,
          flightNumber,
          routeId: r.routeId,
          aircraftId: aircraft.aircraftId,

          origin,
          destination: dest,

          status: "ATIVO", // ATIVO | FINALIZADO | AGUARDANDO
          speedKts: model.cruiseKts,
          altitudeFt: 28000,

          distanceKm,
          ticketPrice: r.ticketPrice,

          progress01: Math.random() * 0.2, // 0..1
          position,

          createdAt: now
        });
      }
    }

    data.flights = flights;
    save(data);
  }

  // API global do jogo
  const state = load();

  // se não tem voos ainda, gera
  if (!state.flights || state.flights.length === 0) {
    generateFlightsForRoutes(state);
  } else {
    // garante consistência básica
    save(state);
  }

  window.FlySimStore = {
    STORAGE_KEY,
    uid,
    load: () => load(),
    save: (d) => save(d),
    kmBetween,
    generateFlightsForRoutes
  };

  window.flightData = state;
})();