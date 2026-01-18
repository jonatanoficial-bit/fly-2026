document.addEventListener("DOMContentLoaded", () => {
  // === CONFIG ===
  const ADMIN_PASSWORD = "admin123"; // troque aqui se quiser

  const loginSection = document.getElementById("loginSection");
  const panelSection = document.getElementById("panelSection");
  const adminPass = document.getElementById("adminPass");
  const loginBtn = document.getElementById("loginBtn");
  const loginMsg = document.getElementById("loginMsg");

  const tabArea = document.getElementById("tabArea");
  const tabButtons = document.querySelectorAll(".tab[data-tab]");

  let activeTab = "catalog";

  // ===== Helpers =====
  function ensureStore() {
    if (!window.FlySimStore || !window.flightData) {
      // Se o admin abrir direto sem carregar data.js do jogo,
      // criamos o mínimo necessário para editar o localStorage.
      const STORAGE_KEY = "flysim_save_v1";

      function uid(prefix) {
        return `${prefix}-${Math.random().toString(16).slice(2, 8)}${Date.now()
          .toString(16)
          .slice(-4)}`.toUpperCase();
      }

      function load() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) throw new Error("Sem save");
          return JSON.parse(raw);
        } catch {
          // fallback mínimo (se ainda não existe save)
          return {
            meta: { version: 1 },
            company: { name: "Fly-202", cash: 10000000, fuel: 50000, co2Credits: 1000, reputation: 50 },
            airports: [],
            aircraftCatalog: [],
            fleet: [],
            staff: [],
            candidates: [],
            routes: [],
            flights: [],
            missions: []
          };
        }
      }

      function save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }

      window.FlySimStore = { STORAGE_KEY, uid, load, save };
      window.flightData = load();
    }
  }

  function saveAndReloadState() {
    FlySimStore.save(window.flightData);
    // recarrega do storage para garantir consistência
    window.flightData = FlySimStore.load();
  }

  function money(n) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  }

  function setTab(tab) {
    activeTab = tab;
    tabButtons.forEach((b) => b.classList.remove("active"));
    document.querySelector(`.tab[data-tab="${tab}"]`)?.classList.add("active");
    render();
  }

  function render() {
    const d = window.flightData;

    if (activeTab === "catalog") {
      tabArea.innerHTML = `
        <h3>Catálogo de Aeronaves</h3>
        <p class="muted">Aqui você adiciona modelos disponíveis para comprar na aba Frota.</p>

        <div class="card mini">
          <h4>Adicionar Modelo</h4>
          <div class="grid">
            <label>ID do Modelo (ex: CAT-A321)</label>
            <input id="m_id" placeholder="CAT-A321" />
            <label>Nome</label>
            <input id="m_name" placeholder="A321 (Genérico)" />
            <label>Fabricante</label>
            <input id="m_manu" placeholder="Airbus" />
            <label>Assentos</label>
            <input id="m_seats" type="number" value="180" />
            <label>Alcance (km)</label>
            <input id="m_range" type="number" value="6000" />
            <label>Cruzeiro (kts)</label>
            <input id="m_kts" type="number" value="450" />
            <label>Preço</label>
            <input id="m_price" type="number" value="450000000" />
            <label>Consumo (comb/km)</label>
            <input id="m_burn" type="number" step="0.1" value="2.4" />
            <button id="addModelBtn" class="btn">Adicionar</button>
          </div>
        </div>

        <div class="card mini">
          <h4>Modelos atuais</h4>
          ${(!d.aircraftCatalog || d.aircraftCatalog.length === 0)
            ? `<div class="muted">Nenhum modelo cadastrado.</div>`
            : `
              <div class="list">
                ${d.aircraftCatalog.map(m => `
                  <div class="row">
                    <div>
                      <b>${m.modelId}</b> — ${m.name} <span class="muted">(${m.manufacturer})</span><br/>
                      <span class="muted">${m.seats} assentos • ${m.rangeKm} km • ${m.cruiseKts} kts • ${money(m.price)}</span>
                    </div>
                    <button class="btn danger" data-del-model="${m.modelId}">Excluir</button>
                  </div>
                `).join("")}
              </div>
            `
          }
        </div>
      `;

      document.getElementById("addModelBtn").onclick = () => {
        const modelId = document.getElementById("m_id").value.trim();
        const name = document.getElementById("m_name").value.trim();
        const manufacturer = document.getElementById("m_manu").value.trim();
        const seats = Number(document.getElementById("m_seats").value || 0);
        const rangeKm = Number(document.getElementById("m_range").value || 0);
        const cruiseKts = Number(document.getElementById("m_kts").value || 0);
        const price = Number(document.getElementById("m_price").value || 0);
        const fuelBurnPerKm = Number(document.getElementById("m_burn").value || 0);

        if (!modelId || !name) return alert("Preencha pelo menos ID e Nome.");
        if (d.aircraftCatalog.some(x => x.modelId === modelId)) return alert("Já existe um modelo com esse ID.");

        d.aircraftCatalog.push({ modelId, name, manufacturer, seats, rangeKm, cruiseKts, price, fuelBurnPerKm });
        saveAndReloadState();
        render();
      };

      tabArea.querySelectorAll("[data-del-model]").forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute("data-del-model");
          d.aircraftCatalog = d.aircraftCatalog.filter(x => x.modelId !== id);
          saveAndReloadState();
          render();
        };
      });

      return;
    }

    if (activeTab === "airports") {
      tabArea.innerHTML = `
        <h3>Aeroportos</h3>
        <p class="muted">Aparecem ao criar rotas no jogo.</p>

        <div class="card mini">
          <h4>Adicionar Aeroporto</h4>
          <div class="grid">
            <label>Código (ex: REC)</label>
            <input id="a_code" placeholder="REC" />
            <label>Cidade</label>
            <input id="a_city" placeholder="Recife" />
            <label>Latitude</label>
            <input id="a_lat" type="number" step="0.0001" placeholder="-8.1265" />
            <label>Longitude</label>
            <input id="a_lon" type="number" step="0.0001" placeholder="-34.9236" />
            <button id="addAirportBtn" class="btn">Adicionar</button>
          </div>
        </div>

        <div class="card mini">
          <h4>Aeroportos atuais</h4>
          ${(!d.airports || d.airports.length === 0)
            ? `<div class="muted">Nenhum aeroporto cadastrado.</div>`
            : `
              <div class="list">
                ${d.airports.map(a => `
                  <div class="row">
                    <div><b>${a.code}</b> — ${a.city}<br/>
                      <span class="muted">${a.lat}, ${a.lon}</span>
                    </div>
                    <button class="btn danger" data-del-airport="${a.code}">Excluir</button>
                  </div>
                `).join("")}
              </div>
            `
          }
        </div>
      `;

      document.getElementById("addAirportBtn").onclick = () => {
        const code = document.getElementById("a_code").value.trim().toUpperCase();
        const city = document.getElementById("a_city").value.trim();
        const lat = Number(document.getElementById("a_lat").value);
        const lon = Number(document.getElementById("a_lon").value);

        if (!code || !city) return alert("Preencha código e cidade.");
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return alert("Lat/Lon inválidos.");
        if (d.airports.some(x => x.code === code)) return alert("Já existe aeroporto com esse código.");

        d.airports.push({ code, city, lat, lon });
        saveAndReloadState();
        render();
      };

      tabArea.querySelectorAll("[data-del-airport]").forEach(btn => {
        btn.onclick = () => {
          const code = btn.getAttribute("data-del-airport");
          d.airports = d.airports.filter(x => x.code !== code);
          saveAndReloadState();
          render();
        };
      });

      return;
    }

    if (activeTab === "candidates") {
      tabArea.innerHTML = `
        <h3>Candidatos (Contratação)</h3>
        <p class="muted">Esses candidatos aparecem na aba Equipe para contratar.</p>

        <div class="card mini">
          <h4>Adicionar Candidato</h4>
          <div class="grid">
            <label>Nome</label>
            <input id="c_name" placeholder="Fernanda" />
            <label>Função</label>
            <select id="c_role">
              <option>Piloto</option>
              <option>Mecânico</option>
              <option>Comissário</option>
            </select>
            <label>Salário</label>
            <input id="c_salary" type="number" value="9000" />
            <label>Moral (0-100)</label>
            <input id="c_morale" type="number" value="75" min="0" max="100" />
            <button id="addCandidateBtn" class="btn">Adicionar</button>
          </div>
        </div>

        <div class="card mini">
          <h4>Lista</h4>
          ${(!d.candidates || d.candidates.length === 0)
            ? `<div class="muted">Nenhum candidato cadastrado.</div>`
            : `
              <div class="list">
                ${d.candidates.map(c => `
                  <div class="row">
                    <div>
                      <b>${c.name}</b> — ${c.role}<br/>
                      <span class="muted">Salário: ${money(c.salary)} • Moral: ${c.morale}%</span>
                    </div>
                    <button class="btn danger" data-del-cand="${c.id}">Excluir</button>
                  </div>
                `).join("")}
              </div>
            `
          }
        </div>
      `;

      document.getElementById("addCandidateBtn").onclick = () => {
        const name = document.getElementById("c_name").value.trim();
        const role = document.getElementById("c_role").value;
        const salary = Number(document.getElementById("c_salary").value || 0);
        const morale = Number(document.getElementById("c_morale").value || 0);

        if (!name) return alert("Nome obrigatório.");

        const id = FlySimStore.uid("C");
        d.candidates.push({ id, name, role, salary, morale });
        saveAndReloadState();
        render();
      };

      tabArea.querySelectorAll("[data-del-cand]").forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute("data-del-cand");
          d.candidates = d.candidates.filter(x => x.id !== id);
          saveAndReloadState();
          render();
        };
      });

      return;
    }

    if (activeTab === "missions") {
      tabArea.innerHTML = `
        <h3>Missões</h3>
        <div class="card mini">
          <h4>Adicionar Missão</h4>
          <div class="grid">
            <label>Título</label>
            <input id="ms_title" placeholder="Operação Noturna" />
            <label>Dificuldade</label>
            <select id="ms_diff">
              <option>Baixa</option>
              <option>Média</option>
              <option>Alta</option>
            </select>
            <label>Recompensa</label>
            <input id="ms_reward" type="number" value="150000" />
            <label>Descrição</label>
            <input id="ms_desc" placeholder="Complete um voo sob condições difíceis." />
            <button id="addMissionBtn" class="btn">Adicionar</button>
          </div>
        </div>

        <div class="card mini">
          <h4>Lista</h4>
          ${(!d.missions || d.missions.length === 0)
            ? `<div class="muted">Nenhuma missão cadastrada.</div>`
            : `
              <div class="list">
                ${d.missions.map(m => `
                  <div class="row">
                    <div>
                      <b>${m.title}</b> — ${m.difficulty}<br/>
                      <span class="muted">${m.description} • ${money(m.reward)}</span>
                    </div>
                    <button class="btn danger" data-del-ms="${m.id}">Excluir</button>
                  </div>
                `).join("")}
              </div>
            `
          }
        </div>
      `;

      document.getElementById("addMissionBtn").onclick = () => {
        const title = document.getElementById("ms_title").value.trim();
        const difficulty = document.getElementById("ms_diff").value;
        const reward = Number(document.getElementById("ms_reward").value || 0);
        const description = document.getElementById("ms_desc").value.trim();

        if (!title) return alert("Título obrigatório.");
        const id = FlySimStore.uid("MS");
        d.missions.push({ id, title, difficulty, reward, description });
        saveAndReloadState();
        render();
      };

      tabArea.querySelectorAll("[data-del-ms]").forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute("data-del-ms");
          d.missions = d.missions.filter(x => x.id !== id);
          saveAndReloadState();
          render();
        };
      });

      return;
    }
  }

  // ===== Login =====
  ensureStore();

  loginBtn.addEventListener("click", () => {
    const pass = adminPass.value;
    if (pass === ADMIN_PASSWORD) {
      loginSection.classList.add("hidden");
      panelSection.classList.remove("hidden");
      loginMsg.textContent = "";
      setTab("catalog");
    } else {
      loginMsg.textContent = "Senha incorreta.";
    }
  });

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });
});