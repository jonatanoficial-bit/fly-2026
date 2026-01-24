
window.GameModule={
 init(){
  setInterval(()=>{
   window.dispatchEvent(new Event("game-updated"));
  },1000);
 }
};