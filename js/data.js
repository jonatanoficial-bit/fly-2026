// Dados base do jogo (pode virar DLC/updates no futuro)
window.flightData = {
  company: {
    name: "Fly-202",
    cash: 10000000,
    fuel: 50000,
    co2Credits: 1000
  },

  flights: [
    {
      id: "FL-001",
      flightNumber: "VA 202",
      origin: { code: "GRU", city: "São Paulo", lat: -23.4356, lon: -46.4731 },
      destination: { code: "GIG", city: "Rio de Janeiro", lat: -22.8099, lon: -43.2506 },
      status: "Em voo",
      speedKts: 420,
      altitudeFt: 28000,
      position: { lat: -23.10, lon: -45.60 }
    },
    {
      id: "FL-002",
      flightNumber: "VA 303",
      origin: { code: "BSB", city: "Brasília", lat: -15.8697, lon: -47.9208 },
      destination: { code: "SSA", city: "Salvador", lat: -12.9086, lon: -38.3225 },
      status: "Aguardando",
      speedKts: 0,
      altitudeFt: 0,
      position: { lat: -15.90, lon: -47.90 }
    }
  ],

  staff: [
    { id: "ST-001", name: "Piloto", role: "Comandante", salary: 18000, morale: 82 },
    { id: "ST-002", name: "Mecânico", role: "Manutenção", salary: 9000, morale: 76 },
    { id: "ST-003", name: "Comissário", role: "Cabine", salary: 6500, morale: 88 }
  ],

  missions: [
    { id: "MS-001", title: "Carga Express", reward: 120000, difficulty: "Média", description: "Entregar carga sensível no prazo." },
    { id: "MS-002", title: "Voo VIP", reward: 220000, difficulty: "Alta", description: "Transportar passageiro VIP com conforto máximo." }
  ],

  aircraftModels: [
    { id: "AC-001", name: "Jet Genérico", manufacturer: "Vale Air", rangeKm: 5200, seats: 180 }
  ]
};