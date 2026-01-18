// js/admin-firebase.js
import { FirebaseAPI, isAdmin } from "./firebase.js";

const loginSection = document.getElementById("loginSection");
const panelSection = document.getElementById("panelSection");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");
const logoutBtn = document.getElementById("logoutBtn");

const emailEl = document.getElementById("email");
const passEl = document.getElementById("pass");

const tabArea = document.getElementById("tabArea");
const tabButtons = document.querySelectorAll(".tab[data-tab]");
let activeTab = "catalog";

const DLC_DOC = FirebaseAPI.doc(FirebaseAPI.db, "public", "dlc");

function money(n) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

async function loadDLC() {
  const snap = await FirebaseAPI.getDoc(DLC_DOC);
  if (!snap.exists()) {
    // inicializa documento
    const empty = {
      aircraftCatalog: [],
      airports: [],
      candidates: [],
      missions: []
    };
    await FirebaseAPI.setDoc(DLC_DOC, empty);
    return empty;
  }
  return snap.data();
}

async function saveDLC(patch) {
  await FirebaseAPI.updateDoc(DLC_DOC, patch);
}

function setTab(tab) {
  activeTab = tab;
  tabButtons.forEach(b => b.classList.remove("active"));
  document.querySelector(`.tab[data-tab="${tab}"]`)?.classList.add("active");
  render();
}

let dlcCache = null;

