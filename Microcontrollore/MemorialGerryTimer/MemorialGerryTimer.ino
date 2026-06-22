#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <FastLED.h>
#include "secrets.h"

WiFiMulti wifiMulti;

// --- CONFIGURAZIONE HARDWARE ---
#define NUM_LEDS          130   // 4 display LED (28+28+35+35) + Colon (4) = 130 LED totali
#define DATA_PIN          16    // Pin dati per la striscia LED del display a 7 segmenti
#define BOARD_LED_PIN     48    // Pin dati per il LED RGB integrato nella board ESP32-S3
#define NUM_BOARD_LEDS    1     // Numero di LED di bordo

CRGB leds[NUM_LEDS];
CRGB boardLed[NUM_BOARD_LEDS];

// --- STATO DELLE ANIMAZIONI (NON BLOCCANTE) ---
enum LedState {
  STATE_IDLE,
  STATE_GOAL_HOME,
  STATE_GOAL_AWAY,
  STATE_START_MATCH,
  STATE_END_MATCH,
  STATE_TIMER,
  STATE_TIMER_PAUSED
};

LedState currentState = STATE_IDLE;
unsigned long stateStartTime = 0;
unsigned long lastAnimationUpdate = 0;

// --- STATO DELLA PARTITA LIVE ---
String liveMatchId = "";
int homeScore = 0;
int awayScore = 0;

// --- STATO DEL TIMER ---
int timerDuration = 9;
unsigned long timerStartMillis = 0;
int timerLastVal = -1;
unsigned long flashStartMillis = 0;
String timerColorStr = "RED";
String timerEffectStr = "SOLID";

// --- WEBSOCKET & TIMING & MULTI-CORE ---
WebSocketsClient webSocket;
unsigned long lastHeartbeat = 0;
int refCount = 2; // Contatore dei ref Phoenix (phx_join usa "1")
TaskHandle_t pingTaskHandle = NULL;

// Mappatura dei segmenti attivi per ciascuna cifra (0-9)
// I segmenti sono in ordine di cablaggio fisico sulla striscia:
// Indice 0: E (Basso Sinistra)
// Indice 1: D (Basso)
// Indice 2: C (Basso Destra)
// Indice 3: G (Centro)
// Indice 4: F (Alto Sinistra)
// Indice 5: A (Alto)
// Indice 6: B (Alto Destra)
const bool digitSegments[10][7] = {
  // E,     D,     C,     G,     F,     A,     B
  { true,  true,  true,  false, true,  true,  true  }, // Cifra 0
  { false, false, true,  false, false, false, true  }, // Cifra 1
  { true,  true,  false, true,  false, true,  true  }, // Cifra 2
  { false, true,  true,  true,  false, true,  true  }, // Cifra 3
  { false, false, true,  true,  true,  false, true  }, // Cifra 4
  { false, true,  true,  true,  true,  true,  false }, // Cifra 5
  { true,  true,  true,  true,  true,  true,  false }, // Cifra 6
  { false, false, true,  false, false, true,  true  }, // Cifra 7
  { true,  true,  true,  true,  true,  true,  true  }, // Cifra 8
  { false, true,  true,  true,  true,  true,  true  }  // Cifra 9
};

// Nomi descrittivi dei segmenti in base alla posizione fisica
const char* segmentNames[7] = {
  "E (Basso Sinistra)",
  "D (Basso)",
  "C (Basso Destra)",
  "G (Centro)",
  "F (Alto Sinistra)",
  "A (Alto)",
  "B (Alto Destra)"
};

// --- PROTOTIPI DELLE FUNZIONI ---
void checkLiveMatch();
void initWebSocket();
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);
void handleWebSocketMessage(uint8_t * payload, size_t length);
void joinRealtimeChannel();
void sendHeartbeat();
void sendDevicePing();
void updateLEDs();
void triggerGoalEffect(bool isHome);
void triggerStartMatchEffect();
void triggerEndMatchEffect();
CRGB getBaseColor(String colorStr);
CRGB getLedColor(String colorStr, String effectStr, int ledIndex, unsigned long nowMillis);
void setDigitSegment(int digitIndex, int segmentIndex, String colorStr, String effectStr, unsigned long nowMillis);
void setColon(String colorStr, String effectStr, unsigned long nowMillis);
void displayTime(int totalSeconds, String colorStr, String effectStr, unsigned long nowMillis);
void pingTask(void * pvParameters);

