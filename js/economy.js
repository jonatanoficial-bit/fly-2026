// js/economy.js (offline tycoon)
window.EconomyModule = {
  toRad(d){ return d*Math.PI/180; },
  distKm(a,b){
    const R=6371;
    const dLat=this.toRad(b.lat-a.lat), dLon=this.toRad(b.lon-a.lon);
    const x = Math.sin(dLat/2)**2 + Math.cos(this.toRad(a.lat))*Math.cos(this.toRad(b.lat))*Math.sin(dLon/2)**2;
    return R*2*Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  },
  seasonFactor(season){
    if(season==="HIGH") return 1.15;
    if(season==="LOW") return 0.85;
    return 1.0;
  },
  weatherFactor(w){
    if(w==="STORM") return 0.78;
    if(w==="RAIN") return 0.90;
    return 1.0;
  },
  competitorCount(){ return Math.floor(Math.random()*3); },
  suggestedTicket(d, route, ac){
    const o=d.airports.find(x=>x.code===route.origin);
    const de=d.airports.find(x=>x.code===route.destination);
    if(!o||!de) return 1200;
    const dist = this.distKm(o,de);
    const hub = ((o.hubLevel||3)+(de.hubLevel||3))/2;
    const base = dist*1.15*(0.85+hub*0.05);
    return Math.max(180, Math.round(base));
  },
  computeFlight(d, route, ac){
    const o=d.airports.find(x=>x.code===route.origin);
    const de=d.airports.find(x=>x.code===route.destination);
    const dist = (o&&de) ? this.distKm(o,de) : 600;
    const baseDemand = (((o?.demandBase)||0.6)+((de?.demandBase)||0.6))/2;
    const comp = this.competitorCount();
    let lf = baseDemand * this.seasonFactor(d.company.season) * this.weatherFactor(d.company.weather);
    lf *= (1 - comp*0.12);
    lf = Math.max(0.35, Math.min(0.96, lf));

    const pax = Math.floor((ac.seats||140) * lf);
    const ticket = route.ticketPrice || this.suggestedTicket(d, route, ac);
    const revenue = pax * ticket;

    const fuel = dist*(ac.fuelBurnPerKm||2.2) * (d.company.fuelPricePerUnit||5.2);
    const crew = 55000 + (ac.seats||140)*35;
    const maint = 25000 + dist*28;
    const cost = fuel + crew + maint;

    const profit = revenue - cost;
    return {dist, lf, pax, ticket, revenue, cost, profit, comp};
  }
};
