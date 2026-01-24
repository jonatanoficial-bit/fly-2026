// js/ui.js (Mobile AAA Drawer UI)
window.UIModule = (function(){
  let currentTab="home";

  function $(id){ return document.getElementById(id); }

  function init(){
    $("menuBtn")?.addEventListener("click", ()=> openPanel(true));
    $("closePanelBtn")?.addEventListener("click", ()=> openPanel(false));

    document.querySelectorAll("#tabs [data-tab]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        document.querySelectorAll("#tabs [data-tab]").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        currentTab = btn.getAttribute("data-tab");
        render();
      });
    });

    window.addEventListener("game-updated", refresh);

    const first = !localStorage.getItem("flysim-first");
    if(first){
      localStorage.setItem("flysim-first","1");
      openPanel(true);
      setTimeout(()=>{
        alert("Tutorial rápido (offline):\n\n1) FROTA: compre uma aeronave\n2) ROTAS: crie uma rota e selecione a aeronave\n3) Avance 1 dia para gerar voos\n4) Veja resultados em VOOS e RELATÓRIOS\n\nUse ☰ para abrir/fechar o painel.");
      }, 250);
    }

    refresh();
  }

  function openPanel(on){
    const p=$("panel");
    if(!p) return;
    if(on) p.classList.remove("hidden"); else p.classList.add("hidden");
  }

  function money(v){
    return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v||0));
  }
  function clock(day, minute){
    const h=Math.floor((minute||0)/60)%24;
    const m=Math.floor((minute||0)%60);
    return `Dia ${day} • ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }

  function refresh(){
    const d=window.flightData;
    $("clockText") && ($("clockText").textContent = clock(d.company.day, d.company.minuteOfDay));
    $("cashText") && ($("cashText").textContent = money(d.company.cash));
    $("repText") && ($("repText").textContent = Math.round((d.company.reputation01||0.55)*100) + "%");
    $("weatherText") && ($("weatherText").textContent = d.company.weather || "—");
    $("seasonText") && ($("seasonText").textContent = d.company.season || "—");
    render();
  }

  function render(){
    const d=window.flightData;
    const body=$("panelBody");
    if(!body) return;

    if(currentTab==="home") body.innerHTML = renderHome(d);
    else if(currentTab==="fleet") body.innerHTML = renderFleet(d);
    else if(currentTab==="routes") body.innerHTML = renderRoutes(d);
    else if(currentTab==="flights") body.innerHTML = renderFlights(d);
    else if(currentTab==="reports") body.innerHTML = renderReports(d);
    else body.innerHTML = renderHome(d);

    bindActions();
  }

  function renderHome(d){
    const fleet=(d.fleet||[]).length;
    const routes=(d.routes||[]).length;
    const lastDay=d.company.day-1;
    const flights=(d.flights||[]).filter(f=>f.day===lastDay).length;
    return `
      <div class="card">
        <div class="kpi">Visão geral</div>
        <div class="muted small" style="margin-top:6px">Gestão offline estilo tycoon.</div>
        <div style="height:10px"></div>
        <div class="row small"><div>Frota</div><b>${fleet}</b></div>
        <div class="row small"><div>Rotas</div><b>${routes}</b></div>
        <div class="row small"><div>Voos (último dia)</div><b>${flights}</b></div>
        <div style="height:12px"></div>
        <div class="row">
          <button class="btn primary" data-act="advanceDay" type="button">Avançar 1 dia</button>
          <button class="btn" data-act="focusGRU" type="button">Focar GRU</button>
        </div>
        <div style="height:12px"></div>
        <button class="btn danger" data-act="resetSave" type="button">Resetar save</button>
      </div>
    `;
  }

  function renderFleet(d){
    const catalog=window.DEFAULT_AIRCRAFT_CATALOG||[];
    const fleetCards=(d.fleet||[]).map(ac=>{
      const it=catalog.find(x=>x.modelId===ac.modelId);
      const cond=Math.round((ac.condition01||0.9)*100);
      return `
        <div class="card">
          ${it?.imageRef?`<img class="aircraft" src="${it.imageRef}" alt="Aeronave" />`:``}
          <div class="kpi">${it?.name||ac.modelId}</div>
          <div class="muted small">${it?.category||"Aeronave"} • Assentos ${it?.seats||"—"} • Alcance ${it?.rangeKm||"—"} km</div>
          <div style="height:8px"></div>
          <div class="row small"><div>Condição</div><b>${cond}%</b></div>
          <div class="muted small" style="margin-top:8px">ID: <b>${ac.id}</b></div>
        </div>
      `;
    }).join("");

    const shop=catalog.map(it=>`
      <div class="card">
        ${it.imageRef?`<img class="aircraft" src="${it.imageRef}" alt="Aeronave" />`:``}
        <div class="kpi">${it.name}</div>
        <div class="muted small">${it.category} • ${it.seats} assentos • ${it.rangeKm} km</div>
        <div style="height:10px"></div>
        <div class="row"><div class="muted small">Preço</div><b>${money(it.price)}</b></div>
        <div style="height:10px"></div>
        <button class="btn primary" data-act="buy" data-model="${it.modelId}" type="button">Comprar</button>
      </div>
    `).join("");

    return `
      <div class="card"><div class="kpi">Sua frota</div><div class="muted small">Compre aeronaves para operar rotas.</div></div>
      ${fleetCards || `<div class="card"><div class="muted">Você ainda não tem aeronaves.</div></div>`}
      <div class="card"><div class="kpi">Loja</div><div class="muted small">Modelos genéricos (comercial-safe).</div></div>
      ${shop}
    `;
  }

  function renderRoutes(d){
    const aps=d.airports||[];
    const opts=aps.map(a=>`<option value="${a.code}">${a.code} — ${a.name||""}</option>`).join("");
    const fleetOpts=(d.fleet||[]).map(ac=>`<option value="${ac.id}">${ac.id} (${ac.modelId})</option>`).join("");

    const list=(d.routes||[]).map(r=>`
      <div class="card">
        <div class="kpi">${r.origin} → ${r.destination}</div>
        <div class="muted small">Frequência/dia: ${r.frequencyPerDay} • Ticket: ${r.ticketPrice?money(r.ticketPrice):"(auto)"} • Aeronave: <b>${r.aircraftId||"—"}</b></div>
      </div>
    `).join("");

    return `
      <div class="card">
        <div class="kpi">Criar rota</div>
        <div style="height:10px"></div>
        <div class="row" style="justify-content:stretch">
          <select id="routeOrigin" class="btn" style="flex:1">${opts}</select>
          <select id="routeDest" class="btn" style="flex:1">${opts}</select>
        </div>
        <div style="height:10px"></div>
        <div class="row" style="justify-content:stretch">
          <input id="routeFreq" class="btn" style="flex:1" type="number" min="1" max="10" value="2" />
          <input id="routeTicket" class="btn" style="flex:1" type="number" min="0" value="0" />
        </div>
        <div style="height:10px"></div>
        <div class="row" style="justify-content:stretch">
          <select id="routeAircraft" class="btn" style="flex:1">
            <option value="">(sem aeronave)</option>
            ${fleetOpts}
          </select>
          <button class="btn primary" data-act="createRoute" type="button">Criar</button>
        </div>
        <div class="muted small" style="margin-top:8px">Ticket 0 = automático.</div>
      </div>
      ${list || `<div class="card"><div class="muted">Nenhuma rota criada ainda.</div></div>`}
    `;
  }

  function renderFlights(d){
    const flights=(d.flights||[]).slice(-25).reverse();
    const list=flights.map(f=>{
      const res=f.lastResult;
      const profit=res?res.profit:0;
      const badge = f.status==="CANCELADO" ? "🟠 Cancelado" : profit>=0 ? "🟢 Lucro" : "🔴 Prejuízo";
      return `
        <div class="card">
          <div class="kpi">${f.flightNumber} • ${badge}</div>
          <div class="muted small">${f.origin} → ${f.destination} • Aeronave: ${f.aircraftId}</div>
          ${res?`
            <div style="height:10px"></div>
            <div class="row small"><div>Ocupação</div><b>${Math.round((res.lf||0)*100)}%</b></div>
            <div class="row small"><div>Resultado</div><b>${money(profit)}</b></div>
          `:``}
        </div>
      `;
    }).join("");
    return `
      <div class="card"><div class="kpi">Voos</div><div class="muted small">Últimos 25 voos.</div></div>
      ${list || `<div class="card"><div class="muted">Sem voos ainda. Crie rotas e atribua aeronave.</div></div>`}
    `;
  }

  function renderReports(d){
    const rows=(d.reports?.daily||[]).slice(-14).reverse();
    const list=rows.map(r=>`
      <div class="card">
        <div class="kpi">Dia ${r.day}</div>
        <div class="muted small">Temporada: ${r.season} • Clima: ${r.weather}</div>
        <div style="height:8px"></div>
        <div class="row small"><div>Receita</div><b>${money(r.revenue)}</b></div>
        <div class="row small"><div>Custos</div><b>${money(r.cost)}</b></div>
        <div class="row small"><div>Lucro</div><b>${money(r.profit)}</b></div>
      </div>
    `).join("");
    return `
      <div class="card"><div class="kpi">Relatórios</div><div class="muted small">Últimos 14 dias.</div></div>
      ${list || `<div class="card"><div class="muted">Sem relatório ainda. Avance 1 dia.</div></div>`}
    `;
  }

  function bindActions(){
    document.querySelectorAll("[data-act]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const act=btn.getAttribute("data-act");
        if(act==="advanceDay") return window.GameModule.advanceDay();
        if(act==="focusGRU") return window.MapModule.focusAirport("GRU");
        if(act==="resetSave"){
          if(confirm("Resetar o save?")) { window.FlySimStore.reset(); location.reload(); }
          return;
        }
        if(act==="buy"){
          const model=btn.getAttribute("data-model");
          const res=window.GameModule.buyAircraft(model);
          if(!res.ok) alert(res.error||"Falha ao comprar.");
          return;
        }
        if(act==="createRoute"){
          const o=document.getElementById("routeOrigin")?.value;
          const de=document.getElementById("routeDest")?.value;
          const freq=Number(document.getElementById("routeFreq")?.value||2);
          const ticket=Number(document.getElementById("routeTicket")?.value||0);
          const ac=document.getElementById("routeAircraft")?.value||null;
          if(!o||!de||o===de) return alert("Escolha origem e destino diferentes.");
          const r=window.GameModule.addRoute(o,de,{frequencyPerDay:freq,ticketPrice:ticket,aircraftId:ac});
          if(!r) alert("Falha ao criar rota.");
          else alert("Rota criada!");
          return;
        }
      }, { once:true });
    });
  }

  return { init };
})();