void setup() {
  Serial.begin(115200);
  
  // Aspetta fino a 5 secondi che il Serial Monitor venga aperto (fondamentale per USB CDC su ESP32-S3)
  unsigned long startSerial = millis();
  while (!Serial && (millis() - startSerial < 5000)) {
    delay(10);
  }
  
  Serial.println("\n=== Avvio Centralina Integrata Memorial Gerry (Con Timer) ===");

  // Inizializzazione FastLED (Striscia + LED di bordo)
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.addLeds<NEOPIXEL, BOARD_LED_PIN>(boardLed, NUM_BOARD_LEDS);
  
  // Limitatore di potenza per evitare cali di tensione e proteggere USB/ESP32
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 800);
  FastLED.setBrightness(120); 

  // Inizializzazione LED di bordo in giallo (attesa Wi-Fi)
  boardLed[0] = CRGB::Yellow;
  FastLED.show();

  // Connessione Wi-Fi con WiFiMulti
  Serial.println("Inizializzazione connessione Wi-Fi (WiFiMulti)...");
  wifiMulti.addAP(SECRET_SSID_1, SECRET_PASS_1);
  wifiMulti.addAP(SECRET_SSID_2, SECRET_PASS_2);
  wifiMulti.addAP(SECRET_SSID_3, SECRET_PASS_3);

  while (wifiMulti.run() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    static bool toggle = false;
    boardLed[0] = toggle ? CRGB::Yellow : CRGB::Black;
    FastLED.show();
    toggle = !toggle;
  }
  
  Serial.println("\n[Wi-Fi] Connesso con successo!");
  Serial.print("[Wi-Fi] Indirizzo IP: ");
  Serial.println(WiFi.localIP());

  // Attendi 1.5 secondi per stabilizzare il socket di rete
  delay(1500);

  // Arancione sul LED di bordo: Connesso a Wi-Fi, in attesa di Supabase
  boardLed[0] = CRGB::Orange; 
  FastLED.show();

  // Invia il primo ping di presenza immediatamente
  sendDevicePing();

  // Recupera lo stato iniziale del match dal database
  checkLiveMatch();

  // Inizializza e avvia la connessione WebSocket a Supabase
  initWebSocket();

  // Crea la task per il ping di presenza in background su Core 0
  xTaskCreatePinnedToCore(
    pingTask,
    "PingTask",
    10240, // Stack size (10KB) sicuro per client SSL
    NULL,
    1,     // Priorità bassa
    &pingTaskHandle,
    0      // Eseguito su Core 0
  );
}

void loop() {
  // Gestisce i pacchetti del WebSocket
  webSocket.loop();

  // Gestione attiva della connessione Wi-Fi in caso di perdite
  static unsigned long lastWiFiCheck = 0;
  if (millis() - lastWiFiCheck > 10000) {
    lastWiFiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[Wi-Fi] Connessione persa! Tentativo di riconnessione tramite WiFiMulti...");
      wifiMulti.run();
    }
  }

  // Heartbeat per il protocollo Phoenix (ogni 30 secondi)
  unsigned long now = millis();
  if (now - lastHeartbeat >= 30000) {
    lastHeartbeat = now;
    sendHeartbeat();
  }


  // Gestione ed esecuzione dell'effetto LED attivo (non bloccante)
  updateLEDs();
}

// Interroga Supabase REST API per verificare se c'è un match LIVE attivo
void checkLiveMatch() {
  WiFiClientSecure client;
  client.setInsecure(); 
  client.setTimeout(5); // 5 secondi timeout socket
  
  HTTPClient http;
  http.setTimeout(5000); // 5 secondi timeout HTTP
  String url = "https://" + String(SECRET_SUPABASE_HOST) + "/rest/v1/matches?status=eq.LIVE&select=*";
  
  Serial.println("[HTTP] Verifica partite LIVE attive su Supabase...");
  if (http.begin(client, url)) {
    http.addHeader("apikey", SECRET_SUPABASE_ANON_KEY);
    http.addHeader("Authorization", "Bearer " + String(SECRET_SUPABASE_ANON_KEY));
    
    int httpCode = http.GET();
    Serial.printf("[HTTP] Codice risposta GET matches: %d\n", httpCode);
    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("[HTTP] Risposta ricevuta: " + payload);
      
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, payload);
      if (!error) {
        JsonArray arr = doc.as<JsonArray>();
        if (arr.size() > 0) {
          JsonObject match = arr[0].as<JsonObject>();
          liveMatchId = match["id"].as<String>();
          homeScore = match["home_score"].as<int>();
          awayScore = match["away_score"].as<int>();
          
          Serial.printf("[HTTP] Rilevata partita LIVE attiva! ID: %s | Punteggio: %d - %d\n", 
                        liveMatchId.c_str(), homeScore, awayScore);
          triggerStartMatchEffect();
        } else {
          liveMatchId = "";
          Serial.println("[HTTP] Nessun match attualmente in stato LIVE.");
        }
      } else {
        Serial.print("[HTTP] Errore parsing JSON iniziale: ");
        Serial.println(error.c_str());
      }
    } else {
      Serial.printf("[HTTP] Errore chiamata GET: %d\n", httpCode);
    }
    http.end();
  }
}

