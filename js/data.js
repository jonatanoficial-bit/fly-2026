/**
 * Dados estáticos para o jogo. Estes dados podem ser carregados
 * via API ou banco de dados em uma implementação completa.
 */

window.flightData = {
    company: {
        cash: 10000000,     // orçamento inicial em dólares
        fuel: 50000,        // litros de combustível
        co2Credits: 1000    // créditos de CO2 para compensação
    },
    flights: [
        {
            id: 1,
            flightNumber: "BR1001",
            origin: { city: "São Paulo", code: "GRU", lat: -23.4356, lon: -46.4731 },
            destination: { city: "Rio de Janeiro", code: "GIG", lat: -22.8090, lon: -43.2506 },
            position: { lat: -23.2, lon: -45.8 },
            status: "Em rota",
            planeModel: "A320"
        },
        {
            id: 2,
            flightNumber: "BR2002",
            origin: { city: "São Paulo", code: "GRU", lat: -23.4356, lon: -46.4731 },
            destination: { city: "Porto Alegre", code: "POA", lat: -29.9940, lon: -51.1715 },
            position: { lat: -24.5, lon: -47.5 },
            status: "Em rota",
            planeModel: "B737"
        }
    ],
    staff: [
        { id: 1, name: "Carlos Oliveira", role: "Piloto", salary: 120000, happiness: 0.85 },
        { id: 2, name: "Mariana Souza", role: "Copiloto", salary: 80000, happiness: 0.75 },
        { id: 3, name: "João Almeida", role: "Engenheiro de Voo", salary: 60000, happiness: 0.70 }
    ],
    missions: [
        {
            id: 1,
            name: "Transporte de passageiros",
            description: "Leve 150 passageiros de São Paulo para Rio de Janeiro sem atrasos.",
            reward: 500000,
            origin: "GRU",
            destination: "GIG",
            planeRequired: "A320"
        },
        {
            id: 2,
            name: "Carga urgente",
            description: "Entregue equipamentos médicos de São Paulo a Porto Alegre.",
            reward: 350000,
            origin: "GRU",
            destination: "POA",
            planeRequired: "B737"
        }
    ],
    planeModels: [
        {
            id: "A320",
            name: "Airbus A320",
            range: 6150,   // em quilômetros
            capacity: 150,
            speed: 828,    // km/h
            file: null     // referência a arquivo GLTF (poderá ser carregado via admin)
        },
        {
            id: "B737",
            name: "Boeing 737",
            range: 5100,
            capacity: 160,
            speed: 842,
            file: null
        }
    ]
};