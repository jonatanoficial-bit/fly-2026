// js/map.js (SUBSTITUA INTEIRO) — mapa real online (Leaflet) + fallback offline
window.MapModule = (function () {
  let mode = "AUTO"; // "LEAFLET" | "OFFLINE"
  let map = null;

  let config = {
    mapId: "map",
    center: [-23.55052, -46.633308],
    zoom: 4
  };

  let flightMarkers = {};
  let routeLines = {};
  let routeMarkers = {};
  let animTimer = null;

  // Fallback offline canvas
  let offline = {
    canvas: null,
    ctx: null,
    w: 0,
    h: 0,
    bounds: { minLat: -60, maxLat: 75, minLon: -180, maxLon: 180 }
  };

  function init(userConfig) {
    config = { ...config, ...(userConfig || {}) };

    const el = document.getElementById(config.mapId);
    if (!el) {
      console.error("[MAP] Container #map não encontrado.");
      return;
    }

    // Decide modo: Leaflet se tiver L e internet; caso contrário offline.
    const canLeaflet = !!window.L;
    const online = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (canLeaflet && online) {
      mode = "LEAFLET";
      initLeaflet();
    } else {
      mode = "OFFLINE";
      initOfflineCanvas();
    }

    // Reagir a troca de rede
    window.addEventListener("online", () => {
      if (mode !== "LEAFLET" && !!window.L) {
        trySwitchToLeaflet();
      }
    });

    window.addEventListener("offline", () => {
      if (mode !== "OFFLINE") {
        trySwitchToOffline();
      }
    });

    window.addEventListener("dlc-updated", () => refresh());

    refresh();
    startAnimation();

    const loading = document.getElementById("mapLoading");
    if (loading) loading.style.display = "none";

    console.log(`[MAP] Inicializado em modo: ${mode}`);
  }

  function trySwitchToLeaflet() {
    const el = document.getElementById(config.mapId);
    if (!el) return;
    destroyOffline();
    mode = "LEAFLET";
    initLeaflet();
    refresh();
  }

  function trySwitchToOffline() {
    const el = document.getElementById(config.mapId);
    if (!el) return;
    destroyLeaflet();
    mode = "OFFLINE";
    initOfflineCanvas();
    refresh();
  }

  // ============================
  // LEAFLET (MAPA REAL)
  // ============================
  function initLeaflet() {
    if (!window.L) return;

    const el = document.getElementById(config.mapId);
    if (!el) return;

    // evita erro “already initialized”
    if (map) {
      try { map.remove(); } catch (_) {}
      map = null;
    }

    // garante que #map tem altura
    if (!el.style.height) el.style.height = "100%";

    map = L.map(config.mapId, { zoomControl: true, preferCanvas: true })
      .setView(config.center, config.zoom);

    // Tiles (para comercial, troque para provedor com chave)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
  }

  function destroyLeaflet() {
    if (!map) return;
    try { map.remove(); } catch (_) {}
    map = null;
    flightMarkers = {};
    routeLines = {};
    routeMarkers = {};
  }

  // ============================
  // OFFLINE (CANVAS SIMPLES)
  // ============================
  function initOfflineCanvas() {
    const el = document.getElementById(config.mapId);
    if (!el) return;

    // cria canvas cobrindo o container
    el.innerHTML = "";
    const c = document.createElement("canvas");
    c.style.width = "100%";
    c.style.height = "100%";
    c.width = el.clientWidth || 360;
    c.height = el.clientHeight || 520;
    el.appendChild(c);

    offline.canvas = c;
    offline.ctx = c.getContext("2d");
    offline.w = c.width;
    offline.h = c.height;

    // resize
    window.addEventListener("resize", resizeOffline);
    resizeOffline();
  }

  function resizeOffline() {
    if (!offline.canvas) return;
    const el = document.getElementById(config.mapId);
    if (!el) return;
    offline.canvas.width = el.clientWidth || 360;
    offline.canvas.height = el.clientHeight || 520;
    offline.w = offline.canvas.width;
    offline.h = offline.canvas.height;
  }

  function destroyOffline() {
    window.removeEventListener("resize", resizeOffline);
    const el = document.getElementById(config.mapId);
    if (el && offline.canvas) el.innerHTML = "";
    offline.canvas = null;
    offline.ctx = null;
  }

  function latLonToXY(lat, lon) {
    const b = offline.bounds;
    const x = ((lon - b.minLon) / (b.maxLon - b.minLon)) * offline.w;
    const y = (1 - (lat - b.minLat) / (b.maxLat - b.minLat)) * offline.h;
    return { x, y };
  }

  // ============================
  // RENDER (AMBOS MODOS)
  // ============================
  function refresh() {
    if (mode === "LEAFLET") {
      refreshLeaflet();
    } else {
      refreshOffline();
    }
  }

  function refreshLeaflet() {
    if (!map) return;

    clearLeafletLayers();
    renderRoutesLeaflet();
    renderFlightsLeaflet();
  }

  function clearLeafletLayers() {
    Object.values(flightMarkers).forEach(m => { try { map.removeLayer(m); } catch (_) {} });
    Object.values(routeLines).forEach(l => { try { map.removeLayer(l); } catch (_) {} });
    Object.values(routeMarkers).forEach(m => { try { map.removeLayer(m); } catch (_) {} });
    flightMarkers = {};
    routeLines = {};
    routeMarkers = {};
  }

  function renderRoutesLeaflet() {
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
          <div><b>Preço:</b> ${fmtMoney(r.ticketPrice)}</div>
          <div><b>Freq/dia:</b> ${r.frequencyPerDay}</div>
          <div style="margin-top:10px;">
            <button style="padding:8px 10px;border-radius:10px;border:1px solid #ccc;cursor:pointer;"
              onclick="UIModule.openPanel(); UIModule.selectTab('routes')">Abrir gestão</button>
          </div>
        </div>
      `;
      marker.bindPopup(popup);
      marker.on("click", () => marker.openPopup());
      line.on("click", () => marker.openPopup());
    });
  }

  function renderFlightsLeaflet() {
    const d = window.flightData || {};
    const icon = L.icon({
      iconUrl: "assets/images/plane.png",
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -16]
    });

    (d.flights || []).forEach(f => {
      if (!f.position) f.position = { lat: f.origin.lat, lon: f.origin.lon };
      if (typeof f.progress01 !== "number") f.progress01 = Math.random() * 0.25;

      const marker = L.marker([f.position.lat, f.position.lon], { icon }).addTo(map);
      flightMarkers[f.id] = marker;

      const popup = `
        <div style="min-width:240px">
          <div style="font-weight:900; margin-bottom:6px">${f.flightNumber}</div>
          <div><b>${f.origin.code}</b> → <b>${f.destination.code}</b></div>
          <div style="margin-top:6px;"><b>Status:</b> ${f.status}</div>
          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            <button style="padding:8px 10px;border-radius:10px;border:1px solid #ccc;cursor:pointer;"
              onclick="UIModule.openPanel(); UIModule.selectTab('flights')">Abrir voos</button>
            <button style="padding:8px 10px;border-radius:10px;border:1px solid #ccc;cursor:pointer;"
              onclick="UIModule.completeFlight('${f.id}')">Concluir (lucro)</button>
          </div>
        </div>
      `;
      marker.bindPopup(popup);
      marker.on("click", () => marker.openPopup());
    });
  }

  // OFFLINE: desenha tudo num canvas simples
  function refreshOffline() {
    if (!offline.ctx) return;
    drawOfflineBase();
    drawOfflineRoutes();
    drawOfflineFlights();
  }

  function drawOfflineBase() {
    const ctx = offline.ctx;
    ctx.clearRect(0, 0, offline.w, offline.h);

    // fundo
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, offline.w, offline.h);

    // grade
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 1;
    const step = Math.max(40, Math.min(80, Math.floor(Math.min(offline.w, offline.h) / 8)));
    for (let x = 0; x < offline.w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, offline.h); ctx.stroke();
    }
    for (let y = 0; y < offline.h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(offline.w, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // label offline
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "bold 12px system-ui";
    ctx.fillText("Modo Offline (sem mapa real)", 12, 18);
  }

  function drawOfflineRoutes() {
    const d = window.flightData || {};
    const ctx = offline.ctx;

    (d.routes || []).forEach(r => {
      const o = (d.airports || []).find(a => a.code === r.origin);
      const de = (d.airports || []).find(a => a.code === r.destination);
      if (!o || !de) return;

      const p1 = latLonToXY(o.lat, o.lon);
      const p2 = latLonToXY(de.lat, de.lon);

      ctx.strokeStyle = r.active ? "rgba(34,197,94,0.85)" : "rgba(148,163,184,0.35)";
      ctx.lineWidth = r.active ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // marcador
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      ctx.fillStyle = "rgba(59,130,246,0.9)";
      ctx.beginPath();
      ctx.arc(mid.x, mid.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "10px system-ui";
      ctx.fillText(`${r.origin}→${r.destination}`, mid.x + 8, mid.y + 4);
    });
  }

  function drawOfflineFlights() {
    const d = window.flightData || {};
    const ctx = offline.ctx;

    (d.flights || []).forEach(f => {
      if (!f.position) f.position = { lat: f.origin.lat, lon: f.origin.lon };

      const p = latLonToXY(f.position.lat, f.position.lon);
      ctx.fillStyle = "rgba(252,211,77,0.95)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "10px system-ui";
      ctx.fillText(f.flightNumber, p.x + 8, p.y + 4);
    });
  }

  // ============================
  // ANIMAÇÃO (MOVER AVIÕES)
  // ============================
  function startAnimation() {
    stopAnimation();
    animTimer = setInterval(tick, 1000 / 30);
  }

  function stopAnimation() {
    if (animTimer) clearInterval(animTimer);
    animTimer = null;
  }

  function tick() {
    const d = window.flightData || {};
    const flights = d.flights || [];

    const speed = 0.0007; // ajuste

    for (const f of flights) {
      if (!f || !f.origin || !f.destination) continue;
      if (f.status === "FINALIZADO") continue;

      const r = (d.routes || []).find(x => x.routeId === f.routeId);
      if (r && r.active === false) continue;

      const p = typeof f.progress01 === "number" ? f.progress01 : 0;
      const next = p + speed;
      f.progress01 = next >= 1 ? 0 : next;

      const lat = lerp(f.origin.lat, f.destination.lat, f.progress01);
      const lon = lerp(f.origin.lon, f.destination.lon, f.progress01);

      f.position = { lat, lon };

      if (mode === "LEAFLET") {
        const marker = flightMarkers[f.id];
        if (marker) marker.setLatLng([lat, lon]);
      }
    }

    if (mode === "OFFLINE") refreshOffline();
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

  function fmtMoney(n) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));
  }

  // ============================
  // Focus helpers
  // ============================
  function focusFlight(id) {
    const f = (window.flightData?.flights || []).find(x => x.id === id);
    if (!f) return;

    if (mode === "LEAFLET" && map && f.position) {
      map.setView([f.position.lat, f.position.lon], 6, { animate: true });
      flightMarkers[id]?.openPopup();
      return;
    }

    refreshOffline();
  }

  function focusRoute(routeId) {
    const d = window.flightData || {};
    const r = (d.routes || []).find(x => x.routeId === routeId);
    if (!r) return;

    const o = (d.airports || []).find(a => a.code === r.origin);
    const de = (d.airports || []).find(a => a.code === r.destination);
    if (!o || !de) return;

    if (mode === "LEAFLET" && map) {
      const bounds = L.latLngBounds([[o.lat, o.lon], [de.lat, de.lon]]);
      map.fitBounds(bounds.pad(0.25));
      routeMarkers[routeId]?.openPopup();
      return;
    }

    refreshOffline();
  }

  function centerOnCompany() {
    if (mode === "LEAFLET" && map) {
      map.setView(config.center, config.zoom, { animate: true });
      return;
    }
    refreshOffline();
  }

  return {
    init,
    refresh,
    focusFlight,
    focusRoute,
    centerOnCompany
  };
})();
