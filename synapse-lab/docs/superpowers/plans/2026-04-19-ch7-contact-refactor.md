# Ch7 Contact Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere funzionante il booking call via Calendly, rimuovere l'email in chiaro ovunque nel sito, eliminare la card "Form conversazionale".

**Architecture:** Due nuove utility (`src/config.js` con URL Calendly, `src/email-obfuscate.js` con ricomposizione email a runtime). Il componente `ChapterContact` passa da grid 3-col a grid 2-col simmetrica. Il componente `ChapterAbout` gestisce un nuovo flag `obfuscated: true` nei contatti. In tutti i punti di contatto, l'email non esiste mai come stringa completa nel sorgente né nel DOM renderizzato: viene ricomposta solo dentro handler `onClick`.

**Tech Stack:** React 18, Vite 5, CSS vanilla. Nessun test runner installato → verifica via `npm run build`, `grep` sul `dist/`, e check manuale tramite `npm run dev`.

**Worktree:** Tutti i comandi vanno eseguiti da `/Users/fede/Documents/siti-web/.worktrees/ch7-refactor/synapse-lab`.

**Spec di riferimento:** `docs/superpowers/specs/2026-04-19-ch7-contact-refactor-design.md`

---

## Pre-requisiti

- Worktree esistente in `/Users/fede/Documents/siti-web/.worktrees/ch7-refactor/`
- Branch attivo: `feature/ch7-refactor`
- `npm install` già eseguito
- Baseline build: ✅ (41 moduli)

Tutti i comandi presuppongono: `cd /Users/fede/Documents/siti-web/.worktrees/ch7-refactor/synapse-lab`.

**Nota su un pattern del codebase:** il componente `ChapterContact` (e altri) usa un pattern di inner-HTML React combinato con un helper `rawHtml = (s) => ({ __html: s })`. In più punti del codebase, i titoli con `<em>` vengono renderizzati con quel pattern. In questo piano, quando serve quel pattern, il riferimento è **"usa lo stesso pattern inner-HTML delle altre card"** — guarda ad esempio il titolo della card 1 `cards[0]` in `ChapterContact` per copiare la forma esatta.

---

## Task 1: Utility — config e email-obfuscate

**Files:**
- Create: `src/config.js`
- Create: `src/email-obfuscate.js`

- [ ] **Step 1.1: Crea `src/config.js`**

Crea il file `src/config.js` con questo contenuto esatto:

```js
// Configurazione runtime per link esterni.
// NOTA: il link Calendly è un placeholder — sostituire dopo aver creato
// l'account Calendly con l'event type da 30 minuti.
export const CALENDLY_URL = 'https://calendly.com/YOUR-HANDLE/30min'; // TODO
```

- [ ] **Step 1.2: Crea `src/email-obfuscate.js`**

Crea il file `src/email-obfuscate.js` con questo contenuto esatto:

```js
// Offuscamento email: i pezzi stanno in un array, mai come stringa
// completa nel sorgente né nel DOM renderizzato. Ricomposizione
// solo a runtime dentro handler onClick.

const PARTS = ['battistella', 'business', 'gmail', 'com'];

export const getEmail = () => `${PARTS[0]}.${PARTS[1]}@${PARTS[2]}.${PARTS[3]}`;

export async function copyEmailToClipboard() {
  const email = getEmail();
  if (!navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(email);
    return true;
  } catch {
    return false;
  }
}

export function openMailto() {
  window.location.href = 'mailto:' + getEmail();
}
```

- [ ] **Step 1.3: Verifica build**

Run: `npm run build`
Expected: output termina con `✓ built in <ms>ms`, nessun errore.

- [ ] **Step 1.4: Verifica che il bundle non contenga la stringa email**

Run: `grep -rn "battistella.business@gmail.com" dist/`
Expected: exit code 1, nessun output.

- [ ] **Step 1.5: Commit**

```bash
git add src/config.js src/email-obfuscate.js
git commit -m "feat(contact): aggiungi utility CALENDLY_URL e getEmail offuscato

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Aggiornamento `src/copy.js`

**Files:**
- Modify: `src/copy.js` — circa righe 145, 163-167, 168-172

- [ ] **Step 2.1: Aggiorna il contatto email in About (riga 145)**

Sostituisci esattamente questa riga:

```js
      { label: "Email",  href: "mailto:battistella.business@gmail.com", text: "battistella.business@gmail.com" },
```

Con:

```js
      { label: "Email", obfuscated: true, cta: { it: "Invia una mail", en: "Send a mail" } },
