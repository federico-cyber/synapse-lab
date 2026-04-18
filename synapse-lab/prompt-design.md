# Synapse Lab — Design Brief / Prompt

**Data**: 2026-04-18
**Deliverable atteso**: design completo (mockup ad alta fedeltà + art direction + sistema di motion) di un sito single-page per l'agenzia Synapse Lab, da cui sarà poi derivata l'implementazione in codice.

---

## 1. Identità & positioning

**Synapse Lab** è uno studio di digital craft italiano, fondato da **Federico**, che progetta e costruisce siti e prodotti digitali di fascia alta. Non è un'agenzia generalista: è un piccolo laboratorio premium che lavora al confine tra design, codice e sperimentazione interattiva.

Il sito stesso è il primo case study. Deve dimostrare — non raccontare — il livello tecnico ed estetico che l'agenzia è in grado di produrre. Target di riferimento: brand ambiziosi, startup tech, aziende con budget e gusto per l'eccellenza. Il sito deve comunicare "questi sono i migliori della loro categoria" nei primi cinque secondi.

**Tono di voce**: sicuro, essenziale, un filo provocatorio. Niente corporate, niente "soluzioni su misura per il tuo business". Frasi corte, claim netti, un po' di attitude da studio di design senior.

---

## 2. Lingua

**Bilingue IT / EN** con switcher discreto in navbar (default IT, fallback EN su geolocalizzazione). Copy costruito in parallelo — l'inglese non deve essere una traduzione letterale, entrambe le versioni devono suonare native.

---

## 3. Direzione visiva generale

**Tier visivo**: awwwards SOTY / FWA. Riferimenti: Active Theory, Lusion, Igloo Inc, Resn, Bruno Simon, Basement Studio, Unseen Studio.

**Palette principale** (dark mode di default):
- `#05060B` – near-black profondo (sfondo primario)
- `#0E1018` – off-black (card / sezioni)
- `#EDEAE0` – warm off-white (testo primario, tipografia gigante)
- `#00E5FF` – ciano elettrico (accento principale, bagliori sinaptici)
- `#7B5CFF` – viola "synapse" (accento secondario, gradient)
- `#FF3B5C` – rosa/rosso pulsante (highlight rari, hover critici, easter egg)

**Palette alternativa "light / dawn"**: stessa struttura invertita, warm white di base (`#F5F1E6`), inchiostro (`#0A0C14`), accenti meno saturi. Attivabile via toggle con **morph 3D** della scena (non un semplice flip: la rete neurale cambia illuminazione, angolo, atmosfera — come se passasse da notte cosmica ad alba).

**Typography**:
- **Display**: un grottesco moderno editoriale con personalità — es. *Söhne Breit*, *Editorial New*, *GT America Mono* per i numeri, o **PP Neue Machina** / **PP Editorial New** (Pangram Pangram) per un mix tecnico-umanista. Usare tipografia **gigantesca** (clamp 6rem → 18vw) nei momenti chiave.
- **Body**: sans neogrottesco pulito — *Inter*, *General Sans*, o *Söhne* regular.
- **Mono accenti**: per label, coordinate, metadata, timestamp stile lab — *JetBrains Mono*, *Berkeley Mono* o *GT America Mono*.

**Motion language**:
- Easing: cubic-bezier custom (evitare default). Base: `cubic-bezier(0.77, 0, 0.175, 1)` per transizioni ampie, `cubic-bezier(0.25, 1, 0.5, 1)` per micro-interazioni.
- Durate: 400–800ms macro, 150–250ms micro.
- Scroll: **scroll scrubbing** su scena 3D principale (Lenis smooth scroll + GSAP ScrollTrigger). Niente "salti", tutto deve sembrare analogico.
- Legge universale: **nothing snaps, everything breathes**. Elementi statici al riposo sono vietati — tutto ha un micro-movimento (parallax, float, pulse sinaptico) ≤ 3px di ampiezza.

---

