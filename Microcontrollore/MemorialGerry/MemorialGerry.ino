#include <FastLED.h>

// Definiamo il numero di LED (1 per il test sulla scheda) e il pin
#define NUM_LEDS    1
#define DATA_PIN    48  // Cambialo in 38 se noti che rimane spento dopo il reset

// Creiamo l'array di LED richiesto da FastLED
CRGB leds[NUM_LEDS];

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("--- Test FastLED avviato! ---");

  // Configurazione iniziale di FastLED per il chip WS2812B
  // Usiamo l'ordine dei colori GRB standard
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  
  // Impostiamo la luminosità generale (da 0 a 255)
  FastLED.setBrightness(40);
}

void loop() {
  
  // --- EFFETTO 1: Dissolvenza fluida (Breathing/Respiro) di un colore ---
  Serial.println("Effetto: Respiro Blu");
  for(int i = 0; i < 255; i++) {
    // Impostiamo il LED su Blu, ma scalando l'intensità in base a 'i'
    leds[0] = CRGB::Blue;
    leds[0].nscale8(i); 
    FastLED.show();
    delay(4);
  }
  for(int i = 255; i > 0; i--) {
    leds[0] = CRGB::Blue;
    leds[0].nscale8(i); // Funzione nativa per scalare la luminosità matematicamente
    FastLED.show();
    delay(4);
  }
  delay(500);


  // --- EFFETTO 2: Arcobaleno dinamico (Rainbow) ---
  Serial.println("Effetto: Arcobaleno Continuo");
  unsigned long startTime = millis();
  // Fa girare l'arcobaleno per 5 secondi
  while(millis() - startTime < 5000) {
    // beat8 e beatsin8 sono funzioni matematiche di FastLED che creano oscillazioni temporali
    uint8_t hue = beat8(30); // Genera una tonalità di colore che cambia costantemente nel tempo
    leds[0] = CHSV(hue, 255, 255); // Usa il formato HSV (Tonalità, Saturazione, Valore/Luminosità)
    FastLED.show();
    delay(10);
  }
  delay(500);


  // --- EFFETTO 3: Flash Stroboscopico (Utile per quando scade il tempo!) ---
  Serial.println("Effetto: Flash Rosso");
  for(int f = 0; f < 5; f++) {
    leds[0] = CRGB::Red;   // Accendi Rosso pieno
    FastLED.show();
    delay(80);
    
    leds[0] = CRGB::Black; // Spegni (Il nero equivale a spento)
    FastLED.show();
    delay(80);
  }
  delay(1000);
}