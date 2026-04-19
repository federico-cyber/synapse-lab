# Spec · Capitolo 7 "Contact" — refactor: Calendly funzionante + email offuscata

**Data:** 2026-04-19
**Branch:** `feature/ch7-refactor`
**Worktree:** `.worktrees/ch7-refactor/`
**Autore:** Federico (Synapse Lab)

---

## Obiettivo

Tre problemi sul Capitolo 7 (`ChapterContact` in `src/chapters.jsx:308-394`):

1. La card "Prenota una call" ha CTA `Apri Calendly` ma **non fa nulla al click** (nessun onClick).
2. La card "Email diretta" mostra l'indirizzo `battistella.business@gmail.com` **in chiaro**, esposto allo scraping dei bot.
3. La card "Form conversazionale" è un **placeholder non implementato** — occupa uno slot della griglia senza utilità.

Obiettivo: rendere funzionante il booking call, rimuovere l'email in chiaro ovunque compaia nel sito, eliminare la card form.

## Non-obiettivi

- Non si progetta né si implementa un form di contatto (il "conversazionale" viene rimosso, punto).
- Non si rifattorizza il componente `ChapterContact` oltre lo stretto necessario.
- Non si toccano altri capitoli tranne il Capitolo 6 "About" (vedi sotto, dove l'email compare in chiaro).
- Niente analytics / tracking eventi (fuori scope).

---

## Scope

### File coinvolti

| File | Modifica |
|---|---|
| `src/chapters.jsx` | Rimuovere card 3; aggiungere onClick a card 1 (Calendly); aggiornare card 2 (no email visibile); aggiornare link Email nel footer Cap.7; aggiornare render contatti in Cap.6 About |
| `src/copy.js` | Rimuovere `COPY.contact.cards[2]`; rimuovere `email` da `cards[1]` + aggiungere `title`; modificare `about.contacts[0]` (rimuovere email/href in chiaro, aggiungere flag `obfuscated`) |
| `src/style.css` | Grid Cap.7 da 3 a 2 colonne simmetriche; rimuovere `.contact-email-card .email` (regola morta) |
| `src/email-obfuscate.js` | **Nuovo file** — utility per ricomporre l'indirizzo mai-in-DOM |
| `src/config.js` | **Nuovo file** — costante `CALENDLY_URL` placeholder |

### Fuori scope

- Nessun cambiamento a markup/CSS di altri capitoli.
- Nessun refactor di `chapters.jsx` oltre le funzioni toccate.
- Nessuna aggiunta di librerie.

---

## Architettura

### 1. Booking call — Calendly in nuova tab

Scelta: **Calendly free tier**. Motivo: free tier supporta 1 event type e prenotazioni illimitate, setup in 5 minuti, link stabile del tipo `https://calendly.com/HANDLE/30min`. Google Calendar Appointment Schedules richiede Workspace a pagamento, non disponibile sull'account di destinazione.

**Implementazione:**

Nuovo file `src/config.js`:
```js
export const CALENDLY_URL = 'https://calendly.com/YOUR-HANDLE/30min'; // TODO: sostituire dopo setup account
```

Nel componente card 1 (`ChapterContact`):
```jsx
import { CALENDLY_URL } from './config';

const openCall = () => window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');

<button className="contact-card reveal" data-magnet onClick={openCall}>…</button>
```

**Future-proofing:** spostare a Cal.com o altro provider richiede solo di cambiare la costante — nessun codice React modificato.

### 2. Email offuscata — strategia

**Principio:** la stringa `battistella.business@gmail.com` non compare mai nel codice sorgente committato né nel DOM renderizzato. Viene ricomposta a runtime solo all'interno di handler `onClick`.

Nuovo file `src/email-obfuscate.js`:
```js
const PARTS = ['battistella', 'business', 'gmail', 'com'];
export const getEmail = () => `${PARTS[0]}.${PARTS[1]}@${PARTS[2]}.${PARTS[3]}`;
```

Motivazione delle scelte:
- **Array di pezzi invece di una stringa** — nessun pattern `x@y.z` trovabile via regex statica.
- **`export` nominato** (non default) — il bundler Vite conserva il nome, ma i pezzi restano separati nel bundle finale.
- **Chiamato solo dentro handler** — garantisce che il prerender statico (Vite SSG / snapshot) non produca output contenente l'indirizzo completo.

**Verifica post-build:** `grep -r "battistella.business" dist/` deve restituire **zero match**.

### 3. Comportamenti per punto di contatto

| Punto | Markup | Comportamento click |
|---|---|---|
| Card 1 "Call" (Cap.7) | `<button>` | `window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer')` |
| Card 2 "Email" (Cap.7) | `<button>` | `navigator.clipboard.writeText(getEmail())` + mostra "Copiato" per 1.6s (comportamento esistente, cambia solo la sorgente) |
| Footer "Email" (Cap.7) | `<button>` | Prova `mailto:` + sempre copia negli appunti; mostra toast transiente "Email copiata" (1.6s) |
| About "Email" (Cap.6) | `<button>` | Come footer: `mailto:` + copia; mostra stessa toast |

Per footer + About si usa sempre la doppia azione (mailto + copia) perché:
- Alcuni utenti desktop non hanno un client mail configurato → `mailto:` fallisce silenziosamente; la copia negli appunti garantisce comunque l'azione utile.
- La card 2 del Cap.7 è dichiaratamente un "copia indirizzo" (l'action label è "Copia indirizzo"), quindi mantiene solo la copia (comportamento attuale).

**Feedback visivo toast (footer + About):** dopo il click mostra per 1.6s un piccolo messaggio "Email copiata" / "Email copied" vicino al bottone. Implementazione: state locale `useState(copied)` + `setTimeout`, identico al pattern già usato in `ChapterContact`. Nessun componente toast globale.

### 4. Layout — griglia 2 colonne

Attuale (`src/style.css:768-772`):
```css
.contact-grid { grid-template-columns: 1.2fr 1fr 1fr; }
```

Nuovo:
```css
.contact-grid { grid-template-columns: 1fr 1fr; }
```

**Rationale:** con 2 card (Call, Email) di "dignità visiva" comparabile, colonne simmetriche comunicano equivalenza e massimizzano lo spazio di ciascuna. La "preferenza" per la Call è già dichiarata nel copy (tag "Via preferita") e non serve un secondo segnale tramite peso di colonna.

**Mobile:** regola esistente `@media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr; } }` resta invariata.

**CSS morto da rimuovere:** `.contact-email-card .email` (righe 803-808) — stilava il testo email oggi rimosso.

### 5. Copy changes

**`COPY.contact.cards[1]`** (in `src/copy.js`):

Prima:
```js
{ tag: { it: "Email diretta", en: "Direct email" },
  email: "battistella.business@gmail.com",
  desc: { it: "Risposta entro 48h, sempre. Anche per dire di no.",
          en: "Reply within 48h, always. Even to say no." },
  action: { it: "Copia indirizzo", en: "Copy address" } }
```

Dopo:
```js
{ tag: { it: "Email diretta", en: "Direct email" },
  title: { it: "Scrivimi una <em>mail</em>", en: "Drop me a <em>line</em>" },
  desc: { it: "Risposta entro 48h, sempre. Anche per dire di no.",
          en: "Reply within 48h, always. Even to say no." },
  action: { it: "Copia indirizzo", en: "Copy address" } }
```

**`COPY.contact.cards[2]`** — rimosso interamente (form conversazionale).

**`COPY.about.contacts[0]`** (in `src/copy.js:145`):

Prima:
```js
{ label: "Email",  href: "mailto:battistella.business@gmail.com", text: "battistella.business@gmail.com" },
```

Dopo:
```js
{ label: "Email", obfuscated: true, labelIt: "Invia una mail", labelEn: "Send a mail" },
```

**Nota:** gli altri contatti dell'array (`X`, `GitHub`, `LinkedIn`) hanno `text` come stringa piatta (es. `"@battistella"`). Il render in `ChapterAbout` (`chapters.jsx:295-302`) gestirà entrambe le forme:
- Se `contact.obfuscated === true` → render `<button>` con testo `labelIt`/`labelEn` secondo `lang`.
- Altrimenti → render `<a>` esistente con `c.text`.

Nessuna modifica ai contatti non-email.

### 6. Accessibilità

- Tutti gli elementi "email" diventano `<button>` invece di `<a>`: non c'è un `href` reale da navigare e `<button>` comunica correttamente un'azione. Focus da tastiera, `Enter`/`Space` funzionano nativamente.
- `aria-label="Invia una mail"` aggiunto al bottone del footer Cap.7 (il testo visibile "Email" è generico).
- `span.copy-state` → aggiungere `aria-live="polite"` per annunciare "Copiato" agli screen reader.
- `rel="noopener,noreferrer"` sul `window.open` Calendly per sicurezza (previene `window.opener` leak).

### 7. Edge case

| Scenario | Mitigazione |
|---|---|
| `navigator.clipboard` non disponibile (HTTP non-secure, browser molto vecchi) | `if (navigator.clipboard)` guard; fallback a `document.execCommand('copy')` via textarea nascosta temporanea |
| `mailto:` non gestito (desktop senza client mail) | Il bottone copia sempre l'indirizzo negli appunti come side-effect; `mailto:` è bonus |
| `CALENDLY_URL` ancora placeholder | Al click apre la 404 Calendly — accettabile; il `// TODO` nel codice è il reminder |
| Prerender Vite | `getEmail()` chiamato solo dentro handler, mai durante render → l'HTML statico non contiene l'indirizzo |

---

## Test plan

### Test automatico

Build check post-implementazione (comando esplicito):
```sh
cd /Users/fede/Documents/siti-web/.worktrees/ch7-refactor/synapse-lab
npm run build
grep -r "battistella.business" dist/
```
**Criterio di successo:** il `grep` restituisce zero righe e ha exit code 1.

### Test manuale

Avvio dev server:
```sh
npm run dev
```

Checklist:
- [ ] Capitolo 7: griglia a 2 colonne su desktop, 1 colonna su mobile (≤768px)
- [ ] Capitolo 7 card 1: click → apre Calendly in nuova tab (il link sarà sul placeholder; verificare che si apre nuova tab, non importa la destinazione)
- [ ] Capitolo 7 card 2: click → appare "Copiato", `Cmd+V` in un editor incolla l'indirizzo corretto
- [ ] Capitolo 7 footer "Email": click apre client mail (se configurato) + copia l'indirizzo
- [ ] Capitolo 6 About "Invia una mail": click apre client mail + copia
- [ ] `Cmd+U` (View source): **zero** occorrenze di `battistella.business`
- [ ] DevTools Elements, `Ctrl+F` "battistella": **zero** occorrenze
- [ ] Tab-navigation: tutti i nuovi bottoni raggiungibili con Tab, attivabili con Enter/Space
- [ ] VoiceOver (`Cmd+F5`): bottoni email annunciati come "Invia una mail, bottone" o simile
- [ ] La card 3 "Form conversazionale" non esiste più in DOM

### Rollback

Il lavoro è su branch `feature/ch7-refactor` in worktree isolato. Rollback = `git worktree remove .worktrees/ch7-refactor --force && git branch -D feature/ch7-refactor`.

---

## Rischi

| Rischio | Probabilità | Mitigazione |
|---|---|---|
| Utente copia l'indirizzo corrotto (errore nel `PARTS` array) | Bassa | Test manuale: `Cmd+V` in Notes, verificare stringa esatta |
| Calendly URL placeholder dimenticato in produzione | Media | `// TODO` nel file `config.js`; checklist include verifica pre-deploy |
| `mailto:` fallback confuso per utente (non sa che la copia è avvenuta) | Bassa | Toast "Email copiata" dopo il click anche nei casi mailto |
| Prerender produce HTML con email in chiaro | Bassa | Test automatico `grep` dopo `npm run build` |

---

## Decisioni chiave e rationale

1. **Button invece di `<a href="mailto:">`** → `href` esporrebbe l'indirizzo nel DOM (obiettivo: zero occorrenze).
2. **Array di stringhe invece di HTML entities** → HTML entities sono decodificate dai bot moderni in millisecondi; separazione a runtime in JS è più robusta.
3. **Grid simmetrica 1fr 1fr invece di asimmetrica** → preferenza utente esplicita nel brainstorming (minore rischio visivo, layout pulito).
4. **Calendly invece di Cal.com** → setup più rapido, UX più curata out-of-the-box; Federico è principiante e l'onboarding Calendly è guidato.
5. **Copy email card: "Scrivimi una mail" / "Drop me a line"** → tono coerente col resto del copy di Synapse Lab (diretto, umano, non corporate).

---

## Prossimo passo

Dopo approvazione dello spec → invocare `superpowers:writing-plans` per generare il piano di implementazione.
