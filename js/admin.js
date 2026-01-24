/**
 * Lógica do painel de administração.  Permite ao usuário inserir uma senha
 * para acessar os formulários, adicionar novos modelos de aviões e novas
 * missões, e visualizar a lista atual de modelos e missões.
 */

document.addEventListener('DOMContentLoaded', () => {
    const ADMIN_PASSWORD = 'admin123'; // senha simples para demonstração
    const loginSection = document.getElementById('loginSection');
    const adminSection = document.getElementById('adminSection');
    const loginBtn = document.getElementById('loginBtn');
    const passwordInput = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');

    // Evento de login
    loginBtn.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASSWORD) {
            loginSection.style.display = 'none';
            adminSection.style.display = 'block';
            renderLists();
        } else {
            loginError.style.display = 'block';
        }
    });

    // Formulário de adicionar avião
    const planeForm = document.getElementById('planeForm');
    planeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('planeId').value.trim();
        const name = document.getElementById('planeName').value.trim();
        const range = parseInt(document.getElementById('planeRange').value);
        const capacity = parseInt(document.getElementById('planeCapacity').value);
        const speed = parseInt(document.getElementById('planeSpeed').value);
        const file = document.getElementById('planeFile').value.trim() || null;
        // Adiciona ao array de modelos
        const newModel = { id, name, range, capacity, speed, file };
        window.flightData.planeModels.push(newModel);
        saveToLocalStorage();
        planeForm.reset();
        renderLists();
        alert('Modelo adicionado com sucesso!');
    });

    // Formulário de adicionar missão
    const missionForm = document.getElementById('missionForm');
    missionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('missionId').value);
        const name = document.getElementById('missionName').value.trim();
        const description = document.getElementById('missionDesc').value.trim();
        const reward = parseInt(document.getElementById('missionReward').value);
        const origin = document.getElementById('missionOrigin').value.trim().toUpperCase();
        const dest = document.getElementById('missionDest').value.trim().toUpperCase();
        const planeRequired = document.getElementById('missionPlane').value.trim();
        const newMission = { id, name, description, reward, origin, destination: dest, planeRequired };
        window.flightData.missions.push(newMission);
        saveToLocalStorage();
        missionForm.reset();
        renderLists();
        alert('Missão adicionada com sucesso!');
    });

    /**
     * Renderiza listas de modelos e missões existentes.
     */
    function renderLists() {
        const planeList = document.getElementById('planeList');
        const missionList = document.getElementById('missionList');
        // Limpa listas
        planeList.innerHTML = '';
        missionList.innerHTML = '';
        // Popula modelos
        window.flightData.planeModels.forEach(model => {
            const li = document.createElement('li');
            li.textContent = `${model.id} – ${model.name} (Capacidade: ${model.capacity}, Alcance: ${model.range} km)`;
            planeList.appendChild(li);
        });
        // Popula missões
        window.flightData.missions.forEach(mission => {
            const li = document.createElement('li');
            li.textContent = `${mission.id} – ${mission.name} (${mission.origin}→${mission.destination}) – recompensa $${mission.reward.toLocaleString()}`;
            missionList.appendChild(li);
        });
    }

    /**
     * Salva dados no localStorage para persistência simples.
     */
    function saveToLocalStorage() {
        localStorage.setItem('flightData', JSON.stringify(window.flightData));
    }

    /**
     * Carrega dados do localStorage se existirem.
     */
    function loadFromLocalStorage() {
        const dataStr = localStorage.getItem('flightData');
        if (dataStr) {
            try {
                const data = JSON.parse(dataStr);
                Object.assign(window.flightData.company, data.company);
                window.flightData.flights = data.flights || window.flightData.flights;
                window.flightData.staff = data.staff || window.flightData.staff;
                window.flightData.missions = data.missions || window.flightData.missions;
                window.flightData.planeModels = data.planeModels || window.flightData.planeModels;
            } catch (err) {
                console.error('Erro ao carregar dados do localStorage', err);
            }
        }
    }

    // Carrega dados ao inicializar
    loadFromLocalStorage();
});