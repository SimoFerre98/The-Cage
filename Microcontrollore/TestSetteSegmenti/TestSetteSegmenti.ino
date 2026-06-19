#include <FastLED.h>

// --- CONFIGURAZIONE HARDWARE ---
#define NUM_LEDS          28    // 7 segmenti * 4 LED per segmento = 28 LED totali
#define DATA_PIN          16    // Pin dati per la striscia LED del display a 7 segmenti
#define BOARD_LED_PIN     48    // Pin dati per il LED RGB integrato nella board ESP32-S3
#define NUM_BOARD_LEDS    1     // Numero di LED di bordo

CRGB leds[NUM_LEDS];
CRGB boardLed[NUM_BOARD_LEDS];

// Numero di LED per ciascun segmento
#define LEDS_PER_SEGMENT  4

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

// Variabili per alternare gli effetti del contatore
enum CounterEffect {
  EFFECT_WHITE_MAX = 0,
  EFFECT_RAINBOW = 1,
  EFFECT_CYBERPUNK = 2,
  EFFECT_COUNT // Numero totale di effetti
};

CounterEffect currentEffect = EFFECT_WHITE_MAX;

void setup() {
  Serial.begin(115200);
  
  // Aspetta fino a 5 secondi che il Serial Monitor venga aperto (fondamentale per USB CDC su ESP32-S3)
  unsigned long startSerial = millis();
  while (!Serial && (millis() - startSerial < 5000)) {
    delay(10);
  }
  
  Serial.println("\n=== Avvio Test Contatore 7 Segmenti (0-9) ===");
  Serial.printf("Configurazione: %d LED (%d per segmento), Pin dati: %d\n", NUM_LEDS, LEDS_PER_SEGMENT, DATA_PIN);

  // Inizializzazione FastLED (Striscia display + LED di bordo)
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.addLeds<NEOPIXEL, BOARD_LED_PIN>(boardLed, NUM_BOARD_LEDS);

  // --- GESTORE DI POTENZA (BIANCO MASSIMO) ---
  // Alziamo il limite di corrente a 1000mA (1 Ampere) per consentire alla luce bianca di essere molto luminosa.
  // NOTA DI SICUREZZA: Se la scheda ESP32 si riavvia o si spegne durante il test del Bianco (specialmente sull'8),
  // significa che la porta USB del PC non eroga abbastanza corrente. In tal caso, alimenta la scheda con 
  // un caricatore da muro per smartphone oppure abbassa questo valore a 500.
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 1000);
  FastLED.setBrightness(255); // Impostiamo la luminosità software al massimo (255)

  // Spegne tutto all'avvio
  FastLED.clear();
  FastLED.show();
}

// Funzione ausiliaria per impostare il colore di un segmento
void setSegment(int segmentIndex, CRGB color) {
  if (segmentIndex < 0 || segmentIndex >= 7) return;
  
  int startLed = segmentIndex * LEDS_PER_SEGMENT;
  for (int i = 0; i < LEDS_PER_SEGMENT; i++) {
    leds[startLed + i] = color;
  }
}

// =========================================================================
// FUNZIONI DEGLI EFFETTI GRAFICI
// =========================================================================

// 1. EFFETTO ARCOBALENO SCORREVOLE (Rainbow Flow)
void updateRainbowDigit(int digit, uint8_t baseHue) {
  FastLED.clear();
  for (int seg = 0; seg < 7; seg++) {
    if (digitSegments[digit][seg]) {
      int startLed = seg * LEDS_PER_SEGMENT;
      for (int i = 0; i < LEDS_PER_SEGMENT; i++) {
        leds[startLed + i] = CHSV(baseHue + (startLed + i) * 6, 255, 255);
      }
    }
  }
  boardLed[0] = CHSV(baseHue, 255, 255);
  FastLED.show();
}

// 2. EFFETTO CYBERPUNK SYNTHWAVE (Ciano e Magenta sfumati in movimento)
void updateCyberpunkDigit(int digit, uint8_t baseHue) {
  FastLED.clear();
  for (int seg = 0; seg < 7; seg++) {
    if (digitSegments[digit][seg]) {
      int startLed = seg * LEDS_PER_SEGMENT;
      for (int i = 0; i < LEDS_PER_SEGMENT; i++) {
        // Calcola una tonalità oscillatoria tra Ciano (130) e Magenta (224)
        uint8_t factor = baseHue + (startLed + i) * 5;
        uint8_t mappedHue = map(sin8(factor), 0, 255, 130, 224);
        leds[startLed + i] = CHSV(mappedHue, 255, 255);
      }
    }
  }
  boardLed[0] = CHSV(baseHue, 255, 255);
  FastLED.show();
}