// Inizializza il client WebSocket configurando l'host, la porta e il path per Supabase Realtime
void initWebSocket() {
  String path = "/realtime/v1/websocket?apikey=" + String(SECRET_SUPABASE_ANON_KEY) + "&vsn=1.0.0";
  
  Serial.println("[WebSocket] Connessione a Supabase Realtime...");
  webSocket.beginSSL(SECRET_SUPABASE_HOST, 443, path.c_str());
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

// Gestione degli eventi di rete del WebSocket
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WebSocket] Disconnesso dal server.");
      break;
    case WStype_CONNECTED:
      Serial.println("[WebSocket] Connesso! Invio del join channel...");
      joinRealtimeChannel();
      break;
    case WStype_TEXT:
      handleWebSocketMessage(payload, length);
      break;
    case WStype_BIN:
    case WStype_ERROR:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
      break;
  }
}

// Invia il messaggio di Join sottoscrivendosi sia a 'matches' che a 'timer_control'
void joinRealtimeChannel() {
  // Sottoscrizione multipla a 'matches' (UPDATE) e 'timer_control' (UPDATE)
  String joinPayload = "{\"topic\":\"realtime:public\",\"event\":\"phx_join\",\"payload\":{\"config\":{\"postgres_changes\":["
                       "{\"event\":\"UPDATE\",\"schema\":\"public\",\"table\":\"matches\"},"
                       "{\"event\":\"UPDATE\",\"schema\":\"public\",\"table\":\"timer_control\"}"
                       "]},\"access_token\":\"" + String(SECRET_SUPABASE_ANON_KEY) + "\"},\"ref\":\"1\",\"join_ref\":\"1\"}";
  
  webSocket.sendTXT(joinPayload);
  Serial.println("[WebSocket] Sottoscrizione inviata per modifiche in tempo reale su 'matches' e 'timer_control'");
}

// Invia un heartbeat periodico per prevenire il timeout di connessione di Supabase
void sendHeartbeat() {
  if (webSocket.isConnected()) {
    String refStr = String(refCount++);
    String heartbeat = "{\"topic\":\"phoenix\",\"event\":\"heartbeat\",\"payload\":{},\"ref\":\"" + refStr + "\"}";
    webSocket.sendTXT(heartbeat);
    Serial.println("[WebSocket] Heartbeat inviato.");
  }
}

