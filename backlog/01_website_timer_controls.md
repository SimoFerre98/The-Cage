# Issue 1: Pannello di Regia Web per Gestione Timer Avanzata

## Descrizione
L'attuale gestione del timer nel pannello di amministrazione (`LiveController.tsx`) è estremamente semplice: permette solo di selezionare una durata prefissata da un menu a tendina e premere Start o Stop.
Vogliamo evolvere l'interfaccia inserendo controlli completi e intuitivi per la gestione dei 4 display fisici (Minuti e Secondi).

## Requisiti UI/UX (Pannello Admin)
1. **Controlli di Timing Principali**:
   - Pulsante **Avvia (Play) `▶️`**: avvia o riprende il countdown.
   - Pulsante **Pausa `⏸️`**: ferma temporaneamente il tempo salvando i secondi rimanenti nel database.
   - Pulsante **Reset / Ferma `⏹️`**: spegne il timer e ripristina la visualizzazione a zero/idle.
2. **Preset Rapidi per Carte Speciali**:
   - Chips/Pulsanti rapidi per preimpostare istantaneamente la durata corretta delle carte giocate:
     - 🃏 **Joker** (Imprevisto) -> Durata custom (es: 30 secondi)
     - 🌟 **Star Player** -> 3 minuti (180s)
     - 🔥 **Goal X2** -> 3 minuti (180s)
     - ⛔ **Sospensione** -> 3 minuti (180s)
     - ⚡ **Shootout** -> 15 secondi (15s)
     - 🎯 **Rigore** -> 15 secondi (15s)
3. **Modificatori di Tempo al Volo**:
   - Pulsanti per aggiungere o sottrarre tempo rapidamente durante il gioco:
     - `+1m` / `-1m` (Aggiunge/toglie 60 secondi)
     - `+10s` / `-10s` (Aggiunge/toglie 10 secondi)
4. **Input Manuale e Visualizzazione**:
   - Un visualizzatore digitale (stile orologio `MM:SS`) che simula il countdown locale del display.
   - Un campo di inserimento orario (Minuti e Secondi separati o input numerico) per impostare manualmente qualsiasi valore personalizzato (es. 2 minuti e 45 secondi).

## Protocollo Database (Tabella `timer_control`)
Le modifiche sul sito si rifletteranno sulla riga `timer_1` della tabella `timer_control`:
- `command`: cambierà tra `'START'`, `'PAUSE'`, `'STOP'`.
- `duration`: conterrà il tempo residuo corrente in secondi.
- `updated_at`: timestamp per notificare la centralina del cambiamento in tempo reale.
