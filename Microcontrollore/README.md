# Microcontrollore - Memorial Gerry The Cage

Questa cartella contiene il firmware e il codice sorgente per il microcontrollore del progetto **Memorial Gerry The Cage**. Il codice è progettato per gestire indicatori visivi fisici (ad esempio strisce o singoli LED RGB) utilizzati sul campo o sul tabellone del torneo.

---

## 📂 Struttura della Cartella

```text
Microcontrollore/
├── MemorialGerry/
│   └── MemorialGerry.ino  # Sketch principale di Arduino
├── libraries/             # Librerie locali di Arduino (esclusa da Git)
└── .gitignore             # Configurazione Git per escludere file di compilazione e librerie locali
```

- **`MemorialGerry/`**: Contiene lo sketch Arduino principale (`MemorialGerry.ino`) che implementa gli effetti visivi.
- **`libraries/`**: Cartella destinata a ospitare le librerie esterne necessarie per la compilazione locale. È configurata nel `.gitignore` per evitare di caricare file ridondanti su GitHub.
- **`.gitignore`**: Esclude i file di compilazione temporanei (es. `.elf`, `.hex`, `.o`), le cartelle di configurazione degli IDE (es. `.vscode/`, `.idea/`) e le librerie locali.

---

## ⚡ Descrizione del Firmware (`MemorialGerry.ino`)

Il codice pilota un LED RGB indirizzabile (modello **WS2812B**) e implementa tre effetti visivi ciclici, stampando informazioni di debug sulla porta seriale a `115200` baud:

1. **Effetto 1: Respiro Blu (Breathing)**
   - Effetto di dissolvenza fluida (fade-in e fade-out) sul colore blu. Utilizza la funzione nativa `nscale8` per variare in modo logaritmico/lineare l'intensità luminosa.
   
2. **Effetto 2: Arcobaleno Continuo (Rainbow)**
   - Ciclo continuo di colori ad arcobaleno per 5 secondi. Utilizza la funzione `beat8` per generare una variazione costante della tonalità (Hue) nello spazio colore HSV.

3. **Effetto 3: Flash Stroboscopico Rosso (Strobe)**
   - Lampeggio rapido e intermittente di colore rosso (5 flash). Questo effetto è pensato per segnalare la **scadenza del tempo** o eventi di allerta durante i match del torneo.

---

## 🛠️ Configurazione Hardware e Connessioni

Nello sketch principale sono configurati i seguenti parametri:
* **Tipo LED**: `WS2812B` (ordine dei colori: `GRB`)
* **Numero di LED (`NUM_LEDS`)**: `1` (espandibile per strisce LED configurando il valore)
* **Pin di Connessione (`DATA_PIN`)**: `48` (in caso di mancata risposta dopo il reset hardware, provare a configurare il pin `38`)
* **Luminosità Generale**: Impostata a `40` (su una scala da 0 a 255) per evitare surriscaldamenti e abbagliamenti durante i test.

---

## 💻 Come Avviare e Compilare il Progetto

1. **Strumenti consigliati**:
   - Arduino IDE (versione 2.x o superiore) oppure VS Code con l'estensione **Arduino** o **PlatformIO**.
2. **Librerie necessarie**:
   - **FastLED** (installabile tramite il Library Manager dell'Arduino IDE o scaricandola all'interno della cartella `libraries/`).
3. **Caricamento**:
   - Collega la scheda di sviluppo al PC.
   - Seleziona la porta corretta e il modello della scheda (es. ESP32 o Arduino compatibile).
   - Clicca su **Carica (Upload)**.
   - Apri il monitor seriale impostando il baud rate a `115200` per visualizzare i log di debug degli effetti.
