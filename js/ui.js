const UIModule = (function () {
  let sidePanel, backdrop, menuBtn, closePanel, tabContent;
  let activeTab = "overview";

  function init() {
    sidePanel = document.getElementById("sidePanel");
    backdrop = document.getElementById("backdrop");
    menuBtn = document.getElementById("menuBtn");
    closePanel = document.getElementById("closePanel");
    tabContent = document.getElementById("tabContent");

    menuBtn.addEventListener("click", openPanel);
    closePanel.addEventListener("click", closePanelFn);
    backdrop.addEventListener("click", closePanelFn);

    // Tabs
    document.querySelectorAll(".tab[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => selectTab(btn.dataset.tab));
    });

    // Render inicial
    renderTab(activeTab);
  }

  function openPanel() {
    sidePanel.classList.remove("hidden");
    backdrop.classList.remove("hidden");
    sidePanel.setAttribute("aria-hidden", "false");
  }

  function closePanelFn() {
    sidePanel.classList.add("hidden");
    backdrop.classList.add("hidden");
    sidePanel.setAttribute("aria-hidden", "true");
  }

  function selectTab(tab) {
    activeTab = tab;

    document.querySelectorAll(".tab[data-tab]").forEach((b) => b.classList.remove("active"));
    const current = document.querySelector(`.tab[data-tab="${tab}"]`);
    if (current) current.classList.add("active");

    renderTab(tab);
  }

  function money(n) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  }

  function renderTab(tab) {
    const data = window.flightData;

    if (tab === "overview") {
      tabContent.innerHTML = `
        <div class="card">
          <div class="cardTitle">${data.company.name}</div>
          <div class="row">
            <div><b>Caixa:</b> ${money(data.company.cash)}</div>
            <div><b>Combustível:</b> ${data.company.fuel.toLocaleString("pt-BR")} L</div>
            <div><b>CO₂:</b> ${data.company.co2Credits.toLocaleString("pt-BR")} créditos</div>
          </div>
          <p class="muted" style="margin-top:10px;">
            Base pronta para DLC/updates: novos aviões, missões, mapas e economia.
          </p>
        </div>
      `;
      return;
    }

    if (tab === "flights") {
      tabContent.innerHTML = `
        ${data.flights.map(f => `
          <div class="card">
            <div class="cardTitle">${f.flightNumber} — ${f.origin.code} → ${f.destination.code}</div>
            <div class="muted">${f.origin.city} → ${f.destination.city}</div>
            <div style="margin-top:8px;">
              <b>Status:</b> ${f.status}<br/>
              <b>Velocidade:</b> ${f.speedKts} kts<br/>
              <b>Altitude:</b> ${f.altitudeFt} ft
            </div>
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn" onclick="MapModule.focusFlight('${f.id}')">Ver no mapa</button>
              <button class="btn ghost" onclick="GameModule.startFlight('${f.id}')">Iniciar Voo (3D)</button>
            </div>
          </div>
        `).join("")}
      `;
      return;
    }

    if (tab === "staff") {
      tabContent.innerHTML = `
        ${data.staff.map(s => `
          <div class="card">
            <div class="cardTitle">${s.name} — ${s.role}</div>
            <div><b>Salário:</b> ${money(s.salary)}</div>
            <div><b>Moral:</b> ${s.morale}%</div>
          </div>
        `).join("")}
      `;
      return;
    }

    if (tab === "missions") {
      tabContent.innerHTML = `
        ${data.missions.map(m => `
          <div class="card">
            <div class="cardTitle">${m.title} (${m.difficulty})</div>
            <div class="muted">${m.description}</div>
            <div style="margin-top:8px;"><b>Recompensa:</b> ${money(m.reward)}</div>
            <div style="margin-top:10px;">
              <button class="btn" onclick="alert('Missão aceita: ${m.title}')">Aceitar</button>
            </div>
          </div>
        `).join("")}
      `;
      return;
    }

    tabContent.innerHTML = `<div class="card"><div class="muted">Em construção.</div></div>`;
  }

  // API pública
  return {
    init,
    openPanel,
    closePanel: closePanelFn,
    selectTab
  };
})();