```

Gli altri elementi dell'array `contacts` (X, GitHub, LinkedIn) restano invariati.

- [ ] **Step 2.2: Aggiorna card 2 del Capitolo 7**

Sostituisci esattamente questo blocco:

```js
      { tag: { it: "Email diretta", en: "Direct email" },
        email: "battistella.business@gmail.com",
        desc: { it: "Risposta entro 48h, sempre. Anche per dire di no.",
                en: "Reply within 48h, always. Even to say no." },
        action: { it: "Copia indirizzo", en: "Copy address" } },
```

Con:

```js
      { tag: { it: "Email diretta", en: "Direct email" },
        title: { it: "Scrivimi una <em>mail</em>", en: "Drop me a <em>line</em>" },
        desc: { it: "Risposta entro 48h, sempre. Anche per dire di no.",
                en: "Reply within 48h, always. Even to say no." },
        action: { it: "Copia indirizzo", en: "Copy address" } },
```

Cambiato: rimossa `email`, aggiunta `title`.

- [ ] **Step 2.3: Rimuovi card 3 (Form conversazionale)**

Rimuovi completamente questo blocco:

```js
      { tag: { it: "Preferisci scrivere?", en: "Prefer to type?" },
        title: { it: "Form <em>conversazionale</em>", en: "Conversational <em>form</em>" },
        desc: { it: "Tre domande, una alla volta. Senza tendine, senza checkbox.",
                en: "Three questions, one at a time. No dropdowns, no checkboxes." },
        action: { it: "Inizia la conversazione", en: "Start the conversation" } },
```

L'array `cards` deve contenere **esattamente 2 elementi** (Call, Email) dopo la rimozione. Controlla che la parentesi `]` chiuda correttamente e che `footer: { ... }` resti valido.

- [ ] **Step 2.4: Verifica build**

Run: `npm run build`
Expected: build passa, nessun errore JS.

- [ ] **Step 2.5: Verifica che il bundle non contenga più l'email**

Run: `grep -rn "battistella.business@gmail.com" dist/`
Expected: exit code 1, nessun output.

- [ ] **Step 2.6: Commit**

```bash
git add src/copy.js
git commit -m "refactor(copy): rimuovi email in chiaro + card form conversazionale

- COPY.about.contacts[0]: flag obfuscated + label i18n
- COPY.contact.cards[1]: rimossa email, aggiunto title
- COPY.contact.cards[2]: rimossa completamente

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: ChapterContact — import + handler + card 1 Calendly

**Files:**
- Modify: `src/chapters.jsx` — import block (riga 7-8) e inizio `ChapterContact` (circa 309-318), più markup card 1 (circa 328-338)

- [ ] **Step 3.1: Aggiorna gli import in cima al file**

Trova le righe 7-8:

```js
import { useState, useEffect, useRef, useMemo } from 'react';
import { COPY } from './copy.js';
```

Sostituisci con:

```js
import { useState, useEffect, useRef, useMemo } from 'react';
import { COPY } from './copy.js';
import { CALENDLY_URL } from './config.js';
import { copyEmailToClipboard, openMailto } from './email-obfuscate.js';
```

Gli extra import servono nei task successivi — metterli ora evita di toccare lo stesso blocco più volte.

- [ ] **Step 3.2: Aggiungi state e handler in `ChapterContact`**

Trova:

```jsx
function ChapterContact({ lang, onToggleTheme, theme }) {
  const C = COPY.contact;
  const [copied, setCopied] = useState(false);
  const copyEmail = () => {
    const email = C.cards[1].email;
    if (navigator.clipboard) navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
```

Sostituisci con:

```jsx
function ChapterContact({ lang, onToggleTheme, theme }) {
  const C = COPY.contact;
  const [copied, setCopied] = useState(false);
  const [footerCopied, setFooterCopied] = useState(false);

  const copyEmail = async () => {
    await copyEmailToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const openCall = () => {
    window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
  };

  const mailAndCopy = async () => {
    await copyEmailToClipboard();
    openMailto();
    setFooterCopied(true);
    setTimeout(() => setFooterCopied(false), 1600);
  };
```

`footerCopied` e `mailAndCopy` serviranno al Task 7 (footer) — dichiararli ora evita un secondo diff sullo stesso blocco.

- [ ] **Step 3.3: Aggiungi `onClick` alla card 1**

Trova la riga della card "Prenota una call":

```jsx
        <button className="contact-card reveal" data-magnet>
```

Sostituisci con:

