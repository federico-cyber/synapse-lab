# Capitolo 6 — Ridisegno "Studio"

**Data:** 2026-04-19
**Autore:** Federico Battistella (con Claude)
**Stato:** Design approvato, pronto per implementation plan

## Contesto

Il capitolo 6 del sito Synapse Lab è oggi una sezione "About" centrata sulla persona del fondatore: nome grande "Federico Battistella", ruolo "Fondatore & Principal", bio in prima persona, firma "F. Battistella" e quattro contatti personali (Email, X, GitHub, LinkedIn).

Tra i 7 capitoli del sito è l'unico punto in cui la voce passa dal "noi studio" all'"io Federico". Questo salto di registro risulta egocentrico rispetto alla narrativa studio-centrica del resto del sito e indebolisce il posizionamento del brand.

## Obiettivo

Sostituire il contenuto del capitolo 6 con un blocco di **principi operativi** dello studio, mantenendo la funzione narrativa del capitolo (ponte di fiducia prima del Contact) ma rimuovendo l'auto-narrazione personale.

### Non-obiettivi

- Non ridisegnare il footer del ch7 (solo aggiunta di una riga di credit)
- Non modificare altri capitoli
- Non cambiare navigazione, CTA del Hero o indicatori di progress
- Non introdurre nuove pagine o route
- Non aggiungere immagini/illustrazioni nel ch6 (estetica solo-tipografia voluta)

## Scelte di design

### Angolo narrativo: Principi operativi, non valori

Il ch2 è già un **Manifesto** con tre credenze aforistiche ("Crediamo che il web…", "Costruiamo pochi siti l'anno…", "Il dettaglio è il mestiere"). Riproporre "Principi" con stesso registro sarebbe ridondante.

**Differenziazione:** il ch2 dichiara i *valori* (registro astratto, dichiarativo); il nuovo ch6 mostra le *regole del gioco* (registro operativo, verificabile). Il manifesto dice "in cosa crediamo", il ch6 dice "come si traduce in comportamento concreto".

### Struttura: due blocchi sequenziali, 3+3 righe a colonne

Il capitolo ospita due micro-blocchi in successione verticale:

**Blocco 1 — "Lo studio"** (che tipo di studio siamo)
Griglia 2 colonne: `Facciamo` vs `Non facciamo`.

**Blocco 2 — "Il patto"** (la relazione studio↔cliente)
Griglia 2 colonne: `Portiamo noi` vs `Porti tu`.

Ogni blocco ha 3 righe × 2 colonne = 6 micro-affermazioni. Totale sul capitolo: 12 (6 per blocco × 2 blocchi).

Alternative considerate e scartate:
- Unica tabella 4 colonne: troppo densa, ingestibile su mobile
- Due card affiancate con sotto-colonne interne: eleganti ma visivamente affollate

### Voce e tono

- Asciutto, verificabile, senza marketing-speak
- Ogni riga deve essere una **promessa verificabile** dal cliente, non uno slogan
- No "fatti a mano", "no AI" o equivalenti — contraddicono lo stack dichiarato al ch5 (che include Claude Code). L'asse differenziante è *custom vs generico*, non *umano vs AI*
- Coerente con la parola-chiave brand **cura** già presente nel sito

### Gestione del "residuo personale"

Tutti i riferimenti personali del vecchio ch6 (nome, ruolo, bio, firma, social personali) vengono rimossi dal capitolo. Nel footer del ch7 si aggiunge una **riga di credit discreta**:

> *"Studio fondato da Federico Battistella · Milano, IT"*

stessa tipografia e opacity del `footer-joke` esistente. Zero foto, zero bio, zero social personali sul sito.

### Label del capitolo

Resta **"Capitolo 06 · Studio"** (IT) / **"Chapter 06 · Studio"** (EN). Label neutro, minima frizione con il sito attuale.

## Architettura dei componenti

### Rinomina: `ChapterAbout` → `ChapterStudio`

Il componente React `ChapterAbout` in `src/chapters.jsx` viene rinominato in `ChapterStudio` per riflettere il nuovo contenuto. Impatti:

- `src/chapters.jsx`: definizione componente + `export`
- `src/app.jsx`: `import` e uso nel render

### Struttura JSX del nuovo componente (descrizione)

Il `<section id="ch6">` interno si articola così:

1. **`.chapter-meta`** — identica al pattern esistente negli altri capitoli (numero 06, dot, label). Nessuna novità.
2. **`.studio-head`** — contiene:
   - un `<h2 className="studio-title reveal">` con il titolo del capitolo (supporta `<em>` via inner-HTML, coerente con il pattern usato nei titoli di ch3/ch5)
   - un `<p className="studio-lead reveal">` con il sottotitolo breve
3. **`.studio-block`** (×2, uno per blocco) — ciascuno contiene:
   - un `<h3 className="studio-block-title">` con il nome del blocco ("Lo studio" / "Il patto")
   - una `<div className="studio-grid">` con due `<div className="studio-col">` al suo interno
