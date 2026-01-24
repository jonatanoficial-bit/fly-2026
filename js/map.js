
window.MapModule={
 init(){
  const map=L.map("map").setView([-14,-51],4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
 }
};