// =========================================================================
// TRANSIZIONE E CELEBRAZIONE
// =========================================================================

// Flash di transizione (Neon Spark) prima del cambio cifra
void triggerFlashEffect(int digit) {
  FastLED.clear();
  for (int seg = 0; seg < 7; seg++) {
    if (digitSegments[digit][seg]) {
      int startLed = seg * LEDS_PER_SEGMENT;
      for (int i = 0; i < LEDS_PER_SEGMENT; i++) {
        leds[startLed + i] = CRGB::White;
      }
    }
  }
  boardLed[0] = CRGB::White;
  FastLED.show();
  delay(80);
}

// Celebrazione finale quando si raggiunge il 9 (durata 4 secondi)
void runCelebrationEffect() {
  Serial.println("[Contatore] 9 raggiunto! Celebrazione!");
  unsigned long startCel = millis();
  uint8_t hue = 0;
  
  while (millis() - startCel < 4000) {
    // Arcobaleno rotante molto veloce
    fill_rainbow(leds, NUM_LEDS, hue, 8);
    hue += 8;
    
    // Scintille stroboscopiche bianche casuali
    if (random8() < 60) {
      int idx = random16(NUM_LEDS);
      leds[idx] = CRGB::White;
      if (idx > 0) leds[idx-1] = CRGB::White;
      if (idx < NUM_LEDS - 1) leds[idx+1] = CRGB::White;
    }
    
    boardLed[0] = CHSV(hue, 255, 255);
    FastLED.show();
    delay(20);
  }
  
  // Spegnimento finale
  FastLED.clear();
  boardLed[0] = CRGB::Black;
  FastLED.show();
  delay(1000);
}

void loop() {
  // Stampa l'effetto grafico del ciclo corrente
  Serial.print("\n--- Inizio Contatore (0-9) con Effetto: ");
  if (currentEffect == EFFECT_WHITE_MAX) Serial.println("BIANCO MASSIMA INTENSITÀ ---");
  else if (currentEffect == EFFECT_RAINBOW) Serial.println("ONDA ARCOBALENO ---");
  else if (currentEffect == EFFECT_CYBERPUNK) Serial.println("SFUMATURA CYBERPUNK (EFFETTO FIGO) ---");

  // Conteggio progressivo da 0 a 9
  for (int num = 0; num <= 9; num++) {
    Serial.printf("[Contatore] Cifra: %d\n", num);
    
    // Flash bianco del cambio cifra
    triggerFlashEffect(num);
    
    unsigned long startDigitTime = millis();
    uint8_t hue = num * 25; 
    
    while (millis() - startDigitTime < 1500) { // Mostra ogni numero per 1.5 secondi
      uint32_t nowMs = millis();
      
      switch (currentEffect) {
        case EFFECT_WHITE_MAX:
          // Accende i segmenti attivi a bianco puro senza sfumature
          FastLED.clear();
          for (int seg = 0; seg < 7; seg++) {
            if (digitSegments[num][seg]) {
              setSegment(seg, CRGB::White);
            }
          }
          boardLed[0] = CRGB::White;
          FastLED.show();
          break;
          
        case EFFECT_RAINBOW:
          updateRainbowDigit(num, hue);
          hue += 2;
          break;
          
        case EFFECT_CYBERPUNK:
          updateCyberpunkDigit(num, hue);
          hue += 1.5;
          break;
      }
      delay(15); // ~60 FPS
    }
    
    // Al 9, eseguiamo l'effetto celebrazione
    if (num == 9) {
      runCelebrationEffect();
    }
  }

  // Cambia l'effetto per il prossimo ciclo di contatore
  currentEffect = (CounterEffect)((currentEffect + 1) % EFFECT_COUNT);
  
  Serial.println("[Contatore] Riavvio conteggio da 0 tra 2 secondi...");
  delay(2000);
}
