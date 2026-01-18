// js/economy.js
const EconomyModule = (function () {
  let timer = null;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function money(n) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  }

  function dispatchEconomyUpdated(meta) {
    try {
      window.dispatchEvent(new CustomEvent("economy-updated", { detail: meta || {} }));
    } catch {
      const ev = document.createEvent("Event");
      ev.initEvent("economy-updated", true, true);
      window.dispatchEvent(ev);
    }
  }

  function getModel(data, modelId) {
    return (data.aircraftCatalog || []).find(m => m.modelId === modelId) || null;
  }

  function getAircraft(data, aircraftId) {
    return (data.fleet || []).find(a => a.aircraftId === aircraftId) || null;
  }

  function sumSalariesDaily(data) {
    const mult = Number(data.economy?.salaryDailyMultiplier ?? 1);
    const total = (data.staff || []).reduce((s, x) => s + (Number(x.salary) || 0), 0);
    return Math.round(total * mult);
  }

  function calcOccupancy01(data, aircraft) {
    const econ = data.economy || {};
    const rep = Number(data.company?.reputation ?? 50);

    let occ = Number(econ.baseOccupancy ?? 0.68);
    occ += (rep - 50) * Number(econ.repImpact ?? 0.002);

    // penalidade por condição baixa
    const cond = Number(aircraft?.condition ?? 100);
    const at = Number(econ.lowConditionPenaltyAt ?? 70);
    if (cond < at) {
      const maxPen = Number(econ.lowConditionPenaltyMax ?? 0.18);
      const factor = clamp((at - cond) / at, 0, 1);
      occ -= maxPen * factor;
    }

    return clamp(occ, 0.25, 0.98);
  }

  function maybeDelay(data, aircraft) {
    const cond = Number(aircraft?.condition ?? 100);
    if (cond >= 55) return false;
    const chance = Number(data.economy?.delayChanceAtVeryLow ?? 0.25);
    return Math.random() < chance;
  }

  function maintenanceTick(data) {
    const hours = data.time.hour;
    const day = data.time.day;

    for (const ac of (data.fleet || [])) {
      if (ac.status !== "MAINTENANCE" || !ac.maintenance) continue;

      const endsDay = ac.maintenance.endsAtDay;
      const endsHour = ac.maintenance.endsAtHour;

      const done = (day > endsDay) || (day === endsDay && hours >= endsHour);
      if (!done) continue;

      ac.status = "IDLE";
      ac.maintenance = null;
      // recuperação (garantimos que pelo menos chegue a 95)
      ac.condition = clamp(Number(ac.condition || 0), 0, 100);
      if (ac.condition < 95) ac.condition = 95;
      FlySimStore.ledgerPush(data, {
        type: "MAINT_DONE",
        amount: 0,
        title: `Manutenção concluída (${ac.tailNumber})`,
        note: "Aeronave liberada para operar."
      });
    }
  }

  function runFlightsAtCurrentTime(data) {
    const day = data.time.day;
    const hour = data.time.hour;

    const flights = data.flights || [];
    for (const f of flights) {
      if (f.status === "COMPLETED") continue;

      // agenda -> ativa
      if (f.status === "SCHEDULED" && f.depDay === day && f.depHour === hour) {
        f.status = "ACTIVE";
        f.progress01 = 0;
      }

      if (f.status !== "ACTIVE") continue;

      const aircraft = getAircraft(data, f.aircraftId);
      const model = aircraft ? getModel(data, aircraft.modelId) : null;
      if (!aircraft || !model) {
        // não dá pra operar sem aeronave/modelo
        f.status = "COMPLETED";
        continue;
      }

      // se aeronave entrou em manutenção, cancela voo (penalidade reputação)
      if (aircraft.status === "MAINTENANCE") {
        data.company.reputation = clamp((data.company.reputation || 50) - 1, 0, 100);
        FlySimStore.ledgerPush(data, {
          type: "CANCEL",
          amount: 0,
          title: `Voo cancelado (${f.flightNumber})`,
          note: "Aeronave em manutenção. Reputação -1."
        });
        f.status = "COMPLETED";
        continue;
      }

      // avança progresso (por hora)
      const eta = Math.max(1, Number(f.etaHours || 1));
      f.progress01 = clamp(f.progress01 + (1 / eta), 0, 1);

      // posição interpolada (mapa)
      const p = f.progress01;
      f.position = {
        lat: f.origin.lat + (f.destination.lat - f.origin.lat) * p,
        lon: f.origin.lon + (f.destination.lon - f.origin.lon) * p
      };

      // terminou?
      if (f.progress01 >= 1) {
        // economia do voo
        const occ01 = calcOccupancy01(data, aircraft);
        const delayed = maybeDelay(data, aircraft);

        const seats = Number(model.seats || 0);
        const passengers = Math.max(0, Math.round(seats * occ01 * (delayed ? 0.88 : 1)));
        const revenue = Math.round(passengers * Number(f.ticketPrice || 0));

        const distanceKm = Number(f.distanceKm || 0);
        const fuelBurnPerKm = Number(model.fuelBurnPerKm || 0);
        const fuelUsed = Math.round(distanceKm * fuelBurnPerKm);

        // consome combustível no estoque e cobra custo
        data.company.fuel = Math.max(0, Number(data.company.fuel || 0) - fuelUsed);
        const fuelCost = Math.round(fuelUsed * Number(data.economy?.fuelPricePerUnit ?? 6));

        const airportFee = Math.round(Number(data.economy?.airportFeePerFlight ?? 2500));
        const costs = fuelCost + airportFee;

        const profit = revenue - costs;

        data.company.cash = Math.round(Number(data.company.cash || 0) + profit);

        // desgaste
        const lossPerKm = Number(data.economy?.conditionLossPerKm ?? 0.0018);
        const loss = distanceKm * lossPerKm;
        aircraft.condition = clamp(Number(aircraft.condition || 100) - loss, 0, 100);

        // reputação ajusta levemente
        if (profit > 0 && !delayed) data.company.reputation = clamp((data.company.reputation || 50) + 0.2, 0, 100);
        if (delayed) data.company.reputation = clamp((data.company.reputation || 50) - 0.4, 0, 100);

        f.economy = {
          passengers,
          occupancy01: occ01,
          revenue,
          costs,
          profit,
          delayed
        };

        FlySimStore.ledgerPush(data, {
          type: "FLIGHT",
          amount: profit,
          title: `Voo ${f.flightNumber} concluído`,
          note: `Receita ${money(revenue)} • Custos ${money(costs)} • ${delayed ? "Atraso/penalidade" : "No horário"}`
        });

        f.status = "COMPLETED";
      }
    }
  }

  function payDailySalariesIfNewDay(data, oldDay, newDay) {
    if (newDay === oldDay) return;
    // a cada virada de dia paga salários
    const pay = sumSalariesDaily(data);
    data.company.cash = Math.round(Number(data.company.cash || 0) - pay);

    FlySimStore.ledgerPush(data, {
      type: "SALARY",
      amount: -pay,
      title: "Pagamento de salários (diário)",
      note: `Equipe: ${(data.staff || []).length} funcionários`
    });
  }

  function regenerateFlightsIfNeeded(data, oldDay, newDay) {
    if (newDay === oldDay) return;
    // gera voos para o novo dia (com base em rotas e disponibilidade)
    FlySimStore.generateFlightsForRoutes(data);
    FlySimStore.ledgerPush(data, {
      type: "SCHEDULE",
      amount: 0,
      title: `Novos voos gerados (Dia ${data.time.day})`,
      note: "Baseado nas rotas ativas."
    });
  }

  function tick() {
    const data = window.flightData;
    if (!data || !window.FlySimStore) return;

    const oldDay = data.time.day;
    const oldHour = data.time.hour;

    // manutenção pode concluir
    maintenanceTick(data);

    // executa voos nessa hora
    runFlightsAtCurrentTime(data);

    // avança tempo (30 min por tick, por padrão)
    const mins = Number(data.time.tickMinutes || 30);
    let hour = Number(data.time.hour || 0);
    let day = Number(data.time.day || 1);

    // 60 min = 1h, então 30min = meio passo.
    // para simplificar a sim, cada tick incrementa 1 hora quando tickMinutes>=60,
    // mas como é 30, vamos acumular meia-hora em um buffer simples.
    data.time._minuteBuffer = Number(data.time._minuteBuffer || 0) + mins;
    while (data.time._minuteBuffer >= 60) {
      data.time._minuteBuffer -= 60;
      hour += 1;
      if (hour >= 24) {
        hour = 0;
        day += 1;
      }
    }

    // se não completou 1 hora ainda, não muda hora/dia
    data.time.hour = hour;
    data.time.day = day;

    // virada de dia: salários e novos voos
    payDailySalariesIfNewDay(data, oldDay, day);
    regenerateFlightsIfNeeded(data, oldDay, day);

    // salva
    FlySimStore.save(data);

    // avisa UI/map
    dispatchEconomyUpdated({ oldDay, oldHour, day, hour });
  }

  function init() {
    const data = window.flightData;
    if (!data) return;

    // UI reage a economia também
    window.addEventListener("economy-updated", () => {
      try {
        window.dispatchEvent(new CustomEvent("dlc-updated")); // reaproveita re-render do UI/map
      } catch {}
    });

    // auto sim
    if (data.time.autoSim) {
      start();
    }
  }

  function start() {
    stop();
    // 1 tick a cada 1.2s (ajuste se quiser)
    timer = setInterval(() => tick(), 1200);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function advanceDays(n) {
    const data = window.flightData;
    if (!data) return;

    const days = Math.max(1, Math.floor(Number(n || 1)));
    // avança “dia” fazendo 24h de ticks (ignorando o buffer)
    for (let i = 0; i < days; i++) {
      // força ir até o próximo dia
      const startDay = data.time.day;
      // simula 48 ticks de 30min = 24h
      for (let t = 0; t < 48; t++) tick();
      // garante que avançou pelo menos 1 dia
      if (data.time.day === startDay) {
        data.time.day += 1;
        data.time.hour = 0;
      }
    }

    FlySimStore.save(data);
    dispatchEconomyUpdated({ forced: true });
    alert(`Avançou ${days} dia(s). Caixa atual: ${money(data.company.cash)}`);
  }

  function startMaintenance(aircraftId) {
    const data = window.flightData;
    if (!data) return;

    const ac = (data.fleet || []).find(x => x.aircraftId === aircraftId);
    if (!ac) return alert("Aeronave não encontrada.");
    if (ac.status === "MAINTENANCE") return alert("Já está em manutenção.");

    const econ = data.economy || {};
    const m = econ.maintenance || {};
    const base = Number(m.baseCost || 80000);
    const perPoint = Number(m.costPerConditionPoint || 6000);

    const current = Number(ac.condition || 0);
    const target = 100;
    const need = Math.max(0, target - current);
    const cost = Math.round(base + need * perPoint);

    if (data.company.cash < cost) return alert(`Caixa insuficiente. Necessário: ${money(cost)}`);

    // cobra
    data.company.cash = Math.round(data.company.cash - cost);

    // agenda tempo
    const hoursReq = Number(m.hoursRequired || 10);
    const end = addHours(data.time.day, data.time.hour, hoursReq);

    ac.status = "MAINTENANCE";
    ac.maintenance = { endsAtDay: end.day, endsAtHour: end.hour };

    // repara parcialmente já no início (o resto "libera" ao concluir)
    ac.condition = clamp(current + Math.min(need, 10), 0, 100);

    FlySimStore.ledgerPush(data, {
      type: "MAINT",
      amount: -cost,
      title: `Manutenção iniciada (${ac.tailNumber})`,
      note: `Custo ${money(cost)} • Termina no Dia ${end.day} ${String(end.hour).padStart(2, "0")}:00`
    });

    FlySimStore.save(data);
    dispatchEconomyUpdated({ maint: true });
    alert(`Manutenção iniciada. Custo: ${money(cost)}.`);
  }

  function addHours(day, hour, add) {
    let d = Number(day), h = Number(hour);
    let a = Math.max(0, Math.floor(Number(add || 0)));
    while (a > 0) {
      h += 1;
      if (h >= 24) { h = 0; d += 1; }
      a -= 1;
    }
    return { day: d, hour: h };
  }

  return {
    init,
    start,
    stop,
    tick,
    advanceDays,
    startMaintenance
  };
})();