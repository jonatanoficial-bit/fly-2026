// js/game.js (SUBSTITUA INTEIRO)
// Implementação mínima para não quebrar botões. (Você pode evoluir o 3D depois.)
window.GameModule = (function () {
  let flightView, flightCanvas, btnExitFlight, flightTitle;

  function initDom() {
    flightView = document.getElementById("flightView");
    flightCanvas = document.getElementById("flightCanvas");
    btnExitFlight = document.getElementById("btnExitFlight");
    flightTitle = document.getElementById("flightTitle");

    if (btnExitFlight) btnExitFlight.addEventListener("click", exitFlight);
  }

  function startFlight(flightId) {
    // Se ainda não tiver 3D pronto, só abre a tela e mostra o ID do voo
    if (!flightView) initDom();

    const f = (window.flightData?.flights || []).find(x => x.id === flightId);
    if (!f) {
      alert("Voo não encontrado.");
      return;
    }

    if (flightTitle) {
      flightTitle.textContent = `Modo Voo — ${f.flightNumber} (${f.origin.code} → ${f.destination.code})`;
    }

    if (flightView) flightView.classList.remove("hidden");

    // fallback simples: pinta o canvas
    if (flightCanvas) {
      const ctx = flightCanvas.getContext?.("2d");
      if (ctx) {
        const w = flightCanvas.width = window.innerWidth;
        const h = flightCanvas.height = window.innerHeight;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "white";
        ctx.font = "bold 20px system-ui";
        ctx.fillText("Modo Voo (placeholder)", 20, 50);
        ctx.font = "14px system-ui";
        ctx.fillText("Você pode evoluir para Three.js depois. Por enquanto o jogo não quebra.", 20, 80);
      }
    }
  }

  function exitFlight() {
    if (!flightView) initDom();
    if (flightView) flightView.classList.add("hidden");
  }

  return {
    startFlight,
    exitFlight
  };
})();