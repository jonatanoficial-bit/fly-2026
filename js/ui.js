// js/ui.js (SUBSTITUA INTEIRO)
const UIModule = (function () {
  let sidePanel, backdrop, menuBtn, closePanel, tabContent;
  let activeTab = "overview";
  let clockInterval = null;

  // =========================
  // Helpers
  // =========================
  function fmtMoney(n) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));
  }

  function fmtNow() {
    const d = new Date();
    const dia = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return `${dia} • ${hora}`;
  }

  function _safe(fn) {
    try { fn(); }
    catch (e) {
      console.error(e);
      alert("Erro ao executar ação. Veja o console.");
    }
  }

  function getAirport(code) {
    return (window.flightData.airports || []).find(a => a.code === code);
  }

  function getModel(modelId) {
    return (window.flightData.aircraftCatalog || []).find(m => m.modelId === modelId);
  }

  function getAircraft(aircraftId) {
    return (window.flightData.fleet || []).find(a => a.aircraftId === aircraftId);
  }

  function ensureLedger() {
    const d = window.flightData;
    if (!Array.isArray(d.ledger)) d.ledger = [];
  }

  function addLedgerEntry(entry) {
    ensureLedger();
    const d = window.flightData;
    d.ledger.unshift({
      id: FlySimStore.uid("LED"),
      at: Date.now(),
      ...entry
    });
    // limita para não crescer infinito
    d.ledger = d.ledger.slice(0, 50);
  }

  function refreshAll({ refreshMap = true } = {}) {
    FlySimStore.save(window.flightData);
    renderTab(activeTab);
    if (refreshMap && window.MapModule?.refresh) window.MapModule.refresh();
  }

  // =========================
  // Economia / Lucro
  // =========================
  function estimateFlightProfit(flight) {
    // Modelo simples, mas já útil:
    // Receita = assentos * ocupação * ticket
    // Custos = combustível (distância * burn) * preçoComb + taxa aeroportos + desgaste
    const d = window.flightData;
    const ac = getAircraft(flight.aircraftId);
    const model = ac ? getModel(ac.modelId) : null;

    const seats = model?.seats ?? 150;
    const distanceKm = Number(flight.distanceKm || 800);

    // taxa ocupação baseada em reputação (30%..92%)
    const rep = Number(d.company.reputation || 50);
    const occupancy = Math.max(0.30, Math.min(0.92, 0.35 + rep / 120));

    const ticket = Number(flight.ticketPrice || 400);
    const revenue = seats * occupancy * ticket;

    // combustível
    const burnPerKm = Number(model?.fuelBurnPerKm ?? 2.2); // "litros" abstratos por km
    const fuelUnits = distanceKm * burnPerKm;

    // preço por unidade de combustível (abstrato)
    const fuelUnitPrice = 6.2;
    const fuelCost = fuelUnits * fuelUnitPrice;

    // taxas
    const airportFees = 22000; // fixa por voo (placeholder)
    const staffCost = 12000;   // custo fixo simplificado por voo
    const maintenanceReserve = 8000; // provisão

    const costs = fuelCost + airportFees + staffCost + maintenanceReserve;
    const profit = revenue - costs;

    return {
      revenue,
      costs,
      profit,
      occupancy,
      seats,
      distanceKm
    };
  }

  // =========================
  // Ações de Gestão
  // =========================
  function buyAircraft(modelId) {
    return _safe(() => {
      const d = window.flightData;
      const m = getModel(modelId);
      if (!m) return alert("Modelo inválido.");
      if (d.company.cash < m.price) return alert("Caixa insuficiente para comprar esta aeronave.");

      d.company.cash -= m.price;

      const aircraftId = FlySimStore.uid("AC");
      const tailNumber = `PP-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

      d.fleet.push({
        aircraftId,
        modelId,
        tailNumber,
        condition: 100,
        status: "IDLE"
      });

      addLedgerEntry({
        type: "COMPRA_AERONAVE",
        title: "Compra de aeronave",
        amount: -m.price,
        meta: { modelId: m.modelId, name: m.name, tailNumber }
      });

      refreshAll();
      alert(`Aeronave comprada: ${m.name} (${tailNumber})`);
    });
  }

  function hireCandidate(candidateId) {
    return _safe(() => {
      const d = window.flightData;
      const idx = (d.candidates || []).findIndex(c => c.id === candidateId);
      if (idx < 0) return;

      const c = d.candidates[idx];
      const hiringFee = Math.round(c.salary * 2);

      if (d.company.cash < hiringFee) {
        return alert(`Caixa insuficiente. Necessário: ${fmtMoney(hiringFee)}.`);
      }

      d.company.cash -= hiringFee;

      d.staff.push({
        id: FlySimStore.uid("ST"),
        name: c.name,
        role: c.role,
        salary: c.salary,
        morale: c.morale
      });

      d.candidates.splice(idx, 1);

      addLedgerEntry({
        type: "CONTRATACAO",
        title: `Contratação: ${c.name} (${c.role})`,
        amount: -hiringFee,
        meta: { salary: c.salary }
      });

      refreshAll({ refreshMap: false });
      alert(`Contratado: ${c.name} (${c.role})`);
    });
  }

  function createRoute() {
    return _safe(() => {
      const d = window.flightData;

      const origin = document.getElementById("route_origin").value;
      const destination = document.getElementById("route_destination").value;
      const ticketPrice = Number(document.getElementById("route_price").value || 0);
      const freq = Number(document.getElementById("route_freq").value || 1);
      const assignedAircraftId = document.getElementById("route_aircraft").value;

      if (!origin || !destination || origin === destination) return alert("Escolha origem e destino diferentes.");
      if (!assignedAircraftId) return alert("Selecione uma aeronave para a rota.");
      if (ticketPrice <= 0) return alert("Defina um preço de passagem válido.");

      d.routes.push({
        routeId: FlySimStore.uid("RT"),
        origin,
        destination,
        ticketPrice,
        frequencyPerDay: Math.max(1, Math.min(12, freq)),
        assignedAircraftId,
        active: true
      });

      FlySimStore.generateFlightsForRoutes(d);

      addLedgerEntry({
        type: "NOVA_ROTA",
        title: `Rota criada: ${origin} → ${destination}`,
        amount: 0,
        meta: { ticketPrice, freq, assignedAircraftId }
      });

      refreshAll();
      alert("Rota criada e voos gerados!");
    });
  }

  function toggleRoute(routeId) {
    return _safe(() => {
      const d = window.flightData;
      const r = (d.routes || []).find(x => x.routeId === routeId);
      if (!r) return;

      r.active = !r.active;
      FlySimStore.generateFlightsForRoutes(d);

      addLedgerEntry({
        type: "ROTA_STATUS",
        title: `Rota ${r.origin} → ${r.destination} ${r.active ? "ativada" : "desativada"}`,
        amount: 0
      });

      refreshAll();
    });
  }

  function regenerateFlights() {
    return _safe(() => {
      FlySimStore.generateFlightsForRoutes(window.flightData);
      addLedgerEntry({ type: "REGERAR_VOOS", title: "Voos regenerados", amount: 0 });
      refreshAll();
      alert("Voos regenerados!");
    });
  }

  function performMaintenance(aircraftId) {
    return _safe(() => {
      const d = window.flightData;
      const ac = getAircraft(aircraftId);
      if (!ac) return alert("Aeronave não encontrada.");

      const model = getModel(ac.modelId);
      const condition = Number(ac.condition ?? 100);

      // custo: base + "quanto pior estava"
      const base = 50000;
      const penalty = Math.round((100 - condition) * 2200);
      const cost = Math.max(20000, base + penalty);

      if (d.company.cash < cost) return alert(`Caixa insuficiente para manutenção. Necessário: ${fmtMoney(cost)}`);

      // manutenção instantânea (upgrade futuro: timer/agenda)
      d.company.cash -= cost;
      ac.status = "IDLE";
      ac.condition = 100;

      addLedgerEntry({
        type: "MANUTENCAO",
        title: `Manutenção: ${ac.tailNumber} (${model?.name ?? ac.modelId})`,
        amount: -cost,
        meta: { aircraftId, tailNumber: ac.tailNumber }
      });

      refreshAll({ refreshMap: false });
      alert(`Manutenção concluída: ${ac.tailNumber}\nCusto: ${fmtMoney(cost)}`);
    });
  }

  function completeFlight(flightId) {
    return _safe(() => {
      const d = window.flightData;
      const f = (d.flights || []).find(x => x.id === flightId);
      if (!f) return alert("Voo não encontrado.");

      if (f.status === "FINALIZADO") return alert("Este voo já foi concluído.");

      const calc = estimateFlightProfit(f);
      f.status = "FINALIZADO";
      f.completedAt = Date.now();
      f.revenue = calc.revenue;
      f.costs = calc.costs;
      f.profit = calc.profit;
      f.occupancy = calc.occupancy;

      // aplica no caixa
      d.company.cash += calc.profit;

      // desgaste simplificado do avião
      const ac = getAircraft(f.aircraftId);
      if (ac) {
        const wear = Math.max(1, Math.round((calc.distanceKm / 1000) * 2)); // ~2% por 1000km
        ac.condition = Math.max(40, Number(ac.condition ?? 100) - wear);
      }

      addLedgerEntry({
        type: "VOO_CONCLUIDO",
        title: `Voo concluído: ${f.flightNumber} (${f.origin.code} → ${f.destination.code})`,
        amount: calc.profit,
        meta: { revenue: calc.revenue, costs: calc.costs, occupancy: calc.occupancy }
      });

      refreshAll();
      alert(`Voo concluído!\nLucro: ${fmtMoney(calc.profit)}\nReceita: ${fmtMoney(calc.revenue)}\nCustos: ${fmtMoney(calc.costs)}`);
    });
  }

  // =========================
  // Clock UI
  // =========================
  function startClock() {
    stopClock();
    clockInterval = setInterval(() => {
      const el = document.getElementById("nowTime");
      if (el) el.textContent = fmtNow();
    }, 1000);
  }

  function stopClock() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = null;
  }

  // =========================
  // Render Tabs
  // =========================
  function renderOverview() {
    const d = window.flightData;
    ensureLedger();

    const last = (d.ledger || []).slice(0, 6);
    const lastHtml = last.length
      ? last.map(l => `
          <div class="card" style="margin:10px 0;">
            <div class="row">
              <div>
                <div class="cardTitle">${l.title}</div>
                <div class="muted">${new Date(l.at).toLocaleString("pt-BR")}</div>
              </div>
              <div style="font-weight:900;">
                ${l.amount >= 0 ? "+" : ""}${fmtMoney(l.amount)}
              </div>
            </div>
          </div>
        `).join("")
      : `<div class="muted" style="margin-top:10px;">Sem lançamentos ainda.</div>`;

    tabContent.innerHTML = `
      <div class="card">
        <div class="cardTitle">${d.company.name}</div>

        <div class="row" style="margin-top:6px;">
          <div><b>Dia/Hora:</b> <span id="nowTime">${fmtNow()}</span></div>
        </div>

        <div class="row" style="margin-top:10px;">
          <div><b>Caixa:</b> ${fmtMoney(d.company.cash)}</div>
          <div><b>Reputação:</b> ${Number(d.company.reputation || 0)}%</div>
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn" onclick="UIModule.openPanel(); UIModule.selectTab('fleet')">Frota</button>
          <button class="btn ghost" onclick="UIModule.openPanel(); UIModule.selectTab('routes')">Rotas</button>
          <button class="btn ghost" onclick="UIModule.openPanel(); UIModule.selectTab('flights')">Voos</button>
        </div>
      </div>

      <div class="card">
        <div class="cardTitle">Últimos lançamentos (Ledger)</div>
        <div class="muted">Entradas recentes do seu financeiro.</div>
        ${lastHtml}
      </div>
    `;

    startClock();
  }

  function renderFleet() {
    const d = window.flightData;

    tabContent.innerHTML = `
      <div class="card">
        <div class="cardTitle">Sua Frota</div>
        <div class="muted">Aeronaves compradas, condição e manutenção.</div>
      </div>

      ${(d.fleet || []).map(ac => {
        const m = getModel(ac.modelId);
        const cond = Number(ac.condition ?? 100);
        const status = ac.status || "IDLE";

        let condLabel = "Ótima";
        if (cond < 85) condLabel = "Boa";
        if (cond < 70) condLabel = "Atenção";
        if (cond < 55) condLabel = "Crítica";

        return `
          <div class="card">
            <div class="cardTitle">${m ? m.name : ac.modelId} — ${ac.tailNumber}</div>
            <div class="row" style="margin-top:6px;">
              <div><b>Status:</b> ${status}</div>
              <div><b>Condição:</b> ${cond}% (${condLabel})</div>
            </div>
            <div class="muted" style="margin-top:6px;">
              Alcance: ${m?.rangeKm ?? "-"} km | Assentos: ${m?.seats ?? "-"}
            </div>
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn" onclick="UIModule.performMaintenance('${ac.aircraftId}')">Manutenção</button>
            </div>
          </div>
        `;
      }).join("")}

      <div class="card">
        <div class="cardTitle">Comprar Aeronave (Catálogo DLC)</div>
        ${(d.aircraftCatalog || []).map(m => `
          <div class="card" style="margin:10px 0;">
            <div class="cardTitle">${m.name}</div>
            <div class="muted">${m.manufacturer} — ${m.seats} assentos — ${m.rangeKm} km</div>
            <div style="margin-top:6px;"><b>Preço:</b> ${fmtMoney(m.price)}</div>
            <div style="margin-top:10px;">
              <button class="btn" onclick="UIModule.buyAircraft('${m.modelId}')">Comprar</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    stopClock();
  }

  function renderRoutes() {
    const d = window.flightData;
    const idleFleet = (d.fleet || []).filter(f => f.status === "IDLE" || f.status === "ASSIGNED");

    tabContent.innerHTML = `
      <div class="card">
        <div class="cardTitle">Criar Rota Aérea (Aeroportos DLC)</div>
        <div class="muted">Crie rotas e o jogo gera voos automaticamente.</div>

        <div style="margin-top:10px; display:grid; gap:10px;">
          <label class="muted">Origem</label>
          <select id="route_origin" class="input">
            ${(d.airports || []).map(a => `<option value="${a.code}">${a.code} — ${a.city}</option>`).join("")}
          </select>

          <label class="muted">Destino</label>
          <select id="route_destination" class="input">
            ${(d.airports || []).map(a => `<option value="${a.code}">${a.code} — ${a.city}</option>`).join("")}
          </select>

          <label class="muted">Preço da passagem</label>
          <input id="route_price" class="input" type="number" value="420" min="1" />

          <label class="muted">Frequência por dia</label>
          <input id="route_freq" class="input" type="number" value="2" min="1" max="12" />

          <label class="muted">Aeronave</label>
          <select id="route_aircraft" class="input">
            <option value="">Selecione...</option>
            ${idleFleet.map(ac => {
              const m = getModel(ac.modelId);
              return `<option value="${ac.aircraftId}">${ac.tailNumber} — ${m?.name ?? ac.modelId}</option>`;
            }).join("")}
          </select>

          <button class="btn" onclick="UIModule.createRoute()">Criar rota + gerar voos</button>
        </div>
      </div>

      <div class="card">
        <div class="cardTitle">Rotas Criadas</div>
        ${(d.routes || []).length === 0 ? `<div class="muted">Nenhuma rota ainda.</div>` : ""}
      </div>

      ${(d.routes || []).map(r => {
        const o = getAirport(r.origin);
        const de = getAirport(r.destination);
        const ac = (d.fleet || []).find(x => x.aircraftId === r.assignedAircraftId);
        const m = ac ? getModel(ac.modelId) : null;

        return `
          <div class="card">
            <div class="cardTitle">${r.origin} → ${r.destination} ${r.active ? "" : "(INATIVA)"}</div>
            <div class="muted">${o?.city ?? ""} → ${de?.city ?? ""}</div>
            <div style="margin-top:6px;">
              <b>Preço:</b> ${fmtMoney(r.ticketPrice)} |
              <b>Freq/dia:</b> ${r.frequencyPerDay} |
              <b>Aeronave:</b> ${ac ? `${ac.tailNumber} (${m?.name ?? ac.modelId})` : "N/D"}
            </div>
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn ghost" onclick="MapModule.focusRoute('${r.routeId}')">Ver no mapa</button>
              <button class="btn" onclick="UIModule.toggleRoute('${r.routeId}')">${r.active ? "Desativar" : "Ativar"}</button>
            </div>
          </div>
        `;
      }).join("")}
    `;

    stopClock();
  }

  function renderFlights() {
    const d = window.flightData;

    tabContent.innerHTML = `
      <div class="card">
        <div class="cardTitle">Voos</div>
        <div class="muted">
          Agora os voos podem ser concluídos para gerar lucro e registrar no ledger.
        </div>
        <div style="margin-top:10px;">
          <button class="btn" onclick="UIModule.regenerateFlights()">Regenerar voos</button>
        </div>
      </div>

      ${(d.flights || []).map(f => {
        const profitHtml = (f.status === "FINALIZADO" && typeof f.profit === "number")
          ? `<div style="margin-top:8px;"><b>Lucro do voo:</b> ${fmtMoney(f.profit)} (Receita ${fmtMoney(f.revenue)} • Custos ${fmtMoney(f.costs)})</div>`
          : `<div class="muted" style="margin-top:8px;">Lucro aparecerá quando o voo for concluído.</div>`;

        const actionBtn = (f.status === "FINALIZADO")
          ? `<button class="btn ghost" disabled style="opacity:.6; cursor:not-allowed;">Concluído</button>`
          : `<button class="btn" onclick="UIModule.completeFlight('${f.id}')">Concluir voo</button>`;

        return `
          <div class="card">
            <div class="cardTitle">${f.flightNumber} — ${f.origin.code} → ${f.destination.code}</div>
            <div class="muted">${f.origin.city} → ${f.destination.city}</div>

            <div style="margin-top:8px;">
              <b>Status:</b> ${f.status}<br/>
              <b>Vel:</b> ${f.speedKts} kts | <b>Alt:</b> ${f.altitudeFt} ft
            </div>

            ${profitHtml}

            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn" onclick="MapModule.focusFlight('${f.id}')">Ver no mapa</button>
              <button class="btn ghost" onclick="GameModule.startFlight('${f.id}')">Iniciar Voo (3D)</button>
              ${actionBtn}
            </div>
          </div>
        `;
      }).join("")}
    `;

    stopClock();
  }

  function renderStaff() {
    const d = window.flightData;

    tabContent.innerHTML = `
      <div class="card">
        <div class="cardTitle">Equipe Atual</div>
        ${(d.staff || []).map(s => `
          <div class="card" style="margin:10px 0;">
            <div class="cardTitle">${s.name} — ${s.role}</div>
            <div><b>Salário:</b> ${fmtMoney(s.salary)}</div>
            <div><b>Moral:</b> ${s.morale}%</div>
          </div>
        `).join("")}
      </div>

      <div class="card">
        <div class="cardTitle">Contratar Funcionários (Candidatos DLC)</div>
        <div class="muted">Contratação tem taxa (2x salário).</div>

        ${(d.candidates || []).length === 0 ? `<div class="muted" style="margin-top:10px;">Sem candidatos no momento.</div>` : ""}

        ${(d.candidates || []).map(c => `
          <div class="card" style="margin:10px 0;">
            <div class="cardTitle">${c.name} — ${c.role}</div>
            <div><b>Salário:</b> ${fmtMoney(c.salary)} | <b>Moral:</b> ${c.morale}%</div>