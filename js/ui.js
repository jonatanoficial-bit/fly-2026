window.UIModule={
 init(){
  window.addEventListener('game-updated',()=>this.refresh());
  this.refresh();
 },
 refresh(){
  clockText.textContent=`Dia ${flightData.company.day}`;
  cashText.textContent=flightData.company.cash.toLocaleString();
  repText.textContent=Math.round(flightData.company.reputation01*100)+'%';
  modeText.textContent=flightData.mode.type;
 }
};