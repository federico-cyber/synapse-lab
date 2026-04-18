# Prompt per sito web — Lavanderia-Tintoria-Stireria "La Farfalla"

## Contesto attività
- **Nome:** Lavanderia-Tintoria-Stireria "La Farfalla"
- **Tipologia:** Lavanderia, tintoria e stireria locale
- **Indirizzo:** Corso Matteotti, 43 — 20084 Lacchiarella (MI)
- **Telefono:** 351 868 8487
- **Orari:** apre alle 08:30 (inserire orari completi se disponibili)
- **Reputazione:** 5,0★ su Google Maps — attività di qualità, cura artigianale
- **Target:** residenti di Lacchiarella e paesi limitrofi, famiglie, professionisti, sposi/cerimonie, clienti con capi delicati

## Stile scelto e motivazione
**Motion-Driven + Parallax Storytelling** con accento boutique-artigianale.

**Perché:** il nome "La Farfalla" è un regalo creativo — la metafora della trasformazione (capo sporco → capo pulito, come bruco → farfalla) giustifica e anima l'intero sito. L'utente percepisce leggerezza, cura, movimento — esattamente i valori del servizio. Uno stile statico sprecherebbe questo potenziale narrativo.

## Elementi dinamici richiesti (il cuore del progetto)

### Elementi di sfondo sempre attivi
- **Farfalle animate** che attraversano lo schermo con traiettorie sinusoidali (SVG animati, 3–5 farfalle in contemporanea, velocità e dimensioni differenti per effetto parallasse)
- **Bolle di sapone** che salgono dal basso con leggero ondeggio laterale (opacità 0.3–0.7, dimensioni variabili, 8–12 bolle simultanee)
- **Particelle di luce/polvere dorata** in sottofondo, densità minima, per aggiungere atmosfera

### Animazioni scroll-triggered (parallasse a 3–5 livelli)
- Sfondo cielo/tessuto si muove lento (layer 1, velocità 0.3)
- Elementi decorativi a velocità intermedia (layer 2, 0.6)
- Contenuti principali a velocità normale (layer 3, 1.0)
- Farfalle in primo piano più veloci (layer 4, 1.3)
- Sezione hero con effetto "tessuto che si apre come sipario"

### Micro-interazioni
- Hover su card servizi → la card si solleva con shadow morbida + piccola farfalla compare nell'angolo e batte le ali
- Hover su CTA "Chiama ora" → pulsazione gentile + leggera rotazione dell'icona telefono
- Bottoni con scale 0.96 in pressed e ritorno con spring physics
- Numeri dei contatori animati da 0 al valore finale (anni di esperienza, capi lavati, clienti soddisfatti)

### Transizioni di sezione
- Entrance animations: fade + translateY(30px) → 0 con stagger 50–80ms tra elementi
- Testi con reveal a maschera (come se un panno si spostasse per rivelarli)
- Icone servizio con morphing SVG al primo ingresso nel viewport

### Hero dinamico
- Titolo con kinetic typography: le lettere di "La Farfalla" arrivano una alla volta e sulla "F" compare una farfalla che ne disegna il tratto
- Scroll indicator animato in basso (una farfalla che sale e scende delicatamente)

### Sezione "Come funziona" / timeline
- Scroll-driven: mentre l'utente scorre, un capo di vestito passa visivamente attraverso le fasi (raccolta → lavaggio → stiro → riconsegna) con animazioni dedicate per ogni fase (schiuma, vapore, piega)

## Palette colori
Ispirata a: pulizia, freschezza, cura artigianale, tocco femminile-elegante (la farfalla).

| Ruolo | Hex | Uso |
|---|---|---|
| Primary | `#1E3A5F` | Blu notte elegante, testi principali, header |
| Accent 1 | `#E8B4BC` | Rosa cipria (farfalla), CTA secondari, dettagli |
| Accent 2 | `#7FB3D5` | Azzurro acqua, bolle, elementi liquidi |
| Background | `#FBF9F6` | Bianco caldo (lino), sfondo base |
| Surface | `#FFFFFF` | Card, pannelli |
| Muted | `#E8ECF1` | Divider, bg secondari |
| Foreground | `#1A1D23` | Testo primario |
| Gold accent | `#D4A574` | Polvere luminosa, dettagli premium |

Contrasti verificati AA (4.5:1 testi normali, 3:1 large).

## Tipografia
- **Display/Heading:** `Playfair Display` (serif elegante, richiama artigianato sartoriale) — pesi 600, 700
- **Body:** `Inter` (sans-serif pulito, leggibile) — pesi 400, 500
- **Accent (piccoli dettagli, claim):** `Dancing Script` (solo per frase-firma tipo "dal 1995 ci prendiamo cura dei tuoi capi")

Scala: 14 / 16 / 18 / 24 / 32 / 48 / 72 px

