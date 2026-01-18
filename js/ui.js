const UIModule = (function () {
  let sidePanel, backdrop, menuBtn, closePanel, tabContent;
  let activeTab = "overview";

  function init() {
    sidePanel = document.getElementById("sidePanel");
    backdrop = document.getElementById("backdrop");
    menuBtn = document.getElementById("menuBtn");
    closePanel = document.getElementById("closePanel");
    tabContent = document.getElementById("tabContent");

    menuBtn.addEventListener("click", openPanel);
    closePanel.addEventListener("click", closePanelFn);
    backdrop.addEventListener("click", closePanelFn);

    document.querySelectorAll(".tab[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => selectTab(btn.dataset.tab));
    });

    // Realtime DLC event
    window.addEventListener("dlc-updated", () => {
      // re-render do que estiver aberto
      renderTab(activeTab);
    });

    renderTab(activeTab);
  }

  function openPanel() {
    sidePanel.classList.remove("hidden");
    backdrop.classList.remove("hidden");
    sidePanel.setAttribute("aria-hidden", "false");
  }

  function closePanelFn() {
    sidePanel.classList.add("hidden");
    backdrop.classList.add("hidden");
    sidePanel.setAttribute("aria-hidden", "true");
  }

  function selectTab(tab) {
    activeTab = tab;
    document.querySelectorAll(".tab[data-tab]").forEach((b) => b.classList.remove("active"));
    const current = document.querySelector(`.tab[data-tab="${tab}"]`);
    if (current) current.classList.add("active");
    renderTab(tab);
  }

  function fmtMoney(n) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  }

  function refreshAll() {
    FlySimStore.save(window.flightData);
    renderTab(activeTab);
    if (window.MapModule?.refresh) window.MapModule.refresh();
  }

  function getAirport(code) {
    return window.flightData.airports.find(a => a.code === code);
  }

  function getModel(modelId) {
    return window.flightData.aircraftCatalog.find(m => m.modelId === modelId);
  }

  // --------- AÇÕES DE GESTÃO ---------
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

      refreshAll();
      alert(`Aeronave comprada: ${m.name} (${tailNumber})`);
    });
  }

  function hireCandidate(candidateId) {
    return _safe(() => {
      const d = window.flightData;
      const idx = d.candidates.findIndex(c => c.id === candidateId);
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
      refreshAll();
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
      refreshAll();
      alert("Rota criada e voos gerados!");
    });
  }

  function toggleRoute(routeId) {
    return _safe(() => {
      const d = window.flightData;
      const r = d.routes.find(x => x.routeId === routeId);
      if (!r) return;
      r.active = !r.active;
      FlySimStore.generateFlightsForRoutes(d);
      refreshAll();
    });
  }

  function regenerateFlights() {
    return _safe(() => {
      FlySimStore.generateFlightsForRoutes(window.flightData);
      refreshAll();
      alert("Voos regenerados!");
    });
  }

  // --------- RENDER TABS ---------
  function renderTab(tab) {
    const d = window.flightData;

    if (tab === "overview") {
      tabContent.innerHTML = `
        <div class="card">
          <div class="cardTitle">${d.company.name}</div>
          <div class="row">
            <div><b>Caixa:</b> ${fmtMoney(d.company.cash)}</div>
            <div><b>Combustível:</b> ${d.company.fuel.toLocaleString("pt-BR")} L</div>
            <div><b>CO₂:</b> ${d.company.co2Credits.toLocaleString("pt-BR")} créditos</div>
            <div><b>Reputação:</b> ${d.company.reputation}%</div>
          </div>
          <p class="muted" style="margin-top:10px;">
            DLC realtime ligado: se você editar no Admin, o jogo atualiza automaticamente.
          </p>
          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn" onclick="UIModule.openPanel(); UIModule.selectTab('fleet')">Gerenciar Frota</button>
            <button class="btn ghost" onclick="UIModule.openPanel(); UIModule.selectTab('routes')">Gerenciar Rotas</button>
            <button class="btn ghost" onclick="UIModule.openPanel(); UIModule.selectTab('staff')">Contratar</button>
          </div>
        </div>
      `;
      return;
    }

    if (tab === "fleet") {
      tabContent.innerHTML = `
        <div class="card">
          <div class="cardTitle">Sua Frota</div>
          <div class="muted">Aeronaves compradas e status atual.</div>
        </div>

        ${d.fleet.map(ac => {
          const m = getModel(ac.modelId);
          return `
            <div class="card">
              <div class="cardTitle">${m ? m.name : ac.modelId} — ${ac.tailNumber}</div>
              <div><b>Status:</b> ${ac.status} | <b>Condição:</b> ${ac.condition}%</div>
              <div class="muted" style="margin-top:6px;">
                Alcance: ${m?.rangeKm ?? "-"} km | Assentos: ${m?.seats ?? "-"}
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
      return;
    }

    if (tab === "routes") {
      const idleFleet = d.fleet.filter(f => f.status === "IDLE" || f.status === "ASSIGNED");

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
          const ac = d.fleet.find(x => x.aircraftId === r.assignedAircraftId);
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
      return;
    }

    if (tab === "flights") {
      tabContent.innerHTML = `
        <div class="card">
          <div class="cardTitle">Voos Gerados</div>
          <div class="muted">Estes voos foram gerados automaticamente a partir das rotas.</div>
          <div style="margin-top:10px;">
            <button class="btn" onclick="UIModule.regenerateFlights()">Regenerar voos</button>
          </div>
        </div>

        ${(d.flights || []).map(f => `
          <div class="card">
            <div class="cardTitle">${f.flightNumber} — ${f.origin.code} → ${f.destination.code}</div>
            <div class="muted">${f.origin.city} → ${f.destination.city}</div>
            <div style="margin-top:8px;">
              <b>Status:</b> ${f.status} <br/>
              <b>Vel:</b> ${f.speedKts} kts | <b>Alt:</b> ${f.altitudeFt} ft
            </div>
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn" onclick="MapModule.focusFlight('${f.id}')">Ver no mapa</button>
              <button class="btn ghost" onclick="GameModule.startFlight('${f.id}')">Iniciar Voo (3D)</button>
            </div>
          </div>
        `).join("")}
      `;
      return;
    }

    if (tab === "staff") {
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
              <div class="muted" style="margin-top:6px;">Taxa contratação: ${fmtMoney(c.salary * 2)}</div>
              <div style="margin-top:10px;">
                <button class="btn" onclick="UIModule.hireCandidate('${c.id}')">Contratar</button>
              </div>
            </div>
          `).join("")}
        </div>
      `;
      return;
    }

    if (tab === "missions") {
      tabContent.innerHTML = `
        ${(d.missions || []).map(m => `
          <div class="card">
            <div class="cardTitle">${m.title} (${m.difficulty})</div>
            <div class="muted">${m.description}</div>
            <div style="margin-top:8px;"><b>Recompensa:</b> ${fmtMoney(m.reward)}</div>
            <div style="margin-top:10px;">
              <button class="btn" onclick="alert('Missão aceita: ${m.title}')">Aceitar</button>
            </div>
          </div>
        `).join("")}
      `;
      return;
    }

    tabContent.innerHTML = `<div class="card"><div class="muted">Em construção.</div></div>`;
  }

  function _safe(fn) {
    try { fn(); }
    catch (e) {
      console.error(e);
      alert("Erro ao executar ação. Veja o console.");
    }
  }

  return {
    init,
    openPanel,
    closePanel: closePanelFn,
    selectTab,
    buyAircraft,
    hireCandidate,
    createRoute,
    toggleRoute,
    regenerateFlights
  };
})();