// js/game.js — Núcleo do jogo (tempo, simulação de voos, autosave)
(function(){
  let timer = null;

  function minutesToClock(min){
    const h = Math.floor(min/60)%24;
    const m = Math.floor(min%60);
    return String(h).padStart(2,'0') + ":" + String(m).padStart(2,'0');
  }

  function tick(){
    const state = window.flightData;
    if(!state) return;

    // avança o tempo do jogo
    window.FlySimStore.advanceMinute(1);

    // move voos em andamento
    for(const f of (state.flights||[])){
      if(f.status !== "EM_ROTA") continue;

      const model = (state.aircraftCatalog||[]).find(m=>m.modelId===f.modelId);
      const cruiseKts = Number(model?.cruiseKts || 420);
      const speedKmh = cruiseKts * 1.852;
      const dist = Number(f.distanceKm || 1);

      // quantos km por minuto
      const kmPerMin = speedKmh / 60;

      const dp = kmPerMin / dist; // progresso por minuto
      f.progress01 = Math.min(1, (f.progress01 || 0) + dp);

      if(f.progress01 >= 1){
        // finaliza economia
        window.FlySimStore.completeFlight(f.id);
      }
    }

    // salários diários (no começo do dia)
    if(state.time.minuteOfDay === 0){
      paySalaries(state);
    }

    // salvar
    window.FlySimStore.save(state);

    // informar UI
    window.dispatchEvent(new CustomEvent("game-tick", {detail:{
      day: state.time.day,
      clock: minutesToClock(state.time.minuteOfDay),
      cash: state.company?.cash || 0,
      rep: state.company?.reputation || 0
    }}));
  }

  function paySalaries(state){
    let total = 0;
    for(const s of (state.staff||[])){
      total += Math.round((s.salary || 0)/30);
    }
    if(total > 0){
      state.company.cash = Math.round((state.company.cash||0) - total);
      state.ledger.unshift({ ts: Date.now(), type:"SALARIOS", ref:"Folha", detail:"Pagamento diário da equipe", amount:-total });
      state.ledger = state.ledger.slice(0, 40);
    }
  }

  function init(){
    // loop: 1 tick por segundo = 1 minuto de jogo
    if(timer) clearInterval(timer);
    timer = setInterval(tick, 1000);

    // first paint
    tick();
  }

  window.GameModule = { init };
})();