// Gestisce il parsing e il processamento dei messaggi ricevuti da Supabase
void handleWebSocketMessage(uint8_t * payload, size_t length) {
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.print("[WebSocket] Errore parsing JSON: ");
    Serial.println(error.c_str());
    return;
  }

  String event = doc["event"] | "";
  
  // DEBUG: Stampa il messaggio raw per diagnostica
  if (event != "phx_reply" && event != "heartbeat") {
    Serial.println("[WebSocket] === MESSAGGIO RAW ===");
    String rawMsg;
    serializeJson(doc, rawMsg);
    // Stampa i primi 500 caratteri per evitare overflow seriale
    if (rawMsg.length() > 500) {
      Serial.println(rawMsg.substring(0, 500) + "...(troncato)");
    } else {
      Serial.println(rawMsg);
    }
    Serial.println("[WebSocket] === FINE MESSAGGIO ===");
  }
  
  if (event == "postgres_changes") {
    JsonObject payloadObj = doc["payload"].as<JsonObject>();
    
    // Il protocollo Phoenix di Supabase annida i dati dentro payload.data
    // Controlliamo sia il livello diretto (payload.table) sia il nested (payload.data.table)
    JsonObject dataObj;
    if (payloadObj.containsKey("data") && payloadObj["data"].is<JsonObject>()) {
      dataObj = payloadObj["data"].as<JsonObject>();
    }
    
    // Estrai eventType: cerca prima nel livello diretto, poi in data
    String eventType = "";
    if (payloadObj.containsKey("eventType")) {
      eventType = payloadObj["eventType"].as<String>();
    } else if (payloadObj.containsKey("type")) {
      eventType = payloadObj["type"].as<String>();
    } else if (!dataObj.isNull()) {
      if (dataObj.containsKey("eventType")) {
        eventType = dataObj["eventType"].as<String>();
      } else if (dataObj.containsKey("type")) {
        eventType = dataObj["type"].as<String>();
      }
    }
    
    // Estrai table: cerca prima nel livello diretto, poi in data
    String table = payloadObj["table"] | "";
    if (table == "" && !dataObj.isNull()) {
      table = dataObj["table"] | "";
    }
    
    Serial.printf("[WebSocket] Evento rilevato: table='%s' eventType='%s'\n", table.c_str(), eventType.c_str());
    
    // --- GESTIONE AGGIORNAMENTI TABELLA MATCHES (GOL) ---
    if (table == "matches" && eventType == "UPDATE") {
      JsonObject record;
      // Cerca il record nei vari formati possibili di Supabase Realtime
      if (payloadObj.containsKey("new")) {
        record = payloadObj["new"].as<JsonObject>();
      } else if (payloadObj.containsKey("record")) {
        record = payloadObj["record"].as<JsonObject>();
      } else if (!dataObj.isNull() && dataObj.containsKey("record")) {
        record = dataObj["record"].as<JsonObject>();
      } else if (!dataObj.isNull() && dataObj.containsKey("new")) {
        record = dataObj["new"].as<JsonObject>();
      } else if (!dataObj.isNull()) {
        record = dataObj;
      }
      
      if (record.isNull()) return;
      
      String matchId = record["id"] | "";
      String status = record["status"] | "";
      
      if (liveMatchId == "" && status == "LIVE") {
        liveMatchId = matchId;
        homeScore = record["home_score"] | 0;
        awayScore = record["away_score"] | 0;
        Serial.printf("[WebSocket] Nuova partita LIVE avviata! ID: %s | Punteggio: %d - %d\n", 
                      liveMatchId.c_str(), homeScore, awayScore);
        triggerStartMatchEffect();
      } 
      else if (matchId == liveMatchId) {
        if (status != "LIVE") {
          Serial.println("[WebSocket] La partita tracciata è terminata.");
          liveMatchId = "";
          triggerEndMatchEffect();
        } 
        else {
          int newHomeScore = record["home_score"] | 0;
          int newAwayScore = record["away_score"] | 0;
          
          if (newHomeScore > homeScore) {
            Serial.printf("[WebSocket] GOL CASA! Punteggio: %d - %d\n", newHomeScore, newAwayScore);
            triggerGoalEffect(true);
          } else if (newAwayScore > awayScore) {
            Serial.printf("[WebSocket] GOL TRASFERTA! Punteggio: %d - %d\n", newHomeScore, newAwayScore);
            triggerGoalEffect(false);
          }
          
          homeScore = newHomeScore;
          awayScore = newAwayScore;
        }
      }
    }
    // --- GESTIONE AGGIORNAMENTI TABELLA TIMER_CONTROL (TIMER) ---
    else if (table == "timer_control" && eventType == "UPDATE") {
      JsonObject record;
      // Cerca il record nei vari formati possibili di Supabase Realtime
      if (payloadObj.containsKey("new")) {
        record = payloadObj["new"].as<JsonObject>();
      } else if (payloadObj.containsKey("record")) {
        record = payloadObj["record"].as<JsonObject>();
      } else if (!dataObj.isNull() && dataObj.containsKey("record")) {
        record = dataObj["record"].as<JsonObject>();
      } else if (!dataObj.isNull() && dataObj.containsKey("new")) {
        record = dataObj["new"].as<JsonObject>();
      } else if (!dataObj.isNull()) {
        record = dataObj;
      }
      
      if (record.isNull()) return;
      
      String command = record["command"] | "STOP";
      int duration = record["duration"] | 9;
      
      if (record.containsKey("color")) {
        timerColorStr = record["color"] | "RED";
      }
      if (record.containsKey("effect")) {
        timerEffectStr = record["effect"] | "SOLID";
      }
      
      Serial.printf("[WebSocket] Timer comando: %s | Durata: %d | Colore: %s | Effetto: %s\n", 
                    command.c_str(), duration, timerColorStr.c_str(), timerEffectStr.c_str());
                    
      if (command == "START") {
        timerDuration = duration;
        timerStartMillis = millis();
        timerLastVal = -1; // Forza il flash di transizione iniziale
        currentState = STATE_TIMER;
      } else if (command == "PAUSE") {
        timerDuration = duration;
        currentState = STATE_TIMER_PAUSED;
      } else if (command == "STOP") {
        currentState = STATE_IDLE;
      }
    }
  } 
  else if (event == "phx_reply") {
    JsonObject response = doc["payload"].as<JsonObject>();
    String status = response["status"] | "";
    if (status == "ok") {
      Serial.println("[WebSocket] Canale connesso e attivo.");
    }
  }
}

