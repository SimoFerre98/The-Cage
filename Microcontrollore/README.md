# Microcontrollore - Memorial Gerry The Cage

Questa cartella contiene il firmware e il codice sorgente per il microcontrollore del progetto **Memorial Gerry The Cage**. Il sistema è progettato per interfacciarsi in tempo reale con il database Supabase del torneo, sincronizzando lo stato del tabellone LED fisico con i match LIVE.

---

## 📂 Struttura della Cartella

```text
Microcontrollore/
├── MemorialGerry/
│   ├── MemorialGerry.ino  # Sketch principale di Arduino
│   └── secrets.h          # File di configurazione credenziali Wi-Fi e API (Escluso da Git)
├── libraries/             # Librerie locali di Arduino (esclusa da Git)
└── .gitignore             # Configurazione Git per escludere file temporanei, build e credenziali
```

- **`MemorialGerry/`**: Contiene lo sketch principale e il file di intestazione per le credenziali private.
- **`MemorialGerry/secrets.h`**: Contiene le credenziali sensibili (SSID Wi-Fi, Password e Anon Key di Supabase). Questo file è aggiunto al `.gitignore` locale per evitare il tracciamento e la pubblicazione su repository pubblici.
- **`libraries/`**: Cartella destinata a ospitare le librerie esterne necessarie per la compilazione locale.
- **`.gitignore`**: Esclude i file di compilazione temporanei (es. `.elf`, `.hex`, `.o`), le cartelle di configurazione degli IDE (es. `.vscode/`, `.idea/`), le librerie locali e il file `secrets.h`.

---

## ⚡ Descrizione del Firmware (`MemorialGerry.ino`)

Il codice implementa una connessione WebSocket protetta a Supabase Realtime per monitorare gli eventi del torneo in tempo reale. 

### Funzionalità Principali:
1. **Connessione Wi-Fi e Auto-Reconnect**: Connessione automatica alla rete wireless configurata con logiche di ripristino in caso di disconnessione.
2. **REST API Fetch Iniziale**: All'avvio, l'ESP32 esegue una chiamata GET HTTPS a Supabase per verificare se ci sono partite attive (`status = 'LIVE'`), salvando i punteggi correnti (`home_score` e `away_score`).
3. **Sottoscrizione Realtime (WebSocket)**: Connessione all'endpoint WSS di Supabase usando il protocollo **Phoenix Channels** (gestione heartbeat ogni 30 secondi e messaggio di join sul canale `matches`).
4. **Analisi Eventi in Tempo Reale**: All'arrivo di un payload di aggiornamento (`postgres_changes` / `UPDATE`), il firmware confronta i punteggi locali e rileva se una delle due squadre ha segnato un gol.
5. **Macchina a Stati Non Bloccante**: La gestione dei LED avviene in modo asincrono (senza l'uso di `delay()` bloccanti nel loop principale) per garantire che il client WebSocket rimanga attivo e non perda la connessione.

### Stati dei LED e Animazioni:
* **`STATE_IDLE`**: Effetto arcobaleno dinamico che scorre sulla striscia LED, arricchito da scintillii bianchi casuali. Il LED integrato pulsa dolcemente di luce viola.
* **`STATE_GOAL_HOME` (Gol Casa)**: Lampeggio stroboscopico **Rosso** (durata 3 secondi) a massima intensità su tutti i LED e sul LED di bordo.
* **`STATE_GOAL_AWAY` (Gol Trasferta)**: Lampeggio stroboscopico **Blu** (durata 3 secondi) a massima intensità.
* **`STATE_START_MATCH` (Inizio Match)**: Riempimento progressivo della striscia LED di colore **Verde** (durata 2 secondi) per segnalare l'inizio o l'aggancio a una partita LIVE.
* **`STATE_END_MATCH` (Fine Match)**: Lampeggio rapido e continuo di colore **Rosso** (durata 5 secondi) a simulare la sirena di fine tempo.

---

## 🛠️ Configurazione Hardware e Connessioni

Nello sketch principale sono configurati i seguenti parametri:
* **Tipo LED Striscia**: `WS2812B` (ordine dei colori: `GRB`).
* **Numero di LED Striscia (`NUM_LEDS`)**: `60` (corrispondente a 1 metro di striscia LED standard da 60 LED/m. Espandibile moltiplicando il numero di LED per i metri totali).
* **Pin Striscia LED (`DATA_PIN`)**: GPIO `16` (`IO16`) dell'ESP32-S3.
* **Pin LED Integrato (`BOARD_LED_PIN`)**: GPIO `48` (NeoPixel integrato per diagnostica).
* **Luminosità Generale**: Limitata via software a `50` (su 255) per evitare un assorbimento di corrente eccessivo dalla porta USB del computer durante i test.

---

## 💻 Come Avviare e Compilare il Progetto

1. **Strumenti consigliati**:
   - Arduino IDE (versione 2.x o superiore) con il pacchetto delle schede `esp32 by Espressif Systems` installato.
   - Modello scheda da selezionare: `ESP32S3 Dev Module`.
   - Impostazione `USB CDC On Boot`: `Enabled` (consigliato per mantenere stabile il monitor seriale).

2. **Librerie richieste**:
   Installa le seguenti librerie tramite il **Gestore Librerie (Library Manager)** dell'Arduino IDE:
   - **FastLED** (di Daniel Garcia)
   - **ArduinoJson** (di Benoit Blanchon)
   - **WebSockets** (di Markus Sattler)

3. **Configurazione Credenziali**:
   Crea un file di nome `secrets.h` nella stessa cartella di `MemorialGerry.ino` compilando il seguente template:
   ```cpp
   #ifndef SECRETS_H
   #define SECRETS_H

   #define SECRET_SSID "NOME_TUA_RETE_WIFI"
   #define SECRET_PASS "PASSWORD_TUA_RETE_WIFI"

   #define SECRET_SUPABASE_HOST "IL_TUO_PROJECT_REF.supabase.co"
   #define SECRET_SUPABASE_ANON_KEY "LA_TUA_CHIAVE_ANON_DI_SUPABASE"

   #endif
   ```

4. **Caricamento**:
   - Collega l'ESP32-S3 al PC via USB.
   - Seleziona la porta COM corretta e avvia il caricamento (**Upload**).
   - Apri il **Monitor Seriale** impostando il baud rate a `115200` per monitorare la diagnostica di rete e gli eventi di ricezione gol.
