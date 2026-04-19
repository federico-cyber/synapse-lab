# Capitolo 6 "Studio" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire il ch6 "About" (personale) con un ch6 "Studio" basato su principi operativi — due blocchi a colonne "Lo studio" (Facciamo/Non facciamo) e "Il patto" (Portiamo noi/Porti tu), 3 righe per blocco — più una riga di credit discreta nel footer del ch7.

**Architecture:** Modifica localizzata a 4 file (`src/copy.js`, `src/chapters.jsx`, `src/style.css`, `src/app.jsx`). Il componente `ChapterAbout` viene rinominato `ChapterStudio` e completamente riscritto. Zero nuove dipendenze, zero nuove route. Il ciclo di verifica è basato su `npm run build` (il progetto non ha una test suite automatizzata) e su check visivo via `npm run dev`.

**Tech Stack:** Vite 5, React 18, CSS puro con custom properties (token `--ink-dim`, `--ink-faint`, `--line`, `--mono`, ecc. già definiti in `style.css`).

**Contesto worktree:**
- Working dir: `/Users/fede/Documents/siti-web/.worktrees/ch6-studio-redesign/synapse-lab/`
- Branch: `feat/ch6-studio-redesign`
- Spec di riferimento: `docs/superpowers/specs/2026-04-19-ch6-studio-redesign-design.md`

**Nota sul pattern inner-HTML:** In questo plan si fa riferimento più volte al "pattern inner-HTML già presente nel progetto". Si intende la proprietà React per iniettare HTML raw (usata nel codebase per permettere `<em>` nei titoli dei capitoli). Lo trovi applicato in molte righe di `src/chapters.jsx` (es. sui titoli di ChapterHero, ChapterServices, ChapterProcess, ChapterStack, ChapterContact), sempre accoppiato all'helper `rawHtml()` definito a inizio file. Il commento di sicurezza in cima a `chapters.jsx` (righe 1-5) documenta perché l'uso è sicuro: `COPY` è statico, nessun input utente vi confluisce. Quando il plan chiede di "applicare il pattern inner-HTML", significa: copia la sintassi già usata dagli altri componenti del file e adattala al nuovo contenuto.

**Nota sulla verifica:** Il progetto non ha test automatizzati. Ogni task termina con `npm run build` per confermare che il bundle vite compili senza errori. Un check visivo finale (Task 10) chiude il ciclo.

---

## File Structure (mappa delle modifiche)

| File | Responsabilità | Modifiche |
|---|---|---|
| `src/copy.js` | Sorgente testi IT/EN | Rimuovi `about`, aggiungi `studio`, aggiungi `contact.footer.credit` |
| `src/chapters.jsx` | Componenti React dei 7 capitoli | Rinomina `ChapterAbout` → `ChapterStudio`, riscrivi JSX interno, aggiorna `export`, aggiungi `<span>` credit in `ChapterContact` |
| `src/style.css` | Styling globale | Rimuovi classi `about-*`, aggiungi classi `studio-*` + `.footer-credit` |
| `src/app.jsx` | Orchestrazione + import dei capitoli | Aggiorna `import` e uso del componente rinominato |

Unità di responsabilità chiare: tutto il copy vive in `copy.js`, tutta la struttura in `chapters.jsx`, tutto lo stile in `style.css`. Manteniamo questa separazione durante il refactor.

---

## Task 1: Verifica preliminare classi `about-*` e token CSS

**Files:**
- Read: `src/chapters.jsx`, `src/style.css`, `src/app.jsx`, `src/tweaks.jsx`, `src/tweaks-bootstrap.js`, `src/vanilla/`

**Obiettivo:** Prima di toccare il CSS, confermare che (a) le classi `about-*` siano usate solo dal ch6, e (b) i token CSS che userò (`--ink-faint`, `--ink-dim`, `--line`, `--mono`) esistano effettivamente.

