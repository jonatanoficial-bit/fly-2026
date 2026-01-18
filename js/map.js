const MapModule = (function () {
  let map;
  let markers = {};
  let routes = {};
  let config = {
    mapId: "map",
    center: [-23.55052, -46.633308],
    zoom: 4
  };

  function init(userConfig) {
    config = { ...config, ...(userConfig || {}) };

    // Segurança: espera Leaflet existir
    if (!window.L) {
      console.error("Leaflet não carregou (L undefined). Verifique conexão/CDN.");
      return;
    }

    map = L.map(config.mapId, {
      zoomControl: true,
      preferCanvas: true
    }).setView(config.center, config.zoom);

    // Tiles (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    renderFlights();
  }

  function getFlightById(id) {
    return window.flightData.flights.find(f => f.id === id);
  }

  function renderFlights() {
    const icon = L.icon({
      iconUrl: "assets/images/plane.png",
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -18]
    });

    window.flightData.flights.forEach((flight) => {
      // Marcador
      const marker = L.marker([flight.position.lat, flight.position.lon], { icon }).addTo(map);
      markers[flight.id] = marker;

      // Linha de rota
      const line = L.polyline(
        [
          [flight.origin.lat, flight.origin.lon],
          [flight.destination.lat, flight.destination.lon]
        ],
        {
          weight: 3,
          opacity: 0.7
        }
      ).addTo(map);
      routes[flight.id] = line;

      // Popup com botão funcional
      const popupHtml = `
        <div style="min-width:220px">
          <div style="font-weight:900; margin-bottom:6px">${flight.flightNumber}</div>
          <div><b>${flight.origin.code}</b> → <b>${flight.destination.code}</b></div>
          <div style="margin-top:6px;"><b>Status:</b> ${flight.status}</div>
          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            <button style="padding:8px 10px; border-radius:10px; border:1px solid #ccc; cursor:pointer;"
              onclick="GameModule.startFlight('${flight.id}')">Iniciar Voo</button>
            <button style="padding:8px 10px; border-radius:10px; border:1px solid #ccc; cursor:pointer;"
              onclick="UIModule.openPanel(); UIModule.selectTab('flights')">Detalhes</button>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      // Clique → abre popup
      marker.on("click", () => marker.openPopup());
    });
  }

  function focusFlight(id) {
    const f = getFlightById(id);
    if (!f) return;

    map.setView([f.position.lat, f.position.lon], 6, { animate: true });
    if (markers[id]) markers[id].openPopup();
  }

  function centerOnCompany() {
    map.setView(config.center, config.zoom, { animate: true });
  }

  // API pública
  return {
    init,
    focusFlight,
    centerOnCompany
  };
})();