async function render() {
  if (!dlcCache) dlcCache = await loadDLC();
  const d = dlcCache;

  if (activeTab === "catalog") {
    tabArea.innerHTML = `
      <h3>Catálogo de Aeronaves (DLC)</h3>
      <div class="card mini">
        <h4>Adicionar Modelo</h4>
        <div class="grid">
          <label>ID (ex: CAT-A321)</label>
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
        <h4>Modelos</h4>
        ${d.aircraftCatalog.length === 0 ? `<div class="muted">Sem modelos.</div>` : ""}
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
      </div>
    `;

    document.getElementById("addModelBtn").onclick = async () => {
      const modelId = document.getElementById("m_id").value.trim();
      const name = document.getElementById("m_name").value.trim();
      const manufacturer = document.getElementById("m_manu").value.trim();
      const seats = Number(document.getElementById("m_seats").value || 0);
      const rangeKm = Number(document.getElementById("m_range").value || 0);
      const cruiseKts = Number(document.getElementById("m_kts").value || 0);
      const price = Number(document.getElementById("m_price").value || 0);
      const fuelBurnPerKm = Number(document.getElementById("m_burn").value || 0);

      if (!modelId || !name) return alert("Preencha ID e Nome.");
      if (d.aircraftCatalog.some(x => x.modelId === modelId)) return alert("ID já existe.");

      d.aircraftCatalog.push({ modelId, name, manufacturer, seats, rangeKm, cruiseKts, price, fuelBurnPerKm });
      await saveDLC({ aircraftCatalog: d.aircraftCatalog });
      dlcCache = await loadDLC();
      render();
    };

    tabArea.querySelectorAll("[data-del-model]").forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute("data-del-model");
        d.aircraftCatalog = d.aircraftCatalog.filter(x => x.modelId !== id);
        await saveDLC({ aircraftCatalog: d.aircraftCatalog });
        dlcCache = await loadDLC();
        render();
      };
    });

    return;
  }

  if (activeTab === "airports") {
    tabArea.innerHTML = `
      <h3>Aeroportos (DLC)</h3>
      <div class="card mini">
        <h4>Adicionar</h4>
        <div class="grid">
          <label>Código</label>
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
        <h4>Lista</h4>
        ${d.airports.length === 0 ? `<div class="muted">Sem aeroportos.</div>` : ""}
        <div class="list">
          ${d.airports.map(a => `
            <div class="row">
              <div><b>${a.code}</b> — ${a.city}<br/><span class="muted">${a.lat}, ${a.lon}</span></div>
              <button class="btn danger" data-del-air="${a.code}">Excluir</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    document.getElementById("addAirportBtn").onclick = async () => {
      const code = document.getElementById("a_code").value.trim().toUpperCase();
      const city = document.getElementById("a_city").value.trim();
      const lat = Number(document.getElementById("a_lat").value);
      const lon = Number(document.getElementById("a_lon").value);

      if (!code || !city) return alert("Código e cidade obrigatórios.");
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return alert("Lat/Lon inválidos.");
      if (d.airports.some(x => x.code === code)) return alert("Código já existe.");

      d.airports.push({ code, city, lat, lon });
      await saveDLC({ airports: d.airports });
      dlcCache = await loadDLC();
      render();
    };

    tabArea.querySelectorAll("[data-del-air]").forEach(btn => {
      btn.onclick = async () => {
        const code = btn.getAttribute("data-del-air");
        d.airports = d.airports.filter(x => x.code !== code);
        await saveDLC({ airports: d.airports });
        dlcCache = await loadDLC();
        render();
      };
    });

    return;
  }

  if (activeTab === "candidates") {
    tabArea.innerHTML = `
      <h3>Candidatos (DLC)</h3>
      <div class="card mini">
        <h4>Adicionar</h4>
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
          <button id="addCandBtn" class="btn">Adicionar</button>
        </div>
      </div>

      <div class="card mini">
        <h4>Lista</h4>
        ${d.candidates.length === 0 ? `<div class="muted">Sem candidatos.</div>` : ""}
        <div class="list">
          ${d.candidates.map((c, idx) => `
            <div class="row">
              <div><b>${c.name}</b> — ${c.role}<br/><span class="muted">Salário: ${money(c.salary)} • Moral: ${c.morale}%</span></div>
              <button class="btn danger" data-del-cand="${idx}">Excluir</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    document.getElementById("addCandBtn").onclick = async () => {
      const name = document.getElementById("c_name").value.trim();
      const role = document.getElementById("c_role").value;
      const salary = Number(document.getElementById("c_salary").value || 0);
      const morale = Number(document.getElementById("c_morale").value || 0);
      if (!name) return alert("Nome obrigatório.");

      d.candidates.push({ name, role, salary, morale });
      await saveDLC({ candidates: d.candidates });
      dlcCache = await loadDLC();
      render();
    };

    tabArea.querySelectorAll("[data-del-cand]").forEach(btn => {
      btn.onclick = async () => {
        const idx = Number(btn.getAttribute("data-del-cand"));
        d.candidates.splice(idx, 1);
        await saveDLC({ candidates: d.candidates });
        dlcCache = await loadDLC();
        render();
      };
    });

    return;
  }

  if (activeTab === "missions") {
    tabArea.innerHTML = `
      <h3>Missões (DLC)</h3>
      <div class="card mini">
        <h4>Adicionar</h4>
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
          <button id="addMsBtn" class="btn">Adicionar</button>
        </div>
      </div>

      <div class="card mini">
        <h4>Lista</h4>
        ${d.missions.length === 0 ? `<div class="muted">Sem missões.</div>` : ""}
        <div class="list">
          ${d.missions.map((m, idx) => `
            <div class="row">
              <div><b>${m.title}</b> — ${m.difficulty}<br/><span class="muted">${m.description} • ${money(m.reward)}</span></div>
              <button class="btn danger" data-del-ms="${idx}">Excluir</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    document.getElementById("addMsBtn").onclick = async () => {
      const title = document.getElementById("ms_title").value.trim();
      const difficulty = document.getElementById("ms_diff").value;
      const reward = Number(document.getElementById("ms_reward").value || 0);
      const description = document.getElementById("ms_desc").value.trim();
      if (!title) return alert("Título obrigatório.");

      d.missions.push({ title, difficulty, reward, description });
      await saveDLC({ missions: d.missions });
      dlcCache = await loadDLC();
      render();
    };

    tabArea.querySelectorAll("[data-del-ms]").forEach(btn => {
      btn.onclick = async () => {
        const idx = Number(btn.getAttribute("data-del-ms"));
        d.missions.splice(idx, 1);
        await saveDLC({ missions: d.missions });
        dlcCache = await loadDLC();
        render();
      };
    });

    return;
  }
}

async function bootAdminUI(user) {
  if (!isAdmin(user)) {
    loginSection.classList.remove("hidden");
    panelSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    loginMsg.textContent = "Você não é admin.";
    return;
  }

  loginSection.classList.add("hidden");
  panelSection.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  dlcCache = await loadDLC();
  render();
}

FirebaseAPI.onAuthStateChanged(FirebaseAPI.auth, (user) => {
  bootAdminUI(user);
});

loginBtn.addEventListener("click", async () => {
  try {
    loginMsg.textContent = "";
    await FirebaseAPI.signInWithEmailAndPassword(
      FirebaseAPI.auth,
      emailEl.value.trim(),
      passEl.value
    );
  } catch (e) {
    console.error(e);
    loginMsg.textContent = "Falha no login. Verifique email/senha.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await FirebaseAPI.signOut(FirebaseAPI.auth);
});

// tabs
tabButtons.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));