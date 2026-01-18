/**
 * Módulo responsável por inicializar e controlar o mapa 2D com Leaflet.
 * É possível adaptar para Mapbox GL JS alterando a constante TILE_URL e
 * definindo seu token de acesso.  O mapa serve para visualizar
 * os voos em tempo real, inspirando-se em jogos de gerenciamento de
 * companhias que permitem rastrear voos no mapa【690044430469829†L61-L69】.
 */

const MapModule = (function () {
    const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    let map;
    let flightMarkers = {};

    /**
     * Inicializa o mapa.
     */
    function init() {
        map = L.map('map').setView([-23.5505, -46.6333], 5); // centro inicial em São Paulo
        L.tileLayer(TILE_URL, {
            attribution: TILE_ATTRIBUTION,
            maxZoom: 19
        }).addTo(map);

        renderFlights();

        // Atualiza posições periodicamente
        setInterval(updateFlightPositions, 1000 * 5); // a cada 5 segundos
    }

    /**
     * Renderiza os marcadores de voo no mapa.
     */
    function renderFlights() {
        if (!window.flightData || !window.flightData.flights) return;
        window.flightData.flights.forEach(flight => {
            const icon = L.icon({
                iconUrl: 'assets/images/plane.png',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });
            const marker = L.marker([flight.position.lat, flight.position.lon], { icon }).addTo(map);
            marker.bindPopup(`<strong>${flight.flightNumber}</strong><br>${flight.origin.code} → ${flight.destination.code}<br>Status: ${flight.status}`);
            // Ao clicar duas vezes no marcador, inicia a simulação de voo 3D
            marker.on('dblclick', () => {
                if (window.GameModule && window.GameModule.startFlight) {
                    window.GameModule.startFlight(flight);
                }
            });
            flightMarkers[flight.id] = marker;
        });
    }

    /**
     * Atualiza as posições dos voos no mapa. Para demonstrar o movimento,
     * interpolamos a posição entre origem e destino.  Em uma aplicação real,
     * estes dados viriam de um backend ou API.
     */
    function updateFlightPositions() {
        if (!window.flightData || !window.flightData.flights) return;
        window.flightData.flights.forEach(flight => {
            // calcula uma pequena variação para simular movimento
            const latDiff = flight.destination.lat - flight.origin.lat;
            const lonDiff = flight.destination.lon - flight.origin.lon;
            // atualiza a posição incrementalmente
            flight.position.lat += latDiff * 0.01;
            flight.position.lon += lonDiff * 0.01;
            // atualiza marcador
            const marker = flightMarkers[flight.id];
            if (marker) {
                marker.setLatLng([flight.position.lat, flight.position.lon]);
            }
        });
    }

    return {
        init
    };
})();

// Inicializa o mapa ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    MapModule.init();
});