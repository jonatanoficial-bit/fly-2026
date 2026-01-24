// js/ui.js (SUBSTITUA INTEIRO)
// UI Tycoon (detalhada) para FlySim: frota, rotas, voos, equipe e financeiro.
// Requer: window.flightData + GameModule + EconomyModule (para sugestões) e opcional MapModule.
//
// IDs esperados no index.html:
// - #panel, #panelBody, #tabs
// - #statusText, #clockText, #cashText, #repText, #ledgerMini
// - botões externos (opcional): #openPanelBtn, #tutorialBtn
//
// Eventos escutados: "game-updated" e "game-tick" (se existir)

window.UIModule = (function () {
  // ---------------------------
  // Estado UI
  // ---------------------------
  let currentTab = "home";
  let panelEl = null;
  let bodyEl = null;
  let tabsEl = null;

  // Tutorial overlay simples
  let tutorialShownThisSession = false;

  function init() {
    panelEl = document.getElementById("panel");
    bodyEl = document.getElementById("panelBody");
    tabsEl = document.getElementById("tabs");

    bindTabs();
    bindGlobalShortcuts();

    window.addEventListener("game-updated", refresh);
    window.addEventListener("game-tick", refresh);

    refresh();
  }

  function bindTabs() {
    if (!tabsEl) return;
    tabsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;
      const t = btn.getAttribute("data-tab");
      selectTab(t);
    });
  }

  function bindGlobalShortcuts() {
    // Caso o index tenha botões quick
    const openBtn = document.getElementById("openPanelBtn");
    openBtn?.addEventListener("click", () => openPanel());

    const tutBtn = document.getElementById("tutorialBtn");
    tutBtn?.addEventListener("click", () => startTutorial(true));
  }

  function openPanel() {
    if (!panelEl) panelEl = document.getElementById("panel");
    if (!panelEl) return;
    panelEl.classList.remove("hidden");
    refresh();
  }

  function closePanel() {
    if (!panelEl) return;
    panelEl.classList.add("hidden");
  }

  function selectTab(tab) {
    currentTab = tab || "home";
    // toggles
    if (tabsEl) {
      const buttons = tabsEl.querySelectorAll("[data-tab]");
      buttons.forEach(b => {
        const t = b.getAttribute("data-tab");
        b.classList.toggle("active", t === currentTab);
      });
    }
    render();
  }

  // ---------------------------
  // Render / Refresh
  // ---------------------------
  function refresh() {
    updateTopHUD();
    updateLedgerMini();
    render();
  }

  function updateTopHUD() {
    const d = window.flightData || {};
    const c = d.company || {};

    // status
    const st = document.getElementById("statusText");
    if (st) {
      const online = (typeof navigator !== "undefined") ? navigator.onLine : true;
      st.textContent = online ? "Operando (Mapa Online)" : "Operando (Offline)";
    }

    const clock = document.getElementById("clockText");
    if (clock) clock.textContent = formatClock(c.day || 1, c.minuteOfDay || 0);

    const cash = document.getElementById("cashText");
    if (cash) cash.textContent = money(c.cash || 0);

    const rep = document.getElementById("repText");
    if (rep) rep.textContent = `${Math.round((c.reputation01 ?? 0.55) * 100)}%`;
  }

  function updateLedgerMini() {
    const d = window.flightData || {};
    const led = d.ledger || [];
    const mini = document.getElementById("ledgerMini");
    if (!mini) return;

    if (!led.length) {
      mini.textContent = "Sem lançamentos ainda.";
      return;
    }

    const top = led.slice(0, 5).map(x => {
      const t = new Date(x.t || Date.now());
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");
      const sign = Number(x.amount || 0) >= 0 ? "+" : "-";
      const val = money(Math.abs(Number(x.amount || 0)));
      return `${hh}:${mm} • ${x.title || x.type || "Mov"} • ${sign}${val}`;
    }).join("\n");

    mini.textContent = top;
  }

  function render() {
    if (!bodyEl) bodyEl = document.getElementById("panelBody");
    if (!bodyEl) return;

    const tab = currentTab;

    if (tab === "home") bodyEl.innerHTML = renderHome();
    else if (tab === "fleet") bodyEl.innerHTML = renderFleet();
    else if (tab === "routes") bodyEl.innerHTML = renderRoutes();
    else if (tab === "flights") bodyEl.innerHTML = renderFlights();
    else if (tab === "staff") bodyEl.innerHTML = renderStaff();
    else if (tab === "ledger") bodyEl.innerHTML = renderLedger();
    else bodyEl.innerHTML = renderHome();

    bindActionsInPanel();
  }

  // ---------------------------
  // HTML builders
  // ---------------------------
  function renderHome() {
    const d = window.flightData || {};
    const c = d.company || {};

    const fleetCount = (d.fleet || []).length;
    const activeRoutes = (d.routes || []).filter(r => r.active !== false).length;
    const flightsToday = (d.flights || []).filter(f => (f.day === c.day)).length;

    const negCash = Number(c.cash || 0) < 0;

    return `
      <div class="card2">
        <div class="kpi">Visão Geral</div>
        <div class="muted small" style="margin-top:6px;">Painel de gestão estilo tycoon.</div>
        <div class="hr"></div>

        <div class="row">
          <div>
            <div class="muted small">Frota</div>
            <div class="kpi">${fleetCount}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted small">Rotas ativas</div>
            <div class="kpi">${activeRoutes}</div>
          </div>
        </div>

        <div class="row" style="margin-top:10px;">
          <div>
            <div class="muted small">Voos no dia</div>
            <div class="kpi">${flightsToday}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted small">Combustível (un)</div>
            <div class="kpi">${(c.fuelPricePerUnit ?? 5.2).toFixed(2)}</div>
          </div>
        </div>

        ${negCash ? `<div class="hr"></div><div class="muted"><b>Atenção:</b> caixa negativo reduz reputação diariamente.</div>` : ""}

        <div class="hr"></div>
        <div class="row">
          <button data-act="goFleet" type="button">Comprar aeronave</button>
          <button data-act="goRoutes" type="button">Criar rota</button>
          <button data-act="goStaff" type="button">Contratar</button>
        </div>
      </div>

      <div class="card2">
        <div class="kpi">Missões sugeridas</div>
        <div class="muted small" style="margin-top:6px;">
          1) Crie 2 rotas e atribua aeronaves<br/>
          2) Complete 5 voos lucrativos seguidos<br/>
          3) Suba reputação acima de 60%<br/>
          4) Faça manutenção antes de cair abaixo de 65%
        </div>
      </div>
    `;
  }

  function renderFleet() {
    const d = window.flightData || {};
    const fleet = d.fleet || [];

    const catalog = getCatalog(d);

    const cards = fleet.map(ac => {
      const stats = findCatalogItem(catalog, ac.modelId);
      const cond = Math.round((ac.condition01 ?? 0.92) * 100);
      const needs = cond < 70;
      const price = stats?.price ? money(stats.price) : "—";

      return `
        <div class="card2">
          <div class="row">
            <div>
              <div class="kpi">${escapeHtml(stats?.name || ac.modelId)}</div>
              <div class="muted small">${escapeHtml(stats?.category || "Aeronave")} • Assentos: ${stats?.seats ?? "—"} • Alcance: ${stats?.rangeKm ?? "—"} km</div>
            </div>
            <div style="text-align:right;">
              <div class="muted small">Condição</div>
              <div class="kpi">${cond}%</div>
            </div>
          </div>

          <div class="hr"></div>

          <div class="row">
            <div class="muted small">Status: <b>${escapeHtml(ac.status || "ACTIVE")}</b></div>
            <div class="muted small">Preço base: <b>${price}</b></div>
          </div>

          <div class="row" style="margin-top:10px;">
            <button data-act="maintain" data-id="${ac.id}" type="button">${needs ? "Manutenção (recomendado)" : "Manutenção"}</button>
            <button data-act="assignRoute" data-id="${ac.id}" type="button">Atribuir a rota</button>
          </div>
        </div>
      `;
    }).join("");

    const shop = renderShop(catalog);

    return `
      <div class="card2">
        <div class="kpi">Frota</div>
        <div class="muted small" style="margin-top:6px;">A condição afeta reputação e risco de cancelamento.</div>
      </div>
      ${cards || `<div class="card2"><div class="muted">Você ainda não tem aeronaves. Compre na loja abaixo.</div></div>`}
      ${shop}
    `;
  }

  function renderShop(catalog) {
    const d = window.flightData || {};
    const c = d.company || {};
    const cash = Number(c.cash || 0);

    const items = (catalog || []).slice(0, 50).map(it => {
      const affordable = cash >= Number(it.price || 0);
      const btnLabel = affordable ? "Comprar" : "Sem caixa";
      return `
        <div class="card2">
          <div class="row">
            <div>
              <div class="kpi">${escapeHtml(it.name || it.modelId)}</div>
              <div class="muted small">${escapeHtml(it.category || "Categoria")} • ${it.seats} assentos • ${it.rangeKm} km • ${it.cruiseKts} kts</div>
            </div>
            <div style="text-align:right;">
              <div class="muted small">Preço</div>
              <div class="kpi">${money(it.price || 0)}</div>
            </div>
          </div>
          <div class="hr"></div>
          <div class="row">
            <button data-act="buy" data-model="${it.modelId}" type="button" ${affordable ? "" : "disabled"}>${btnLabel}</button>
            <button data-act="suggestRoutes" data-model="${it.modelId}" type="button">Sugestões</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="card2">
        <div class="kpi">Loja de Aeronaves</div>
        <div class="muted small" style="margin-top:6px;">Compra offline, sem marcas registradas (comercialmente seguro).</div>
      </div>
      ${items}
    `;
  }

  function renderRoutes() {
    const d = window.flightData || {};
    const routes = d.routes || [];
    const airports = d.airports || [];
    const catalog = getCatalog(d);

    const optionsAirport = airports.map(a => `<option value="${a.code}">${a.code} — ${escapeHtml(a.name || "")}</option>`).join("");
    const optionsAircraft = (d.fleet || []).map(ac => {
      const it = findCatalogItem(catalog, ac.modelId);
      return `<option value="${ac.id}">${escapeHtml(it?.name || ac.modelId)} (${Math.round((ac.condition01 ?? 0.9) * 100)}%)</option>`;
    }).join("");

    const list = routes.map(r => {
      const dist = safeRouteDistance(d, r);
      const ac = (d.fleet || []).find(x => x.id === r.aircraftId);
      const acName = ac ? (findCatalogItem(catalog, ac.modelId)?.name || ac.modelId) : "—";
      const competitors = window.EconomyModule?.aiCompetitorCount ? window.EconomyModule.aiCompetitorCount(d, r) : 0;

      return `
        <div class="card2">
          <div class="row">
            <div>
              <div class="kpi">${escapeHtml(r.origin)} → ${escapeHtml(r.destination)} ${r.active === false ? `<span class="muted">(inativa)</span>` : ""}</div>
              <div class="muted small">Distância: ${Math.round(dist)} km • Freq/dia: ${r.frequencyPerDay} • Concorrentes: ${competitors}</div>
              <div class="muted small">Ticket: <b>${money(r.ticketPrice || 0)}</b> • Aeronave: <b>${escapeHtml(acName)}</b></div>
            </div>
            <div style="text-align:right;">
              <button data-act="focusRoute" data-route="${r.routeId}" type="button">Focar</button>
            </div>
          </div>

          <div class="hr"></div>
          <div class="row">
            <button data-act="toggleRoute" data-route="${r.routeId}" data-on="${r.active === false ? "1" : "0"}" type="button">
              ${r.active === false ? "Ativar" : "Desativar"}
            </button>
            <button data-act="editRoute" data-route="${r.routeId}" type="button">Editar</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="card2">
        <div class="kpi">Rotas</div>
        <div class="muted small" style="margin-top:6px;">
          Rotas geram voos automaticamente a cada dia. Atribua uma aeronave para operar.
        </div>
        <div class="hr"></div>

        <div class="kpi" style="font-size:14px;">Criar rota</div>
        <div class="row" style="margin-top:8px;">
          <select id="routeOrigin" style="flex:1; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">
            ${optionsAirport}
          </select>
          <select id="routeDest" style="flex:1; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">
            ${optionsAirport}
          </select>
        </div>

        <div class="row" style="margin-top:8px;">
          <input id="routeFreq" type="number" min="1" max="10" value="2"
            style="flex:1; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;" />
          <input id="routeTicket" type="number" min="50" value="0"
            style="flex:1; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;" />
        </div>

        <div class="row" style="margin-top:8px;">
          <select id="routeAircraft" style="flex:1; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;">
            <option value="">(sem aeronave)</option>
            ${optionsAircraft}
          </select>
          <button data-act="createRoute" type="button">Criar</button>
        </div>

        <div class="muted small" style="margin-top:8px;">
          Dica: deixe Ticket = 0 para usar o sugerido automaticamente.
        </div>
      </div>

      ${list || `<div class="card2"><div class="muted">Nenhuma rota criada ainda.</div></div>`}
    `;
  }

  function renderFlights() {
    const d = window.flightData || {};
    const c = d.company || {};
    const flights = (d.flights || []).slice().reverse(); // mais recentes por último -> invertendo para mostrar recentes primeiro
    const catalog = getCatalog(d);

    const list = flights.slice(0, 80).reverse().map(f => {
      const r = (d.routes || []).find(x => x.routeId === f.routeId);
      const ac = (d.fleet || []).find(x => x.id === f.aircraftId);
      const acName = ac ? (findCatalogItem(catalog, ac.modelId)?.name || ac.modelId) : "—";

      const res = f.lastResult || null;
      const profit = res ? Number(res.profit || 0) : null;
      const lf = res ? Number(res.lf || 0) : null;
      const badge = (f.status === "FINALIZADO")
        ? (profit >= 0 ? `<span style="color:#22c55e;font-weight:900;">Lucro</span>` : `<span style="color:#ef4444;font-weight:900;">Prejuízo</span>`)
        : (f.status === "CANCELADO" ? `<span style="color:#f59e0b;font-weight:900;">Cancelado</span>` : `<span style="color:#93c5fd;font-weight:900;">Em progresso</span>`);

      return `
        <div class="card2">
          <div class="row">
            <div>
              <div class="kpi">${escapeHtml(f.flightNumber || "Voo")} • ${badge}</div>
              <div class="muted small">${escapeHtml(f.origin?.code || "")} → ${escapeHtml(f.destination?.code || "")} • Aeronave: ${escapeHtml(acName)}</div>
              <div class="muted small">
                Status: <b>${escapeHtml(f.status)}</b>
                ${f.status === "CANCELADO" ? ` • Motivo: ${escapeHtml(f.cancelReason || "—")}` : ""}
              </div>

              ${res ? `
                <div class="hr"></div>
                <div class="row">
                  <div>
                    <div class="muted small">Ocupação</div>
                    <div class="kpi">${Math.round(lf * 100)}%</div>
                  </div>
                  <div style="text-align:right;">
                    <div class="muted small">Resultado</div>
                    <div class="kpi">${profit >= 0 ? "+" : "-"}${money(Math.abs(profit))}</div>
                  </div>
                </div>
                <div class="muted small" style="margin-top:6px;">
                  Receita: ${money(res.revenue || 0)} • Custos: ${money(res.cost || 0)} • Pax: ${res.pax || "—"}
                </div>
              ` : ``}
            </div>

            <div style="text-align:right;">
              <button data-act="focusFlight" data-flight="${f.id}" type="button">Focar</button>
              ${f.status !== "FINALIZADO" && f.status !== "CANCELADO"
                ? `<button data-act="completeFlight" data-flight="${f.id}" type="button" style="margin-top:6px;">Concluir</button>`
                : ``}
            </div>
          </div>
        </div>
      `;
    }).join("");

    const today = (d.flights || []).filter(x => x.day === c.day);
    const done = today.filter(x => x.status === "FINALIZADO").length;
    const open = today.filter(x => x.status !== "FINALIZADO" && x.status !== "CANCELADO").length;

    return `
      <div class="card2">
        <div class="kpi">Voos</div>
        <div class="muted small" style="margin-top:6px;">
          Hoje: <b>${today.length}</b> • Concluídos: <b>${done}</b> • Em aberto: <b>${open}</b>
        </div>
      </div>
      ${list || `<div class="card2"><div class="muted">Nenhum voo gerado ainda. Crie rotas e aguarde virar o dia.</div></div>`}
    `;
  }

  function renderStaff() {
    const d = window.flightData || {};
    const staff = d.staff || [];
    const payroll = staff.reduce((sum, s) => sum + Number(s.salaryDay || 0), 0);

    const list = staff.map(s => {
      return `
        <div class="card2">
          <div class="row">
            <div>
              <div class="kpi">${escapeHtml(s.role || "Staff")}</div>
              <div class="muted small">Salário/dia: <b>${money(s.salaryDay || 0)}</b> • Skill: <b>${Math.round((s.skill01 ?? 0.55) * 100)}%</b></div>
            </div>
            <div style="text-align:right;">
              <div class="muted small">ID</div>
              <div class="kpi">${escapeHtml(s.id || "")}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="card2">
        <div class="kpi">Equipe</div>
        <div class="muted small" style="margin-top:6px;">A folha é paga diariamente. Skill melhora eficiência.</div>
        <div class="hr"></div>
        <div class="row">
          <div>
            <div class="muted small">Funcionários</div>
            <div class="kpi">${staff.length}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted small">Folha/dia</div>
            <div class="kpi">${money(payroll)}</div>
          </div>
        </div>
      </div>

      <div class="card2">
        <div class="kpi">Contratar</div>
        <div class="row" style="margin-top:8px;">
          <input id="staffRole" placeholder="Cargo (ex: Piloto, Mecânico)" style="flex:1; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;" />
        </div>
        <div class="row" style="margin-top:8px;">
          <input id="staffSalary" type="number" min="1000" value="12000" style="flex:1; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;" />
          <input id="staffSkill" type="number" min="0" max="1" step="0.05" value="0.55" style="flex:1; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:#fff;" />
        </div>
        <div class="row" style="margin-top:8px;">
          <button data-act="hire" type="button">Contratar</button>
        </div>
        <div class="muted small" style="margin-top:6px;">Skill vai de 0 a 1.</div>
      </div>

      ${list || `<div class="card2"><div class="muted">Sem funcionários ainda.</div></div>`}
    `;
  }

  function renderLedger() {
    const d = window.flightData || {};
    const led = d.ledger || [];
    const list = led.map(x => {
      const t = new Date(x.t || Date.now());
      const dt = `${String(t.getDate()).padStart(2, "0")}/${String(t.getMonth() + 1).padStart(2, "0")} ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
      const amt = Number(x.amount || 0);
      const color = amt >= 0 ? "#22c55e" : "#ef4444";
      const sign = amt >= 0 ? "+" : "-";
      return `
        <div class="card2">
          <div class="row">
            <div>
              <div class="kpi">${escapeHtml(x.title || x.type || "Movimento")}</div>
              <div class="muted small">${dt} • Tipo: ${escapeHtml(x.type || "—")}</div>
              ${x.meta ? `<div class="muted small" style="margin-top:6px; white-space:pre-wrap;">${escapeHtml(JSON.stringify(x.meta))}</div>` : ""}
            </div>
            <div style="text-align:right;">
              <div class="muted small">Valor</div>
              <div class="kpi" style="color:${color}">${sign}${money(Math.abs(amt))}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="card2">
        <div class="kpi">Caixa / Ledger</div>
        <div class="muted small" style="margin-top:6px;">Histórico financeiro completo.</div>
      </div>
      ${list || `<div class="card2"><div class="muted">Sem lançamentos ainda.</div></div>`}
    `;
  }

  // ---------------------------
  // Actions binding
  // ---------------------------
  function bindActionsInPanel() {
    if (!bodyEl) return;

    bodyEl.querySelectorAll("[data-act]").forEach(btn => {
      btn.addEventListener("click", onActionClick);
    });
  }

  function onActionClick(e) {
    const btn = e.currentTarget;
    const act = btn.getAttribute("data-act");

    try {
      if (act === "goFleet") return selectTab("fleet");
      if (act === "goRoutes") return selectTab("routes");
      if (act === "goStaff") return selectTab("staff");

      if (act === "buy") {
        const model = btn.getAttribute("data-model");
        const res = window.GameModule?.buyAircraft?.(model);
        if (!res?.ok) alert(res?.error || "Falha na compra.");
        return;
      }

      if (act === "maintain") {
        const id = btn.getAttribute("data-id");
        const res = window.GameModule?.maintainAircraft?.(id);
        if (!res?.ok) alert(res?.error || "Falha na manutenção.");
        return;
      }

      if (act === "assignRoute") {
        const aircraftId = btn.getAttribute("data-id");
        openAssignRouteDialog(aircraftId);
        return;
      }

      if (act === "suggestRoutes") {
        const modelId = btn.getAttribute("data-model");
        showRouteSuggestions(modelId);
        return;
      }

      if (act === "createRoute") {
        const origin = document.getElementById("routeOrigin")?.value;
        const dest = document.getElementById("routeDest")?.value;
        const freq = Number(document.getElementById("routeFreq")?.value || 2);
        let ticket = Number(document.getElementById("routeTicket")?.value || 0);
        const aircraftId = document.getElementById("routeAircraft")?.value || null;

        if (!origin || !dest || origin === dest) return alert("Escolha origem e destino diferentes.");

        // Ticket 0 => sugerido por Economy
        if (!ticket || ticket <= 0) {
          const d = window.flightData || {};
          const fakeStats = { seats: 160, cruiseKts: 440, fuelBurnPerKm: 2.2 };
          ticket = window.EconomyModule?.suggestedTicket
            ? window.EconomyModule.suggestedTicket(d, { origin, destination: dest, frequencyPerDay: freq }, fakeStats)
            : 1200;
        }

        const route = window.GameModule?.addRoute?.(origin, dest, {
          frequencyPerDay: freq,
          ticketPrice: ticket,
          aircraftId: aircraftId || null
        });

        if (!route) alert("Falha ao criar rota.");
        else alert("Rota criada! (Voos serão gerados ao virar o dia)");
        return;
      }

      if (act === "toggleRoute") {
        const routeId = btn.getAttribute("data-route");
        const on = btn.getAttribute("data-on") === "1";
        window.GameModule?.toggleRoute?.(routeId, on);
        return;
      }

      if (act === "editRoute") {
        const routeId = btn.getAttribute("data-route");
        openEditRouteDialog(routeId);
        return;
      }

      if (act === "focusRoute") {
        const routeId = btn.getAttribute("data-route");
        window.MapModule?.focusRoute?.(routeId);
        return;
      }

      if (act === "focusFlight") {
        const id = btn.getAttribute("data-flight");
        window.MapModule?.focusFlight?.(id);
        return;
      }

      if (act === "completeFlight") {
        const id = btn.getAttribute("data-flight");
        const ok = window.GameModule?.completeFlight?.(id);
        if (!ok) alert("Não foi possível concluir este voo.");
        return;
      }

      if (act === "hire") {
        const role = document.getElementById("staffRole")?.value || "Staff";
        const salary = Number(document.getElementById("staffSalary")?.value || 12000);
        const skill = Number(document.getElementById("staffSkill")?.value || 0.55);
        window.GameModule?.hireStaff?.(role, salary, skill);
        alert("Contratado!");
        return;
      }
    } catch (err) {
      console.error("[UI] Ação falhou:", err);
      alert("Falha na ação. Veja o console.");
    }
  }

  // ---------------------------
  // Dialogs simples (prompt)
  // ---------------------------
  function openAssignRouteDialog(aircraftId) {
    const d = window.flightData || {};
    const routes = d.routes || [];
    if (!routes.length) return alert("Crie uma rota primeiro.");

    const list = routes.map(r => `${r.routeId} (${r.origin}→${r.destination})`).join("\n");
    const routeId = prompt(`Digite o ID da rota para atribuir esta aeronave:\n${list}`);
    if (!routeId) return;

    const ok = window.GameModule?.assignAircraftToRoute?.(routeId.trim(), aircraftId);
    if (!ok) alert("Não foi possível atribuir (verifique o ID).");
  }

  function openEditRouteDialog(routeId) {
    const d = window.flightData || {};
    const r = (d.routes || []).find(x => x.routeId === routeId);
    if (!r) return alert("Rota não encontrada.");

    const freq = prompt(`Nova frequência por dia (1..10). Atual: ${r.frequencyPerDay}`, String(r.frequencyPerDay || 1));
    if (freq === null) return;

    const ticket = prompt(`Novo ticket (R$). Atual: ${r.ticketPrice}`, String(r.ticketPrice || 0));
    if (ticket === null) return;

    const f = clampInt(Number(freq), 1, 10);
    const t = Math.max(50, Math.floor(Number(ticket) || r.ticketPrice));

    r.frequencyPerDay = f;
    r.ticketPrice = t;

    // autosave/refresh
    window.FlySimStore?.save?.(d);
    refresh();
    alert("Rota atualizada.");
  }

  function showRouteSuggestions(modelId) {
    const d = window.flightData || {};
    const airports = d.airports || [];
    if (airports.length < 2) return alert("Sem aeroportos suficientes.");

    const catalog = getCatalog(d);
    const ac = findCatalogItem(catalog, modelId) || { seats: 160, rangeKm: 5500, cruiseKts: 440, fuelBurnPerKm: 2.2 };

    // pega os hubs mais fortes
    const hubs = airports
      .slice()
      .sort((a, b) => (b.hubLevel || 3) - (a.hubLevel || 3))
      .slice(0, 6);

    // monta 5 sugestões
    const suggestions = [];
    for (let i = 0; i < hubs.length; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        const o = hubs[i], de = hubs[j];
        const dist = distanceKm(o.lat, o.lon, de.lat, de.lon);
        if (dist > (ac.rangeKm || 5500) * 0.92) continue;

        const fakeRoute = { routeId: `${o.code}-${de.code}`, origin: o.code, destination: de.code, frequencyPerDay: 2, ticketPrice: 0, active: true };
        const dem = window.EconomyModule?.routeBaseDemand ? window.EconomyModule.routeBaseDemand(d, fakeRoute) : 0.7;
        const sugTicket = window.EconomyModule?.suggestedTicket ? window.EconomyModule.suggestedTicket(d, fakeRoute, ac) : Math.round(dist * 1.2);

        suggestions.push({ o: o.code, d: de.code, dist, dem, sugTicket });
      }
    }

    suggestions.sort((a, b) => (b.dem - a.dem));
    const top = suggestions.slice(0, 5);

    if (!top.length) return alert("Sem sugestões (alcance curto demais para os hubs).");

    alert("Sugestões (hubs, boa demanda):\n\n" + top.map(s =>
      `${s.o}→${s.d} • ${Math.round(s.dist)} km • Demanda ${Math.round(s.dem * 100)}% • Ticket sugerido ${money(s.sugTicket)}`
    ).join("\n"));
  }

  // ---------------------------
  // Tutorial (overlay simples)
  // ---------------------------
  function startTutorial(force) {
    if (tutorialShownThisSession && !force) return;
    tutorialShownThisSession = true;

    const steps = [
      "Bem-vindo ao FlySim! Aqui você gerencia uma companhia aérea e vê os aviões voando no mapa.",
      "1) Vá em ROTAS e crie uma rota (origem → destino).",
      "2) Atribua uma aeronave para a rota (em ROTAS ou em FROTA > Atribuir).",
      "3) Cada dia o jogo gera voos automaticamente conforme a frequência da rota.",
      "4) Em VOOS, você pode concluir um voo e ver lucro/prejuízo + ocupação.",
      "5) Faça MANUTENÇÃO quando a condição cair abaixo de 70% para evitar cancelamentos.",
      "Pronto! Seu objetivo é crescer a frota, abrir rotas e maximizar lucro mantendo reputação alta."
    ];

    let i = 0;
    const next = () => {
      if (i >= steps.length) return;
      alert(steps[i]);
      i++;
      if (i < steps.length) setTimeout(next, 50);
    };
    next();
  }

  // ---------------------------
  // Catalog helpers
  // ---------------------------
  function getCatalog(d) {
    // Prioriza catálogo no save, senão usa global
    return (d.aircraftCatalog && d.aircraftCatalog.length) ? d.aircraftCatalog : (window.DEFAULT_AIRCRAFT_CATALOG || []);
  }

  function findCatalogItem(catalog, modelId) {
    return (catalog || []).find(x => x.modelId === modelId) || null;
  }

  function safeRouteDistance(d, r) {
    try {
      if (window.EconomyModule?.routeDistanceKm) return window.EconomyModule.routeDistanceKm(d, r);
    } catch (_) {}
    // fallback
    const o = (d.airports || []).find(a => a.code === r.origin);
    const de = (d.airports || []).find(a => a.code === r.destination);
    if (!o || !de) return 600;
    return distanceKm(o.lat, o.lon, de.lat, de.lon);
  }

  // ---------------------------
  // Utils
  // ---------------------------
  function formatClock(day, minuteOfDay) {
    const h = Math.floor((minuteOfDay || 0) / 60) % 24;
    const m = Math.floor((minuteOfDay || 0) % 60);
    return `Dia ${day} • ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function money(v) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
  }

  function clampInt(v, a, b) { return Math.max(a, Math.min(b, Math.floor(v || 0))); }

  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  function toRad(d) { return d * Math.PI / 180; }

  // ---------------------------
  // Public API
  // ---------------------------
  return {
    init,
    refresh,
    openPanel,
    closePanel,
    selectTab,
    startTutorial
  };
})();
