# Issue 2: Firmware ESP32 per Gestione 4 Display LED e Separatore Colon

## Descrizione
La centralina ESP32 controlla attualmente una striscia di soli 28 LED, corrispondenti ad un singolo display a 7 segmenti a singola cifra (0-9).
Avendo assemblato i 4 display fisici completi di colon `:` centrale per i minuti/secondi, il firmware deve essere esteso per pilotare in cascata tutti i segmenti (112+ LED totali) e visualizzare il tempo nel formato `MM:SS`.

## Requisiti Firmware (Microcontrollore)
1. **Espansione LED totali**:
   - `NUM_LEDS` aumentato a: `4 cifre * 7 segmenti * 4 LED = 112 LED`.
   - Più gli eventuali LED dedicati ai due punti `:` centrali (colon).
2. **Indirizzamento Cifre**:
   - Creazione di una funzione `displayTime(int totalSeconds)` che suddivide i secondi in:
     - `Digit 0` (Decine di minuti): `(totalSeconds / 60) / 10`
     - `Digit 1` (Unità di minuti): `(totalSeconds / 60) % 10`
     - `Digit 2` (Decine di secondi): `(totalSeconds % 60) / 10`
     - `Digit 3` (Unità di secondi): `(totalSeconds % 60) % 10`
   - Ciascuna cifra scriverà sui rispettivi 28 LED consecutivi (es: Digit 0 usa LED 0-27, Digit 1 usa LED 28-55, ecc.).
3. **Gestione del Colon centrale `:`**:
   - I due punti centrali di separazione devono accendersi in rosso fisso (o lampeggiante a frequenza di 1Hz) quando il timer è in esecuzione (`STATE_TIMER`), e spegnersi quando il display è in standby (`STATE_IDLE`).
   - *Nota di cablaggio*: Dobbiamo configurare l'indice esatto dei LED del colon nella catena (se sono in serie tra il Digit 1 e il Digit 2, o alla fine).
4. **Macchina a Stati del Timer**:
   - **`START`**: avvia il countdown locale a partire dalla durata ricevuta.
   - **`PAUSE`**: blocca temporaneamente il conteggio lasciando le cifre correnti sul display.
   - **`STOP`**: spegne tutti i segmenti e riporta il dispositivo in standby (LED di bordo viola).
5. **Robustezza del Parsing JSON**:
   - Gestione dei nuovi comandi di controllo (`PAUSE`, `STOP`) e aggiornamento in tempo reale se la durata viene modificata a timer già avviato.
