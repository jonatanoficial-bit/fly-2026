/**
 * Módulo de interface de usuário responsável por gerenciar o painel lateral,
 * tabs e interações gerais.  Ele se comunica com MapModule e GameModule
 * conforme necessário.
 */

const UIModule = (function () {
    let sidePanelVisible = false;
    let currentTab = 'overview';

    function init() {
        const menuBtn = document.getElementById('menuBtn');
        const sidePanel = document.getElementById('sidePanel');
        const overviewTab = document.getElementById('overviewTab');
        const flightsTab = document.getElementById('flightsTab');
        const staffTab = document.getElementById('staffTab');
        const missionsTab = document.getElementById('missionsTab');
        const tabContent = document.getElementById('tabContent');

        // Toggle do menu
        menuBtn.addEventListener('click', () => {
            sidePanelVisible = !sidePanelVisible;
            sidePanel.classList.toggle('visible', sidePanelVisible);
        });

        // Navegação entre tabs
        overviewTab.addEventListener('click', (e) => { e.preventDefault(); switchTab('overview'); });
        flightsTab.addEventListener('click', (e) => { e.preventDefault(); switchTab('flights'); });
        staffTab.addEventListener('click', (e) => { e.preventDefault(); switchTab('staff'); });
        missionsTab.addEventListener('click', (e) => { e.preventDefault(); switchTab('missions'); });

        // Carrega conteúdo inicial
        renderTab('overview');
    }

    /**
     * Troca de tab e atualiza estilos.
     */
    function switchTab(tabName) {
        if (currentTab === tabName) return;
        currentTab = tabName;
        // Atualiza classes active
        document.querySelectorAll('.side-panel nav a').forEach(a => a.classList.remove('active'));
        if (tabName === 'overview') document.getElementById('overviewTab').classList.add('active');
        if (tabName === 'flights') document.getElementById('flightsTab').classList.add('active');
        if (tabName === 'staff') document.getElementById('staffTab').classList.add('active');
        if (tabName === 'missions') document.getElementById('missionsTab').classList.add('active');
        renderTab(tabName);
    }

    /**
     * Renderiza o conteúdo para cada tab.
     */
    function renderTab(tabName) {
        const content = document.getElementById('tabContent');
        if (!window.flightData) return;
        if (tabName === 'overview') {
            const company = window.flightData.company;
            content.innerHTML = `
                <h2>Visão Geral</h2>
                <p><strong>Caixa:</strong> $${company.cash.toLocaleString()}</p>
                <p><strong>Combustível:</strong> ${company.fuel.toLocaleString()} L</p>
                <p><strong>Créditos de CO₂:</strong> ${company.co2Credits.toLocaleString()}</p>
                <button class="btn" id="endFlightBtn" style="display:none;">Finalizar Voo</button>
            `;
            // Botão para finalizar voo aparece no modo 3D
            const endBtn = document.getElementById('endFlightBtn');
            endBtn.addEventListener('click', () => {
                if (window.GameModule && window.GameModule.endFlight) {
                    window.GameModule.endFlight();
                }
                endBtn.style.display = 'none';
            });
        }
        else if (tabName === 'flights') {
            let html = '<h2>Voos</h2><table><thead><tr><th>Número</th><th>Origem</th><th>Destino</th><th>Status</th><th>Ação</th></tr></thead><tbody>';
            window.flightData.flights.forEach(flight => {
                html += `<tr><td>${flight.flightNumber}</td><td>${flight.origin.code}</td><td>${flight.destination.code}</td><td>${flight.status}</td><td><button class="btn" data-flight="${flight.id}">Assistir</button></td></tr>`;
            });
            html += '</tbody></table>';
            content.innerHTML = html;
            // Ações para botões de assistir
            content.querySelectorAll('button[data-flight]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const flightId = parseInt(btn.getAttribute('data-flight'));
                    const flight = window.flightData.flights.find(f => f.id === flightId);
                    if (flight && window.GameModule && window.GameModule.startFlight) {
                        window.GameModule.startFlight(flight);
                        // Exibe botão de finalizar voo na visão geral
                        const endBtn = document.getElementById('endFlightBtn');
                        if (endBtn) endBtn.style.display = 'block';
                    }
                });
            });
        }
        else if (tabName === 'staff') {
            let html = '<h2>Funcionários</h2><table><thead><tr><th>Nome</th><th>Cargo</th><th>Salário</th><th>Felicidade</th></tr></thead><tbody>';
            window.flightData.staff.forEach(emp => {
                html += `<tr><td>${emp.name}</td><td>${emp.role}</td><td>$${emp.salary.toLocaleString()}</td><td>${Math.round(emp.happiness * 100)}%</td></tr>`;
            });
            html += '</tbody></table>';
            content.innerHTML = html;
        }
        else if (tabName === 'missions') {
            let html = '<h2>Missões</h2><table><thead><tr><th>Nome</th><th>Destino</th><th>Recompensa</th><th>Ação</th></tr></thead><tbody>';
            window.flightData.missions.forEach(mission => {
                html += `<tr><td>${mission.name}</td><td>${mission.destination}</td><td>$${mission.reward.toLocaleString()}</td><td><button class="btn" data-mission="${mission.id}">Aceitar</button></td></tr>`;
            });
            html += '</tbody></table>';
            content.innerHTML = html;
            // Eventos para aceitar missão
            content.querySelectorAll('button[data-mission]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const missionId = parseInt(btn.getAttribute('data-mission'));
                    alert(`Missão ${missionId} aceita! Implemente a lógica de missão aqui.`);
                });
            });
        }
    }

    return { init };
})();

// Inicializa a interface após o carregamento
document.addEventListener('DOMContentLoaded', () => {
    UIModule.init();
});