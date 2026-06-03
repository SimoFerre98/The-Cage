# Regole di Sviluppo per Agenti AI

Questo documento definisce il flusso di lavoro e le regole obbligatorie che ogni agente AI deve rispettare quando lavora su questo repository.

---

## 1. Gestione del Backlog e delle Task
- **Prima di iniziare qualsiasi modifica**: L'agente DEVE ispezionare la cartella [.agents/backlog/](file:///c:/Users/s.ferrero/Code/The%20Cage/.agents/backlog/).
- **Se la task esiste già**: L'agente deve leggerla attentamente per comprendere obiettivi e specifiche. Se necessario, può arricchire la task con ulteriori dettagli tecnici.
- **Se si tratta di una nuova modifica/funzionalità**: L'agente DEVE creare un nuovo file di backlog nella cartella `.agents/backlog/` denominato `sprint-[numero]-[titolo-task].md`, definendo:
  - Gli obiettivi in formato **INVEST** (Independent, Negotiable, Valuable, Estimable, Small, Testable).
  - Una checklist precisa dei passaggi da compiere.
  - Le specifiche tecniche delle modifiche programmate.
- **Aggiornamento dello stato**: Il file generale [task.md](file:///c:/Users/s.ferrero/Code/The%20Cage/task.md) funge da **Punto di Tracciamento Centralizzato** di tutto il progetto. Ogni agente deve aggiornarlo tassativamente come segue:
  - All'avvio del lavoro su una task, lo stato nel file `task.md` deve essere impostato su **In corso** utilizzando il flag `[/]` (es. `[/] **Sprint 6...**`).
  - Al termine dello sviluppo, dopo il merge sul branch `main`, lo stato deve essere impostato su **Completato** con il flag `[x]` (es. `[x] **Sprint 6...**`).
  - La checklist all'interno del file di sprint specifico in `.agents/backlog/` deve anch'essa essere aggiornata regolarmente segnando le sotto-attività completate con `[x]`.

---

## 2. Gestione dei Branch Git (Workflow di Sviluppo)
- **Creazione del Branch**: Prima di scrivere codice o effettuare modifiche ai file di progetto, l'agente deve creare un branch di sviluppo dedicato.
  - Il nome del branch deve coincidere con quello specificato all'interno del file della task (es. `sprint-6-swr-classifica`).
  - Comando per creare e spostarsi sul branch:
    ```bash
    git checkout -b nome-branch
    ```
- **Sviluppo e Commits**: L'agente effettua le modifiche ed esegue commit atomici e chiari man mano che completa i punti della checklist.
- **Verifica**: Prima del merge, l'agente deve avviare la build di produzione (`npm run build`) o eseguire verifiche per assicurarsi che non ci siano errori TypeScript o di runtime.
- **Merge**: A lavoro completato ed approvato dall'utente, l'agente deve spostarsi sul branch principale (`main`), effettuare il merge del branch di sviluppo ed eliminare il branch locale temporaneo:
  ```bash
  git checkout main
  git merge nome-branch
  git branch -d nome-branch
  ```
- **Documentazione**: Al termine di ogni sprint, deve essere creato o aggiornato un file di walkthrough (`walkthrough.md`) per riassumere i risultati ottenuti.
