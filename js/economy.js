window.EconomyModule={
 routeDistanceKm(d,r){
  const o=d.airports.find(a=>a.code===r.origin),de=d.airports.find(a=>a.code===r.destination);
  if(!o||!de)return 500;
  const R=6371,toRad=x=>x*Math.PI/180;
  const dLat=toRad(de.lat-o.lat),dLon=toRad(de.lon-o.lon);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(o.lat))*Math.cos(toRad(de.lat))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
 },
 routeBaseDemand(d,r){
  const o=d.airports.find(a=>a.code===r.origin),de=d.airports.find(a=>a.code===r.destination);
  let base=((o?.demandBase||0.6)+(de?.demandBase||0.6))/2;
  if(d.company.season==="HIGH") base*=1.15;
  if(d.company.season==="LOW") base*=0.85;
  return Math.min(1,base);
 },
 aiCompetitorCount(){return Math.floor(Math.random()*3);},
 suggestedTicket(d,r,ac){
  const dist=this.routeDistanceKm(d,r);
  return Math.round(dist*1.2);
 },
 computeFlightResult(d,r,ac,opts){
  const dist=this.routeDistanceKm(d,r);
  const demand=this.routeBaseDemand(d,r);
  const comp=this.aiCompetitorCount();
  let lf=Math.max(0.3,Math.min(0.95,demand*(1-comp*0.15)));
  const pax=Math.floor(ac.seats*lf);
  const revenue=pax*r.ticketPrice;
  const cost=(dist*ac.fuelBurnPerKm*(opts.fuelPricePerUnit||5))+50000;
  return {lf,pax,revenue,cost,profit:revenue-cost};
 },
 applyFlightResultToSave(d,f,r,ac,stats,res){
  d.company.cash+=res.profit;
  f.lastResult=res;
  d.ledger.unshift({t:Date.now(),type:"FLIGHT",amount:res.profit,title:f.flightNumber});
 },
 applyDailyOps(d){
  const seasons=["NORMAL","HIGH","LOW"];
  if(Math.random()<0.15) d.company.season=seasons[Math.floor(Math.random()*3)];
 }
};