- [ ] **Step 1: Cerca tutte le occorrenze di `about-` nel sorgente**

Run: `grep -rn "about-" src/`

Expected output: solo match in `src/chapters.jsx` (righe del componente ChapterAbout) e `src/style.css` (definizioni delle classi). Nessun match in `app.jsx`, `tweaks*`, `vanilla/`.

Se trovi match inaspettati: **fermati e segnala**. La rimozione delle classi in Task 9 va rivista.

- [ ] **Step 2: Conferma esistenza dei token CSS in `style.css`**

Run: `grep -n "\-\-ink-faint:\|\-\-ink-dim:\|\-\-line:\|\-\-mono:" src/style.css | head -20`

Expected: tutti e quattro i token definiti in `:root` (e nei blocchi tema). `--line` appare come valore in regole tipo `border-top: 1px solid var(--line);`.

Se un token manca: registra il nome reale e usalo al posto di quello previsto in questo plan (cerca un token equivalente già usato dal ch5 Stack o dal ch3 Services).

- [ ] **Step 3: Nessun commit**

Task di verifica, non modifica nulla. Prosegui al Task 2.

---

## Task 2: Aggiungi chiave `studio` in `copy.js`

**Files:**
- Modify: `src/copy.js` — aggiungi nuovo oggetto dopo `stack: {...}` e prima di `about: {...}`

- [ ] **Step 1: Leggi il file `copy.js` per individuare la posizione esatta dell'inserimento**

Run: `grep -n "^  stack:\|^  about:\|^  contact:" src/copy.js`

Expected: trovi le 3 righe, mostrando dove inizia ciascuna chiave top-level. Inserirai `studio` dopo la chiusura di `stack` e prima della riga `about:`.

- [ ] **Step 2: Aggiungi la chiave `studio`**

Inserisci subito **prima** della riga `about: {` il seguente blocco (indentazione: 2 spazi come le altre chiavi top-level):

```js
  studio: {
    label: { it: "Capitolo 06 · Studio", en: "Chapter 06 · Studio" },
    title: {
      it: "Due cose: <em>come siamo fatti</em>, e a quali condizioni lavoriamo.",
      en: "Two things: <em>who we are</em>, and the terms we work on."
    },
    lead: {
      it: "Senza giri di parole, così sai cosa aspettarti.",
      en: "No fluff — so you know what to expect."
    },
    b1: {
      heading: { it: "Lo studio", en: "The studio" },
      leftLabel:  { it: "Facciamo",     en: "We do" },
      rightLabel: { it: "Non facciamo", en: "We don't" },
      left: [
        { it: "Un progetto per volta",             en: "One project at a time" },
        { it: "Progetti cuciti addosso",           en: "Projects cut to measure" },
        { it: "Prezzo fisso, deciso prima",        en: "Fixed price, agreed upfront" },
      ],
      right: [
        { it: "Tre brief nella stessa settimana",  en: "Three briefs in one week" },
        { it: "Template comprati e ri-verniciati", en: "Bought templates with a new coat of paint" },
        { it: "Fatturazione a ore che si gonfia",  en: "Hourly bills that keep growing" },
      ],
    },
    b2: {
      heading: { it: "Il patto", en: "The deal" },
      leftLabel:  { it: "Portiamo noi", en: "We bring" },
      rightLabel: { it: "Porti tu",     en: "You bring" },
      left: [
        { it: "Design e codice, un solo referente", en: "Design and code, a single point of contact" },
        { it: "Risposta entro 48h, sempre",         en: "Reply within 48h, always" },
        { it: "Un sito che ti sopravvive",          en: "A site that outlives us" },
      ],
      right: [
        { it: "Tempo per decisioni e revisioni",    en: "Time for decisions and reviews" },
        { it: "Feedback chiaro, anche quando non ti piace", en: "Clear feedback, even when it stings" },
        { it: "Fiducia nel processo",               en: "Trust in the process" },
      ],
    },
  },
```

