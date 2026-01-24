// js/bootstrap.js
(function(){
  const saved = window.FlySimStore?.load?.();
  if(saved && typeof saved === "object") window.flightData = saved;
  window.MapModule?.init?.();
  window.UIModule?.init?.();
  window.GameModule?.init?.();
})();
