# IOT-Funcionando 🌐

Sistema de Gerenciamento IoT para Dispositivos ESP32 com Comunicação MQTT

**Trabalho 2 da disciplina de Internet das Coisas - DLSC808**

## 📋 Descrição

Sistema web completo para gerenciar e monitorar dispositivos ESP32 com sensores conectados. A aplicação permite:

- ✅ Gerenciamento de dispositivos ESP32
- 📊 Visualização de dados de sensores em tempo real
- 💾 Armazenamento de dados históricos
- ⚡ Automação de rotinas baseadas em leituras de sensores
- 🔄 Comunicação via protocolo MQTT
- 📱 Interface web responsiva e intuitiva

## 🏗️ Arquitetura

### Backend
- **Node.js** com Express
- **MQTT Client** para comunicação com ESP32
- **SQLite** para armazenamento de dados
- **REST API** para interface web

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Design responsivo
- Atualização automática dos dados

### Protocolo de Comunicação
- **MQTT** (Message Queuing Telemetry Transport)
- Broker padrão: test.mosquitto.org
- Tópicos:
  - `iot-funcionando/{device_id}/data` - Envio de dados dos sensores
  - `iot-funcionando/{device_id}/status` - Status do dispositivo
  - `iot-funcionando/{device_id}/command` - Recebimento de comandos

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js (v14 ou superior)
- npm (gerenciador de pacotes do Node.js)

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/TiagoSteffler/IOT-Funcionando.git
cd IOT-Funcionando
```

2. **Instale as dependências**
```bash
npm install
```

3. **Inicie o servidor**
```bash
npm start
```

4. **Acesse a interface web**
```
http://localhost:3000
```

## 📡 Configuração do ESP32

### Bibliotecas Necessárias
Instale via Arduino IDE (Sketch → Include Library → Manage Libraries):
- `PubSubClient` by Nick O'Leary
- `ArduinoJson` by Benoit Blanchon
- `WiFi` (incluída no ESP32)

### Código de Exemplo
Use o arquivo `esp32_example.ino` como base para seu projeto.

### Configuração Básica

1. **Configure suas credenciais WiFi**
```cpp
const char* ssid = "SEU_SSID_WIFI";
const char* password = "SUA_SENHA_WIFI";
```

2. **Defina um ID único para o dispositivo**
```cpp
const char* device_id = "ESP32_001";
```

3. **Compile e faça upload para o ESP32**

4. **Registre o dispositivo na interface web**
   - Acesse a aba "Adicionar Dispositivo"
   - Use o mesmo `device_id` configurado no ESP32

## 📊 Estrutura de Dados

### Mensagem JSON de Dados (ESP32 → Backend)
```json
{
  "temperature": 25.5,
  "humidity": 60.0,
  "pressure": 1013.2,
  "light": 450
}
```

### Comandos (Backend → ESP32)
Envie comandos como string simples:
- `LED_ON` - Liga o LED
- `LED_OFF` - Desliga o LED
- `REBOOT` - Reinicia o dispositivo
- Comandos personalizados conforme sua implementação

## 🔧 API REST

### Dispositivos

- `GET /api/devices` - Listar todos os dispositivos
- `GET /api/devices/:id` - Obter dispositivo específico
- `POST /api/devices` - Registrar novo dispositivo
- `PUT /api/devices/:id` - Atualizar dispositivo
- `DELETE /api/devices/:id` - Remover dispositivo

### Dados dos Sensores

- `GET /api/devices/:id/data` - Obter histórico de dados
- `GET /api/devices/:id/latest` - Obter últimas leituras

### Automações

- `GET /api/automations` - Listar automações
- `POST /api/automations` - Criar automação
- `PUT /api/automations/:id/toggle` - Ativar/desativar automação
- `DELETE /api/automations/:id` - Remover automação

### Comandos

- `POST /api/devices/:id/command` - Enviar comando ao dispositivo

### Estatísticas

- `GET /api/stats` - Obter estatísticas do dashboard

## ⚡ Automações

As automações permitem executar ações automaticamente baseadas em condições dos sensores.

### Exemplo de Automação
- **Condição**: Temperatura > 30°C
- **Ação**: Enviar comando `FAN_ON` para ligar ventilador

### Criando uma Automação

1. Acesse a aba "Automações"
2. Clique em "Nova Automação"
3. Preencha os campos:
   - Nome da automação
   - Dispositivo
   - Tipo de sensor
   - Condição (maior que, menor que, igual a)
   - Valor limite
   - Ação (comando a ser enviado)

## 📁 Estrutura do Projeto

```
IOT-Funcionando/
├── server.js              # Servidor backend principal
├── package.json           # Dependências do projeto
├── esp32_example.ino      # Código exemplo para ESP32
├── database/              # Banco de dados SQLite
│   └── iot.db            # (criado automaticamente)
├── public/                # Arquivos da interface web
│   ├── index.html        # Página principal
│   ├── css/
│   │   └── style.css     # Estilos da aplicação
│   └── js/
│       └── app.js        # Lógica do frontend
└── README.md             # Este arquivo
```

## 💾 Banco de Dados

O sistema utiliza SQLite com as seguintes tabelas:

### devices
- Armazena informações dos dispositivos ESP32 registrados

### sensor_data
- Armazena todas as leituras dos sensores

### automations
- Armazena as regras de automação configuradas

## 🔒 Segurança

⚠️ **Nota**: Esta é uma aplicação educacional. Para uso em produção, considere:
- Autenticação de usuários
- Criptografia TLS/SSL para MQTT
- Validação adicional de dados
- Rate limiting para a API
- Broker MQTT privado e seguro

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js, Express.js
- **MQTT**: mqtt.js
- **Banco de Dados**: SQLite3
- **Frontend**: HTML5, CSS3, JavaScript
- **Hardware**: ESP32

## 📝 Exemplos de Sensores Compatíveis

- **DHT22**: Temperatura e umidade
- **BME280**: Temperatura, umidade e pressão
- **BMP180**: Temperatura e pressão
- **LDR**: Sensor de luz (fotoresistor)
- **DS18B20**: Sensor de temperatura à prova d'água
- **MQ-2**: Sensor de gás
- **HC-SR04**: Sensor ultrassônico de distância

## 🐛 Troubleshooting

### ESP32 não conecta ao MQTT
- Verifique as credenciais WiFi
- Confirme que o broker MQTT está acessível
- Verifique a configuração do device_id

### Dispositivo aparece como offline
- Verifique a conexão WiFi do ESP32
- Confirme que o dispositivo está enviando dados
- Verifique os logs no Serial Monitor

### Dados não aparecem na interface
- Confirme que o device_id é o mesmo no ESP32 e no registro
- Verifique o formato JSON dos dados enviados
- Atualize a página ou use o botão "Atualizar"

## 📚 Recursos Adicionais

- [Documentação do ESP32](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
- [MQTT Protocol](https://mqtt.org/)
- [PubSubClient Library](https://pubsubclient.knolleary.net/)
- [ArduinoJson](https://arduinojson.org/)

## 👥 Contribuindo

Este é um projeto acadêmico. Sugestões e melhorias são bem-vindas!

## 📄 Licença

ISC License - Projeto educacional para a disciplina DLSC808

---

**Desenvolvido para a disciplina de Internet das Coisas - DLSC808**