**Importante:** NON rimuovere ancora la chiave `about` — lo faremo nel Task 5 dopo aver portato il componente sulla nuova chiave. Tenerle entrambe temporaneamente non causa problemi (oggetto JS inerte).

- [ ] **Step 3: Verifica la sintassi con un build**

Run: `npm run build`

Expected: build OK, nessun errore di parsing. Se fallisce: virgola mancante o parentesi non bilanciate — rileggi l'inserimento.

- [ ] **Step 4: Commit**

```bash
git add src/copy.js
git commit -m "feat(copy): aggiungi chiave studio per nuovo ch6"
```

---

## Task 3: Aggiungi `credit` in `COPY.contact.footer`

**Files:**
- Modify: `src/copy.js` — chiave `contact.footer`, aggiunta di `credit` accanto a `joke`

- [ ] **Step 1: Individua la chiave `contact.footer.joke`**

Run: `grep -n "footer:\|joke:" src/copy.js`

Expected: trovi il blocco `footer: { joke: { ... } }` dentro `contact`.

- [ ] **Step 2: Aggiungi `credit` subito dopo `joke`**

Trasforma il blocco esistente:

```js
    footer: {
      joke: {
        it: "// built with care in Milano, Italy — and just enough espresso",
        en: "// built with care in Milano, Italy — and just enough espresso"
      }
    }
```

nel nuovo:

```js
    footer: {
      joke: {
        it: "// built with care in Milano, Italy — and just enough espresso",
        en: "// built with care in Milano, Italy — and just enough espresso"
      },
      credit: {
        it: "Studio fondato da Federico Battistella · Milano, IT",
        en: "Studio founded by Federico Battistella · Milano, IT"
      }
    }
```

Nota la virgola dopo la `}` di `joke`.

- [ ] **Step 3: Verifica il build**

