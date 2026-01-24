window.GameModule={
 init(){
  setInterval(()=>{
    const d=flightData;
    d.company.minuteOfDay+=60;
    if(d.company.minuteOfDay>=1440){
      d.company.minuteOfDay=0;
      d.company.day++;
      EconomyModule.applyDailyOps(d);
      FlySimStore.save(d);
    }
    window.dispatchEvent(new Event('game-updated'));
  },1000);
 }
};