// --- GESTIONE DEI TRIGGER EFFETTI LED ---
void triggerGoalEffect(bool isHome) {
  currentState = isHome ? STATE_GOAL_HOME : STATE_GOAL_AWAY;
  stateStartTime = millis();
}

void triggerStartMatchEffect() {
  currentState = STATE_START_MATCH;
  stateStartTime = millis();
}

void triggerEndMatchEffect() {
  currentState = STATE_END_MATCH;
  stateStartTime = millis();
}

CRGB getBaseColor(String colorStr) {
  if (colorStr == "GREEN")   return CRGB::Green;
  if (colorStr == "BLUE")    return CRGB::Blue;
  if (colorStr == "YELLOW")  return CRGB::Yellow;
  if (colorStr == "CYAN")    return CRGB::Cyan;
  if (colorStr == "MAGENTA") return CRGB::Magenta;
  if (colorStr == "WHITE")   return CRGB::White;
  if (colorStr == "BLACK")   return CRGB::Black;
  return CRGB::Red; // Default to RED
}

CRGB getLedColor(String colorStr, String effectStr, int ledIndex, unsigned long nowMillis) {
  if (colorStr == "BLACK") {
    return CRGB::Black;
  }
  bool isRainbow = (effectStr == "RAINBOW" || effectStr == "RAINBOW_BREATHE");
  bool isBreathe = (effectStr == "BREATHE" || effectStr == "RAINBOW_BREATHE");
  
  uint8_t brightness = 255;
  if (isBreathe) {
    brightness = beatsin8(15, 60, 255, 0, 0); 
  }
  
  if (isRainbow) {
    uint8_t hue = (ledIndex * 2) + (nowMillis / 15);
    return CHSV(hue, 255, brightness);
  } else {
    CRGB baseColor = getBaseColor(colorStr);
    if (brightness < 255) {
      baseColor.nscale8_video(brightness);
    }
    return baseColor;
  }
}

// Imposta un segmento a un colore per una determinata cifra
void setDigitSegment(int digitIndex, int segmentIndex, String colorStr, String effectStr, unsigned long nowMillis) {
  if (digitIndex < 0 || digitIndex >= 4) return;
  if (segmentIndex < 0 || segmentIndex >= 7) return;
  
  int startLed = 0;
  int ledsPerSeg = 0;
  
  if (digitIndex == 0) {
    startLed = segmentIndex * 4;
    ledsPerSeg = 4;
  } else if (digitIndex == 1) {
    startLed = 28 + (segmentIndex * 4);
    ledsPerSeg = 4;
  } else if (digitIndex == 2) {
    startLed = 60 + (segmentIndex * 5);
    ledsPerSeg = 5;
  } else if (digitIndex == 3) {
    startLed = 95 + (segmentIndex * 5);
    ledsPerSeg = 5;
  }
  
  for (int i = 0; i < ledsPerSeg; i++) {
    int ledIndex = startLed + i;
    leds[ledIndex] = getLedColor(colorStr, effectStr, ledIndex, nowMillis);
  }
}

