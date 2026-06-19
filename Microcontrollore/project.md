# Progetto: ProPontedecimo - Tabellone Segnapunti Digitale "Memorial Gerry"

## 📝 Descrizione del Progetto

Questo firmware è sviluppato per gestire un tabellone segnapunti elettronico e un dashboard di gestione per il progetto sportivo **ProPontedecimo**, specificamente dedicato al torneo amateur **"Memorial Gerry The Cage"**. Il sistema pilota una serie di strisce LED indirizzabili per mostrare in tempo reale il punteggio (punti/gol) delle squadre e il timer di gioco, integrando transizioni visive ed effetti di esultanza dinamici.

---

## 🛠️ Architettura Hardware

### 1. Microcontrollore

- **Modello:** ESP32-S3 DevKitC-1 (Core Xtensa® dual-core a 32-bit LX7).
- **Configurazione di Programmazione:**
  - **Interfaccia di comunicazione:** Porta USB-to-UART (attualmente mappata su `COM14` in ambiente Windows dopo il bootloader).
  - **Impostazioni IDE:** Core `esp32 by Espressif Systems` (v3.3.10), scheda selezionata `ESP32S3 Dev Module`.
  - **USB CDC On Boot:** Impostato su `Enabled` per mantenere la stabilità della porta seriale durante i riavvii software senza richiedere combinazioni fisiche di tasti.

### 2. Output Visivo (LED)

- **Hardware:** Striscia LED indirizzabile modello **WS2812B** (Alimentazione a 5V, logica a 3.3V).
- **Pinout e Connessioni:**
  - **GND:** Collegato a un pin `GND` comune dell'ESP32-S3.
  - **5V / VCC:** Collegato al pin `5V` / `VIN` dell'ESP32-S3 (per i test di sviluppo via USB, la luminosità globale è limitata via software per evitare sovraccarichi).
  - **DIN (Data In):** Collegato al **GPIO 16** (`IO16`) dell'ESP32-S3. Questo pin supporta correttamente la comunicazione RMT hardware ad alta velocità.
- **LED di Diagnostica:** La scheda include un LED RGB integrato (NeoPixel di bordo) mappato sul **GPIO 48** (o GPIO 38 a seconda della revisione hardware), utilizzato per i test di connettività iniziali.

---

## 💻 Stack Software e Dipendenze

- **Framework:** Arduino Framework (IDE v2.3.9).
- **Libreria Principale di Gestione LED:** **FastLED** (v3.x).
  - _Motivazione della scelta:_ Sfrutta l'oggetto `CRGB` e lo spazio colore `CHSV` per gestire transizioni fluide, effetti stroboscopici e dissolvenze matematiche ottimizzate per architetture a 32-bit senza appesantire il loop principale.
- **Velocità Seriale (Log/Debug):** `115200 baud`.

---

## ⚙️ Logica del Firmware e Funzionalità Richieste

L'IDE deve implementare e assistere nello sviluppo delle seguenti funzioni logiche all'interno del file principale (`MemorialGerry.ino`):

1. **Struttura dei Numeri (Mappatura dei Segmenti):**
   La striscia LED fisica dovrà essere idealmente suddivisa in segmenti (stile display a 7 segmenti) per comporre i numeri del punteggio (Squadra Casa / Squadra Ospiti) e i minuti/secondi del cronometro.
2. **Gestione del Tempo (Timer):**
   Un sistema di temporizzazione non bloccante (basato su `millis()`, evitando l'uso di `delay()`) per gestire il countdown o il count-up del tempo di gioco.
3. **Effetti Visivi Avanzati (FastLED):**
   - **Stato di Idle/Attesa:** Sfumature o animazioni soft (es. effetto "respiro" o arcobaleno lento).
   - **Evento "Gol / Punto Segnato":** Flash stroboscopici intermittenti o animazioni a scorrimento rapido sui segmenti della squadra che ha segnato.
   - **Fine Tempo / Sirena:** Lampeggio stroboscopico rosso ad alta intensità su tutto il tabellone per simulare la fine del match.

---

## 🚀 Istruzioni per l'IDE (Contesto di Generazione del Codice)

Quando generi o modifichi il codice per questo progetto, assicurati di:

- Utilizzare sempre funzioni non bloccanti per evitare di congelare l'aggiornamento dei LED o la lettura dei dati seriali.
- Mantenere la direttiva `#define DATA_PIN 16` e definire in modo chiaro il numero totale di LED per la struttura del tabellone.
- Commentare il codice in italiano.