4. Ogni **`.studio-col`** contiene:
   - uno `<span className="studio-col-label">` con l'etichetta di colonna ("Facciamo", "Non facciamo", "Portiamo noi", "Porti tu")
   - una `<ul>` con 3 `<li>`, ciascuna renderizzata via `.map()` dal corrispondente array nel COPY

La colonna destra del blocco 1 riceve un modifier `studio-col--neg` per distinguere visivamente il "Non facciamo" via CSS (colore `--ink-faint`) senza sporcare il JSX.

### Principi strutturali

- Classe `reveal` applicata al blocco intero (non a ogni `<li>`) per non sovraccaricare l'IntersectionObserver globale
- Titolo renderizzato come inner-HTML per abilitare `<em>`, usando lo stesso helper `rawHtml()` già presente in `chapters.jsx` e sui titoli degli altri capitoli. Zero user input: il pattern è già considerato sicuro nel progetto perché la sorgente è solo `copy.js` statico.
- Separazione netta dati/presentazione: tutti i testi vivono in `COPY.studio` in `copy.js`
- Nessun hook nuovo (niente `useState`, niente `useEffect`, niente `useRef`): il componente è puramente presentazionale. Il ch6 attuale è già così, manteniamo la stessa semplicità.

## Contenuti (copy IT/EN)

### Nuova chiave `studio` in `src/copy.js`

Struttura dell'oggetto:

- `label` (IT/EN)
- `title` (IT/EN, supporta `<em>`)
- `lead` (IT/EN, plain text)
- `b1` (oggetto blocco 1):
  - `heading` (IT/EN)
  - `leftLabel`, `rightLabel` (IT/EN)
  - `left`, `right` (array di 3 oggetti `{it, en}` ciascuno)
- `b2` (oggetto blocco 2): stessa shape di `b1`

**Valori concreti:**

| Chiave | IT | EN |
|---|---|---|
| `label` | Capitolo 06 · Studio | Chapter 06 · Studio |
| `title` | Due cose: `<em>`come siamo fatti`</em>`, e a quali condizioni lavoriamo. | Two things: `<em>`who we are`</em>`, and the terms we work on. |
| `lead` | Senza giri di parole, così sai cosa aspettarti. | No fluff — so you know what to expect. |

**Blocco 1 — Lo studio**

| # | Facciamo (IT) | We do (EN) | Non facciamo (IT) | We don't (EN) |
|---|---|---|---|---|
| 1 | Un progetto per volta | One project at a time | Tre brief nella stessa settimana | Three briefs in one week |
| 2 | Progetti cuciti addosso | Projects cut to measure | Template comprati e ri-verniciati | Bought templates with a new coat of paint |
| 3 | Prezzo fisso, deciso prima | Fixed price, agreed upfront | Fatturazione a ore che si gonfia | Hourly bills that keep growing |

**Blocco 2 — Il patto**

| # | Portiamo noi (IT) | We bring (EN) | Porti tu (IT) | You bring (EN) |
|---|---|---|---|---|
| 1 | Design e codice, un solo referente | Design and code, a single point of contact | Tempo per decisioni e revisioni | Time for decisions and reviews |
| 2 | Risposta entro 48h, sempre | Reply within 48h, always | Feedback chiaro, anche quando non ti piace | Clear feedback, even when it stings |
| 3 | Un sito che ti sopravvive | A site that outlives us | Fiducia nel processo | Trust in the process |

### Aggiunta `credit` in `COPY.contact.footer`

Oggi `contact.footer` contiene solo `joke`. Si aggiunge una seconda chiave `credit`:

| Chiave | IT | EN |
|---|---|---|
| `credit` | Studio fondato da Federico Battistella · Milano, IT | Studio founded by Federico Battistella · Milano, IT |

### Modifica JSX in `ChapterContact` (footer ch7)

Subito dopo lo `<span className="footer-joke">` esistente si aggiunge uno `<span className="footer-credit">` che renderizza `COPY.contact.footer.credit` via il normale `L(...)`. Nessun inner-HTML, testo plain.

## Stile (CSS) — nuove classi in `src/style.css`

### Sezione `.studio-*`

Propongo il seguente blocco, che riusa i token CSS già presenti nel progetto (`--ink-faint`, `--hairline`, `clamp()` per tipografia fluida coerente con gli altri capitoli):