```jsx
        <button className="contact-card reveal" data-magnet onClick={openCall}>
```

(Unica aggiunta: `onClick={openCall}`.)

- [ ] **Step 3.4: Verifica build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 3.5: Verifica nel browser**

Run: `npm run dev`
Apri `http://localhost:5173`. Scorri al Capitolo 7. Click sulla card "Prenota una call".
Expected: nuova tab con URL `https://calendly.com/YOUR-HANDLE/30min` (sarà 404 placeholder — ok).
Ferma dev server.

- [ ] **Step 3.6: Commit**

```bash
git add src/chapters.jsx
git commit -m "feat(ch7): card Prenota una call apre Calendly in nuova tab

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: ChapterContact — card 2 senza email visibile

**Files:**
- Modify: `src/chapters.jsx` — markup card 2 email (circa righe 340-350)

- [ ] **Step 4.1: Aggiorna il markup della card 2**

Trova questo blocco nel componente `ChapterContact`:

```jsx
        <button className={`contact-card contact-email-card reveal ${copied ? 'copied' : ''}`} data-magnet onClick={copyEmail}>
          <div>
            <span className="tag">{L(C.cards[1].tag.it, C.cards[1].tag.en)}</span>
            <p className="email" style={{ marginTop: 20 }}>{C.cards[1].email}</p>
            <p className="desc" style={{ marginTop: 14 }}>{L(C.cards[1].desc.it, C.cards[1].desc.en)}</p>
          </div>
          <div className="action">
            <span>{copied ? (lang === 'en' ? 'Copied' : 'Copiato') : L(C.cards[1].action.it, C.cards[1].action.en)}</span>
            <span className="copy-state">✓</span>
          </div>
        </button>
```

Applica **queste tre modifiche** (non riscrivere tutto):

1. Rimuovi la riga `<p className="email" style={{ marginTop: 20 }}>{C.cards[1].email}</p>`.
2. Al suo posto, inserisci un titolo renderizzato con lo **stesso pattern inner-HTML** già usato dalla card 1 (`cards[0].title`) nel file, leggendo però `C.cards[1].title.it` / `C.cards[1].title.en`. In pratica: copia la riga del titolo della card 1 (quella che usa `rawHtml(L(...))` per supportare l'`<em>`) e adatta l'indice a `cards[1]`, applicando lo stesso `style={{ marginTop: 16 }}`. Puoi identificare rapidamente la riga modello cercando nel file `rawHtml(L(C.cards[0].title.it, C.cards[0].title.en))`.
3. Al `<span className="copy-state">` aggiungi l'attributo `aria-live="polite"`.

Dopo la modifica, la card 2 ha (nell'ordine): `tag` → `title` (pattern inner-HTML per supportare `<em>`) → `desc` → `action` con `span copy-state aria-live="polite"`.

- [ ] **Step 4.2: Verifica build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 4.3: Gate email-in-bundle**

Run: `grep -rn "battistella.business@gmail.com" dist/`
Expected: exit code 1, zero match.

- [ ] **Step 4.4: Verifica nel browser**

Run: `npm run dev`
Apri Capitolo 7. Card 2 mostra:
- Tag "Email diretta"
- Titolo grande "Scrivimi una *mail*" (la parola "mail" in corsivo serif grazie all'`<em>`)
- Descrizione invariata
- Action "Copia indirizzo"

Click sulla card:
- Appare "Copiato" per ~1.6s
- `Cmd+V` in un editor: incolla `battistella.business@gmail.com` (verifica indirizzo intero e corretto)

Ferma dev server.

- [ ] **Step 4.5: Commit**

```bash
git add src/chapters.jsx
git commit -m "feat(ch7): card Email senza indirizzo visibile, copy-at-click via getEmail

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: ChapterContact — rimozione card 3

**Files:**
- Modify: `src/chapters.jsx` — rimozione del terzo `<button className="contact-card">` nel componente `ChapterContact`

- [ ] **Step 5.1: Rimuovi il markup della card 3**

Nel componente `ChapterContact`, rimuovi completamente questo blocco (è la terza card, dopo quella email):

```jsx
        <button className="contact-card reveal" data-magnet>
          <div>
            <span className="tag">{L(C.cards[2].tag.it, C.cards[2].tag.en)}</span>
            <span className="title" role="heading" aria-level="3" style={{ marginTop: 16 }} dangerouslySetInnerHTML={rawHtml(L(C.cards[2].title.it, C.cards[2].title.en))}/>
            <p className="desc" style={{ marginTop: 14 }}>{L(C.cards[2].desc.it, C.cards[2].desc.en)}</p>
          </div>
          <div className="action">
            <span>{L(C.cards[2].action.it, C.cards[2].action.en)}</span>
            <span className="arr">↗</span>
          </div>
        </button>
```

