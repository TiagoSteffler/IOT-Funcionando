const express = require('express');
const mqtt = require('mqtt');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./database/iot.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      location TEXT,
      status TEXT DEFAULT 'offline',
      last_seen DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      sensor_type TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(device_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS automations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      device_id TEXT,
      sensor_type TEXT,
      condition TEXT,
      threshold REAL,
      action TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables initialized');
}

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org';
const MQTT_TOPIC_BASE = 'iot-funcionando';

const mqttClient = mqtt.connect(MQTT_BROKER, {
  clientId: 'iot-backend-' + Math.random().toString(16).substr(2, 8),
  clean: true,
  reconnectPeriod: 1000,
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker:', MQTT_BROKER);
  // Subscribe to all device topics
  mqttClient.subscribe(`${MQTT_TOPIC_BASE}/+/data`, (err) => {
    if (!err) {
      console.log(`Subscribed to topic: ${MQTT_TOPIC_BASE}/+/data`);
    }
  });
  mqttClient.subscribe(`${MQTT_TOPIC_BASE}/+/status`, (err) => {
    if (!err) {
      console.log(`Subscribed to topic: ${MQTT_TOPIC_BASE}/+/status`);
    }
  });
});

mqttClient.on('message', (topic, message) => {
  console.log('Received MQTT message:', topic, message.toString());
  
  try {
    const parts = topic.split('/');
    const deviceId = parts[1];
    const messageType = parts[2];
    
    if (messageType === 'data') {
      const data = JSON.parse(message.toString());
      handleSensorData(deviceId, data);
    } else if (messageType === 'status') {
      const status = message.toString();
      updateDeviceStatus(deviceId, status);
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

mqttClient.on('error', (error) => {
  console.error('MQTT connection error:', error);
});

// Handle incoming sensor data
function handleSensorData(deviceId, data) {
  // Update device last seen
  db.run(
    'UPDATE devices SET last_seen = CURRENT_TIMESTAMP, status = ? WHERE device_id = ?',
    ['online', deviceId]
  );

  // Store sensor data
  if (data.temperature !== undefined) {
    storeSensorReading(deviceId, 'temperature', data.temperature, '°C');
  }
  if (data.humidity !== undefined) {
    storeSensorReading(deviceId, 'humidity', data.humidity, '%');
  }
  if (data.pressure !== undefined) {
    storeSensorReading(deviceId, 'pressure', data.pressure, 'hPa');
  }
  if (data.light !== undefined) {
    storeSensorReading(deviceId, 'light', data.light, 'lux');
  }

  // Check automations
  checkAutomations(deviceId, data);
}

function storeSensorReading(deviceId, sensorType, value, unit) {
  db.run(
    'INSERT INTO sensor_data (device_id, sensor_type, value, unit) VALUES (?, ?, ?, ?)',
    [deviceId, sensorType, value, unit],
    (err) => {
      if (err) {
        console.error('Error storing sensor data:', err);
      }
    }
  );
}

function updateDeviceStatus(deviceId, status) {
  db.run(
    'UPDATE devices SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE device_id = ?',
    [status, deviceId]
  );
}

// Check and execute automations
function checkAutomations(deviceId, data) {
  db.all(
    'SELECT * FROM automations WHERE device_id = ? AND active = 1',
    [deviceId],
    (err, automations) => {
      if (err) {
        console.error('Error checking automations:', err);
        return;
      }

      automations.forEach(automation => {
        const sensorValue = data[automation.sensor_type];
        if (sensorValue !== undefined) {
          let shouldTrigger = false;

          switch (automation.condition) {
            case 'greater':
              shouldTrigger = sensorValue > automation.threshold;
              break;
            case 'less':
              shouldTrigger = sensorValue < automation.threshold;
              break;
            case 'equal':
              shouldTrigger = sensorValue === automation.threshold;
              break;
          }

          if (shouldTrigger) {
            executeAutomationAction(deviceId, automation);
          }
        }
      });
    }
  );
}

function executeAutomationAction(deviceId, automation) {
  console.log(`Executing automation: ${automation.name} for device ${deviceId}`);
  
  // Publish action command to device
  const topic = `${MQTT_TOPIC_BASE}/${deviceId}/command`;
  mqttClient.publish(topic, automation.action, { qos: 1 });
}

// REST API Endpoints

// Get all devices
app.get('/api/devices', (req, res) => {
  db.all('SELECT * FROM devices ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single device
app.get('/api/devices/:id', (req, res) => {
  db.get('SELECT * FROM devices WHERE device_id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json(row);
  });
});

// Register new device
app.post('/api/devices', (req, res) => {
  const { device_id, name, type, location } = req.body;
  
  if (!device_id || !name) {
    res.status(400).json({ error: 'device_id and name are required' });
    return;
  }

  db.run(
    'INSERT INTO devices (device_id, name, type, location, status) VALUES (?, ?, ?, ?, ?)',
    [device_id, name, type, location, 'offline'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, device_id, name, type, location });
    }
  );
});

// Update device
app.put('/api/devices/:id', (req, res) => {
  const { name, type, location } = req.body;
  
  db.run(
    'UPDATE devices SET name = ?, type = ?, location = ? WHERE device_id = ?',
    [name, type, location, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Device updated', changes: this.changes });
    }
  );
});

// Delete device
app.delete('/api/devices/:id', (req, res) => {
  db.run('DELETE FROM devices WHERE device_id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Device deleted', changes: this.changes });
  });
});

// Get sensor data for a device
app.get('/api/devices/:id/data', (req, res) => {
  const limit = req.query.limit || 100;
  
  db.all(
    'SELECT * FROM sensor_data WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?',
    [req.params.id, limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Get latest sensor readings for a device
app.get('/api/devices/:id/latest', (req, res) => {
  db.all(
    `SELECT sensor_type, value, unit, MAX(timestamp) as timestamp 
     FROM sensor_data 
     WHERE device_id = ? 
     GROUP BY sensor_type`,
    [req.params.id],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Get all automations
app.get('/api/automations', (req, res) => {
  db.all('SELECT * FROM automations ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create automation
app.post('/api/automations', (req, res) => {
  const { name, device_id, sensor_type, condition, threshold, action } = req.body;
  
  if (!name || !device_id || !sensor_type || !condition || threshold === undefined || !action) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  db.run(
    `INSERT INTO automations (name, device_id, sensor_type, condition, threshold, action) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, device_id, sensor_type, condition, threshold, action],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, device_id, sensor_type, condition, threshold, action });
    }
  );
});

// Toggle automation active status
app.put('/api/automations/:id/toggle', (req, res) => {
  db.run(
    'UPDATE automations SET active = NOT active WHERE id = ?',
    [req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Automation toggled', changes: this.changes });
    }
  );
});

// Delete automation
app.delete('/api/automations/:id', (req, res) => {
  db.run('DELETE FROM automations WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Automation deleted', changes: this.changes });
  });
});

// Send command to device via MQTT
app.post('/api/devices/:id/command', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    res.status(400).json({ error: 'Command is required' });
    return;
  }

  const topic = `${MQTT_TOPIC_BASE}/${req.params.id}/command`;
  mqttClient.publish(topic, command, { qos: 1 }, (err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to send command' });
      return;
    }
    res.json({ message: 'Command sent', topic, command });
  });
});

// Dashboard stats endpoint
app.get('/api/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as total FROM devices', (err, row) => {
    if (!err) stats.totalDevices = row.total;
    
    db.get('SELECT COUNT(*) as online FROM devices WHERE status = "online"', (err, row) => {
      if (!err) stats.onlineDevices = row.online;
      
      db.get('SELECT COUNT(*) as total FROM sensor_data', (err, row) => {
        if (!err) stats.totalReadings = row.total;
        
        db.get('SELECT COUNT(*) as active FROM automations WHERE active = 1', (err, row) => {
          if (!err) stats.activeAutomations = row.active;
          res.json(stats);
        });
      });
    });
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`IoT Backend server running on port ${PORT}`);
  console.log(`Web interface: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  mqttClient.end();
  db.close(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});
