#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <FastLED.h>
#include "secrets.h"

// --- CONFIGURAZIONE HARDWARE ---
#define NUM_LEDS          60    // Numero di LED sulla striscia WS2812B
#define DATA_PIN          16    // Pin dati per la striscia LED
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
  STATE_END_MATCH
};

LedState currentState = STATE_IDLE;
unsigned long stateStartTime = 0;
unsigned long lastAnimationUpdate = 0;

// --- STATO DELLA PARTITA LIVE ---
String liveMatchId = "";
int homeScore = 0;
int awayScore = 0;

// --- WEBSOCKET & TIMING ---
WebSocketsClient webSocket;
unsigned long lastHeartbeat = 0;
int refCount = 2; // Contatore dei ref Phoenix (phx_join usa "1")

// --- PROTOTIPI DELLE FUNZIONI ---
void checkLiveMatch();
void initWebSocket();
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);
void handleWebSocketMessage(uint8_t * payload, size_t length);
void joinRealtimeChannel();
void sendHeartbeat();
void updateLEDs();
void triggerGoalEffect(bool isHome);
void triggerStartMatchEffect();
void triggerEndMatchEffect();

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("\n=== Avvio Centralina Memorial Gerry ===");

  // Inizializzazione FastLED
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.addLeds<NEOPIXEL, BOARD_LED_PIN>(boardLed, NUM_BOARD_LEDS);
  FastLED.setBrightness(50); // Luminosità di sicurezza

  // Inizializzazione LED di bordo in giallo (attesa Wi-Fi)
  boardLed[0] = CRGB::Yellow;
  FastLED.show();

  // Connessione Wi-Fi
  Serial.printf("Connessione a rete Wi-Fi: %s\n", SECRET_SSID);
  WiFi.begin(SECRET_SSID, SECRET_PASS);
  WiFi.setAutoReconnect(true);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    // Lampeggio giallo durante il caricamento del Wi-Fi
    static bool toggle = false;
    boardLed[0] = toggle ? CRGB::Yellow : CRGB::Black;
    FastLED.show();
    toggle = !toggle;
  }
  
  Serial.println("\n[Wi-Fi] Connesso con successo!");
  Serial.print("[Wi-Fi] Indirizzo IP: ");
  Serial.println(WiFi.localIP());

  boardLed[0] = CRGB::Orange; // Arancione: Connesso a Wi-Fi, in attesa del DB
  FastLED.show();

  // Recupera lo stato iniziale del match dal database
  checkLiveMatch();

  // Inizializza e avvia la connessione WebSocket a Supabase
  initWebSocket();
}

