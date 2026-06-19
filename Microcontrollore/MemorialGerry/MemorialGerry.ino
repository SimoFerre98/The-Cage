#include <FastLED.h>

// Imposta il numero effettivo di LED presenti sulla tua striscia WS2812B
#define NUM_LEDS    60  
// Pin DIN della striscia collegato al GPIO 16 (IO16) dell'ESP32-S3
#define DATA_PIN    16  

// Definizione dell'array di LED
CRGB leds[NUM_LEDS];

void setup() {
  // Inizializzazione della porta seriale a 115200 baud per il debug
  Serial.begin(115200);
  delay(1500); // Piccolo delay per stabilizzare la seriale all'avvio
  
  Serial.println("--- Test Striscia LED WS2812B Avviato! ---");
  Serial.printf("Configurazione: GPIO %d | Numero LED: %d\n", DATA_PIN, NUM_LEDS);

  // Inizializzazione della striscia WS2812B tramite FastLED
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  
  // Limita la luminosità generale a 50 (da 0 a 255) per sicurezza energetica 
  // (evita di sovraccaricare la porta USB del PC / pin 5V dell'ESP32)
  FastLED.setBrightness(50);
}

void loop() {
  // --- EFFETTO: Arcobaleno Twinkle (Scintille a Gruppi di 3) ---
  // Sfondo arcobaleno dinamico e in movimento su tutta la striscia, 
  // interrotto casualmente da flash di 3 LED contigui di colore bianco puro a massima intensità.

  static uint8_t gHue = 0; // Tonalità di partenza dell'arcobaleno
  
  // 1. Genera l'effetto arcobaleno su tutti i LED
  fill_rainbow(leds, NUM_LEDS, gHue, 5); // deltaHue = 5 stende l'arcobaleno lungo la striscia
  gHue += 2; // Fa scorrere lentamente l'arcobaleno

  // 2. Accendi casualmente gruppi di 3 LED contigui in bianco puro a massima intensità
  if (random8() < 20) { // circa l'8% di possibilità per frame di generare il flash
    int startIndex = random16(NUM_LEDS - 2); // Assicura che ci sia spazio per 3 LED
    leds[startIndex]     = CRGB::White;
    leds[startIndex + 1] = CRGB::White;
    leds[startIndex + 2] = CRGB::White;
  }

  // Mostra i colori sulla striscia LED
  FastLED.show();
  delay(30); // Regola per variare la fluidità del movimento dell'arcobaleno
}