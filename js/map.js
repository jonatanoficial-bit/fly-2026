// js/map.js
const MapModule = (function () {
  let map;
  let config = {
    mapId: "map",
    center: [-23.55052, -46.633308],
    zoom: 4
  };

  let flightMarkers = {};
  let routeLines = {};
  let routeMarkers = {};

  function init(userConfig) {
    config = { ...config, ...(userConfig || {}) };

    const el = document.getElementById(config.mapId);
    if (!el) {
      console.error("[MAP] Container #map não encontrado.");
      return;
    }

    if (!window.L) {
      console.error("[MAP] Leaflet não carregou (window.L undefined).");
      return;
    }

    // Evita "Map container is already initialized"
    if (map) {
      try { map.remove(); } catch (_) {}
      map = null;
    }

    map = L.map(config.mapId, { zoomControl: true, preferCanvas: true })
      .setView(config.center, config.zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    // Atualiza quando DLC mudar
    window.addEventListener("dlc-updated", () => refresh());

    refresh();

    // Remove loading overlay se existir
    const loading = document.getElementById("mapLoading");
    if (loading) loading.style.display = "none";

    console.log("[MAP] Inicializado OK.");
  }

  function refresh() {
    if (!map) return;
    clearAll();
    renderRoutes();
    renderFlights();
  }

  function clearAll() {
    Object.values(flightMarkers).forEach(m => { try { map.removeLayer(m); } catch (_) {} });
    Object.values(routeLines).forEach(l => { try { map.removeLayer(l); } catch (_) {} });
    Object.values(routeMarkers).forEach(m => { try { map.removeLayer(m); } catch (_) {} });
    flightMarkers = {};
    routeLines = {};
    routeMarkers = {};
  }

  function renderRoutes() {
    const d = window.flightData || {};
    (d.routes || []).forEach(r => {
      const o = (d.airports || []).find(a => a.code === r.origin);
      const de = (d.airports || []).find(a => a.code === r.destination);
      if (!o || !de) return;

      const line = L.polyline([[o.lat, o.lon], [de.lat, de.lon]], {
        weight: r.active ? 4 : 2,
        opacity: r.active ? 0.8 : 0.35
      }).addTo(map);

      routeLines[r.routeId] = line;

      const mid = { lat: (o.lat + de.lat) / 2, lon: (o.lon + de.lon) / 2 };
      const marker = L.circleMarker([mid.lat, mid.lon], {
        radius: 7,
        opacity: 0.9,
        fillOpacity: 0.7
      }).addTo(map);

      routeMarkers[r.routeId] = marker;

      const popup = `
        <div style="min-width:220px">
          <div style="font-weight:900; margin-bottom:6px">Rota ${r.origin} → ${r.destination} ${r.active ? "" : "(INATIVA)"}</div>
          <div><b>Preço:</b> R$ ${Number(r.ticketPrice).toFixed(0)}</div>
          <div><b>Freq/dia:</b> ${r.frequencyPerDay}</div>
          <div style="margin-top:10px;">
            <button style="padding:8px 10px; border-radius:10px; border:1px solid #ccc; cursor:pointer;"
              onclick="UIModule.openPanel(); UIModule.selectTab('routes')">Abrir gestão</button>
          </div>
        </div>
      `;

      marker.bindPopup(popup);
      marker.on("click", () => marker.openPopup());
      line.on("click", () => marker.openPopup());
    });
  }

  function renderFlights() {
    const d = window.flightData || {};
    const icon = L.icon({
      iconUrl: "assets/images/plane.png",
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -18]
    });

    (d.flights || []).forEach(f => {
      if (!f.position) return;

      const marker = L.marker([f.position.lat, f.position.lon], { icon }).addTo(map);
      flightMarkers[f.id] = marker;

      const popup = `
        <div style="min-width:220px">
          <div style="font-weight:900; margin-bottom:6px">${f.flightNumber}</div>
          <div><b>${f.origin.code}</b> → <b>${f.destination.code}</b></div>
          <div style="margin-top:6px;"><b>Status:</b> ${f.status}</div>
          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            <button style="padding:8px 10px; border-radius:10px; border:1px solid #ccc; cursor:pointer;"
              onclick="GameModule.startFlight('${f.id}')">Iniciar Voo (3D)</button>
            <button style="padding:8px 10px; border-radius:10px; border:1px solid #ccc; cursor:pointer;"
              onclick="UIModule.openPanel(); UIModule.selectTab('flights')">Detalhes</button>
          </div>
        </div>
      `;

      marker.bindPopup(popup);
      marker.on("click", () => marker.openPopup());
    });
  }

  function focusFlight(id) {
    const f = (window.flightData?.flights || []).find(x => x.id === id);
    if (!f) return;
    map.setView([f.position.lat, f.position.lon], 6, { animate: true });
    flightMarkers[id]?.openPopup();
  }

  function focusRoute(routeId) {
    const d = window.flightData || {};
    const r = (d.routes || []).find(x => x.routeId === routeId);
    if (!r) return;

    const o = (d.airports || []).find(a => a.code === r.origin);
    const de = (d.airports || []).find(a => a.code === r.destination);
    if (!o || !de) return;

    const bounds = L.latLngBounds([[o.lat, o.lon], [de.lat, de.lon]]);
    map.fitBounds(bounds.pad(0.25));
    routeMarkers[routeId]?.openPopup();
  }

  function centerOnCompany() {
    if (!map) return;
    map.setView(config.center, config.zoom, { animate: true });
  }

  return {
    init,
    refresh,
    focusFlight,
    focusRoute,
    centerOnCompany
  };
})();