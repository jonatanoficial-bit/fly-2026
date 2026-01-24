
window.UIModule={
 init(){
  menuBtn.onclick=()=>panel.classList.toggle("show");
  advanceDayBtn.onclick=()=>{flightData.company.day++;this.render()};
  this.render();
 },
 render(){
  clockText.textContent=flightData.company.day;
  cashText.textContent=flightData.company.cash.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  repText.textContent=Math.round(flightData.company.reputation01*100)+"%";
 }
};