Dopo la rimozione, dentro `<div className="contact-grid">` ci sono esattamente 2 card (Call, Email).

- [ ] **Step 5.2: Verifica build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 5.3: Gate residui `cards[2]`**

Run: `grep -n "cards\[2\]" src/chapters.jsx`
Expected: exit code 1, zero match.

- [ ] **Step 5.4: Verifica nel browser (stato temporaneo)**

Run: `npm run dev`
Capitolo 7: griglia ancora a 3 colonne (cambierà col Task 6) ma il terzo slot è vuoto. Stato temporaneo, accettabile.
Ferma dev server.

- [ ] **Step 5.5: Commit**

```bash
git add src/chapters.jsx
git commit -m "feat(ch7): rimuovi card Form conversazionale

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: CSS — grid a 2 colonne + cleanup

**Files:**
- Modify: `src/style.css` — righe 768-772 (grid-template-columns) e righe 803-808 (regola morta)

- [ ] **Step 6.1: Aggiorna la griglia del Capitolo 7 a 2 colonne simmetriche**

Trova:

```css
.contact-grid {
  display: grid; grid-template-columns: 1.2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 64px;
}
```

Sostituisci con:

```css
.contact-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 64px;
}
```

(Unica modifica: da `1.2fr 1fr 1fr` a `1fr 1fr`.)

- [ ] **Step 6.2: Rimuovi la regola morta `.contact-email-card .email`**

Trova e **rimuovi** completamente:

```css
.contact-email-card .email {
  font-family: var(--serif); font-style: italic;
  font-size: clamp(18px, 1.8vw, 24px);
  color: var(--ink);
  word-break: break-all;
}
```

(Senza `<p className="email">` nel markup, questa regola è codice morto.)

- [ ] **Step 6.3: Verifica build**

Run: `npm run build`
Expected: build passa, CSS generato in `dist/assets/index-*.css`.

- [ ] **Step 6.4: Verifica nel browser**

Run: `npm run dev`
Capitolo 7:
- Desktop (finestra larga): 2 card affiancate, stessa dimensione
- Resize ≤ 768px (o DevTools Device Toolbar): 2 card impilate a 1 colonna

Ferma dev server.

- [ ] **Step 6.5: Commit**

```bash
git add src/style.css
git commit -m "style(ch7): grid 2 colonne simmetriche + rimuovi regola email morta

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Footer Capitolo 7 — email offuscata + toast

**Files:**
- Modify: `src/chapters.jsx` — riga circa 379 (link footer)
- Modify: `src/style.css` — aggiunta stili `.footer-email-btn` + `.footer-toast`

- [ ] **Step 7.1: Sostituisci il link email nel footer**

Nel componente `ChapterContact`, trova (circa riga 379):

```jsx
            <a href="mailto:battistella.business@gmail.com" rel="me">Email</a>
```

Sostituisci con:

```jsx
            <button className="footer-email-btn" type="button" onClick={mailAndCopy} aria-label={lang === 'en' ? 'Send me an email' : 'Inviami una mail'}>
              Email
              {footerCopied && <span className="footer-toast" role="status">{lang === 'en' ? 'copied' : 'copiato'}</span>}
            </button>
```

(`mailAndCopy` e `footerCopied` sono già stati definiti nel Task 3 Step 3.2.)

- [ ] **Step 7.2: Aggiungi stili per pulsante e toast**

In `src/style.css`, cerca la sezione `/* footer */` (circa riga 813). Subito dopo le regole del footer esistenti, **prima** di eventuali media query successive, aggiungi:

```css
.footer-email-btn {
  background: none; border: 0; padding: 0;
  font: inherit; color: inherit; letter-spacing: inherit;
  text-transform: inherit; cursor: pointer;
  position: relative;
  transition: color var(--dur-micro);
}
.footer-email-btn:hover { color: var(--accent); }
.footer-email-btn:focus-visible { outline: 1px solid var(--accent); outline-offset: 3px; }

.footer-toast {
  position: absolute; top: -22px; left: 0;
  font-family: var(--mono); font-size: 10px; letter-spacing: .14em;
  color: var(--accent); text-transform: uppercase;
  pointer-events: none;
  animation: email-toast-in .2s ease-out;
}
@keyframes email-toast-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 7.3: Verifica build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 7.4: Gate email-in-bundle**

Run: `grep -rn "battistella.business@gmail.com" dist/`
Expected: exit code 1, zero match.

- [ ] **Step 7.5: Verifica nel browser**

Run: `npm run dev`
Scorri al fondo del Capitolo 7 (footer). Click su "Email":
- Se hai un client mail predefinito (Mail.app su macOS): si apre con indirizzo precompilato
- `Cmd+V` in un editor: incolla l'indirizzo corretto
- Sopra il testo "Email" appare un piccolo "copiato" in accento per ~1.6s

Ferma dev server.

- [ ] **Step 7.6: Commit**

```bash
git add src/chapters.jsx src/style.css
git commit -m "feat(ch7-footer): email offuscata con mailto + copy + toast feedback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: ChapterAbout — contatto email offuscato (i18n)

**Files:**
- Modify: `src/chapters.jsx` — componente `ChapterAbout` (circa righe 280-306)
- Modify: `src/style.css` — aggiunta stili `.about-email-btn` + `.about-toast`

- [ ] **Step 8.1: Aggiungi state e handler a `ChapterAbout`**

Trova:

```jsx
function ChapterAbout({ lang }) {
  const C = COPY.about;
  return (
```

Sostituisci con:

```jsx
function ChapterAbout({ lang }) {
  const C = COPY.about;
  const [aboutCopied, setAboutCopied] = useState(false);

  const mailAndCopyAbout = async () => {
    await copyEmailToClipboard();
    openMailto();
    setAboutCopied(true);
    setTimeout(() => setAboutCopied(false), 1600);
  };

  return (
```

(`copyEmailToClipboard` e `openMailto` sono già importate dal Task 3 Step 3.1.)

- [ ] **Step 8.2: Aggiorna il render dei contatti per gestire `obfuscated`**

Trova:

```jsx
        <div className="about-contacts reveal">
          {C.contacts.map((c, i) => (
            <div key={i}>
              <span style={{ color: 'var(--ink-faint)' }}>{c.label} &nbsp;</span>
              <a href={c.href} data-magnet>{c.text}</a>
            </div>
          ))}
        </div>
```

Sostituisci con:

```jsx
        <div className="about-contacts reveal">
          {C.contacts.map((c, i) => (
            <div key={i}>
              <span style={{ color: 'var(--ink-faint)' }}>{c.label} &nbsp;</span>
              {c.obfuscated ? (
                <button className="about-email-btn" type="button" onClick={mailAndCopyAbout} data-magnet>
                  {L(c.cta.it, c.cta.en)}
                  {aboutCopied && <span className="about-toast" role="status">{lang === 'en' ? 'copied' : 'copiato'}</span>}
                </button>
              ) : (
                <a href={c.href} data-magnet>{c.text}</a>
              )}
            </div>
          ))}
        </div>
```

- [ ] **Step 8.3: Aggiungi stili per `.about-email-btn` e `.about-toast`**

In `src/style.css`, in fondo al file, aggiungi:

```css
/* about — email obfuscated button */
.about-email-btn {
  background: none; border: 0; padding: 0;
  font: inherit; color: inherit; letter-spacing: inherit;
  cursor: pointer; position: relative;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color var(--dur-micro);
}
.about-email-btn:hover { color: var(--accent); }
.about-email-btn:focus-visible { outline: 1px solid var(--accent); outline-offset: 3px; }

.about-toast {
  position: absolute; top: -22px; left: 0;
  font-family: var(--mono); font-size: 10px; letter-spacing: .14em;
  color: var(--accent); text-transform: uppercase;
  pointer-events: none;
  animation: email-toast-in .2s ease-out;
}
```

Il keyframe `email-toast-in` è già definito dal Task 7 Step 7.2 e viene riusato.

- [ ] **Step 8.4: Verifica build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 8.5: Gate email-in-bundle (finale)**

Run: `grep -rn "battistella.business@gmail.com" dist/`
Expected: exit code 1, zero match. **Se fallisce, c'è un punto di esposizione rimasto fuori.**

- [ ] **Step 8.6: Verifica nel browser**

Run: `npm run dev`
Scorri al Capitolo 6 (About). Accanto al label "Email":
- Vedi testo "Invia una mail" (IT) o "Send a mail" (EN), sottolineato
- Click → apre client mail + `Cmd+V` copia indirizzo corretto
- Sopra appare toast "copiato" per ~1.6s

Cambia lingua col toggle della navbar: il testo del pulsante cambia tra IT e EN.

