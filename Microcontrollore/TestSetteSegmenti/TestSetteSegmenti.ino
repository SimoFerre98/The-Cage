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

// Variabili per alternare gli effetti del countdown
enum CountdownEffect {
  EFFECT_RAINBOW = 0,
  EFFECT_FIRE = 1,
  EFFECT_NEON_BREATH = 2,
  EFFECT_COUNT // Numero totale di effetti
};

CountdownEffect currentEffect = EFFECT_RAINBOW;

void setup() {
  Serial.begin(115200);
  
  // Aspetta fino a 5 secondi che il Serial Monitor venga aperto (fondamentale per USB CDC su ESP32-S3)
  unsigned long startSerial = millis();
  while (!Serial && (millis() - startSerial < 5000)) {
    delay(10);
  }
  
  Serial.println("\n=== Avvio Test Countdown 7 Segmenti (Multi-Effetto) ===");
  Serial.printf("Configurazione: %d LED (%d per segmento), Pin dati: %d\n", NUM_LEDS, LEDS_PER_SEGMENT, DATA_PIN);

  // Inizializzazione FastLED (Striscia display + LED di bordo)
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.addLeds<NEOPIXEL, BOARD_LED_PIN>(boardLed, NUM_BOARD_LEDS);

  // --- GESTORE DI POTENZA (IMPORTANTE) ---
  // Limita l'assorbimento a 5V e 500mA per evitare cali di tensione (sags) e sbalzi di luminosità 
  // quando si accendono molti LED, proteggendo la porta USB del PC e l'ESP32.
  // Nota: Se usate un alimentatore esterno da 2A (2000mA), potete impostare (5, 2000).
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 500);
  FastLED.setBrightness(120); // Luminosità base più alta (FastLED la scalerà se necessario per sicurezza)

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
// FUNZIONI DEGLI EFFETTI GRAFICI SULLE CIFRE
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

// 2. EFFETTO FUOCO OSCILLANTE (Fire Flicker)
void updateFireDigit(int digit, uint32_t frameTime) {
  FastLED.clear();
  for (int seg = 0; seg < 7; seg++) {
    if (digitSegments[digit][seg]) {
      int startLed = seg * LEDS_PER_SEGMENT;
      for (int i = 0; i < LEDS_PER_SEGMENT; i++) {
        // Genera rumore di calore dinamico
        uint8_t noise = inoise8(frameTime / 4, (startLed + i) * 35);
        // Tonalità calda: 0 (Rosso) fino a 32 (Arancione/Giallo)
        uint8_t hue = map(noise, 0, 255, 0, 32); 
        uint8_t val = map(noise, 0, 255, 80, 255);
        leds[startLed + i] = CHSV(hue, 255, val);
      }
    }
  }
  boardLed[0] = CRGB::Red;
  FastLED.show();
}

// 3. EFFETTO NEON PULSANTE (Neon Breath)
void updateNeonBreathDigit(int digit, uint8_t breathBrightness) {
  FastLED.clear();
  CRGB neonCyan = CHSV(130, 240, breathBrightness); // Azzurro ghiaccio pulsante
  
  for (int seg = 0; seg < 7; seg++) {
    if (digitSegments[digit][seg]) {
      setSegment(seg, neonCyan);
    }
  }
  boardLed[0] = neonCyan;
  FastLED.show();
}

// =========================================================================
// EFFETTI DI TRANSIZIONE E CELEBRAZIONE
// =========================================================================

// Flash di transizione (Neon Spark) di 80ms prima del cambio cifra
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

// Celebrazione allo zero (durata 4 secondi)
void runCelebrationEffect() {
  Serial.println("[Countdown] ZERO! GOOOL!");
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
  // Stampa l'effetto grafico correntemente utilizzato per questo ciclo
  Serial.print("\n--- Inizio Countdown con Effetto: ");
  if (currentEffect == EFFECT_RAINBOW) Serial.println("ONDA ARCOBALENO ---");
  else if (currentEffect == EFFECT_FIRE) Serial.println("FUOCO OSCILLANTE ---");
  else if (currentEffect == EFFECT_NEON_BREATH) Serial.println("RESPIRO NEON ---");

  // Conteggio da 9 a 0
  for (int num = 9; num >= 0; num--) {
    Serial.printf("[Countdown] Cifra: %d\n", num);
    
    if (num == 0) {
      runCelebrationEffect();
      break; 
    }
    
    // Flash bianco del cambio cifra
    triggerFlashEffect(num);
    
    unsigned long startDigitTime = millis();
    uint8_t hue = num * 25; // per effetto arcobaleno
    
    while (millis() - startDigitTime < 1000) {
      uint32_t nowMs = millis();
      
      switch (currentEffect) {
        case EFFECT_RAINBOW:
          updateRainbowDigit(num, hue);
          hue += 2;
          break;
          
        case EFFECT_FIRE:
          updateFireDigit(num, nowMs);
          break;
          
        case EFFECT_NEON_BREATH: {
          // Oscillazione sinusoidale per l'effetto respiro (luminosità 80 -> 255)
          uint8_t brightness = beatsin8(45, 80, 255); // 45 battiti al minuto
          updateNeonBreathDigit(num, brightness);
          break;
        }
        
        default:
          break;
      }
      delay(15); // ~60 FPS
    }
  }

  // Cambia l'effetto per il prossimo ciclo di conto alla rovescia
  currentEffect = (CountdownEffect)((currentEffect + 1) % EFFECT_COUNT);
  
  Serial.println("[Countdown] Riavvio conto alla rovescia in corso...");
  delay(2000);
}
