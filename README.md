# Memorial Gerry – The Cage

Piattaforma web e fisica per la gestione e la diffusione in tempo reale di un torneo di **calcio a 5** in stile **Kings League**, pensata per offrire un'esperienza moderna, mobile-first e coinvolgente sia al pubblico sugli spalti (via smartphone e tabellone LED) sia allo staff tecnico durante la gestione delle partite.

Il progetto nasce come **Memorial Gerry** ed è unificato sotto il nome **The Cage**. Comprende:

- un portale pubblico responsive (Astro + React Islands),
- un'area amministratore protetta con gestione completa di squadre, giocatori, partite ed eventi live,
- un microcontrollore **ESP32-S3** collegato a una striscia LED WS2812B che visualizza fisicamente i gol e gli stati di gara tramite sottoscrizione realtime a Supabase.

---

## ✨ Funzionalità

### � Sito pubblico

| Pagina | Descrizione |
| :--- | :--- |
| **Home / Hub** (`/`) | Dashboard con widget *Featured Match* (LIVE / Prossima / Terminata), anteprima classifica (top 3) e sezione *Esplora il Torneo* con rose di squadre e giocatori, ricerca live e toggle Squadre/Giocatori. |
| **Calendario** (`/calendario`) | Elenco partite raggruppate per giornata con stato pill (PROSSIMA / LIVE / TERMINATA) e vista **Tabellone** con integrazione dei quarti di finale. |
| **Classifica** (`/classifica`) | Vista classifica (PT, G, V, N, P, GF, GS, DR) e tab **Marcatori** con statistiche per giocatore. |
| **Carte Speciali** (`/carte`) | Catalogo delle power card in stile Kings League: Goal x2, Joker, Penalty, Shootout, Star Player, Suspension. |
| **Live Match** (`/live`) | Schermata full-immersion con score live, tabellino eventi minuto-per-minuto, rose formazioni, modale statistiche giocatore. |

### 🛠️ Area Admin (`/admin`)

- Autenticazione Supabase Auth.
- **Squadre & Giocatori**: CRUD completo, gestione ruoli (Portiere / Difensore / Centrocampista / Attaccante), rinomina squadre con refresh silenzioso, associazione loghi.
- **Partite**: creazione match, gestione gironi, transizione di stato PROSSIMA → LIVE → TERMINATA.
- **Live Controller**: timer gara, eventi (GOAL, YELLOW_CARD, RED_CARD, POWER_CARD) con minuto e dettaglio, voti MVP, monitoraggio centralina ESP32.
- Sincronizzazione realtime centralizzata (postgres_changes su `teams`, `players`, `matches`, `device_status`).

### 🔌 Hardware (`Microcontrollore/`)

- Firmware Arduino per **ESP32-S3** con:
  - Connessione Wi-Fi con auto-reconnect.
  - Fetch HTTPS iniziale per snapshot partite LIVE.
  - Sottoscrizione WebSocket (Phoenix Channels) a Supabase Realtime con heartbeat.
  - Macchina a stati non bloccante per la striscia LED (60 LED WS2812B).
- Stati LED: `IDLE` (arcobaleno dinamico), `GOAL_HOME` (strobo rosso), `GOAL_AWAY` (strobo blu), `START_MATCH` (verde progressivo), `END_MATCH` (sirena rossa).

### 📦 Progressive Web App (PWA)

- Service Worker (`/sw.js`) registrato solo in produzione.
- `manifest.json` + icone + `apple-touch-icon`.
- Banner di installazione dedicati per **Android/Chrome** (cattura `beforeinstallprompt`) e **iOS/Safari** (guida manuale).
- Pagina `offline.html` per il fallback offline.

---

## 🧱 Architettura

### Frontend

- **Astro 6.x** con approccio **Islands Architecture** e rendering statico di default.
- **React 19** idratato in modo selettivo:
  - `client:load` → componenti critici interattivi (Home, Live, AdminApp).
  - `client:visible` → sezioni below-the-fold (Calendario, Classifica, Carte).
  - `client:only="react"` → AdminApp (no fallback SSR).