Ferma dev server.

- [ ] **Step 8.7: Commit**

```bash
git add src/chapters.jsx src/style.css
git commit -m "feat(ch6-about): email offuscata con mailto + copy + toast (i18n)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Verifica finale (gate completo)

**Files:** nessuna modifica, solo verifiche.

- [ ] **Step 9.1: Build pulito da zero**

Run:
```bash
rm -rf dist/
npm run build
```
Expected: `✓ built in <ms>ms`, nessun errore; dimensioni comparabili al baseline (CSS ~30kB → ~6kB gzip, JS ~182kB → ~58kB gzip — leggere variazioni ok).

- [ ] **Step 9.2: Gate email (scrub completo)**

Run: `grep -rn "battistella.business" dist/`
Expected: exit code 1, zero righe. **Se fallisce, il lavoro non è completo.**

Run anche: `grep -rn "battistella.business" src/`
Expected: zero match (i pezzi in `email-obfuscate.js` sono separati, la stringa completa non deve esistere neppure nel sorgente).

- [ ] **Step 9.3: Gate residui**

Run: `grep -rn "Form conversazionale\|Conversational form\|cards\[2\]" src/`
Expected: exit code 1, zero match.

- [ ] **Step 9.4: Checklist manuale dev server**

Run: `npm run dev`
Apri `http://localhost:5173`. Spunta una per una:

- [ ] Capitolo 7: 2 card visibili (Call, Email), griglia simmetrica su desktop
- [ ] Resize ≤ 768px: card impilate a 1 colonna
- [ ] Card "Prenota una call" click → nuova tab su calendly.com (404 placeholder ok)
- [ ] Card "Scrivimi una mail" click → appare "Copiato", `Cmd+V` incolla indirizzo corretto
- [ ] Footer Cap.7 "Email" click → mailto + toast "copiato" sopra il testo
- [ ] Capitolo 6 About "Invia una mail" click → mailto + toast "copiato"
- [ ] Toggle IT/EN (navbar): "Invia una mail" ↔ "Send a mail"; "Scrivimi una mail" ↔ "Drop me a line"
- [ ] `Cmd+U` (View source): ricerca "battistella" → zero match
- [ ] DevTools Elements, `Cmd+F` "battistella" → zero match
- [ ] `Tab` navigation: tutti i pulsanti del Cap.7 raggiungibili; `Enter`/`Space` li attiva
- [ ] VoiceOver (`Cmd+F5`): pulsante email del footer annunciato come "Inviami una mail, pulsante" (IT) o equivalente EN

Ferma dev server.

- [ ] **Step 9.5: Working tree pulito**

Run: `git status`
Expected: `nothing to commit, working tree clean`.

- [ ] **Step 9.6: Riassunto commit**

Run: `git log --oneline main..HEAD`
Expected: 8-9 commit atomici, uno per task più lo spec iniziale.

- [ ] **Step 9.7: Prossimi passi**

Il lavoro è pronto. Opzioni:
1. Restare sul worktree per iterare (es. sostituire `CALENDLY_URL` quando l'account è pronto).
2. Merge in `main`: `cd /Users/fede/Documents/siti-web && git checkout main && git merge feature/ch7-refactor`.
3. Invocare la skill `superpowers:finishing-a-development-branch` per un flusso guidato di chiusura.

---

## Note per chi implementa

- **`window.__lang`:** il progetto usa `window.__lang` globale (vedi helper `L` in `chapters.jsx:10`). Il prop `lang` sui componenti serve per forzare re-render quando cambia. Per logica di interazione usa `lang` (prop), non `window.__lang`.
- **`data-magnet`:** attributo usato dal cursor magnetico custom del sito. Mantienilo su tutti i pulsanti nuovi che sostituiscono `<a>` con `data-magnet`.
- **`reveal`:** classe che attiva animazioni on-scroll. Già presente sui punti toccati — non rimuoverla.
- **Se un test manuale fallisce:** non procedere. Debugga subito (skill `superpowers:systematic-debugging` se serve guida).
- **Calendly URL placeholder:** il link in `src/config.js` è intenzionalmente finto. Dopo aver creato l'account Calendly, modifica solo quella costante con l'handle reale (es. `synapse-lab/30min`).
- **Pattern inner-HTML React + helper `rawHtml`:** il codebase usa un pattern per renderizzare titoli con `<em>`. Il commento in cima a `src/chapters.jsx` (riga 4-5) garantisce che i valori provengono solo da `COPY` statico, non da input utente.
