// js/game.js (SUBSTITUA INTEIRO) — 2D only (sem 3D)
window.GameModule = (function () {
  function startFlight(flightId) {
    // Sem 3D: apenas foca o voo no mapa e abre painel
    if (window.MapModule?.focusFlight) window.MapModule.focusFlight(flightId);
    if (window.UIModule?.openPanel && window.UIModule?.selectTab) {
      window.UIModule.openPanel();
      window.UIModule.selectTab("flights");
    }
  }

  function exitFlight() {
    // não faz nada (3D removido)
  }

  return {
    startFlight,
    exitFlight
  };
})();