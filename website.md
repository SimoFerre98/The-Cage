Act as an expert frontend engineer specializing in Astro and high-performance React Islands. I need you to create a high-fidelity frontend prototype (mock) for a 5-a-side football tournament web application called 'Memorial Gerry The Cage'.

**Goal:** Replicate the feature set and layout of the 'Sanci Arena' website shown in the attached screenshots, but adapt it for our local tournament, using **Astro** for maximum performance and **React** for interactive elements.

**Core Requirement:**
Build a frontend-only prototype using **Astro** (static-first approach) with the **React integration** enabled. Use **Tailwind CSS** for styling. **Do not build a backend yet.** Use hardcoded mock data that mimics a future real-time database structure.

**UI/UX & Performance Guidelines (Critical):**

1. **Mobile-First Design:** Perfectly optimized for smartphones first, then scale to desktops.
2. **Aesthetic (Modern, Pills & Transparency):** Create a highly modern, sleek interface. Use **'pill-shaped'** UI elements extensively (fully rounded corners for buttons, tabs, segmented controls, and badges). Implement **transparency and glassmorphism effects** (e.g., using Tailwind's `backdrop-blur` and semi-transparent backgrounds for the navigation bar, sticky headers, or modals) to give it a premium, iOS-like feel. Maintain the core palette: deep navy blue, crisp white, and subtle grays.
3. **Native Performance:** Use Astro for all static text. Only use React where interactivty is needed (Toggles, Modals, Expandable sections). Use the `client:load` or `client:visible` directives appropriately to keep JS payload low.
4. **Fluid Navigation:** Enable Astro's native **View Transitions** (`import { ViewTransitions } from 'astro:transitions';`) in the main layout. Transition between pages (like Calendar to Standings) must be smooth and appear like a Single Page Application (SPA), not a full page refresh.
5. **Side Navigation:** Replicate the sidebar (Logo, 'Install App' button, Hub, Calendar, Standings, Livestreams). On mobile, this must automatically transform into a slick hamburger menu or a fixed bottom navigation bar (using a glassmorphism effect).

**Specific Pages/Features to Implement (using hardcoded mock data):**

**1. 'Hub' Page (Astro component with React Island):**

- Static Astro Shell: Page header 'Hub', subtitle 'Squadre e giocatori', total player count (e.g., '99 giocatori').
- React Island Component (`client:load`): A component to manage the segmented pill control toggle ('Squadre' vs 'Giocatori') and the expandable team list.
- Team List Data: **IMPORTANT: Use these following real team names instead of national flags for 11 entries:**
  - Amatori Calcio Genova
  - Tama
  - Mario
  - Corsi
  - Montarsolo
  - Dario
  - Taverna
  - UCG (Bairon)
  - Samu Betti
  - chainz Andrea Robbiano
  - Martino Gonzalez
- Interaction: Tapping a team should expand a mock roster (list of 9 player names per team) with a smooth animation.

**2. 'Calendario' Page (Astro component with React Island):**

- Static Astro Shell: 'Calendario' header.
- React Island Component (`client:visible`): A list of match cards.
- Interaction: Date/Time (e.g., 'lun 25 mag, 21:00'), Status ('TERMINATA' or 'PROSSIMA' inside a pill badge), Round ('Girone A'). Use our real team names with believable scores (e.g., 'Montarsolo 4 - 2 Tama').

**3. 'Classifica' Page (Astro component with React Island):**

- Static Astro Shell: 'Classifica' header.
- React Island Component (`client:load`): Manage the 'info' button (to open a glassmorphism legend modal), and the 'Squadre' / 'Marcatori' pill toggle. Renders the 'Vista classifica' data table, using our real team names, sorted by Points (PT).

**Deliverable:** A complete, interactive Astro+React repository or sandbox link. Ensure every navigation element works with seamless View Transitions