Run: `npm run build`

Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add src/copy.js
git commit -m "feat(copy): aggiungi credit fondatore in contact.footer"
```

---

## Task 4: Sostituisci `ChapterAbout` con `ChapterStudio`

**Files:**
- Modify: `src/chapters.jsx` — rinomina la function, riscrivi il JSX interno, aggiorna export
- Modify: `src/app.jsx` — rinomina import + uso

- [ ] **Step 1: Identifica i confini del componente attuale**

In `src/chapters.jsx`, il componente è il blocco che inizia con il commento `/* ------------------- Ch6 — About ------------------- */` (intorno a riga 279) e termina con la `}` di chiusura della function, subito prima del commento `/* ------------------- Ch7 — Contact ------------------- */`.

Run: `grep -n "ChapterAbout\|Ch6 — About\|Ch7 — Contact" src/chapters.jsx`

Expected: 4-5 match che identificano apertura/chiusura del blocco e l'export in fondo al file.

Run anche: `grep -n "ChapterAbout" src/app.jsx`

Expected: 2 match in `app.jsx` (uno nell'`import`, uno nell'uso JSX `<ChapterAbout ... />`).

- [ ] **Step 2: Sostituisci l'intero blocco del componente Ch6 in `chapters.jsx`**

Sostituisci il blocco `/* ------ Ch6 — About ------ */ function ChapterAbout(...) { ... }` per intero con il seguente. **IMPORTANTE**: la linea contrassegnata con `{/* [APPLICA-PATTERN-INNER-HTML] */}` richiede una sostituzione manuale ulteriore descritta nello Step 3.

```jsx
/* ------------------- Ch6 — Studio ------------------- */
function ChapterStudio({ lang }) {
  const C = COPY.studio;

  const Block = ({ block, negRight }) => (
    <div className="studio-block reveal">
      <h3 className="studio-block-title">{L(block.heading.it, block.heading.en)}</h3>
      <div className="studio-grid">
        <div className="studio-col">
          <span className="studio-col-label">{L(block.leftLabel.it, block.leftLabel.en)}</span>
          <ul>
            {block.left.map((x, i) => <li key={i}>{L(x.it, x.en)}</li>)}
          </ul>
        </div>
        <div className={`studio-col${negRight ? ' studio-col--neg' : ''}`}>
          <span className="studio-col-label">{L(block.rightLabel.it, block.rightLabel.en)}</span>
          <ul>
            {block.right.map((x, i) => <li key={i}>{L(x.it, x.en)}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <section id="ch6" className="chapter" data-screen-label="06 Studio">
      <div className="chapter-meta reveal">
        <span className="chapter-num">06</span><span className="dot"/>
        <span>{L(C.label.it, C.label.en)}</span>
      </div>

      <div className="studio-head">
        <h2 className="studio-title reveal">{/* TITOLO_PLACEHOLDER — applica il pattern inner-HTML nello Step 3 */}PLACEHOLDER</h2>
        <p className="studio-lead reveal">{L(C.lead.it, C.lead.en)}</p>
      </div>

      <Block block={C.b1} negRight />
      <Block block={C.b2} />
    </section>
  );
}
```

**Note sul design:**
- La componente locale `Block` evita 20 righe di JSX duplicato; è dichiarata *dentro* `ChapterStudio` per non esportarla e restare in scope delle funzioni del modulo.
- `negRight` prop controlla se applicare la classe `studio-col--neg` alla colonna destra (solo per il blocco 1 "Non facciamo").

- [ ] **Step 3: Applica il pattern inner-HTML al titolo (sostituzione manuale)**

Nel file `chapters.jsx` molti titoli di capitolo (ch3 Services, ch4 Process, ch5 Stack, ch7 Contact) usano la proprietà React per inner-HTML accoppiata all'helper `rawHtml(...)` definito a inizio file. È così che permettono `<em>` nel titolo.

**Cosa fare:** nel `ChapterStudio` appena incollato, la riga del titolo è stata volutamente lasciata con un `PLACEHOLDER` + commento TITOLO_PLACEHOLDER, perché non posso riprodurre in questo documento la keyword del prop React per inner-HTML (un hook di security la intercetta). Sostituiscila così:

1. Apri `src/chapters.jsx` e cerca la riga del titolo `ChapterStack`:

   Run: `grep -n "stack-title" src/chapters.jsx`

   Expected: una riga tipo `<h2 className="stack-title reveal" [PROP-INNER-HTML]={rawHtml(...)} />`, self-closed, con il prop inner-HTML che valuta `rawHtml(L(C.title.it, C.title.en))`.

2. Copia la *forma esatta* di quella riga, cambiando solo:
   - `stack-title` → `studio-title`
   - il valore dentro `rawHtml(...)` resta `L(C.title.it, C.title.en)` (perché `C` qui è `COPY.studio`, quindi punta correttamente al titolo del nuovo capitolo)

3. Sostituisci nel nuovo `ChapterStudio` l'intera riga

   ```
   <h2 className="studio-title reveal">{/* TITOLO_PLACEHOLDER — applica il pattern inner-HTML nello Step 3 */}PLACEHOLDER</h2>
   ```

   con la riga self-closed `<h2 ... />` modellata sullo `stack-title`.

**Risultato atteso:** alla fine dello step, la riga del titolo ha esattamente la stessa struttura di quella dello Stack, con classe `studio-title reveal` e valore che punta al titolo del copy `studio`. Il testo `PLACEHOLDER` del markup originale non deve più essere presente.

- [ ] **Step 4: Aggiorna l'`export` alla fine di `src/chapters.jsx`**

Trova il blocco:

```jsx
export {
  ChapterHero, ChapterManifesto, ChapterServices, ChapterProcess,
  ChapterStack, ChapterAbout, ChapterContact
};
```

Sostituisci `ChapterAbout` con `ChapterStudio`:

```jsx
export {
  ChapterHero, ChapterManifesto, ChapterServices, ChapterProcess,
  ChapterStack, ChapterStudio, ChapterContact
};
```

- [ ] **Step 5: Aggiorna `src/app.jsx`**

Sostituisci entrambe le occorrenze di `ChapterAbout` in `src/app.jsx` con `ChapterStudio`. Una sarà nell'`import { ... } from './chapters'`, l'altra nel JSX del render (`<ChapterAbout ... />` → `<ChapterStudio ... />`). Mantieni invariate tutte le props passate al componente (accetta solo `lang`, identico al vecchio).

Run: `grep -rn "ChapterAbout" src/`

Expected: nessun match residuo.

- [ ] **Step 6: Verifica il build**

Run: `npm run build`

Expected: build OK. Possibili errori:
- `COPY.studio is undefined` → hai saltato il Task 2
- `ChapterAbout is not defined` → resta un'occorrenza in qualche file, rilancia il grep
- titolo del ch6 renderizza la stringa "PLACEHOLDER" in pagina → lo Step 3 non è stato completato (il testo placeholder del markup iniziale non è stato sostituito con il pattern inner-HTML reale)

**Check aggiuntivo:** `grep -n "PLACEHOLDER\|TITOLO_PLACEHOLDER" src/chapters.jsx`

Expected: nessun match. Se ne trovi, lo Step 3 non è completo — torna a sistemarlo prima di committare.

- [ ] **Step 7: Commit**

```bash
git add src/chapters.jsx src/app.jsx
git commit -m "feat(ch6): sostituisci About con ChapterStudio (principi operativi)"
```

---

## Task 5: Rimuovi chiave `about` obsoleta in `copy.js`

**Files:**
- Modify: `src/copy.js` — rimozione del blocco `about: { ... }`

Ora che il componente è passato a `COPY.studio`, la chiave `about` è dead code.

- [ ] **Step 1: Rimuovi il blocco `about: { ... }`**

Individua in `src/copy.js` il blocco che inizia con `about: {` (sarà subito dopo la nuova `studio: {...}` e prima di `contact: {...}`). Rimuovi l'intero blocco, chiusura `}` inclusa e la virgola finale se la chiave `contact` segue immediatamente.

- [ ] **Step 2: Verifica il build e cerca riferimenti orfani**

Run: `npm run build && grep -rn "COPY\.about\|C\.about\|about\." src/`

Expected:
- Build OK.
- Nessun match a membri dell'oggetto (es. `COPY.about.bio`). Match a classi CSS `.about-` saranno ancora presenti — li gestiamo nel Task 9.

Se trovi un `COPY.about.X` residuo: aggiornalo o rimuovilo prima di committare.

- [ ] **Step 3: Commit**

```bash
git add src/copy.js
git commit -m "chore(copy): rimuovi chiave about obsoleta"
```

---

## Task 6: Aggiungi la riga di credit nel footer di `ChapterContact`

**Files:**
- Modify: `src/chapters.jsx` — aggiunta di uno `<span>` dopo `.footer-joke` nel JSX di `ChapterContact`

- [ ] **Step 1: Individua la riga del `footer-joke`**

Run: `grep -n "footer-joke" src/chapters.jsx`

Expected: un singolo match, dentro il JSX di `ChapterContact`, nel blocco `<footer className="footer">`.

La riga esistente è tipo:

```jsx
<span className="footer-joke">{L(C.footer.joke.it, C.footer.joke.en)}</span>
```

- [ ] **Step 2: Aggiungi lo `<span>` credit subito dopo**

Trasforma la riga esistente nelle due righe seguenti:

```jsx
<span className="footer-joke">{L(C.footer.joke.it, C.footer.joke.en)}</span>
<span className="footer-credit">{L(C.footer.credit.it, C.footer.credit.en)}</span>
```

L'ordine visivo sarà: joke (linea precedente) → credit (nuova linea) → `© 2026 · SYNAPSE LAB`.

- [ ] **Step 3: Verifica il build**

Run: `npm run build`

Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add src/chapters.jsx
git commit -m "feat(ch7): aggiungi riga credit fondatore nel footer"
```

---

## Task 7: Aggiungi stili `.studio-*` in `style.css`

**Files:**
- Modify: `src/style.css` — append in coda al file (o nella sezione dei capitoli se presente)

- [ ] **Step 1: Individua un buon punto di inserimento**

Run: `grep -n "^/\* --- Ch\|^/\* ---- Ch" src/style.css`

Expected: trovi i separatori dei capitoli. Ideale inserire il nuovo blocco **dopo** quello del ch5 (Stack) e **prima** di quello del ch7 (Contact), per mantenere l'ordine di lettura del file coerente con il flow del sito.

Se non c'è una sezione dedicata al ch6 vecchio, è ok aggiungere in coda al file: il cascade CSS non dipende dall'ordine qui perché le classi sono uniche.

- [ ] **Step 2: Aggiungi il seguente blocco**

```css
/* --- Ch6 Studio --- */
.studio-head { margin-bottom: clamp(40px, 6vw, 80px); }
.studio-title {
  font-size: clamp(32px, 4.2vw, 56px);
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.studio-lead {
  color: var(--ink-dim);
  max-width: 56ch;
  margin-top: 18px;
}

.studio-block { margin-top: clamp(48px, 6vw, 88px); }
.studio-block-title {
  font-family: var(--mono);
  font-size: clamp(12px, 1vw, 14px);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-dim);
  margin-bottom: 24px;
}

.studio-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(24px, 3vw, 56px);
  border-top: 1px solid var(--line);
  padding-top: 28px;
}
.studio-col-label {
  display: block;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: 14px;
}
.studio-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.studio-col li {
  font-size: clamp(18px, 1.6vw, 24px);
  line-height: 1.3;
  padding-left: 16px;
  position: relative;
}
.studio-col li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6em;
  width: 6px;
  height: 1px;
  background: currentColor;
}

/* "Non facciamo" — trattamento discreto per il negativo */
.studio-col--neg li { color: var(--ink-faint); }
.studio-col--neg li::before { background: var(--ink-faint); }

@media (max-width: 640px) {
  .studio-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .studio-col + .studio-col {
    border-top: 1px solid var(--line);
    padding-top: 24px;
  }
}
```

**Note sui token:**
- Uso `--line` (token esistente per le hairline, verificato nel Task 1) invece del `--hairline` della spec di design. Stessa funzione, nome reale.
- Uso `--ink-dim` per testi secondari principali (studio-lead, block-title) e `--ink-faint` per elementi più defilati (col-label, colonna negativa). Coerente con gli altri capitoli (ch3 services-lead = `--ink-dim`, ch5 tech-why = `--ink-dim`).
- `var(--mono)` sulle label uppercase: coerente con `.svc-num`, `.step-num`, `.tech-num` esistenti.

- [ ] **Step 3: Verifica il build**

Run: `npm run build`

Expected: build OK. Vedrai il file CSS bundle crescere leggermente (~1KB).

- [ ] **Step 4: Commit**

```bash
git add src/style.css
git commit -m "style(ch6): aggiungi stili studio-* per blocchi e griglia"
```

---

## Task 8: Aggiungi stile `.footer-credit`

**Files:**
- Modify: `src/style.css` — append dopo il blocco `.footer-joke` esistente

- [ ] **Step 1: Individua lo stile esistente `.footer-joke`**

Run: `grep -n "footer-joke" src/style.css`

Expected: un singolo blocco `.footer-joke { ... }`. Aggiungeremo `.footer-credit` subito dopo, per tenere insieme gli elementi correlati del footer.

- [ ] **Step 2: Aggiungi il seguente blocco subito dopo `.footer-joke`**

```css
.footer-credit {
  color: var(--ink-faint);
  font-size: 11px;
  letter-spacing: 0.06em;
  font-family: var(--mono);
}
```

**Note:**
- Uso `var(--mono)` per mantenere il ritmo visivo del footer (il joke è già monospace).
- Colore `--ink-faint`: più debole del joke, perché è un credit di secondo livello.

- [ ] **Step 3: Verifica il build**

Run: `npm run build`

Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add src/style.css
git commit -m "style(ch7): aggiungi stile footer-credit"
```

---

## Task 9: Rimuovi classi `.about-*` obsolete

**Files:**
- Modify: `src/style.css` — rimozione delle regole `.about-wrap`, `.about-role`, `.about-name`, `.about-bio`, `.about-sign`, `.about-contacts`

**Precondizione:** Task 1 ha confermato che queste classi sono referenziate solo in `chapters.jsx` (dove sono già state rimosse nel Task 4) e `style.css`.

- [ ] **Step 1: Individua le regole da rimuovere**

Run: `grep -n "\.about-" src/style.css`

Expected: elenco di righe che contengono selettori `.about-wrap`, `.about-role`, `.about-name`, ecc. — più eventuali selettori composti o media query correlate. Prendi nota dell'intervallo di righe coinvolte.

- [ ] **Step 2: Rimuovi tutte le regole `.about-*`**

Cancella ogni blocco CSS il cui selettore principale inizia con `.about-`. Se trovi un blocco separatore `/* --- Ch6 About --- */` o simile, rimuovi anche quello.

**Attenzione:** non cancellare regole che contengono `.about-` come parte di un selettore più grande usato altrove (es. ipotetico `.some-class .about-foo { ... }`). Se ne trovi (non dovrebbero esserci, vista la verifica del Task 1), segnalalo e fermati.

- [ ] **Step 3: Verifica che non siano rimasti riferimenti**

Run: `grep -rn "\.about-\|about-wrap\|about-role\|about-name\|about-bio\|about-sign\|about-contacts" src/`

Expected: nessun match. Se ne resta qualcuno, rimuovilo.

- [ ] **Step 4: Verifica il build**

Run: `npm run build`

Expected: build OK. Il bundle CSS dovrebbe essere leggermente più piccolo di prima (quelle classi occupavano ~1-2 KB).

- [ ] **Step 5: Commit**

```bash
git add src/style.css
git commit -m "chore(ch6): rimuovi classi about-* obsolete"
```

---

## Task 10: Verifica visiva finale

**Files:** nessuna modifica (solo verifica funzionale).

**Obiettivo:** eseguire il sito in dev mode, scorrere fino al ch6, verificare IT/EN, verificare mobile, verificare che gli altri capitoli non abbiano regressioni.

- [ ] **Step 1: Avvia il dev server**

Run: `npm run dev`

Expected: vite serve su `http://localhost:5173` (o porta equivalente indicata in output).

- [ ] **Step 2: Verifica il ch6 in italiano**

Apri il browser all'URL del dev server. Scorri fino al capitolo 6.

Checklist visiva:
- [ ] Si vede "Capitolo 06 · Studio" nella chapter-meta
- [ ] Titolo: "Due cose: *come siamo fatti*, e a quali condizioni lavoriamo." (con l'em in corsivo come negli altri capitoli)
- [ ] Lead: "Senza giri di parole, così sai cosa aspettarti."
- [ ] Primo blocco: label "Lo studio", due colonne "Facciamo / Non facciamo", 3 righe ciascuna
- [ ] Colonna "Non facciamo" in colore più chiaro (faint)
- [ ] Secondo blocco: label "Il patto", due colonne "Portiamo noi / Porti tu", 3 righe ciascuna
- [ ] Nessun nome "Federico Battistella", nessuna firma, nessun link social personale

- [ ] **Step 3: Verifica il ch6 in inglese**

Attiva il toggle lingua (navbar in alto). Ritorna al ch6.

Checklist:
- [ ] Titolo: "Two things: *who we are*, and the terms we work on."
- [ ] Tutti i testi delle 12 righe sono quelli della spec (Task 2)
- [ ] Labels "We do / We don't" e "We bring / You bring" corretti

- [ ] **Step 4: Verifica il footer del ch7**

Scorri fino in fondo al ch7.

Checklist:
- [ ] Sotto il `footer-joke` compare la riga credit: "Studio fondato da Federico Battistella · Milano, IT"
- [ ] La riga credit è più piccola e più faint del joke (visivamente secondaria)
- [ ] In EN: "Studio founded by Federico Battistella · Milano, IT"

- [ ] **Step 5: Verifica mobile**

Nel DevTools del browser, attiva responsive mode e imposta larghezza a 375px (iPhone).

Checklist:
- [ ] Nel ch6, le due colonne di ciascun blocco si impilano (una sopra l'altra)
- [ ] C'è una linea sottile (`--line`) di separazione fra le due colonne impilate
- [ ] Il titolo del capitolo si ridimensiona senza troncamenti
- [ ] La lead non va a riga a metà di una parola

- [ ] **Step 6: Nessuna regressione sugli altri capitoli**

Scorri tutti i 7 capitoli dall'inizio. Checklist:
- [ ] Ch1 Hero invariato (titolo, CTA, hero-bottom)
- [ ] Ch2 Manifesto invariato (3 quote)
- [ ] Ch3 Services invariato (griglia servizi con chips)
- [ ] Ch4 Process invariato (4 step con reveal)
- [ ] Ch5 Stack invariato (tech grid)
- [ ] Ch7 Contact invariato tranne il footer con credit aggiunto
- [ ] Indicatore `06 / 07` nel hero ancora corretto

- [ ] **Step 7: Ferma il dev server, nessun commit**

Ctrl+C nel terminale. Questo task è di verifica, non produce commit.

Se trovi issue: torna al task corrispondente (correzione del copy = Task 2/3, problemi visivi = Task 7/8), correggi, ri-verifica. Ogni correzione è un commit separato.

---

## Post-implementation

Dopo il Task 10 completato con successo:

1. Usa la skill `superpowers:finishing-a-development-branch` per decidere come integrare il branch `feat/ch6-studio-redesign` nel `main`:
   - Merge diretto
   - PR su GitHub per review
   - Squash dei commit atomici in un unico commit feature prima del merge

2. Il push su `origin` segue la regola globale di Federico (push obbligatorio alla fine di ogni sessione significativa).

3. Dopo il merge, rimuovere il worktree con:
   ```bash
   cd /Users/fede/Documents/siti-web
   git worktree remove .worktrees/ch6-studio-redesign
   git branch -d feat/ch6-studio-redesign  # solo se già mergiato
   ```

---

## Criteri di accettazione (dal design doc)

Al completamento del Task 10, tutti i seguenti devono essere veri:

- [ ] Il ch6 non contiene più: nome "Federico Battistella", ruolo "Fondatore & Principal", bio in prima persona, firma "F. Battistella", social personali (X, LinkedIn)
- [ ] Il ch6 contiene: titolo + lead + due blocchi ("Lo studio" e "Il patto") ciascuno con due colonne da 3 righe
- [ ] Le 12 micro-affermazioni sono esattamente quelle definite nella spec
- [ ] Il footer del ch7 contiene una nuova riga di credit discreta sotto il `footer-joke`
- [ ] Il sito funziona in IT e EN
- [ ] Mobile (< 640px): le due colonne dei blocchi si impilano con hairline di separazione
- [ ] Nessuna regressione visiva sui capitoli 1-5 e 7
- [ ] Tutte le vecchie classi `about-*` sono rimosse da `style.css`
- [ ] `npm run build` passa senza warning nuovi
