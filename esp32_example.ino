/*
 * ESP32 IoT Device Example
 * 
 * Este código exemplo demonstra como configurar um ESP32 para
 * enviar dados de sensores via MQTT para o backend IoT-Funcionando
 * 
 * Bibliotecas necessárias:
 * - WiFi (incluída no ESP32)
 * - PubSubClient (para MQTT)
 * - ArduinoJson (para criar mensagens JSON)
 * 
 * Instale via Arduino IDE: Sketch -> Include Library -> Manage Libraries
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Configurações WiFi
const char* ssid = "SEU_SSID_WIFI";
const char* password = "SUA_SENHA_WIFI";

// Configurações MQTT
const char* mqtt_server = "test.mosquitto.org";
const int mqtt_port = 1883;
const char* device_id = "ESP32_001"; // ID único do dispositivo

// Tópicos MQTT
String topic_data = "iot-funcionando/" + String(device_id) + "/data";
String topic_status = "iot-funcionando/" + String(device_id) + "/status";
String topic_command = "iot-funcionando/" + String(device_id) + "/command";

// Pinos dos sensores (ajuste conforme seu hardware)
#define TEMP_SENSOR_PIN 34  // Exemplo: sensor de temperatura analógico
#define LED_PIN 2           // LED integrado do ESP32

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
const long interval = 5000; // Enviar dados a cada 5 segundos

void setup() {
  Serial.begin(115200);
  
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Conectar ao WiFi
  setup_wifi();
  
  // Configurar MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Conectando ao WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi conectado!");
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensagem recebida no tópico: ");
  Serial.println(topic);
  
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("Comando: ");
  Serial.println(message);
  
  // Processar comandos
  if (message == "LED_ON") {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("LED ligado");
  } else if (message == "LED_OFF") {
    digitalWrite(LED_PIN, LOW);
    Serial.println("LED desligado");
  } else if (message == "REBOOT") {
    Serial.println("Reiniciando...");
    ESP.restart();
  }
}

void reconnect() {
  // Loop até reconectar
  while (!client.connected()) {
    Serial.print("Conectando ao MQTT...");
    
    // Criar ID de cliente único
    String clientId = "ESP32-" + String(device_id);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("Conectado!");
      
      // Publicar status online
      client.publish(topic_status.c_str(), "online");
      
      // Inscrever-se no tópico de comandos
      client.subscribe(topic_command.c_str());
      
    } else {
      Serial.print("Falhou, rc=");
      Serial.print(client.state());
      Serial.println(" Tentando novamente em 5 segundos");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;
    
    // Ler sensores (valores de exemplo - ajuste conforme seus sensores)
    float temperature = readTemperature();
    float humidity = readHumidity();
    float pressure = readPressure();
    int light = readLight();
    
    // Criar mensagem JSON
    StaticJsonDocument<200> doc;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["pressure"] = pressure;
    doc["light"] = light;
    
    char jsonBuffer[200];
    serializeJson(doc, jsonBuffer);
    
    // Publicar dados
    Serial.print("Publicando dados: ");
    Serial.println(jsonBuffer);
    client.publish(topic_data.c_str(), jsonBuffer);
  }
}

// Funções de leitura de sensores (exemplos - adapte para seus sensores)

float readTemperature() {
  // Exemplo: simular leitura de temperatura
  // Substitua por leitura real do seu sensor (DHT22, DS18B20, BME280, etc.)
  return 20.0 + random(0, 100) / 10.0;
}

float readHumidity() {
  // Exemplo: simular leitura de umidade
  // Substitua por leitura real do seu sensor (DHT22, BME280, etc.)
  return 50.0 + random(0, 200) / 10.0;
}

float readPressure() {
  // Exemplo: simular leitura de pressão
  // Substitua por leitura real do seu sensor (BME280, BMP180, etc.)
  return 1013.0 + random(-50, 50) / 10.0;
}

int readLight() {
  // Exemplo: ler sensor de luz analógico (LDR)
  // int reading = analogRead(TEMP_SENSOR_PIN);
  // return map(reading, 0, 4095, 0, 1000);
  
  // Simulação
  return random(100, 800);
}

/*
 * INSTRUÇÕES DE USO:
 * 
 * 1. Instale as bibliotecas necessárias no Arduino IDE:
 *    - PubSubClient by Nick O'Leary
 *    - ArduinoJson by Benoit Blanchon
 * 
 * 2. Configure suas credenciais WiFi no início do código
 * 
 * 3. Defina um device_id único para seu ESP32
 * 
 * 4. Ajuste os pinos dos sensores conforme seu hardware
 * 
 * 5. Implemente as funções de leitura de sensores reais
 * 
 * 6. Compile e faça upload para seu ESP32
 * 
 * 7. Abra o Serial Monitor (115200 baud) para ver os logs
 * 
 * 8. Registre o dispositivo na interface web usando o mesmo device_id
 * 
 * SENSORES COMUNS:
 * - DHT22: Temperatura e umidade
 * - BME280: Temperatura, umidade e pressão
 * - BMP180: Temperatura e pressão
 * - LDR: Sensor de luz (fotoresistor)
 * - DS18B20: Sensor de temperatura à prova d'água
 * 
 * COMANDOS MQTT:
 * O ESP32 escuta comandos no tópico: iot-funcionando/{device_id}/command
 * Comandos disponíveis neste exemplo:
 * - LED_ON: Liga o LED
 * - LED_OFF: Desliga o LED
 * - REBOOT: Reinicia o ESP32
 */