// Imposta i LED del colon centrale (separatore ':')
void setColon(String colorStr, String effectStr, unsigned long nowMillis) {
  for (int i = 0; i < 4; i++) {
    int ledIndex = 56 + i;
    leds[ledIndex] = getLedColor(colorStr, effectStr, ledIndex, nowMillis);
  }
}

// Suddivide e visualizza il tempo su tutti e 4 i display in formato MM:SS
void displayTime(int totalSeconds, String colorStr, String effectStr, unsigned long nowMillis) {
  int minutes = totalSeconds / 60;
  int seconds = totalSeconds % 60;
  
  int d0 = (minutes / 10) % 10;
  int d1 = minutes % 10;
  int d2 = (seconds / 10) % 10;
  int d3 = seconds % 10;
  
  // Digit 0 (Decine Minuti): Sopprime lo zero iniziale
  bool showD0 = (minutes >= 10);
  for (int seg = 0; seg < 7; seg++) {
    if (showD0 && digitSegments[d0][seg]) {
      setDigitSegment(0, seg, colorStr, effectStr, nowMillis);
    } else {
      setDigitSegment(0, seg, "BLACK", "SOLID", nowMillis);
    }
  }
  
  // Digit 1 (Unità Minuti)
  for (int seg = 0; seg < 7; seg++) {
    if (digitSegments[d1][seg]) {
      setDigitSegment(1, seg, colorStr, effectStr, nowMillis);
    } else {
      setDigitSegment(1, seg, "BLACK", "SOLID", nowMillis);
    }
  }
  
  // Digit 2 (Decine Secondi)
  for (int seg = 0; seg < 7; seg++) {
    if (digitSegments[d2][seg]) {
      setDigitSegment(2, seg, colorStr, effectStr, nowMillis);
    } else {
      setDigitSegment(2, seg, "BLACK", "SOLID", nowMillis);
    }
  }
  
  // Digit 3 (Unità Secondi)
  for (int seg = 0; seg < 7; seg++) {
    if (digitSegments[d3][seg]) {
      setDigitSegment(3, seg, colorStr, effectStr, nowMillis);
    } else {
      setDigitSegment(3, seg, "BLACK", "SOLID", nowMillis);
    }
  }
}