## Struttura sezioni

### 1. Hero
- Video/animazione sfondo: tessuti di lino che ondeggiano con leggero vento + farfalle che volano
- Titolo: **"Lavanderia La Farfalla"**
- Sottotitolo: *"Lavanderia, tintoria e stireria artigianale a Lacchiarella dal [anno]"*
- CTA primario: `Chiama ora → 351 868 8487` (tel: link)
- CTA secondario: `Vieni a trovarci` (scroll to mappa)
- Badge "5,0★ su Google" con stelline animate

### 2. Servizi (grid 3 colonne, 6 card)
Ogni card con icona SVG animata:
- **Lavaggio ad acqua** — capi quotidiani, biancheria, delicati
- **Lavaggio a secco** — abiti eleganti, giacche, cappotti
- **Tintoria** — capi colorati, cuoio, pelle, pellami
- **Stireria professionale** — camicie, abiti, biancheria
- **Abiti da sposa/cerimonia** — cura dedicata, confezionamento
- **Lavaggio tappeti e tende** — grandi formati, ritiro a domicilio

### 3. "Il percorso di un capo" (timeline parallax)
Animazione scroll-driven che racconta le 4 fasi con icone animate e micro-copy.

### 4. Perché sceglierci (3–4 punti)
Contatori animati:
- `X+` anni di esperienza
- `5,0★` valutazione Google
- `100%` soddisfazione o rilavaggio gratuito
- Prodotti eco-friendly / rispetto dei tessuti

### 5. Testimonianze
Carousel automatico con testimonianze reali dalle recensioni Google (chiedere consenso o riformulare).

### 6. Contatti & Mappa
- Mappa interattiva (Google Maps embed) con pin animato a forma di farfalla
- Orari chiari, numero grande e cliccabile, indirizzo
- Pulsante "Indicazioni stradali"
- Form contatti semplice (nome, telefono, messaggio) — opzionale

### 7. Footer
- Link sezioni, social (se presenti), P.IVA, privacy, cookie
- Piccola farfalla che segue il cursore (solo desktop)

## Requisiti tecnici

### Stack consigliato
- **Framework:** Next.js 14+ (App Router) o Astro
- **Animazioni:** Framer Motion + GSAP ScrollTrigger + Lottie (per icone complesse)
- **Styling:** Tailwind CSS + CSS variables per tokens
- **Icone:** Lucide React (base) + SVG custom animati per farfalle/bolle
- **Fonts:** Google Fonts con `display: swap` e preload di Inter

### Performance
- Lazy-load di tutte le immagini below-the-fold
- `prefers-reduced-motion`: disabilita animazioni pesanti, mantiene solo fade essenziali
- Animazioni solo con `transform` e `opacity` (no width/height)
- Bundle splitting per route
- Immagini in WebP/AVIF con `srcset`
- LCP < 2.5s, CLS < 0.1

### Accessibilità (WCAG AA minimo)
- Contrasto 4.5:1 su tutti i testi
- Focus ring visibili su tutti gli elementi interattivi
- Alt text descrittivi
- Navigazione completa da tastiera
- `aria-label` sui bottoni icona
- Tutte le animazioni rispettano `prefers-reduced-motion`
- Touch target ≥ 44×44px su mobile

### Responsive
- Mobile-first, breakpoint: 375 / 768 / 1024 / 1440
- Su mobile: riduci parallasse a 2 livelli max, farfalle a max 2 contemporaneamente
- Hero verticale su mobile con video/animazione più leggera
- Menu hamburger con transizione morbida

### SEO locale
- Schema.org `LocalBusiness` + `DryCleaning` completo
- Meta tag ottimizzati per "lavanderia Lacchiarella", "tintoria Lacchiarella", "stireria Lacchiarella"
- Open Graph e Twitter Card
- Sitemap e robots.txt
- Google Business Profile collegato
- Dati di contatto in formato microdata

## Tone of voice
- Caldo, accogliente, italiano genuino
- "Ci prendiamo cura dei tuoi capi come se fossero nostri"
- Evita gergo tecnico, preferisci parole semplici e visive
- Dà del "tu" al visitatore, familiare ma professionale

## Deliverable richiesti
1. Sito one-page responsive
2. Tutte le animazioni dinamiche richieste sopra
3. Form contatti funzionante (o almeno link `tel:` e `mailto:`)
4. Mappa Google integrata
5. Ottimizzato mobile e desktop
6. Pronto per deploy su Vercel/Netlify

## Anti-pattern da evitare
- Nessuna animazione che causi layout shift
- Niente emoji come icone (solo SVG)
- Niente autoplay di audio
- Non nascondere orari e telefono (informazioni vitali per lavanderia locale)
- Evitare stock photo generiche di lavanderie industriali — serve feel artigianale
- Niente pop-up invadenti
