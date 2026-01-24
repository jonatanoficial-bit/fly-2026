// js/game.js (loop + geração de voos)
window.GameModule = (function(){
  const TICK_MINUTES = 10;
  const TICK_MS = 1000;

  function nextId(kind){
    const d=window.flightData;
    d.__ids[kind] = (d.__ids[kind]||0)+1;
    return (kind==="flight" ? "F" : kind==="route" ? "R" : kind==="fleet" ? "AC" : "S") + d.__ids[kind];
  }

  function ensureReports(){
    const d=window.flightData;
    if(!d.reports) d.reports={daily:[]};
    if(!Array.isArray(d.reports.daily)) d.reports.daily=[];
  }

  function logLedger(title, amount, meta){
    const d=window.flightData;
    d.ledger = Array.isArray(d.ledger) ? d.ledger : [];
    d.ledger.unshift({ t: Date.now(), type:"LEDGER", title, amount, meta: meta||null });
    if(d.ledger.length>60) d.ledger.length=60;
  }

  function saveAndUpdate(){
    window.FlySimStore?.save?.(window.flightData);
    try { window.dispatchEvent(new Event("game-updated")); } catch(_){ }
  }

  function buyAircraft(modelId){
    const d=window.flightData;
    const it=(window.DEFAULT_AIRCRAFT_CATALOG||[]).find(x=>x.modelId===modelId);
    if(!it) return {ok:false, error:"Modelo inválido"};
    if(d.company.cash < it.price) return {ok:false, error:"Caixa insuficiente"};
    d.company.cash -= it.price;
    const id = nextId("fleet");
    d.fleet.push({ id, modelId, condition01:0.92, status:"ACTIVE" });
    logLedger("Compra de aeronave", -it.price, { modelId, id });
    saveAndUpdate();
    return {ok:true, id};
  }

  function addRoute(origin, destination, opts){
    const d=window.flightData;
    const o=d.airports.find(a=>a.code===origin);
    const de=d.airports.find(a=>a.code===destination);
    if(!o||!de) return null;
    const routeId = nextId("route");
    const route = {
      routeId,
      origin,
      destination,
      frequencyPerDay: Math.max(1, Math.min(10, Math.floor(opts?.frequencyPerDay||2))),
      ticketPrice: Math.max(0, Math.floor(opts?.ticketPrice||0)),
      active: true,
      aircraftId: opts?.aircraftId || null
    };
    d.routes.push(route);
    logLedger("Criação de rota", 0, { routeId, origin, destination });
    saveAndUpdate();
    return route;
  }

  function advanceDay(){
    const d=window.flightData;
    ensureReports();

    const seasons=["NORMAL","HIGH","LOW"]; if(Math.random()<0.18) d.company.season = seasons[Math.floor(Math.random()*seasons.length)];
    const weathers=["CLEAR","RAIN","STORM"]; if(Math.random()<0.22) d.company.weather = weathers[Math.floor(Math.random()*weathers.length)];

    for(const r of d.routes){
      if(r.active===false) continue;
      if(!r.aircraftId) continue;
      const acState = d.fleet.find(x=>x.id===r.aircraftId);
      if(!acState) continue;

      const ac = (window.DEFAULT_AIRCRAFT_CATALOG||[]).find(x=>x.modelId===acState.modelId) || {seats:140,fuelBurnPerKm:2.2};

      for(let i=0;i<r.frequencyPerDay;i++){
        const fid = nextId("flight");
        const flightNumber = "FS " + String(d.__ids.flight).padStart(4,"0");
        const flight = {
          id: fid,
          flightNumber,
          routeId: r.routeId,
          aircraftId: acState.id,
          origin: r.origin,
          destination: r.destination,
          day: d.company.day,
          status: "FINALIZADO",
          lastResult: null
        };

        const res = window.EconomyModule.computeFlight(d, r, ac);
        acState.condition01 = Math.max(0.45, (acState.condition01||0.9) - 0.01 - (res.dist/120000));

        let canceled = false;
        if(d.company.weather==="STORM" && Math.random()<0.10) canceled=true;
        if((acState.condition01||0.9)<0.65 && Math.random()<0.12) canceled=true;

        if(canceled){
          const penalty = Math.round(res.cost*0.45);
          d.company.cash -= penalty;
          flight.status="CANCELADO";
          flight.lastResult={...res, revenue:0, profit:-penalty, cost:penalty, pax:0, lf:0};
          logLedger("Voo cancelado", -penalty, {routeId:r.routeId});
          d.company.reputation01 = Math.max(0.1, d.company.reputation01 - 0.01);
        } else {
          d.company.cash += res.profit;
          flight.lastResult=res;
          logLedger("Resultado de voo", res.profit, {routeId:r.routeId, lf:res.lf, pax:res.pax});
          d.company.reputation01 = Math.min(0.95, d.company.reputation01 + (res.profit>0 ? 0.002 : -0.002));
        }

        d.flights.push(flight);
      }
    }

    const todayFlights = d.flights.filter(f=>f.day===d.company.day && f.lastResult);
    const revenue = todayFlights.reduce((s,f)=>s+(f.lastResult.revenue||0),0);
    const cost = todayFlights.reduce((s,f)=>s+(f.lastResult.cost||0),0);
    const profit = revenue - cost;
    d.reports.daily.push({day:d.company.day, revenue, cost, profit, season:d.company.season, weather:d.company.weather});
    if(d.reports.daily.length>30) d.reports.daily.shift();

    d.company.day += 1;
    saveAndUpdate();
  }

  function init(){
    setInterval(()=>{
      const d=window.flightData;
      d.company.minuteOfDay = (d.company.minuteOfDay + TICK_MINUTES) % 1440;
      if(d.company.minuteOfDay===0){
        advanceDay();
        return;
      }
      saveAndUpdate();
    }, TICK_MS);
  }

  return { init, buyAircraft, addRoute, advanceDay };
})();
