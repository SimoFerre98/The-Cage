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
  // --- EFFETTO: Collisione Cyberpunk (Comete Gemelle) ---
  // Due comete (una Ciano e una Magenta) partono dagli estremi opposti della striscia,
  // si scontrano nel mezzo (miscelandosi in Bianco) e tornano indietro, lasciando
  // una scia morbida e qualche scintilla (glitter) bianca casuale.

  static int pos1 = 0;
  static int pos2 = NUM_LEDS - 1;
  static int dir1 = 1;
  static int dir2 = -1;

  // 1. Dissolve leggermente i LED del frame precedente per creare la scia
  fadeToBlackBy(leds, NUM_LEDS, 45);

  // 2. Disegna la prima cometa (Ciano) usando l'operatore += per consentire la miscelazione colore
  leds[pos1] += CRGB::Cyan;

  // 3. Disegna la seconda cometa (Magenta)
  leds[pos2] += CRGB::Magenta;

  // 4. Aggiungi un luccichio/scintilla bianca casuale (glitter)
  if (random8() < 25) { // circa il 10% di probabilità per ogni frame
    leds[random16(NUM_LEDS)] += CRGB::White;
  }

  // Mostra l'effetto sulla striscia LED
  FastLED.show();
  delay(25); // Velocità di aggiornamento dell'effetto (più basso = più veloce)

  // 5. Aggiorna le posizioni delle comete
  pos1 += dir1;
  pos2 += dir2;

  // Inverti la direzione quando raggiungono i limiti della striscia
  if (pos1 == NUM_LEDS - 1 || pos1 == 0) {
    dir1 = -dir1;
  }
  if (pos2 == NUM_LEDS - 1 || pos2 == 0) {
    dir2 = -dir2;
  }
}