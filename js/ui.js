// js/ui.js — UI AAA (mobile-first) + Tutorial (≈5 min)
(function(){
  let sideVisible = false;
  let currentTab = "overview";

  function money(n){
    const v = Number(n||0);
    return v.toLocaleString("pt-BR", {style:"currency", currency:"USD", maximumFractionDigits:0});
  }
  function pct(n){
    return Math.round((Number(n||0))*100) + "%";
  }
  function clock(){
    const t = window.flightData?.time;
    if(!t) return "—";
    const h = Math.floor((t.minuteOfDay||0)/60)%24;
    const m = Math.floor((t.minuteOfDay||0)%60);
    return `Dia ${t.day} • ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  function init(){
    // ensure modules started
    window.MapModule?.init();
    window.GameModule?.init();

    const menuBtn = document.getElementById("menuBtn");
    const sidePanel = document.getElementById("sidePanel");
    const tabContent = document.getElementById("tabContent");

    menuBtn?.addEventListener("click", ()=>{
      sideVisible = !sideVisible;
      sidePanel.classList.toggle("visible", sideVisible);
    });

    // tabs
    document.querySelectorAll(".tabBtn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        switchTab(btn.dataset.tab);
        document.querySelectorAll(".tabBtn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // tutorial
    setupTutorial();

    // map selection -> open panel & show relevant info
    window.addEventListener("map-selection", (e)=>{
      const sel = e.detail || {};
      if(!sel.type) return;
      if(!sideVisible && window.innerWidth < 980){
        sideVisible = true;
        sidePanel.classList.add("visible");
      }
      // open contextual tab
      if(sel.type === "flight") switchTab("flights", {focusFlightId: sel.id});
      else if(sel.type === "route") switchTab("routes", {focusRouteId: sel.id});
      else if(sel.type === "airport") switchTab("routes", {focusAirport: sel.id});
    });

    window.addEventListener("game-tick", ()=>{
      // keep current tab fresh without flicker
      render(tabContent, currentTab);
    });

    // first time tutorial
    const first = !localStorage.getItem("flysim_tutorial_done");
    if(first){
      openTutorial(0);
    }

    // initial render
    render(tabContent, currentTab);
  }

  function switchTab(tab, opts={}){
    currentTab = tab;
    const tabContent = document.getElementById("tabContent");
    render(tabContent, tab, opts);
  }

  function render(root, tab, opts={}){
    if(!root) return;
    if(tab === "overview") root.innerHTML = viewOverview();
    else if(tab === "fleet") root.innerHTML = viewFleet();
    else if(tab === "routes") root.innerHTML = viewRoutes(opts);
    else if(tab === "flights") root.innerHTML = viewFlights(opts);
    else if(tab === "staff") root.innerHTML = viewStaff();
    else if(tab === "missions") root.innerHTML = viewMissions();
    else if(tab === "settings") root.innerHTML = viewSettings();
    else root.innerHTML = viewOverview();

    wireActions(root, tab, opts);
  }

  function viewOverview(){
    const s = window.flightData;
    const cash = s.company?.cash || 0;
    const rep = s.company?.reputation || 0;

    const ledger = (s.ledger||[]).slice(0, 8).map(l=>`
      <div class="row">
        <div>
          <div class="small"><b>${escapeHtml(l.type)}</b> • <span class="muted">${escapeHtml(l.ref||"")}</span></div>
          <div class="small muted">${escapeHtml(l.detail||"")}</div>
        </div>
        <div class="badge ${Number(l.amount)>=0 ? "good":"bad"}">${money(l.amount)}</div>
      </div>
    `).join("<div class='hr'></div>");

    const fleetOk = (s.fleet||[]).filter(p=>p.status==="OK").length;
    const fleetMaint = (s.fleet||[]).filter(p=>p.status==="MANUTENCAO").length;
    const flightsActive = (s.flights||[]).filter(f=>f.status==="EM_ROTA").length;
    const flightsDoneToday = (s.flights||[]).filter(f=>f.status==="FINALIZADO" && f.day===s.time.day).length;

    return `
      <div class="card">
        <div class="row">
          <div>
            <div class="h2">Status</div>
            <div class="muted small">${clock()}</div>
          </div>
          <span class="badge">Offline</span>
        </div>
        <div class="hr"></div>
        <div class="row">
          <div class="muted">Caixa</div>
          <div><b>${money(cash)}</b></div>
        </div>
        <div class="row">
          <div class="muted">Reputação</div>
          <div><b>${pct(rep)}</b></div>
        </div>
        <div class="hr"></div>
        <div class="row">
          <div class="muted">Frota</div>
          <div class="small"><b>${fleetOk}</b> OK • <b>${fleetMaint}</b> Manutenção</div>
        </div>
        <div class="row">
          <div class="muted">Voos</div>
          <div class="small"><b>${flightsActive}</b> em rota • <b>${flightsDoneToday}</b> concluídos hoje</div>
        </div>
      </div>

      <div class="card">
        <div class="h2">Últimos lançamentos</div>
        <div class="muted small">Registro de lucros, compras e custos.</div>
        <div class="hr"></div>
        ${ledger || "<div class='muted small'>Sem lançamentos ainda.</div>"}
      </div>

      <div class="card">
        <div class="h2">Ações rápidas</div>
        <div class="hr"></div>
        <button class="btn primary" data-action="goTab" data-tab="fleet">Comprar aeronave</button>
        <div style="height:8px"></div>
        <button class="btn" data-action="goTab" data-tab="routes">Criar rota</button>
        <div style="height:8px"></div>
        <button class="btn" data-action="goTab" data-tab="staff">Contratar equipe</button>
      </div>
    `;
  }

  function viewFleet(){
    const s = window.flightData;
    const fleet = s.fleet||[];
    const models = s.aircraftCatalog||[];

    const cards = fleet.map(p=>{
      const m = models.find(x=>x.modelId===p.modelId);
      const cond = Math.round((p.condition||0)*100);
      const badgeClass = cond >= 70 ? "good" : (cond >= 40 ? "" : "bad");
      const status = p.status === "MANUTENCAO" ? "MANUTENÇÃO" : "OK";
      const img = m?.imageRef || "assets/images/aircraft_narrow.png";
      return `
        <div class="card">
          <div class="row">
            <div style="display:flex;gap:10px;align-items:center">
              <img src="${img}" alt="" style="width:46px;height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04)"/>
              <div>
                <div><b>${escapeHtml(p.tail)}</b> • <span class="muted small">${escapeHtml(m?.name || p.modelId)}</span></div>
                <div class="muted small">Condição: <b>${cond}%</b> • Status: <b>${status}</b></div>
              </div>
            </div>
            <span class="badge ${badgeClass}">${cond}%</span>
          </div>
          <div class="hr"></div>
          <div class="row">
            <button class="btn" data-action="maintStart" data-tail="${escapeHtml(p.tail)}" ${p.status==="MANUTENCAO"?"disabled":""}>Entrar em manutenção</button>
            <button class="btn primary" data-action="maintFinish" data-tail="${escapeHtml(p.tail)}" ${p.status!=="MANUTENCAO"?"disabled":""}>Concluir</button>
          </div>
        </div>
      `;
    }).join("");

    // shop list (top 20 by price)
    const shop = [...models].sort((a,b)=>a.price-b.price).slice(0, 24).map(m=>{
      return `
        <div class="card">
          <div class="row">
            <div style="display:flex;gap:10px;align-items:center">
              <img src="${m.imageRef}" alt="" style="width:46px;height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04)"/>
              <div>
                <div><b>${escapeHtml(m.name)}</b></div>
                <div class="muted small">${escapeHtml(m.category)} • ${m.seats} assentos • ${m.rangeKm} km</div>
              </div>
            </div>
            <div style="text-align:right">
              <div class="small"><b>${money(m.price)}</b></div>
              <div class="muted small">${escapeHtml(m.modelId)}</div>
            </div>
          </div>
          <div class="hr"></div>
          <button class="btn primary" data-action="buyAircraft" data-model="${escapeHtml(m.modelId)}">Comprar</button>
        </div>
      `;
    }).join("");

    return `
      <div class="card">
        <div class="h2">Sua frota</div>
        <div class="muted small">Manutenção afeta confiabilidade e lucro. Condição baixa pode travar aeronave.</div>
      </div>
      ${cards || "<div class='card'><div class='muted'>Sem aeronaves. Compre uma abaixo.</div></div>"}
      <div class="card">
        <div class="h2">Loja de aeronaves</div>
        <div class="muted small">Modelos genéricos (uso comercial). Você pode adicionar mais no modo DLC offline.</div>
      </div>
      ${shop}
    `;
  }

  function viewRoutes(opts={}){
    const s = window.flightData;
    const routes = s.routes||[];
    const airports = s.airports||[];

    const routeCards = routes.map(r=>{
      const o = airports.find(a=>a.code===r.origin);
      const d = airports.find(a=>a.code===r.destination);
      const demand = window.FlySimStore.computeDemand(r, s.company.reputation);
      const load = window.FlySimStore.estimateLoadFactor(demand, r.ticketPrice);
      const isSel = opts.focusRouteId && opts.focusRouteId===r.routeId;
      return `
        <div class="card" style="${isSel ? "border-color: rgba(57,183,255,.45); background: rgba(57,183,255,.08)" : ""}">
          <div class="row">
            <div>
              <div><b>${escapeHtml(r.origin)}→${escapeHtml(r.destination)}</b> <span class="muted small">(${escapeHtml(r.routeId)})</span></div>
              <div class="muted small">${escapeHtml(o?.city||"")} → ${escapeHtml(d?.city||"")} • ${r.frequencyPerDay}/dia • Mín: ${escapeHtml(r.minCategory||"regional")}</div>
            </div>
            <span class="badge">${money(r.ticketPrice)} ticket</span>
          </div>
          <div class="hr"></div>
          <div class="row">
            <div class="small muted">Demanda</div>
            <div class="small"><b>${pct(demand)}</b> • Ocupação est.: <b>${pct(load)}</b></div>
          </div>
          <div style="height:10px"></div>
          <button class="btn" data-action="focusRoute" data-route="${escapeHtml(r.routeId)}">Destacar no mapa</button>
        </div>
      `;
    }).join("");

    const airportOptions = airports
      .slice()
      .sort((a,b)=>a.code.localeCompare(b.code))
      .map(a=>`<option value="${escapeHtml(a.code)}">${escapeHtml(a.code)} — ${escapeHtml(a.city)}</option>`)
      .join("");

    return `
      <div class="card">
        <div class="h2">Rotas</div>
        <div class="muted small">Crie rotas e o sistema gera voos automaticamente a cada dia.</div>
      </div>

      <div class="card">
        <div class="h2">Criar rota</div>
        <label>Origem</label>
        <select class="input" id="routeOrigin">${airportOptions}</select>
        <label>Destino</label>
        <select class="input" id="routeDest">${airportOptions}</select>
        <label>Preço do ticket</label>
        <input class="input" id="routePrice" type="number" value="420" min="50" step="10"/>
        <label>Frequência (voos por dia)</label>
        <input class="input" id="routeFreq" type="number" value="2" min="1" step="1"/>
        <label>Demanda base (0 a 1)</label>
        <input class="input" id="routeDemand" type="number" value="0.65" min="0" max="1" step="0.05"/>
        <label>Competição (0 a 1)</label>
        <input class="input" id="routeComp" type="number" value="0.30" min="0" max="1" step="0.05"/>
        <label>Categoria mínima</label>
        <select class="input" id="routeMinCat">
          <option value="turboprop">turboprop</option>
          <option value="regional" selected>regional</option>
          <option value="narrow">narrow</option>
          <option value="wide">wide</option>
          <option value="jumbo">jumbo</option>
        </select>
        <div style="height:10px"></div>
        <button class="btn primary" data-action="createRoute">Criar</button>
        <div id="routeMsg" class="muted small" style="margin-top:8px"></div>
      </div>

      ${routeCards || "<div class='card'><div class='muted'>Nenhuma rota ainda.</div></div>"}
    `;
  }

  function viewFlights(opts={}){
    const s = window.flightData;
    const flights = (s.flights||[]).slice().sort((a,b)=> (b.day-a.day) || String(b.id).localeCompare(String(a.id)));
    const models = s.aircraftCatalog||[];

    const focusId = opts.focusFlightId;

    const cards = flights.slice(0, 18).map(f=>{
      const m = models.find(x=>x.modelId===f.modelId);
      const status = f.status === "FINALIZADO" ? "FINALIZADO" : "EM ROTA";
      const badgeClass = f.status==="FINALIZADO" ? (f.profit>=0?"good":"bad") : "";
      const isSel = focusId && String(focusId)===String(f.id);

      return `
        <div class="card" style="${isSel ? "border-color: rgba(57,183,255,.45); background: rgba(57,183,255,.08)" : ""}">
          <div class="row">
            <div>
              <div><b>${escapeHtml(f.flightNumber)}</b> • ${escapeHtml(f.origin.code)}→${escapeHtml(f.destination.code)}</div>
              <div class="muted small">${escapeHtml(m?.name || f.modelId)} • ${escapeHtml(f.tail || "")} • ${Math.round(f.distanceKm)} km</div>
            </div>
            <span class="badge ${badgeClass}">${status}</span>
          </div>

          <div class="hr"></div>

          ${f.status==="FINALIZADO" ? `
            <div class="row"><div class="muted small">Receita</div><div class="small"><b>${money(f.revenue)}</b></div></div>
            <div class="row"><div class="muted small">Custo</div><div class="small"><b>${money(-Math.abs(f.cost))}</b></div></div>
            <div class="row"><div class="muted small">Lucro</div><div class="small"><b>${money(f.profit)}</b></div></div>
          ` : `
            <div class="row"><div class="muted small">Progresso</div><div class="small"><b>${Math.round((f.progress01||0)*100)}%</b></div></div>
            <div style="height:10px"></div>
            <button class="btn" data-action="focusFlight" data-flight="${escapeHtml(f.id)}">Destacar no mapa</button>
          `}
        </div>
      `;
    }).join("");

    return `
      <div class="card">
        <div class="h2">Voos</div>
        <div class="muted small">Voos são gerados automaticamente a partir das rotas. Concluir um voo atualiza o ledger.</div>
      </div>
      ${cards || "<div class='card'><div class='muted'>Sem voos no momento.</div></div>"}
    `;
  }

  function viewStaff(){
    const s = window.flightData;
    const staff = s.staff||[];
    const candidates = s.candidates||[];

    const staffCards = staff.map(p=>`
      <div class="card">
        <div class="row">
          <div>
            <div><b>${escapeHtml(p.name)}</b> • <span class="muted small">${escapeHtml(p.role)}</span></div>
            <div class="muted small">Skill: <b>${pct(p.skill||0)}</b> • Moral: <b>${pct(p.morale||0)}</b></div>
          </div>
          <span class="badge">${money(p.salary)}/ano</span>
        </div>
      </div>
    `).join("");

    const candCards = candidates.map(c=>`
      <div class="card">
        <div class="row">
          <div>
            <div><b>${escapeHtml(c.name)}</b> • <span class="muted small">${escapeHtml(c.role)}</span></div>
            <div class="muted small">Skill: <b>${pct(c.skill||0)}</b> • Bônus contratação: <b>${money(Math.round((c.salary||0)*0.2))}</b></div>
          </div>
          <span class="badge">${money(c.salary)}/ano</span>
        </div>
        <div class="hr"></div>
        <button class="btn primary" data-action="hire" data-candidate="${escapeHtml(c.id)}">Contratar</button>
      </div>
    `).join("");

    return `
      <div class="card">
        <div class="h2">Equipe</div>
        <div class="muted small">Equipe afeta eficiência (versões futuras adicionam efeitos avançados).</div>
      </div>
      <div class="card">
        <div class="h2">Funcionários</div>
        <div class="muted small">Salários são pagos diariamente.</div>
      </div>
      ${staffCards || "<div class='card'><div class='muted'>Sem equipe.</div></div>"}
      <div class="card">
        <div class="h2">Candidatos</div>
        <div class="muted small">Contrate para crescer e operar mais rotas.</div>
      </div>
      ${candCards || "<div class='card'><div class='muted'>Nenhum candidato disponível.</div></div>"}
    `;
  }

  function viewMissions(){
    const s = window.flightData;
    const missions = s.missions||[];
    return `
      <div class="card">
        <div class="h2">Missões</div>
        <div class="muted small">Objetivos para orientar progresso (offline). Recompensas entram no caixa.</div>
      </div>
      ${missions.map(m=>`
        <div class="card">
          <div class="row">
            <div>
              <div><b>${escapeHtml(m.name)}</b></div>
              <div class="muted small">${escapeHtml(m.desc)}</div>
            </div>
            <span class="badge good">+${money(m.reward)}</span>
          </div>
        </div>
      `).join("")}
      <div class="card">
        <button class="btn" data-action="checkMissions">Checar progresso</button>
        <div id="missionMsg" class="muted small" style="margin-top:8px"></div>
      </div>
    `;
  }

  function viewSettings(){
    const s = window.flightData;
    const dlc = window.FlySimStore.loadDlc();
    return `
      <div class="card">
        <div class="h2">Configuração</div>
        <div class="muted small">Jogo 100% offline. Você pode exportar/importar DLC local (catálogo/aeroportos).</div>
      </div>

      <div class="card">
        <div class="h2">DLC offline</div>
        <div class="muted small">O DLC é salvo no <b>localStorage</b> do navegador/dispositivo.</div>
        <div class="hr"></div>
        <button class="btn" data-action="exportDlc">Exportar DLC (copiar JSON)</button>
        <div style="height:8px"></div>
        <button class="btn" data-action="importDlc">Importar DLC (colar JSON)</button>
        <div id="dlcMsg" class="muted small" style="margin-top:8px"></div>
      </div>

      <div class="card">
        <div class="h2">Salvar / Reset</div>
        <div class="muted small">Cuidado: reset apaga progresso local.</div>
        <div class="hr"></div>
        <button class="btn danger" data-action="resetSave">Resetar jogo</button>
      </div>

      <div class="card">
        <div class="h2">Sobre</div>
        <div class="muted small">Versão offline pronta para evoluir para AAA: mais regiões, ATC, clima, tráfego AI e economia avançada.</div>
      </div>
    `;
  }

  function wireActions(root, tab, opts){
    // go tab
    root.querySelectorAll("[data-action='goTab']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const t = btn.dataset.tab;
        document.querySelector(`.tabBtn[data-tab='${t}']`)?.click();
      });
    });

    // fleet actions
    root.querySelectorAll("[data-action='buyAircraft']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const modelId = btn.dataset.model;
        const res = window.FlySimStore.buyAircraft(modelId);
        alert(res.ok ? `Compra OK! Nova aeronave: ${res.tail}` : `Falha: ${res.reason}`);
      });
    });
    root.querySelectorAll("[data-action='maintStart']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const tail = btn.dataset.tail;
        const ok = window.FlySimStore.startMaintenance(tail);
        if(!ok) alert("Não foi possível iniciar manutenção.");
      });
    });
    root.querySelectorAll("[data-action='maintFinish']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const tail = btn.dataset.tail;
        const ok = window.FlySimStore.finishMaintenance(tail);
        if(!ok) alert("Não foi possível concluir manutenção.");
      });
    });

    // routes
    root.querySelectorAll("[data-action='createRoute']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const o = root.querySelector("#routeOrigin")?.value;
        const d = root.querySelector("#routeDest")?.value;
        const price = Number(root.querySelector("#routePrice")?.value || 0);
        const freq = Number(root.querySelector("#routeFreq")?.value || 1);
        const demand = Number(root.querySelector("#routeDemand")?.value || 0.6);
        const comp = Number(root.querySelector("#routeComp")?.value || 0.3);
        const minCat = root.querySelector("#routeMinCat")?.value || "regional";
        const res = window.FlySimStore.createRoute(o,d,price,freq,demand,comp,minCat);
        const msg = root.querySelector("#routeMsg");
        if(msg) msg.textContent = res.ok ? "Rota criada!" : ("Erro: " + res.reason);
      });
    });
    root.querySelectorAll("[data-action='focusRoute']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.dataset.route;
        window.MapModule?.setSelected({type:"route", id});
      });
    });

    // flights
    root.querySelectorAll("[data-action='focusFlight']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.dataset.flight;
        window.MapModule?.setSelected({type:"flight", id});
      });
    });

    // staff hire
    root.querySelectorAll("[data-action='hire']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.dataset.candidate;
        const res = window.FlySimStore.hire(id);
        alert(res.ok ? "Contratado!" : ("Falha: " + res.reason));
      });
    });

    // missions
    root.querySelectorAll("[data-action='checkMissions']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const msg = root.querySelector("#missionMsg");
        const gained = checkMissions();
        if(msg) msg.textContent = gained>0 ? `Recompensas liberadas: ${money(gained)}` : "Nenhuma missão concluída agora.";
      });
    });

    // settings
    root.querySelectorAll("[data-action='exportDlc']").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        const dlc = window.FlySimStore.loadDlc() || {};
        const json = JSON.stringify(dlc, null, 2);
        try{
          await navigator.clipboard.writeText(json);
          root.querySelector("#dlcMsg").textContent = "DLC copiado para a área de transferência.";
        }catch(e){
          root.querySelector("#dlcMsg").textContent = "Não consegui copiar. Selecione e copie manualmente:";
          prompt("Copie o JSON do DLC:", json);
        }
      });
    });

    root.querySelectorAll("[data-action='importDlc']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const json = prompt("Cole o JSON do DLC offline (aircraftCatalog/airports/missions/candidates):");
        if(!json) return;
        try{
          const obj = JSON.parse(json);
          window.FlySimStore.saveDlc(obj);
          root.querySelector("#dlcMsg").textContent = "DLC importado. Recarregue a página para aplicar.";
        }catch(e){
          root.querySelector("#dlcMsg").textContent = "JSON inválido.";
        }
      });
    });

    root.querySelectorAll("[data-action='resetSave']").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        if(confirm("Resetar o jogo? Isso apaga todo o progresso local.")){
          window.FlySimStore.clearSave();
          localStorage.removeItem("flysim_tutorial_done");
          location.reload();
        }
      });
    });
  }

  function checkMissions(){
    const s = window.flightData;
    let gained = 0;

    for(const m of (s.missions||[])){
      if(m.done) continue;
      if(m.type==="fleetSize"){
        if((s.fleet||[]).length >= m.target){
          m.done = true; gained += (m.reward||0);
        }
      }else if(m.type==="profitFlights"){
        const done = (s.flights||[]).filter(f=>f.status==="FINALIZADO" && f.profit>0).length;
        if(done >= m.target){
          m.done = true; gained += (m.reward||0);
        }
      }
    }

    if(gained>0){
      s.company.cash = Math.round((s.company.cash||0) + gained);
      s.ledger.unshift({ ts: Date.now(), type:"MISSAO", ref:"Recompensa", detail:"Missões concluídas", amount:gained });
      s.ledger = s.ledger.slice(0, 40);
      window.FlySimStore.save(s);
    }
    return gained;
  }

  // -------- tutorial
  const TUTORIAL_STEPS = [
    {
      title: "1) Visão geral",
      body: "Este é um simulador de gestão + voos (100% offline). O painel mostra Dia/Hora, Caixa e Reputação. O ledger registra lucros e custos."
    },
    {
      title: "2) Mapa tático",
      body: "O mapa é offline: rotas são linhas e aviões são pontos em movimento. Toque em uma rota ou avião para abrir detalhes."
    },
    {
      title: "3) Frota",
      body: "Em Frota você compra aeronaves e cuida da manutenção. Condição baixa aumenta risco e trava aeronave em manutenção."
    },
    {
      title: "4) Rotas",
      body: "Crie rotas definindo origem/destino, ticket e demanda. O sistema gera voos automaticamente todo dia, usando aeronaves compatíveis."
    },
    {
      title: "5) Economia real por rota",
      body: "O lucro do voo depende de demanda, competição, reputação, custo de combustível e taxas. Reputação sobe com lucro e cai com prejuízo."
    },
    {
      title: "Pronto!",
      body: "Você pode expandir comprando aeronaves, contratando equipe e criando rotas lucrativas. Em Config, exporte/importa DLC offline."
    }
  ];

  function setupTutorial(){
    const btn = document.getElementById("tutorialBtn");
    btn?.addEventListener("click", ()=> openTutorial(0));
    document.getElementById("tutorialClose")?.addEventListener("click", closeTutorial);
  }

  let tutIndex = 0;
  function openTutorial(i){
    tutIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length-1, i));
    const overlay = document.getElementById("tutorialOverlay");
    overlay.classList.remove("hidden");
    renderTutorialStep();
    document.getElementById("tutorialPrev").onclick = ()=>{ if(tutIndex>0){ tutIndex--; renderTutorialStep(); } };
    document.getElementById("tutorialNext").onclick = ()=>{ 
      if(tutIndex < TUTORIAL_STEPS.length-1){ tutIndex++; renderTutorialStep(); }
      else{ localStorage.setItem("flysim_tutorial_done","1"); closeTutorial(); }
    };
  }

  function closeTutorial(){
    document.getElementById("tutorialOverlay")?.classList.add("hidden");
  }

  function renderTutorialStep(){
    const step = TUTORIAL_STEPS[tutIndex];
    const body = document.getElementById("tutorialBody");
    const stepEl = document.getElementById("tutorialStep");
    const next = document.getElementById("tutorialNext");
    const prev = document.getElementById("tutorialPrev");
    if(!body) return;

    body.innerHTML = `
      <div class="title">${escapeHtml(step.title)}</div>
      <p>${escapeHtml(step.body)}</p>
      <p class="small muted">Dica: no mobile, use o botão ☰ para abrir/fechar o painel.</p>
    `;
    stepEl.textContent = `${tutIndex+1}/${TUTORIAL_STEPS.length}`;
    prev.disabled = tutIndex===0;
    next.textContent = (tutIndex===TUTORIAL_STEPS.length-1) ? "Concluir" : "Próximo";
  }

  // helpers
  function escapeHtml(str){
    return String(str ?? "").replace(/[&<>"']/g, (m)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  window.UIModule = { init };

  // bootstrap
  window.addEventListener("DOMContentLoaded", ()=> window.UIModule.init());
})();