// --- MACCHINA A STATI NON BLOCCANTE PER ANIMAZIONE LED ---
void updateLEDs() {
  unsigned long now = millis();
  
  if (now - lastAnimationUpdate < 16) {
    return;
  }
  lastAnimationUpdate = now;
  
  unsigned long elapsed = now - stateStartTime;
  
  switch(currentState) {
    // 1. STATO DI IDLE: Display spento, solo LED di bordo attivo per segnalare lo stato di pronto
    case STATE_IDLE: {
      FastLED.clear(); // Spegne tutti i segmenti del display a 7 segmenti
      
      // LED di bordo oscilla in viola (standby pronto)
      boardLed[0] = CHSV(192, 255, beatsin8(10, 30, 150));
      break;
    }
    
    // 2. STATO GOL CASA: Stroboscopico Rosso (3 secondi)
    case STATE_GOAL_HOME: {
      if (elapsed > 3000) {
        currentState = STATE_IDLE;
        break;
      }
      bool on = (elapsed / 80) % 2 == 0;
      CRGB color = on ? CRGB::Red : CRGB::Black;
      
      fill_solid(leds, NUM_LEDS, color);
      boardLed[0] = color;
      break;
    }
    
    // 3. STATO GOL TRASFERTA: Stroboscopico Blu (3 secondi)
    case STATE_GOAL_AWAY: {
      if (elapsed > 3000) {
        currentState = STATE_IDLE;
        break;
      }
      bool on = (elapsed / 80) % 2 == 0;
      CRGB color = on ? CRGB::Blue : CRGB::Black;
      
      fill_solid(leds, NUM_LEDS, color);
      boardLed[0] = color;
      break;
    }
    
    // 4. INIZIO PARTITA: Onda Verde (2 secondi)
    case STATE_START_MATCH: {
      if (elapsed > 2000) {
        currentState = STATE_IDLE;
        break;
      }
      int numGreen = map(elapsed, 0, 2000, 0, NUM_LEDS);
      fill_solid(leds, numGreen, CRGB::Green);
      fill_solid(leds + numGreen, NUM_LEDS - numGreen, CRGB::Black);
      boardLed[0] = CRGB::Green;
      break;
    }
    
    // 5. FINE PARTITA: Sirena Rosso Stroboscopica Rapida (5 secondi)
    case STATE_END_MATCH: {
      if (elapsed > 5000) {
        currentState = STATE_IDLE;
        break;
      }
      bool on = (elapsed / 50) % 2 == 0;
      CRGB color = on ? CRGB::Red : CRGB::Black;
      
      fill_solid(leds, NUM_LEDS, color);
      boardLed[0] = color;
      break;
    }
    
    // 6. STATO TIMER: Conto alla rovescia semplice e solido (senza effetti strani)
    case STATE_TIMER: {
      unsigned long timerElapsed = now - timerStartMillis;
      int currentSec = timerDuration - (timerElapsed / 1000);
      
      // Quando il timer finisce (tocca lo 0 ed scende sotto)
      if (currentSec < 0) {
        // Al termine del timer ripristina lo stato di IDLE (display spento)
        currentState = STATE_IDLE;
        break;
      }
      
      if (currentSec != timerLastVal) {
        timerLastVal = currentSec;
        Serial.printf("[Timer] Secondo corrente: %d\n", currentSec);
      }
      
      FastLED.clear();
      // Disegna il tempo residuo MM:SS con colore ed effetto dinamici
      displayTime(currentSec, timerColorStr, timerEffectStr, now);
      
      // Il colon centralina lampeggia a frequenza di 1Hz
      bool colonOn = (now / 500) % 2 == 0;
      if (colonOn) {
        setColon(timerColorStr, timerEffectStr, now);
      } else {
        setColon("BLACK", "SOLID", now);
      }
      
      boardLed[0] = getLedColor(timerColorStr, timerEffectStr, 0, now); // LED di bordo coordinato
      break;
    }
    
    // 7. STATO TIMER PAUSATO: Visualizza il tempo congelato con colon fisso acceso
    case STATE_TIMER_PAUSED: {
      FastLED.clear();
      // Disegna il tempo di pausa con colore ed effetto dinamici
      displayTime(timerDuration, timerColorStr, timerEffectStr, now);
      
      // Il colon rimane fisso acceso
      setColon(timerColorStr, timerEffectStr, now);
      
      // LED di bordo lampeggia lentamente coerente
      bool flashOn = (now / 1000) % 2 == 0;
      boardLed[0] = flashOn ? getLedColor(timerColorStr, timerEffectStr, 0, now) : CRGB::Black;
      break;
    }
  }
  
  // Se il Wi-Fi non è connesso, sovrascrivi il LED di bordo con un lampeggio Arancione di diagnostica
  if (WiFi.status() != WL_CONNECTED) {
    bool flashOn = (now / 500) % 2 == 0;
    boardLed[0] = flashOn ? CRGB::Orange : CRGB::Black;
  }
  
  FastLED.show();
}

// Invia un ping HTTP di presenza a Supabase per aggiornare il timestamp 'last_seen'
void sendDevicePing() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Ping di presenza saltato (Wi-Fi disconnesso).");
    return;
  }
  
  Serial.println("[HTTP] Invio ping di presenza a Supabase (device_status)...");
  WiFiClientSecure client;
  client.setInsecure(); 
  client.setTimeout(5); // 5 secondi timeout socket
  
  HTTPClient http;
  http.setTimeout(5000); // 5 secondi timeout HTTP
  String url = "https://" + String(SECRET_SUPABASE_HOST) + "/rest/v1/device_status";
  
  if (http.begin(client, url)) {
    http.addHeader("apikey", SECRET_SUPABASE_ANON_KEY);
    http.addHeader("Authorization", "Bearer " + String(SECRET_SUPABASE_ANON_KEY));
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Prefer", "resolution=merge-duplicates");
    
    int httpCode = http.POST("{\"id\":\"esp32_centralina\"}");
    Serial.printf("[HTTP] Risposta ping di presenza: %d\n", httpCode);
    http.end();
  } else {
    Serial.println("[HTTP] Errore inizializzazione client per ping.");
  }
}

// Task per inviare periodicamente il ping di presenza sul Core 0
void pingTask(void * pvParameters) {
  // Aspetta 30 secondi prima del primo ping in background (il primo ping viene eseguito sincrono nel setup)
  vTaskDelay(pdMS_TO_TICKS(30000));
  for (;;) {
    sendDevicePing();
    vTaskDelay(pdMS_TO_TICKS(30000));
  }
}