- **View Transitions** (`astro:transitions`) per una navigazione SPA-like (`<ClientRouter />`).
- **Tailwind CSS 4** via plugin Vite (`@tailwindcss/vite`).
- **Code-splitting** manuale in `astro.config.mjs`: chunk separati per `supabase`, `react-vendor`, `vendor`.

### Backend

- **Supabase** come piattaforma BaaS:
  - Database PostgreSQL con **RLS** abilitata su tutte le tabelle.
  - **Supabase Auth** per l'area admin.
  - **Supabase Realtime** (`supabase_realtime` publication) per `matches`, `match_events`, `mvp_votes`.
  - **Edge functions / migration** gestite via CLI Supabase.

### Hardware ↔ Cloud

```
┌─────────────┐   HTTPS/WSS   ┌──────────────┐    postgres_changes   ┌────────────┐
│  ESP32-S3   │ ────────────► │   Supabase   │ ────────────────────► │   React    │
│  + LED STRIP│               │  (Realtime)  │                       │  Islands   │
└─────────────┘               └──────────────┘                       └────────────┘
```

---

## 🗄️ Schema Database

Tabelle principali definite in `supabase/migrations/`:

| Tabella | Campi chiave |
| :--- | :--- |
| `teams` | `id`, `name`, `group_name` |
| `players` | `id`, `team_id`, `name`, `role` (portiere / difensore / centrocampista / attaccante) |
| `matches` | `id`, `home_team_id`, `away_team_id`, `match_date`, `round`, `status` (PROSSIMA / LIVE / TERMINATA), `home_score`, `away_score` |
| `match_events` | `id`, `match_id`, `player_id`, `team_id`, `minute`, `type` (GOAL / YELLOW_CARD / RED_CARD / POWER_CARD), `detail` |
| `mvp_votes` | `id`, `match_id`, `player_id`, `voter_id` |
| `device_status` | `id` (default `esp32_centralina`), `last_seen` |

Sono inoltre definite viste ottimizzate per le statistiche giocatori e l'aggregazione dei voti MVP.

### Policy RLS

- **Lettura pubblica** su tutte le tabelle principali (chiunque può consultare squadre, giocatori, match ed eventi).
- **Insert anonimo** consentito su `mvp_votes` (voto MVP da pubblico).
- Policy admin dedicate (vedi `20260528234417_admin_rls.sql`) per scrittura autenticata.

---

## 🗂️ Struttura del Repository

```text
/
├── public/                         # Asset statici (loghi, sfondi, manifest, sw.js)
│   ├── Logos/                      # Loghi squadre e sponsor
│   ├── Sfondo/                     # Sfondi campo
│   └── cards/                      # Power card (goalx2, joker, penalty, shootout, ...)
├── src/
│   ├── components/                 # React Islands + componenti condivisi
│   │   ├── admin/                  # Dashboard, MatchesManager, TeamsPlayersManager, LiveController, ...
│   │   ├── HomeIsland.tsx
│   │   ├── CalendarioIsland.tsx
│   │   ├── ClassificaIsland.tsx
│   │   ├── CarteIsland.tsx
│   │   ├── LiveMatchIsland.tsx
│   │   ├── PlayerStatsModal.tsx
│   │   ├── LiquidNav.tsx           # Bottom-nav glassmorfica mobile
│   │   ├── TopBar.tsx              # Top bar fissa
│   │   └── GlassEffect.tsx         # Wrapper glassmorfico con filtro SVG
│   ├── layouts/
│   │   ├── Layout.astro            # Layout pubblico standard
│   │   └── LayoutLive.astro        # Layout full-bleed per Live Match
│   ├── lib/
│   │   ├── supabase.ts             # Client Supabase (variabili PUBLIC_*)
│   │   ├── cache.ts                # fetchWithCache (SWR-lite) con localStorage
│   │   └── teamUtils.ts            # getTeamLogo, parsePlayerName, mapping loghi
│   ├── pages/
│   │   ├── index.astro             # Home
│   │   ├── calendario.astro
│   │   ├── classifica.astro
│   │   ├── carte.astro
│   │   ├── live.astro
│   │   └── admin.astro
│   └── styles/global.css
├── supabase/
│   ├── migrations/                 # Migrazioni SQL numerate (schema + seed + RLS + viste)
│   ├── seed.sql                    # Snapshot dati di seed
│   └── config.toml
├── Microcontrollore/               # Firmware Arduino ESP32-S3
│   ├── MemorialGerry/
│   │   └── MemorialGerry.ino       # Sketch principale (LED + Supabase Realtime)
│   ├── MemorialGerryTimer/
│   ├── TestSetteSegmenti/
│   └── project.md
├── .agents/                        # Workflow agenti AI
│   ├── backlog/                    # Sprint file (01-25)
│   ├── skills/                     # Skill locali (supabase, postgres best practices)
│   └── RULES.md                    # Regole di sviluppo per agenti
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── task.md                         # Tracking centralizzato stato sprint
├── walkthrough.md                  # Riassunto modifiche recenti
└── website.md                      # Brief iniziale del progetto
```

