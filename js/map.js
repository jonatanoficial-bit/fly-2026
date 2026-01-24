// js/map.js (Leaflet)
window.MapModule = (function(){
  let map=null;
  function init(){
    map = L.map("map", { zoomControl:true }).setView([-14, -51], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
  }
  function focusAirport(code){
    const d=window.flightData;
    const ap=d.airports.find(x=>x.code===code);
    if(!ap||!map) return;
    map.setView([ap.lat, ap.lon], 6, { animate:true });
  }
  return { init, focusAirport };
})();
