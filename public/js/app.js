// API Base URL
const API_BASE = window.location.origin;

let currentDeviceId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadDevices();
    loadAutomations();
    
    // Auto-refresh every 10 seconds
    setInterval(() => {
        loadStats();
        if (document.getElementById('devices-tab').classList.contains('active')) {
            loadDevices();
        }
    }, 10000);
});

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Activate corresponding button
    event.target.classList.add('active');
    
    // Load data for the tab
    if (tabName === 'devices') {
        loadDevices();
    } else if (tabName === 'automations') {
        loadAutomations();
        loadDevicesForAutomation();
    }
}

// Load Dashboard Stats
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        const stats = await response.json();
        
        document.getElementById('total-devices').textContent = stats.totalDevices || 0;
        document.getElementById('online-devices').textContent = stats.onlineDevices || 0;
        document.getElementById('total-readings').textContent = stats.totalReadings || 0;
        document.getElementById('active-automations').textContent = stats.activeAutomations || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Devices
async function loadDevices() {
    try {
        const response = await fetch(`${API_BASE}/api/devices`);
        const devices = await response.json();
        
        const devicesList = document.getElementById('devices-list');
        
        if (devices.length === 0) {
            devicesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📱</div>
                    <p>Nenhum dispositivo registrado ainda</p>
                    <p>Use a aba "Adicionar Dispositivo" para registrar um novo ESP32</p>
                </div>
            `;
            return;
        }
        
        devicesList.innerHTML = devices.map(device => `
            <div class="device-card" onclick="showDeviceDetails('${device.device_id}')">
                <div class="device-header">
                    <div class="device-name">${device.name}</div>
                    <span class="device-status ${device.status}">${device.status}</span>
                </div>
                <div class="device-info">
                    <strong>ID:</strong> ${device.device_id}
                </div>
                ${device.type ? `<div class="device-info"><strong>Tipo:</strong> ${device.type}</div>` : ''}
                ${device.location ? `<div class="device-info"><strong>Local:</strong> ${device.location}</div>` : ''}
                ${device.last_seen ? `<div class="device-info"><strong>Última conexão:</strong> ${formatDateTime(device.last_seen)}</div>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading devices:', error);
    }
}

// Show Device Details
async function showDeviceDetails(deviceId) {
    currentDeviceId = deviceId;
    
    try {
        const [deviceResponse, latestResponse] = await Promise.all([
            fetch(`${API_BASE}/api/devices/${deviceId}`),
            fetch(`${API_BASE}/api/devices/${deviceId}/latest`)
        ]);
        
        const device = await deviceResponse.json();
        const latestData = await latestResponse.json();
        
        const modal = document.getElementById('device-modal');
        document.getElementById('modal-device-name').textContent = device.name;
        
        let detailsHtml = `
            <div class="device-info">
                <p><strong>ID:</strong> ${device.device_id}</p>
                <p><strong>Tipo:</strong> ${device.type || 'N/A'}</p>
                <p><strong>Local:</strong> ${device.location || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="device-status ${device.status}">${device.status}</span></p>
                <p><strong>Última conexão:</strong> ${device.last_seen ? formatDateTime(device.last_seen) : 'Nunca'}</p>
            </div>
        `;
        
        document.getElementById('modal-device-details').innerHTML = detailsHtml;
        
        if (latestData.length > 0) {
            const sensorHtml = `
                <h3 style="margin-top: 20px; margin-bottom: 15px;">Últimas Leituras dos Sensores</h3>
                <div class="sensor-data-grid">
                    ${latestData.map(sensor => `
                        <div class="sensor-card">
                            <div class="sensor-type">${getSensorLabel(sensor.sensor_type)}</div>
                            <div class="sensor-value">${sensor.value.toFixed(1)}<span class="sensor-unit"> ${sensor.unit}</span></div>
                            <div style="font-size: 0.8em; color: #999; margin-top: 5px;">${formatDateTime(sensor.timestamp)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            document.getElementById('modal-sensor-data').innerHTML = sensorHtml;
        } else {
            document.getElementById('modal-sensor-data').innerHTML = '<p style="margin-top: 20px; color: #666;">Nenhum dado de sensor disponível</p>';
        }
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading device details:', error);
        alert('Erro ao carregar detalhes do dispositivo');
    }
}

function closeDeviceModal() {
    document.getElementById('device-modal').classList.remove('active');
    currentDeviceId = null;
}

// Send command to device
function sendDeviceCommand() {
    const command = prompt('Digite o comando para enviar ao dispositivo:');
    
    if (!command) return;
    
    fetch(`${API_BASE}/api/devices/${currentDeviceId}/command`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command })
    })
    .then(response => response.json())
    .then(data => {
        alert('Comando enviado com sucesso!');
    })
    .catch(error => {
        console.error('Error sending command:', error);
        alert('Erro ao enviar comando');
    });
}

// Register new device
async function registerDevice(event) {
    event.preventDefault();
    
    const deviceData = {
        device_id: document.getElementById('device-id').value,
        name: document.getElementById('device-name').value,
        type: document.getElementById('device-type').value,
        location: document.getElementById('device-location').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/devices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deviceData)
        });
        
        if (response.ok) {
            alert('Dispositivo registrado com sucesso!');
            event.target.reset();
            loadDevices();
            loadStats();
        } else {
            const error = await response.json();
            alert('Erro ao registrar dispositivo: ' + error.error);
        }
    } catch (error) {
        console.error('Error registering device:', error);
        alert('Erro ao registrar dispositivo');
    }
}

// Load Automations
async function loadAutomations() {
    try {
        const response = await fetch(`${API_BASE}/api/automations`);
        const automations = await response.json();
        
        const automationsList = document.getElementById('automations-list');
        
        if (automations.length === 0) {
            automationsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚡</div>
                    <p>Nenhuma automação criada ainda</p>
                    <p>Crie automações para executar ações baseadas em dados dos sensores</p>
                </div>
            `;
            return;
        }
        
        automationsList.innerHTML = automations.map(auto => `
            <div class="automation-card ${auto.active ? '' : 'inactive'}">
                <div class="automation-info">
                    <div class="automation-name">${auto.name}</div>
                    <div class="automation-details">
                        <strong>Dispositivo:</strong> ${auto.device_id} | 
                        <strong>Sensor:</strong> ${getSensorLabel(auto.sensor_type)} | 
                        <strong>Condição:</strong> ${getConditionLabel(auto.condition)} ${auto.threshold} | 
                        <strong>Ação:</strong> ${auto.action}
                    </div>
                </div>
                <div class="automation-actions">
                    <button class="btn btn-small ${auto.active ? 'btn-secondary' : 'btn-success'}" 
                            onclick="toggleAutomation(${auto.id})">
                        ${auto.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteAutomation(${auto.id})">
                        Excluir
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading automations:', error);
    }
}

// Load devices for automation dropdown
async function loadDevicesForAutomation() {
    try {
        const response = await fetch(`${API_BASE}/api/devices`);
        const devices = await response.json();
        
        const select = document.getElementById('auto-device');
        select.innerHTML = devices.map(device => 
            `<option value="${device.device_id}">${device.name} (${device.device_id})</option>`
        ).join('');
    } catch (error) {
        console.error('Error loading devices for automation:', error);
    }
}

// Show/Hide automation form
function showAddAutomation() {
    document.getElementById('add-automation-form').style.display = 'block';
}

function hideAddAutomation() {
    document.getElementById('add-automation-form').style.display = 'none';
}

// Create automation
async function createAutomation(event) {
    event.preventDefault();
    
    const automationData = {
        name: document.getElementById('auto-name').value,
        device_id: document.getElementById('auto-device').value,
        sensor_type: document.getElementById('auto-sensor').value,
        condition: document.getElementById('auto-condition').value,
        threshold: parseFloat(document.getElementById('auto-threshold').value),
        action: document.getElementById('auto-action').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/automations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(automationData)
        });
        
        if (response.ok) {
            alert('Automação criada com sucesso!');
            event.target.reset();
            hideAddAutomation();
            loadAutomations();
            loadStats();
        } else {
            const error = await response.json();
            alert('Erro ao criar automação: ' + error.error);
        }
    } catch (error) {
        console.error('Error creating automation:', error);
        alert('Erro ao criar automação');
    }
}

// Toggle automation
async function toggleAutomation(id) {
    try {
        const response = await fetch(`${API_BASE}/api/automations/${id}/toggle`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            loadAutomations();
            loadStats();
        }
    } catch (error) {
        console.error('Error toggling automation:', error);
    }
}

// Delete automation
async function deleteAutomation(id) {
    if (!confirm('Tem certeza que deseja excluir esta automação?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/automations/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadAutomations();
            loadStats();
        }
    } catch (error) {
        console.error('Error deleting automation:', error);
    }
}

// Refresh devices
function refreshDevices() {
    loadDevices();
    loadStats();
}

// Utility functions
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

function getSensorLabel(sensorType) {
    const labels = {
        temperature: 'Temperatura',
        humidity: 'Umidade',
        pressure: 'Pressão',
        light: 'Luminosidade'
    };
    return labels[sensorType] || sensorType;
}

function getConditionLabel(condition) {
    const labels = {
        greater: 'Maior que',
        less: 'Menor que',
        equal: 'Igual a'
    };
    return labels[condition] || condition;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('device-modal');
    if (event.target == modal) {
        closeDeviceModal();
    }
}