- `.studio-head` — contenitore del titolo; `margin-bottom` fluido `clamp(40px, 6vw, 80px)`
- `.studio-title` — tipo grande, `font-size: clamp(32px, 4.2vw, 56px)`, `line-height: 1.05`, `letter-spacing: -0.02em`
- `.studio-lead` — paragrafo secondario, `color: var(--ink-faint)`, `max-width: 56ch`, `margin-top: 18px`
- `.studio-block` — contenitore del singolo blocco; `margin-top: clamp(48px, 6vw, 88px)`
- `.studio-block-title` — piccola uppercase label di blocco; `font-size: clamp(14px, 1.1vw, 16px)`, `letter-spacing: 0.12em`, `text-transform: uppercase`, `color: var(--ink-faint)`, `margin-bottom: 24px`
- `.studio-grid` — griglia 2 colonne; `display: grid`, `grid-template-columns: 1fr 1fr`, `gap: clamp(24px, 3vw, 56px)`, `border-top: 1px solid var(--hairline)`, `padding-top: 28px`
- `.studio-col-label` — etichetta di colonna; `display: block`, `font-size: 12px`, uppercase, `color: var(--ink-faint)`, `margin-bottom: 14px`
- `.studio-col ul` — reset lista; `list-style: none`, `padding: 0`, `margin: 0`, `display: flex`, `flex-direction: column`, `gap: 14px`
- `.studio-col li` — riga; `font-size: clamp(18px, 1.6vw, 24px)`, `line-height: 1.3`, `padding-left: 16px`, `position: relative`
- `.studio-col li::before` — trattino decorativo a sinistra della riga; `width: 6px`, `height: 1px`, `background: currentColor`, posizionato via `position: absolute; left: 0; top: 0.6em`
- `.studio-col--neg li` (modifier) — `color: var(--ink-faint)`
- `.studio-col--neg li::before` — `background: var(--ink-faint)`

### Media query mobile (`max-width: 640px`)

- `.studio-grid` → `grid-template-columns: 1fr` (impila le colonne)
- `.studio-col + .studio-col` → `border-top: 1px solid var(--hairline)`, `padding-top: 24px` (hairline separatore tra le due colonne impilate)

### Nuova classe `.footer-credit`

- `color: var(--ink-faint)`
- `font-size: 11px`
- `letter-spacing: 0.06em`

### Classi CSS da rimuovere

Tutte le classi `about-*` usate solo dal vecchio ch6: `.about-wrap`, `.about-role`, `.about-name`, `.about-bio`, `.about-sign`, `.about-contacts`.

**Attenzione:** prima della rimozione fare un grep globale (`grep -r "about-" src/`) per verificare che non siano usate altrove (es. `tweaks-bootstrap.js`, `vanilla/`, altri capitoli).

### Verifica token CSS

I nomi `--ink-faint` e `--hairline` sono riferiti per analogia con il pattern del sito. In fase di implementazione vanno verificati contro `style.css` effettivo e sostituiti se i token reali hanno nomi diversi.

## File impattati

| File | Tipo modifica |
|---|---|
| `src/copy.js` | Rimozione `about`, aggiunta `studio`, aggiunta `contact.footer.credit` |
| `src/chapters.jsx` | Rinomina `ChapterAbout` → `ChapterStudio`, nuovo JSX, aggiornamento `export`, aggiunta `<span>` credit nel footer di `ChapterContact` |
| `src/style.css` | Rimozione classi `about-*`, aggiunta classi `studio-*` + `.footer-credit` |
| `src/app.jsx` | Aggiornamento `import` e uso del componente rinominato |

Totale: **4 file toccati**, zero file nuovi, zero dipendenze aggiunte.

## Rischi e mitigazioni

1. **Classi `about-*` usate altrove.** Prima della rimozione, `grep -r "about-" src/` per verificare. Se presenti in altri contesti, mantenerle o rinominare selettivamente.

2. **Animazione `reveal` a livello blocco.** Le 3 righe di ogni blocco appaiono insieme, non in stagger. Accettato: coerente con il ch5 Stack. Stagger aggiungibile dopo come refinement opzionale (`transition-delay` su `:nth-child`).

3. **Link placeholder rimossi.** I social personali `X`, `GitHub`, `LinkedIn` del vecchio ch6 puntavano a `#` (placeholder non funzionanti). Nessun link esterno reale viene rotto.

4. **Impatto SEO.** Un `<h2>` rimosso (nome "Federico Battistella"), uno aggiunto (titolo "Due cose…"). Conteggio headings invariato, impatto SEO nullo.

## Criteri di accettazione

- Il ch6 non contiene più: nome "Federico Battistella", ruolo "Fondatore & Principal", bio in prima persona, firma "F. Battistella", social personali (X, LinkedIn)
- Il ch6 contiene: titolo + lead + due blocchi ("Lo studio" e "Il patto") ciascuno con due colonne da 3 righe
- Le 12 micro-affermazioni sono esattamente quelle definite nella sezione "Contenuti"
- Il footer del ch7 contiene una nuova riga di credit discreta sotto il `footer-joke`
- Il sito funziona in IT e EN (tutti i testi nuovi sono bilingui)
- Mobile (< 640px): le due colonne dei blocchi si impilano con hairline di separazione
- Nessuna regressione visiva sui capitoli 1-5 e 7
- Tutte le vecchie classi `about-*` sono rimosse da `style.css` (previa verifica grep)

## Terminologia

- **ch1 … ch7**: capitoli 1-7 del sito Synapse Lab (sezioni della single-page)
- **Blocco 1 / Blocco 2**: i due sotto-gruppi del nuovo ch6 ("Lo studio" e "Il patto")
- **Credit line**: la riga nuova nel footer del ch7 con attribuzione dello studio
