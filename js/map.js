// js/map.js (SUBSTITUA INTEIRO) — 2D com aviões se movendo nas rotas
window.MapModule = (function () {
  let map;
  let config = {
    mapId: "map",
    center: [-23.55052, -46.633308],
    zoom: 4
  };

  let flightMarkers = {};
  let routeLines = {};
  let routeMarkers = {};
  let animTimer = null;

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

    window.addEventListener("dlc-updated", () => refresh());

    refresh();
    startAnimation();

    const loading = document.getElementById("mapLoading");
    if (loading) loading.style.display = "none";

    console.log("[MAP] 2D inicializado OK.");
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

  // ---------- Render ----------
  function renderRoutes() {
    const d = window.flightData || {};
    (d.routes || []).forEach(r => {
      const o = (d.airports || []).find(a => a.code === r.origin);
      const de = (d.airports || []).find(a => a.code === r.destination);
      if (!o || !de) return;

      const line = L.polyline([[o.lat, o.lon], [de.lat, de.lon]], {
        weight: r.active ? 4 : 2,
        opacity: r.active ? 0.85 : 0.35
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
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -16]
    });

    (d.flights || []).forEach(f => {
      if (!f.position) {
        // se não existir posição, inicia na origem
        f.position = { lat: f.origin.lat, lon: f.origin.lon };
      }
      if (typeof f.progress01 !== "number") f.progress01 = Math.random() * 0.25;

      const marker = L.marker([f.position.lat, f.position.lon], { icon }).addTo(map);
      flightMarkers[f.id] = marker;

      const popup = `
        <div style="min-width:240px">
          <div style="font-weight:900; margin-bottom:6px">${f.flightNumber}</div>
          <div><b>${f.origin.code}</b> → <b>${f.destination.code}</b></div>
          <div style="margin-top:6px;"><b>Status:</b> ${f.status}</div>
          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            <button style="padding:8px 10px; border-radius:10px; border:1px solid #ccc; cursor:pointer;"
              onclick="UIModule.openPanel(); UIModule.selectTab('flights')">Abrir voos</button>
            <button style="padding:8px 10px; border-radius:10px; border:1px solid #ccc; cursor:pointer;"
              onclick="UIModule.completeFlight('${f.id}')">Concluir (lucro)</button>
          </div>
        </div>
      `;

      marker.bindPopup(popup);
      marker.on("click", () => marker.openPopup());
    });
  }

  // ---------- Animação 2D ----------
  function startAnimation() {
    stopAnimation();
    animTimer = setInterval(tick, 1000 / 30); // 30 fps
  }

  function stopAnimation() {
    if (animTimer) clearInterval(animTimer);
    animTimer = null;
  }

  function tick() {
    if (!map) return;
    const d = window.flightData || {};
    const flights = d.flights || [];
    const speed = 0.0007; // velocidade base (ajuste fino)

    for (const f of flights) {
      if (!f || !f.origin || !f.destination) continue;
      if (f.status === "FINALIZADO") continue;

      // se rota estiver inativa, não move
      const r = (d.routes || []).find(x => x.routeId === f.routeId);
      if (r && r.active === false) continue;

      const p = typeof f.progress01 === "number" ? f.progress01 : 0;
      const next = p + speed;

      // loop infinito (avião vai e volta na rota)
      // quando chega em 1, volta pra 0
      f.progress01 = next >= 1 ? 0 : next;

      const lat = lerp(f.origin.lat, f.destination.lat, f.progress01);
      const lon = lerp(f.origin.lon, f.destination.lon, f.progress01);

      f.position = { lat, lon };

      const marker = flightMarkers[f.id];
      if (marker) marker.setLatLng([lat, lon]);
    }

    // salva a cada ~4s pra não pesar
    maybeAutosave();
  }

  let lastSave = 0;
  function maybeAutosave() {
    const now = Date.now();
    if (now - lastSave < 4000) return;
    lastSave = now;
    if (window.FlySimStore?.save) window.FlySimStore.save(window.flightData);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ---------- Focus helpers ----------
  function focusFlight(id) {
    const f = (window.flightData?.flights || []).find(x => x.id === id);
    if (!f || !map || !f.position) return;
    map.setView([f.position.lat, f.position.lon], 6, { animate: true });
    flightMarkers[id]?.openPopup();
  }

  function focusRoute(routeId) {
    const d = window.flightData || {};
    const r = (d.routes || []).find(x => x.routeId === routeId);
    if (!r || !map) return;

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