## 4. Metafora 3D centrale — "Dal pensiero al prodotto"

Il sito è governato da una **singola scena WebGL continua** che accompagna tutto lo scroll. La scena inizia come **rete neurale organica** (nodi luminosi connessi da filamenti, impulsi che viaggiano lungo le connessioni) e si **trasforma** capitolo dopo capitolo assumendo forme diverse, per poi dissolversi e ricomporsi nel finale.

Estetica tecnica: **particelle + curve bezier animate con shader custom**, bloom leggero, depth of field, grain sottile su tutta la scena per sensazione cinematografica. Illuminazione studio (key + rim + fill), non "videogame". La rete deve sembrare viva, non sintetica — respira, pulsa, reagisce al cursore con deformazione locale.

**Tech implicato**: Three.js / React Three Fiber, GLSL shader custom per i nodi (punto luminoso con halo animato) e i filamenti (linee con gradient temporale che simula l'impulso sinaptico), post-processing con `@react-three/postprocessing` (Bloom, Noise, Vignette, DepthOfField).

---

## 5. Struttura narrativa — 8 capitoli

Single-page scroll cinematografico. Ogni capitolo ha **(a)** una micro-trasformazione della scena 3D, **(b)** tipografia editoriale grande, **(c)** un momento di pausa prima del prossimo.

### Capitolo 1 — Hero
**3D**: rete neurale fluttuante al centro, profonda, in lenta rotazione. Impulsi casuali che attraversano le connessioni.
**Copy IT**: titolo gigante "Sinapsi digitali, costruite a mano." / sottotitolo breve (max 2 righe): "Synapse Lab è uno studio che progetta esperienze web al confine tra design, codice e sperimentazione."
**Copy EN**: "Digital synapses, hand-crafted." / "Synapse Lab builds web experiences at the edge of design, code, and experimentation."
**Elementi**: navbar minimale (logo-mark animato + switcher lingua + CTA "Start a project"), indicatore di scroll (micro-animato), timestamp/coordinate lab in mono nell'angolo.

### Capitolo 2 — Manifesto
**3D**: la rete si restringe e i nodi si allineano formando una **frase 3D estrusa** (geometria testo vera, non texture), che poi si dissolve in polvere.
**Copy**: manifesto in tre blocchi corti. Esempio:
> *"Crediamo che il web meriti di essere un'esperienza, non un documento."*
> *"Costruiamo pochi siti l'anno, ognuno come fosse l'unico."*
> *"Il dettaglio non è un lusso: è il mestiere."*
Ogni frase compare con **split-text reveal** (lettera per lettera / parola per parola con GSAP SplitText).

### Capitolo 3 — Servizi ("Cosa facciamo")
**3D**: 4 nodi maggiori si illuminano e orbitano al centro, gli altri sbiadiscono.
**Layout**: 4 card grandi in griglia asimmetrica, ognuna con numero (01–04), label mono, titolo display, descrizione breve, hover → il nodo 3D corrispondente si espande.
**Servizi**:
1. **Web Design & Art Direction** — sistemi visivi, brand digitale, direzione creativa
2. **Development** — Next.js, React, Three.js, performance tuning, accessibilità
3. **Motion & Interaction** — WebGL, scroll-driven storytelling, microinterazioni
4. **Strategy & Product** — positioning, information architecture, growth-ready structure

### Capitolo 4 — Processo
**3D**: la rete si riorganizza in **4 cluster sequenziali** collegati da una "spina dorsale" luminosa che si accende in ordine.
**Contenuto**: 4 step orizzontali (horizontal scroll dentro la sezione verticale, o stacking cards):
1. **Discovery** — ascoltiamo, mappiamo, sfidiamo le assunzioni
2. **Direzione** — moodboard, prototipi, prove di concetto
3. **Costruzione** — design + codice in parallelo, iterazione stretta
4. **Lancio & cura** — deploy, monitoring, evoluzione
Ogni step ha un micro-asset grafico animato (SVG lottie-like o shader 2D).

### Capitolo 5 — Lavori
**3D**: la rete si condensa in **wireframe di siti reali** (mockup 3D in prospettiva, floating). Transizione è il momento più spettacolare del sito.
**Layout**: showcase orizzontale/scroll-snap con 1–3 progetti. **Lavanderia La Farfalla** è il primo, trattato come hero-case (large image, titolo, descrizione breve, link "View case study →" che potrà aprire pagina dedicata in futuro).
Struttura predisposta per crescere (6–12 progetti nel tempo senza rotture di layout).

### Capitolo 6 — Stack tecnologico / Capabilities
**3D**: loghi delle tecnologie **orbitano** intorno a un nucleo centrale come satelliti, leggero tilt con mouse movement.
**Contenuto**: grid/constellation di tecnologie. Non solo logo: al hover si espande una card con "Perché lo usiamo".
Stack da includere: Next.js, React, TypeScript, Three.js / R3F, GSAP, Framer Motion, Tailwind, shadcn/ui, Figma, Blender, Vercel, Supabase/Postgres, Sanity/Payload, Claude Code.

### Capitolo 7 — Chi siamo (Federico)
**3D**: la rete si focalizza su **un nodo centrale più grande**, gli altri si allontanano in profondità (dolly zoom effect).
**Layout**: sezione intima, fondo quasi nero, colonna singola.
- Foto/ritratto di Federico stilizzato (trattamento mono/duotone, grain, non una foto corporate — qualcosa di editoriale, come ritratti di magazine indipendenti).
- Nome in display grande: **Federico** + handle/ruolo in mono: "Founder & Principal".
- Bio corta (3–5 righe) in prima persona, tono schietto. Esempio:
> *"Progetto e costruisco siti da quando il web era brutto. Synapse Lab è il mio tentativo di farlo come credo si debba fare: pochi progetti, fatti bene, con le mani."*
- Firma manoscritta digitalizzata (SVG animato, si traccia al viewport enter).
- Social/contatti discreti sotto.

### Capitolo 8 — Contatti
**3D**: la rete **esplode** in particelle che riempiono lo schermo, poi si riaggregano formando la parola "Let's talk" o il form stesso (i nodi diventano gli input).
**Contenuto**:
- Titolo gigante: "Pronti a costruire qualcosa di memorabile?" / "Ready to build something memorable?"
- Tre CTA in colonna, ciascuna con interazione propria:
  1. **Prenota una call** — apre Calendly embed in modal full-screen con transizione cinematografica (primario)
  2. **Scrivici** — `federico@arautoricambi.com` in display gigante, click-to-copy con feedback animato
  3. **Form conversazionale** — alternativa per chi preferisce scrivere: 3 domande presentate una alla volta con animazione tipo chat ("Come ti chiami?" → "Di che progetto parliamo?" → "Budget indicativo?"), submit invia a email.
- Footer minimale: logo-mark, coordinate lab in mono, socials (X/Twitter, GitHub, LinkedIn, Instagram), credits, toggle tema.

---

## 6. Signature interactions (obbligatori)

- **Cursore custom**: cerchio piccolo con anello esterno che si allarga/colora su elementi interattivi (magnet effect su CTA e link). Diventa "vortex" traslucido nelle sezioni 3D, rivelando una mini-distorsione della scena dietro.
- **Audio design**: soundscape ambient a volume molto basso (layer drone + micro-click sinaptici randomizzati) che parte **solo dopo interazione esplicita** (pulsante audio in navbar, OFF di default con badge "Sound: off → tap"). Micro-sound su click CTA, hover significativi, submit form. Libreria consigliata: Tone.js o Howler.js.
- **Transizioni di capitolo**: ogni sezione ha un'entrata coreografata (not just fade) — combinazioni di mask reveal, split-text, scene morph. Usare GSAP timelines legate a ScrollTrigger.
- **Dark/Light morph**: toggle nel footer che non flippa colori ma **trasforma atmosfera 3D** in ~1.2s (illuminazione, palette, densità particelle).
- **Easter egg**: combo tastiera `S Y N` (o Konami-like) attiva **modalità wireframe** — tutto il sito passa a rendering blueprint (linee ciano su nero, shader wireframe sulla rete neurale, tipografia passa a mono, cursore diventa crosshair). Secondo trigger per tornare normale. Piccola notification in basso: "// debug mode — press SYN to exit".
- **Scheduling premium**: Calendly / Cal.com integrato in modal custom (non l'iframe default) con styling che matcha il sito.
- **Performance-first fallback**: detection automatica (navigator.deviceMemory, connection.effectiveType, prefers-reduced-motion, mobile). Se "low": scena 3D diventa immagine statica generata + parallax 2D, audio off, animazioni ridotte. L'estetica resta premium — **la degradazione non deve sembrare degradazione**.

---

## 7. Copy — regole

- Frasi corte. Mai superare 14 parole per claim principale.
- Numeri scritti in mono, con prefisso label ("N° 01 — Discovery").
- Tempi verbali presenti, attivi. Evitare condizionali.
- Una battuta (UNA) da qualche parte, fine, tipo a fine footer: commento metadata del tipo `// built with care in [city], Italy`.
- Claim da testare per la hero (da validare con il designer): "Sinapsi digitali, costruite a mano." / "Design is thinking, made visible." / "Few sites a year. Each like the last."

---

## 8. Deliverable richiesti (dal tool / designer che riceve questo prompt)

1. **Moodboard**: 6–12 immagini di riferimento per atmosfera, tipografia, 3D style
2. **Sistema visivo**: palette finalizzata, scala tipografica, spacing, grid
3. **Storyboard 3D**: 8 frame chiave (uno per capitolo) della scena WebGL
4. **Mockup ad alta fedeltà**: desktop (1440px) + mobile (390px) per ogni capitolo
5. **Flow di interazione**: video/prototipo animato dei momenti signature (cursore, transizioni, hero, capitolo 5 e 8)
6. **Design tokens**: file JSON/Figma Variables pronti per consumo in codice (Tailwind config compatibile)
7. **Copy deck finale**: IT + EN parallelo, per ogni capitolo
8. **Note tecniche**: qualsiasi constraint o opportunità emersi durante il design (assets 3D necessari, font licenses, librerie consigliate)

---

## 9. Vincoli non negoziabili

- **Performance**: Lighthouse Performance ≥ 85 su mobile mid-range, ≥ 95 desktop. 3D lazy-loaded, mai blocca First Contentful Paint.
- **Accessibilità**: WCAG AA minimo. `prefers-reduced-motion` rispettato (scene statiche + reveal semplici). Navigazione da tastiera completa. Contrasti verificati.
- **SEO**: HTML semantico sotto la scena 3D, metadata completi, Open Graph curato (immagine OG = frame della scena), schema.org Organization + LocalBusiness.
- **Privacy**: no cookie invasivi, analytics privacy-first (Plausible / Umami), GDPR compliant.
- **Mobile**: non è una riduzione del desktop, è un'esperienza ripensata (touch-driven, meno 3D ma più tipografia grande e motion 2D intenzionale).

---

## 10. Cosa NON vogliamo

- Stock photo di persone che sorridono davanti a laptop
- Icone generiche di "servizi"
- Claim tipo "soluzioni digitali a 360°"
- Testimonial finti o loghi "as seen on" senza prova
- Chatbot con mascotte
- Parallax goffo o effetti AOS.js che urlano 2018
- Dark mode tanto per — la nostra dark è curata come la light

---

**Fine brief.**

Questo documento è self-contained: chi lo riceve può iniziare a progettare senza domande ulteriori. Ogni ambiguità residua (es. claim esatti, scelta font finale, foto di Federico) va risolta nel primo round di design con presentazione di 2–3 opzioni.