void loop() {
  // Gestisce i pacchetti del WebSocket
  webSocket.loop();

  // Verifica e stampa lo stato del Wi-Fi in caso di perdite
  static unsigned long lastWiFiCheck = 0;
  if (millis() - lastWiFiCheck > 10000) {
    lastWiFiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[Wi-Fi] Connessione persa, tentativo di riconnessione automatico...");
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
  client.setInsecure(); // Salta la verifica del certificato SSL per semplicità su ESP32
  
  HTTPClient http;
  String url = "https://" + String(SECRET_SUPABASE_HOST) + "/rest/v1/matches?status=eq.LIVE&select=*";
  
  Serial.println("[HTTP] Verifica partite LIVE attive su Supabase...");
  if (http.begin(client, url)) {
    http.addHeader("apikey", SECRET_SUPABASE_ANON_KEY);
    http.addHeader("Authorization", "Bearer " + String(SECRET_SUPABASE_ANON_KEY));
    
    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("[HTTP] Risposta ricevuta: " + payload);
      
      #if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument doc;
      #else
      DynamicJsonDocument doc(2048);
      #endif
      
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
  // Path con la chiave Anon e specificando la versione del protocollo Phoenix channels
  String path = "/realtime/v1/websocket?apikey=" + String(SECRET_SUPABASE_ANON_KEY) + "&vsn=1.0.0";
  
  Serial.println("[WebSocket] Connessione a Supabase Realtime...");
  webSocket.beginSSL(SECRET_SUPABASE_HOST, 443, path.c_str());
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000); // Tenta di riconnettersi ogni 5 secondi in caso di cadute
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

// Invia il messaggio di Join per ascoltare i cambiamenti della tabella 'matches'
void joinRealtimeChannel() {
  // Configura il payload phx_join per ascoltare le modifiche in tempo reale sulla tabella 'matches'
  String joinPayload = "{\"topic\":\"realtime:public\",\"event\":\"phx_join\",\"payload\":{\"config\":{\"postgres_changes\":[{\"event\":\"UPDATE\",\"schema\":\"public\",\"table\":\"matches\"}]},\"access_token\":\"" + String(SECRET_SUPABASE_ANON_KEY) + "\"},\"ref\":\"1\",\"join_ref\":\"1\"}";
  
  webSocket.sendTXT(joinPayload);
  Serial.println("[WebSocket] Sottoscrizione inviata per modifiche in tempo reale su 'matches'");
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

// Gestisce il parsing e il processamento del payload JSON ricevuto dal canale Realtime
void handleWebSocketMessage(uint8_t * payload, size_t length) {
  #if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  #else
  DynamicJsonDocument doc(2048);
  #endif

  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.print("[WebSocket] Errore parsing JSON: ");
    Serial.println(error.c_str());
    return;
  }

  String event = doc["event"] | "";
  
  if (event == "postgres_changes") {
    JsonObject payloadObj = doc["payload"].as<JsonObject>();
    String eventType = payloadObj["type"] | "";
    String table = payloadObj["table"] | "";
    
    if (table == "matches" && eventType == "UPDATE") {
      JsonObject record = payloadObj["data"]["record"].as<JsonObject>();
      
      String matchId = record["id"] | "";
      String status = record["status"] | "";
      
      // CASO A: Non stiamo tracciando partite, e ne viene avviata una LIVE
      if (liveMatchId == "" && status == "LIVE") {
        liveMatchId = matchId;
        homeScore = record["home_score"] | 0;
        awayScore = record["away_score"] | 0;
        Serial.printf("[WebSocket] Nuova partita LIVE avviata! ID: %s | Punteggio: %d - %d\n", 
                      liveMatchId.c_str(), homeScore, awayScore);
        triggerStartMatchEffect();
      } 
      // CASO B: Stiamo tracciando questa specifica partita
      else if (matchId == liveMatchId) {
        // Se la partita viene terminata
        if (status != "LIVE") {
          Serial.println("[WebSocket] La partita tracciata è terminata.");
          liveMatchId = "";
          triggerEndMatchEffect();
        } 
        // Se la partita è ancora live, confronta i punteggi
        else {
          int newHomeScore = record["home_score"] | 0;
          int newAwayScore = record["away_score"] | 0;
          
          if (newHomeScore > homeScore) {
            Serial.printf("[WebSocket] GOL CASA! Punteggio: %d - %d\n", newHomeScore, newAwayScore);
            triggerGoalEffect(true); // Casa (Rosso)
          } else if (newAwayScore > awayScore) {
            Serial.printf("[WebSocket] GOL TRASFERTA! Punteggio: %d - %d\n", newHomeScore, newAwayScore);
            triggerGoalEffect(false); // Trasferta (Blu)
          }
          
          homeScore = newHomeScore;
          awayScore = newAwayScore;
        }
      }
    }
  } else if (event == "phx_reply") {
    JsonObject response = doc["payload"].as<JsonObject>();
    String status = response["status"] | "";
    if (status == "ok") {
      Serial.println("[WebSocket] Canale connesso e attivo.");
    }
  }
}

// --- GESTIONE DEI TRICGER EFFETTI LED ---
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

// --- MACCHINA A STATI NON BLOCCANTE PER ANIMAZIONE LED ---
void updateLEDs() {
  unsigned long now = millis();
  
  // Limita a ~60 FPS per non stressare il processore
  if (now - lastAnimationUpdate < 16) {
    return;
  }
  lastAnimationUpdate = now;
  
  unsigned long elapsed = now - stateStartTime;
  
  switch(currentState) {
    // 1. STATO DI IDLE: Arcobaleno di sfondo + scintille bianche
    case STATE_IDLE: {
      static uint8_t gHue = 0;
      fill_rainbow(leds, NUM_LEDS, gHue, 5);
      gHue += 2;

      if (random8() < 20) {
        int startIndex = random16(NUM_LEDS - 2);
        leds[startIndex]     = CRGB::White;
        leds[startIndex + 1] = CRGB::White;
        leds[startIndex + 2] = CRGB::White;
      }
      
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
  }
  
  // Applica le modifiche a tutti i LED
  FastLED.show();
}