---

## 🛠️ Stack Tecnologico

| Layer | Tecnologia | Versione |
| :--- | :--- | :--- |
| Framework | [Astro](https://astro.build) | `^6.3.5` |
| UI runtime | [React](https://react.dev) | `^19.2.6` |
| Styling | [Tailwind CSS](https://tailwindcss.com) via Vite | `^4.3.0` |
| BaaS | [Supabase](https://supabase.com) (`@supabase/supabase-js`) | `^2.106.2` |
| DB driver (script) | `pg` | `^8.21.0` |
| Linguaggio | TypeScript | — |
| Hardware | ESP32-S3 + FastLED + ArduinoJson + WebSockets | — |

Requisito Node: `>=22.12.0`.

---

## 🚀 Comandi

Tutti i comandi si eseguono dalla root del progetto:

| Comando | Azione |
| :--- | :--- |
| `npm install` | Installa le dipendenze |
| `npm run dev` | Avvia il dev server su `http://localhost:4321` |
| `npm run build` | Build di produzione in `./dist/` |
| `npm run preview` | Anteprima locale della build di produzione |
| `npm run astro ...` | CLI Astro (es. `astro add`, `astro check`) |

### Variabili d'ambiente

Il client Supabase legge da `.env`:

```env
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Per il firmware ESP32 vedere `Microcontrollore/MemorialGerry/secrets.h` (vedi README della sottocartella).

---

## 🧞 Flusso di Lavoro Agenti

Tutti gli agenti AI che lavorano sul repository devono seguire le regole in [`.agents/RULES.md`](./.agents/RULES.md). In sintesi:

1. Consultare `.agents/backlog/` prima di iniziare qualsiasi modifica.
2. Per ogni nuova task, creare `sprint-[N]-[titolo].md` con obiettivi **INVEST** e checklist.
3. Aggiornare lo stato in `task.md` (flag `[/]` in corso, `[x]` completato).
4. Lavorare sempre in un branch dedicato (es. `sprint-26-nome-feature`) e mergiare su `main` solo dopo verifica (`npm run build`).
5. Documentare ogni sprint in `walkthrough.md`.

---

## � Stato del Progetto

Tracciamento completo degli sprint in [`task.md`](./task.md). Ad oggi:

- ✅ **Sprint 1–14, 19–25** completati (MVP foundation, ottimizzazioni, nuove feature, overhaul admin, integrazione rosters, effetti grafici, modale statistiche, tabellone quarti).
- ⏳ **Sprint 15, 16, 17, 18** ancora aperti (admin UX testing, dettaglio partite, indicatore live broadcast, SEO/social sharing).

Il progetto è un prototipo evoluto, pienamente utilizzabile per la gestione di un'edizione reale del torneo.

---

## 🏟️ Squadre del Torneo

Il torneo è composto da **11 squadre** seedate via migrazioni Supabase, tra cui:

`Amatori Calcio Genova` · `Tama` · `Mario` · `Sezione 164` · `Gli Umili` · `Aston Birra` · `Taverna` · `UCG (Bairon)` · `Lo Dico FC` · `Chainz (Andrea Robbiano)` · `Martino Gonzalez`

I loghi ufficiali sono in `public/Logos/` e il mapping nome → logo è gestito in `src/lib/teamUtils.ts`.

---

## 📄 Licenza

Progetto privato a uso interno del torneo *Memorial Gerry – The Cage*.
