# 🚀 Guia Rápido - IOT-Funcionando

## Início Rápido em 5 Passos

### 1️⃣ Instalação

```bash
git clone https://github.com/TiagoSteffler/IOT-Funcionando.git
cd IOT-Funcionando
npm install
npm start
```

Acesse: http://localhost:3000

### 2️⃣ Registrar um Dispositivo

1. Acesse a interface web
2. Clique na aba "Adicionar Dispositivo"
3. Preencha:
   - **ID do Dispositivo**: `ESP32_001` (deve ser único)
   - **Nome**: `Sensor Sala Principal`
   - **Tipo**: `ESP32`
   - **Localização**: `Sala de Estar`
4. Clique em "Registrar Dispositivo"

### 3️⃣ Configurar o ESP32

#### Instalar Bibliotecas no Arduino IDE

1. Abra Arduino IDE
2. Vá em **Sketch** → **Include Library** → **Manage Libraries**
3. Instale:
   - `PubSubClient` by Nick O'Leary
   - `ArduinoJson` by Benoit Blanchon

#### Configurar o Código

1. Abra o arquivo `esp32_example.ino`
2. Modifique:

```cpp
const char* ssid = "SEU_WIFI";           // Seu WiFi
const char* password = "SUA_SENHA";      // Senha do WiFi
const char* device_id = "ESP32_001";     // Mesmo ID registrado na web
```

3. Compile e faça upload para o ESP32

### 4️⃣ Criar uma Automação

Exemplo: **Ligar LED quando temperatura > 30°C**

1. Acesse a aba "Automações"
2. Clique em "➕ Nova Automação"
3. Preencha:
   - **Nome**: `Alerta Temperatura Alta`
   - **Dispositivo**: `ESP32_001`
   - **Tipo de Sensor**: `Temperatura`
   - **Condição**: `Maior que`
   - **Valor Limite**: `30`
   - **Ação**: `LED_ON`
4. Clique em "Criar Automação"

### 5️⃣ Monitorar Dados

- O dashboard atualiza automaticamente a cada 10 segundos
- Clique em qualquer dispositivo para ver detalhes e leituras dos sensores
- Use o botão "🔄 Atualizar" para forçar atualização

## 📊 Formato de Dados do ESP32

O ESP32 deve enviar dados no seguinte formato JSON:

```json
{
  "temperature": 25.5,
  "humidity": 60.0,
  "pressure": 1013.2,
  "light": 450
}
```

**Tópico MQTT**: `iot-funcionando/ESP32_001/data`

## 🎮 Comandos Disponíveis

Você pode enviar comandos do backend para o ESP32:

- `LED_ON` - Liga o LED
- `LED_OFF` - Desliga o LED
- `REBOOT` - Reinicia o ESP32
- Comandos personalizados (implemente no código do ESP32)

### Como enviar comando:

1. Clique no dispositivo no dashboard
2. Clique em "📤 Enviar Comando"
3. Digite o comando
4. Pressione OK

## 🔌 Sensores Comuns para ESP32

### DHT22 (Temperatura e Umidade)
```cpp
#include <DHT.h>
DHT dht(PIN, DHT22);
float temp = dht.readTemperature();
float hum = dht.readHumidity();
```

### BME280 (Temperatura, Umidade e Pressão)
```cpp
#include <Adafruit_BME280.h>
Adafruit_BME280 bme;
float temp = bme.readTemperature();
float hum = bme.readHumidity();
float pressure = bme.readPressure() / 100.0F;
```

### LDR (Sensor de Luz)
```cpp
int ldrPin = 34;
int lightValue = analogRead(ldrPin);
int light = map(lightValue, 0, 4095, 0, 1000);
```

## 🐛 Solução de Problemas

### ESP32 não conecta ao MQTT
✅ Verifique se o WiFi está configurado corretamente
✅ Confirme que o broker MQTT está acessível
✅ Abra o Serial Monitor (115200 baud) para ver os logs

### Dispositivo aparece como "offline"
✅ Verifique se o ESP32 está ligado e conectado ao WiFi
✅ Confirme que o `device_id` é o mesmo no código e no registro
✅ Verifique os logs no Serial Monitor

### Dados não aparecem
✅ Confirme que o ESP32 está enviando dados (veja Serial Monitor)
✅ Verifique o formato JSON dos dados
✅ Clique em "🔄 Atualizar" no dashboard

### Automação não funciona
✅ Verifique se a automação está ativa (botão verde)
✅ Confirme que a condição está correta
✅ Certifique-se de que o ESP32 está recebendo comandos (Serial Monitor)

## 🌐 Estrutura de Tópicos MQTT

```
iot-funcionando/
├── {device_id}/
│   ├── data       → ESP32 publica dados dos sensores aqui
│   ├── status     → ESP32 publica status (online/offline)
│   └── command    → Backend publica comandos para o ESP32
```

## 📱 API REST

### Endpoints principais:

- `GET /api/devices` - Listar dispositivos
- `POST /api/devices` - Registrar dispositivo
- `GET /api/devices/:id/latest` - Últimas leituras
- `POST /api/devices/:id/command` - Enviar comando
- `GET /api/automations` - Listar automações
- `POST /api/automations` - Criar automação

Exemplo com curl:

```bash
# Registrar dispositivo
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32_002",
    "name": "Sensor Quarto",
    "type": "ESP32",
    "location": "Quarto"
  }'

# Enviar comando
curl -X POST http://localhost:3000/api/devices/ESP32_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "LED_ON"}'
```

## 🎓 Próximos Passos

1. **Adicione mais sensores** ao seu ESP32
2. **Crie automações complexas** baseadas em múltiplas condições
3. **Personalize a interface** modificando `public/css/style.css`
4. **Adicione notificações** quando automações são acionadas
5. **Configure um broker MQTT privado** para maior segurança

## 📚 Recursos Úteis

- [Documentação ESP32](https://docs.espressif.com/)
- [MQTT.org](https://mqtt.org/)
- [ArduinoJson](https://arduinojson.org/)
- [PubSubClient](https://pubsubclient.knolleary.net/)

---

**Dúvidas?** Consulte o README.md completo ou abra uma issue no GitHub!
