# SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare il sito Synapse Lab da 38/100 a ~80/100 di SEO score agendo esclusivamente su HTML statico, asset root e copy/JSX già esistenti — senza toccare il build system.

**Architecture:** Il sito è un single-page statico servito da GitHub Pages. Tutte le modifiche avvengono a livello di `<head>` di `index.html`, nuovi file root (`robots.txt`, `sitemap.xml`, `favicon.svg`, `og-image.png`), e piccoli fix di contenuto nel JSX dei capitoli. Nessun build step, nessuna nuova dipendenza.

**Tech Stack:** HTML5, Schema.org JSON-LD, Open Graph, Chrome headless per OG image, bash per verifica.

**Canonical domain:** `https://federico-cyber.github.io/synapse-lab/` — se in futuro verrà impostato un dominio custom (es. `synapselab.it`), aggiornare con un search-and-replace del dominio su tutti i file.

**Scope esplicitamente esclusa (piano separato):** migrazione da React+Babel-standalone a Vite/Next.js con prerendering statico. Quella ristrutturazione risolve il rendering client-side ma è un sottosistema indipendente.

---

## File Structure

### Files to CREATE

| Path | Responsibility |
|------|----------------|
| `robots.txt` | Direttive crawler + riferimento sitemap |
| `sitemap.xml` | URL index con hreflang IT/EN |
| `favicon.svg` | Icona tab basata sul logo inline (SVG vettoriale) |
| `og-image.html` | Template HTML per generare OG image |
| `og-image.png` | Social preview 1200×630 (generata via Chrome headless) |
| `scripts/seo-check.sh` | Smoke test: verifica tag critici nel HTML |

### Files to MODIFY

| Path | Changes |
|------|---------|
| `index.html:5` | Title ottimizzato IT con keyword geo |
| `index.html:7` | Meta description in italiano allineata a `<html lang="it">` |
| `index.html:7-12` (inserimento) | Canonical, Open Graph, Twitter Card, favicon, JSON-LD |
| `chapters.jsx:356` | Sostituire VAT placeholder con testo neutrale |
| `chapters.jsx:357` | Privacy/Cookies → testo "in arrivo" |
| `chapters.jsx:360-363` | Social `href="#"` → link reali o rimozione |
| `chapters.jsx:313,337` | `<h3>` dentro `<button>` → `<span role="heading">` |

---

## Fase 1 — `<head>` meta essentials

### Task 1: Title e meta description in italiano

**Files:**
- Modify: `index.html:5,7`

- [ ] **Step 1: Verifica baseline (test fallisce)**

Run:
```bash
grep -c 'Studio di web design a Milano' /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: `0`

- [ ] **Step 2: Sostituisci il title**

Edit `index.html` riga 5:

old_string:
```html
<title>Synapse Lab — Digital craft studio</title>
```
new_string:
```html
<title>Synapse Lab · Studio di web design a Milano</title>
```

- [ ] **Step 3: Sostituisci la meta description**

Edit `index.html` riga 7:

old_string:
```html
<meta name="description" content="Synapse Lab is a small premium studio crafting web experiences at the edge of design, code, and experimentation.">
```
new_string:
```html
<meta name="description" content="Synapse Lab è uno studio di web design e sviluppo a Milano. Siti su misura con Next.js, React e Three.js — pochi progetti l'anno, fatti con cura.">
```

- [ ] **Step 4: Verifica (test passa)**

Run:
```bash
grep -c 'Studio di web design a Milano' /Users/fede/Documents/siti-web/synapse-lab/index.html
grep -c "content=\"Synapse Lab è uno studio" /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: entrambe `1`. Anche verifica lunghezza:
```bash
awk -F'"' '/meta name="description"/ {print length($4)}' /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: un numero tra 120 e 160.

- [ ] **Step 5: Commit**

```bash
cd /Users/fede/Documents/siti-web/synapse-lab
git add index.html
git commit -m "seo: title e description in italiano allineati a lang=it"
```

---

### Task 2: Canonical URL + robots meta

**Files:**
- Modify: `index.html` (inserimento dopo la meta description)

- [ ] **Step 1: Verifica baseline**

Run:
```bash
grep -c 'rel="canonical"' /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: `0`

- [ ] **Step 2: Aggiungi canonical + meta robots + author**

Edit `index.html` — trova la riga della meta description e inserisci le nuove righe subito dopo.

old_string:
```html
<meta name="description" content="Synapse Lab è uno studio di web design e sviluppo a Milano. Siti su misura con Next.js, React e Three.js — pochi progetti l'anno, fatti con cura.">

<!-- Fonts: Space Grotesk (display) + Instrument Serif (editorial) + JetBrains Mono (lab metadata) -->
```
new_string:
```html
<meta name="description" content="Synapse Lab è uno studio di web design e sviluppo a Milano. Siti su misura con Next.js, React e Three.js — pochi progetti l'anno, fatti con cura.">
<link rel="canonical" href="https://federico-cyber.github.io/synapse-lab/">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="Federico Battistella">

<!-- Fonts: Space Grotesk (display) + Instrument Serif (editorial) + JetBrains Mono (lab metadata) -->
```

- [ ] **Step 3: Verifica**

Run:
```bash
grep -c 'rel="canonical"' /Users/fede/Documents/siti-web/synapse-lab/index.html
grep -c 'max-image-preview:large' /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: entrambe `1`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "seo: canonical URL + robots meta + author"
```

---

### Task 3: Open Graph + Twitter Card

**Files:**
- Modify: `index.html` (inserimento prima del blocco Fonts)

- [ ] **Step 1: Verifica baseline**

Run:
```bash
grep -cE 'og:|twitter:' /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: `0`

- [ ] **Step 2: Inserisci blocco OG/Twitter dopo la riga author**

old_string:
```html
<meta name="author" content="Federico Battistella">

<!-- Fonts: Space Grotesk (display) + Instrument Serif (editorial) + JetBrains Mono (lab metadata) -->
```
new_string:
```html
<meta name="author" content="Federico Battistella">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Synapse Lab">
<meta property="og:title" content="Synapse Lab · Studio di web design a Milano">
<meta property="og:description" content="Sinapsi digitali, progettate con cura. Pochi progetti l'anno — ognuno come fosse l'unico.">
<meta property="og:url" content="https://federico-cyber.github.io/synapse-lab/">
<meta property="og:image" content="https://federico-cyber.github.io/synapse-lab/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Synapse Lab — Digital craft studio, Milano">
<meta property="og:locale" content="it_IT">
<meta property="og:locale:alternate" content="en_US">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Synapse Lab · Studio di web design a Milano">
<meta name="twitter:description" content="Sinapsi digitali, progettate con cura. Pochi progetti l'anno — ognuno come fosse l'unico.">
<meta name="twitter:image" content="https://federico-cyber.github.io/synapse-lab/og-image.png">

<!-- Fonts: Space Grotesk (display) + Instrument Serif (editorial) + JetBrains Mono (lab metadata) -->
```

- [ ] **Step 3: Verifica**

Run:
```bash
grep -c 'og:' /Users/fede/Documents/siti-web/synapse-lab/index.html
grep -c 'twitter:' /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: `11` e `4`.

- [ ] **Step 4: Commit (ancora senza og-image.png — viene creata al Task 6)**

```bash
git add index.html
git commit -m "seo: Open Graph + Twitter Card meta tags"
```

---

### Task 4: Favicon SVG coerente con il logo

**Files:**
- Create: `favicon.svg`
- Modify: `index.html` (inserimento link icon)

- [ ] **Step 1: Crea favicon.svg**

Crea `/Users/fede/Documents/siti-web/synapse-lab/favicon.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="32" height="32">
  <style>
    @media (prefers-color-scheme: dark) { g { stroke: #fff; } circle.core { fill: #fff; } }
    @media (prefers-color-scheme: light) { g { stroke: #111; } circle.core { fill: #111; } }
  </style>
  <g fill="none" stroke="#111" stroke-width="2">
    <circle cx="8" cy="20" r="2.4"/>
    <circle cx="20" cy="8" r="2.4"/>
    <circle cx="20" cy="32" r="2.4"/>
    <circle cx="32" cy="20" r="2.4"/>
    <circle class="core" cx="20" cy="20" r="3.2" fill="#111" stroke="none"/>
    <path d="M10 19 Q 14 14 18 10"/>
    <path d="M22 10 Q 26 14 30 19"/>
    <path d="M30 21 Q 26 26 22 30"/>
    <path d="M18 30 Q 14 26 10 21"/>
  </g>
</svg>
```

- [ ] **Step 2: Aggiungi link al favicon nell'HTML**

Edit `index.html`, inserendo subito dopo `<meta name="author" ...>`:

old_string:
```html
<meta name="author" content="Federico Battistella">

<!-- Open Graph -->
```
new_string:
```html
<meta name="author" content="Federico Battistella">

<link rel="icon" type="image/svg+xml" href="/synapse-lab/favicon.svg">
<link rel="alternate icon" type="image/svg+xml" href="favicon.svg">

<!-- Open Graph -->
```

> Il primo href è absolute per il subpath GitHub Pages, il secondo relative come fallback locale.

- [ ] **Step 3: Verifica SVG valido + link presente**

Run:
```bash
python3 -c "import xml.etree.ElementTree as ET; ET.parse('/Users/fede/Documents/siti-web/synapse-lab/favicon.svg'); print('SVG valid')"
grep -c 'rel="icon"' /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: `SVG valid` e `1`.

- [ ] **Step 4: Commit**

```bash
git add favicon.svg index.html
git commit -m "seo: favicon SVG adattivo dark/light basato sul logo"
```

---

### Task 5: hreflang + preload font

**Files:**
- Modify: `index.html` (canonical block + blocco Fonts)

- [ ] **Step 1: Verifica baseline**

Run:
```bash
grep -c 'hreflang' /Users/fede/Documents/siti-web/synapse-lab/index.html
grep -c 'rel="preload"' /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: entrambe `0`.

- [ ] **Step 2: Aggiungi hreflang dopo canonical**

Edit `index.html`:

old_string:
```html
<link rel="canonical" href="https://federico-cyber.github.io/synapse-lab/">
<meta name="robots" content="index,follow,max-image-preview:large">
```
new_string:
```html
<link rel="canonical" href="https://federico-cyber.github.io/synapse-lab/">
<link rel="alternate" hreflang="it" href="https://federico-cyber.github.io/synapse-lab/">
<link rel="alternate" hreflang="en" href="https://federico-cyber.github.io/synapse-lab/?lang=en">
<link rel="alternate" hreflang="x-default" href="https://federico-cyber.github.io/synapse-lab/">
<meta name="robots" content="index,follow,max-image-preview:large">
```

- [ ] **Step 3: Aggiungi preload per il CSS dei font**

Edit `index.html` — inserisci un preload link prima del `<link href="https://fonts.googleapis.com/...">`:

old_string:
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```
new_string:
```html
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 4: Verifica**

Run:
```bash
grep -c 'hreflang' /Users/fede/Documents/siti-web/synapse-lab/index.html
grep -c 'rel="preload"' /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: `3` e `1`.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "seo: hreflang IT/EN + preload font stylesheet"
```

---

## Fase 2 — Asset SEO root

### Task 6: Genera og-image.png via Chrome headless

**Files:**
- Create: `og-image.html`
- Create: `og-image.png`

- [ ] **Step 1: Crea template HTML**

Crea `/Users/fede/Documents/siti-web/synapse-lab/og-image.html`:

```html
<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Instrument+Serif:ital@1&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px; height: 630px;
    background: #0a0a0f;
    color: #fafafa;
    font-family: 'Space Grotesk', sans-serif;
    padding: 72px 80px;
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden;
  }
  body::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 80% 20%, rgba(80,140,255,0.25), transparent 50%);
  }
  .top { display: flex; align-items: center; gap: 14px; position: relative; z-index: 1; }
  .mark { width: 44px; height: 44px; }
  .brand { font-weight: 600; letter-spacing: 0.02em; font-size: 20px; }
  .brand em { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; }
  h1 {
    font-size: 96px; font-weight: 700; line-height: 1.02; letter-spacing: -0.02em;
    position: relative; z-index: 1; max-width: 900px;
  }
  h1 em { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; color: #8eb8ff; }
  .bottom { display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; font-size: 16px; letter-spacing: 0.06em; text-transform: uppercase; color: #a0a0b0; font-weight: 500; }
</style>
</head>
<body>
  <div class="top">
    <svg class="mark" viewBox="0 0 40 40">
      <g fill="none" stroke="#fafafa" stroke-width="1.6">
        <circle cx="8" cy="20" r="2.4"/>
        <circle cx="20" cy="8" r="2.4"/>
        <circle cx="20" cy="32" r="2.4"/>
        <circle cx="32" cy="20" r="2.4"/>
        <circle cx="20" cy="20" r="3.2" fill="#fafafa"/>
        <path d="M10 19 Q 14 14 18 10"/>
        <path d="M22 10 Q 26 14 30 19"/>
        <path d="M30 21 Q 26 26 22 30"/>
        <path d="M18 30 Q 14 26 10 21"/>
      </g>
    </svg>
    <div class="brand">Synapse <em>Lab</em></div>
  </div>
  <h1>Sinapsi digitali,<br><em>progettate con cura.</em></h1>
  <div class="bottom">
    <span>Studio di web design · Milano</span>
    <span>MMXXVI</span>
  </div>
</body>
</html>
```

- [ ] **Step 2: Renderizza con Chrome headless**

Run (macOS):
```bash
cd /Users/fede/Documents/siti-web/synapse-lab
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --window-size=1200,630 \
  --virtual-time-budget=3000 \
  --screenshot="$(pwd)/og-image.png" \
  "file://$(pwd)/og-image.html"
```
Expected: file `og-image.png` creato.

Se Chrome non è nel path standard:
```bash
ls /Applications/ | grep -i chrome
```

- [ ] **Step 3: Verifica dimensioni**

Run:
```bash
file /Users/fede/Documents/siti-web/synapse-lab/og-image.png
ls -lh /Users/fede/Documents/siti-web/synapse-lab/og-image.png
```
Expected: `PNG image data, 1200 x 630`, peso <500 KB.

Se peso >500 KB e `pngquant` è installato:
```bash
pngquant --quality=70-85 --ext=.png --force /Users/fede/Documents/siti-web/synapse-lab/og-image.png
```

- [ ] **Step 4: Controllo visivo**

```bash
open /Users/fede/Documents/siti-web/synapse-lab/og-image.png
```
Deve mostrare: logo + claim "Sinapsi digitali, progettate con cura." + footer "Studio di web design · Milano · MMXXVI".

- [ ] **Step 5: Commit**

```bash
git add og-image.html og-image.png
git commit -m "seo: OG image 1200x630 generata via Chrome headless"
```

---

### Task 7: robots.txt

**Files:**
- Create: `robots.txt`

- [ ] **Step 1: Verifica baseline**

Run:
```bash
ls /Users/fede/Documents/siti-web/synapse-lab/robots.txt 2>/dev/null && echo exists || echo missing
```
Expected: `missing`.

- [ ] **Step 2: Crea robots.txt**

Crea `/Users/fede/Documents/siti-web/synapse-lab/robots.txt`:

```
# robots.txt — Synapse Lab
# https://federico-cyber.github.io/synapse-lab/

User-agent: *
Allow: /

Disallow: /docs/
Disallow: /prompt-design.md

Sitemap: https://federico-cyber.github.io/synapse-lab/sitemap.xml
```

- [ ] **Step 3: Verifica**

Run:
```bash
grep -c 'Sitemap:' /Users/fede/Documents/siti-web/synapse-lab/robots.txt
```
Expected: `1`.

- [ ] **Step 4: Commit**

```bash
git add robots.txt
git commit -m "seo: robots.txt con sitemap reference"
```

---

### Task 8: sitemap.xml

**Files:**
- Create: `sitemap.xml`

- [ ] **Step 1: Crea sitemap con hreflang**

Crea `/Users/fede/Documents/siti-web/synapse-lab/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://federico-cyber.github.io/synapse-lab/</loc>
    <lastmod>2026-04-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="it" href="https://federico-cyber.github.io/synapse-lab/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://federico-cyber.github.io/synapse-lab/?lang=en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://federico-cyber.github.io/synapse-lab/"/>
  </url>
</urlset>
```

- [ ] **Step 2: Valida XML**

Run:
```bash
python3 -c "import xml.etree.ElementTree as ET; ET.parse('/Users/fede/Documents/siti-web/synapse-lab/sitemap.xml'); print('XML valid')"
```
Expected: `XML valid`.

- [ ] **Step 3: Commit**

```bash
git add sitemap.xml
git commit -m "seo: sitemap.xml con hreflang IT/EN"
```

---

### Task 9: JSON-LD Organization + ProfessionalService

**Files:**
- Modify: `index.html` (inserimento prima di `</head>`)

- [ ] **Step 1: Verifica baseline**

Run:
```bash
grep -c 'application/ld+json' /Users/fede/Documents/siti-web/synapse-lab/index.html
```
Expected: `0`.

- [ ] **Step 2: Inserisci blocco JSON-LD prima di `</head>`**

Edit `index.html`:

old_string:
```html
<link rel="stylesheet" href="style.css">
</head>
```
new_string:
```html
<link rel="stylesheet" href="style.css">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": "https://federico-cyber.github.io/synapse-lab/#org",
      "name": "Synapse Lab",
      "alternateName": "SYN / LAB",
      "url": "https://federico-cyber.github.io/synapse-lab/",
      "logo": "https://federico-cyber.github.io/synapse-lab/favicon.svg",
      "image": "https://federico-cyber.github.io/synapse-lab/og-image.png",
      "description": "Studio di web design e sviluppo a Milano. Siti su misura con Next.js, React e Three.js — pochi progetti l'anno, fatti con cura.",
      "foundingDate": "2025",
      "slogan": "Sinapsi digitali, progettate con cura.",
      "areaServed": { "@type": "Country", "name": "Italy" },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Milano",
        "addressCountry": "IT"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 45.4642,
        "longitude": 9.1900
      },
      "founder": {
        "@type": "Person",
        "@id": "https://federico-cyber.github.io/synapse-lab/#founder",
        "name": "Federico Battistella",
        "jobTitle": "Founder & Principal",
        "email": "battistella.business@gmail.com"
      },
      "knowsAbout": [
        "Web Design", "Art Direction", "Next.js", "React",
        "Three.js", "WebGL", "Motion Design", "TypeScript",
        "Accessibility WCAG AA", "Product Strategy"
      ],
      "makesOffer": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Web Design & Art Direction" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Development & Performance" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Motion & Interaction" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Strategy & Product" } }
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://federico-cyber.github.io/synapse-lab/#website",
      "url": "https://federico-cyber.github.io/synapse-lab/",
      "name": "Synapse Lab",
      "publisher": { "@id": "https://federico-cyber.github.io/synapse-lab/#org" },
      "inLanguage": ["it-IT", "en-US"]
    }
  ]
}
</script>
</head>
```

- [ ] **Step 3: Valida il JSON-LD**

Run:
```bash
python3 << 'EOF'
import re, json
with open('/Users/fede/Documents/siti-web/synapse-lab/index.html') as f:
    html = f.read()
m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
assert m, "JSON-LD block not found"
data = json.loads(m.group(1))
assert data.get("@context") == "https://schema.org"
assert len(data["@graph"]) == 2
print("JSON-LD valid, nodes:", len(data["@graph"]))
EOF
```
Expected: `JSON-LD valid, nodes: 2`.

- [ ] **Step 4: Validazione esterna (dopo deploy)**

Testare online con: `https://validator.schema.org/#url=https%3A%2F%2Ffederico-cyber.github.io%2Fsynapse-lab%2F`

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "seo: JSON-LD ProfessionalService + WebSite schema"
```

---

## Fase 3 — Content fixes nel JSX

### Task 10: Rimuovi link social placeholder

**Files:**
- Modify: `chapters.jsx:359-364`

- [ ] **Step 1: Verifica baseline (4 href="#" nel footer social)**

Run:
```bash
grep -c 'href="#">' /Users/fede/Documents/siti-web/synapse-lab/chapters.jsx
```
Expected: `4`.

- [ ] **Step 2: Sostituisci con link reali**

Edit `chapters.jsx`:

old_string:
```jsx
          <div className="fl-col socials" style={{ alignSelf: 'flex-end' }}>
            <a href="#">Twitter</a>
            <a href="#">GitHub</a>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram</a>
          </div>
```
new_string:
```jsx
          <div className="fl-col socials" style={{ alignSelf: 'flex-end' }}>
            <a href="https://github.com/federico-cyber" rel="me noopener" target="_blank">GitHub</a>
            <a href="mailto:battistella.business@gmail.com" rel="me">Email</a>
          </div>
```

> Meglio 2 link reali che 4 fake. Aggiungere Twitter/LinkedIn/Instagram solo se esistono profili business Synapse Lab.

- [ ] **Step 3: Verifica**

Run:
```bash
grep -c 'href="#">' /Users/fede/Documents/siti-web/synapse-lab/chapters.jsx
```
Expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add chapters.jsx
git commit -m "seo: rimuove link social placeholder, lascia solo quelli reali"
```

---

### Task 11: Fix VAT placeholder e Privacy/Cookies

**Files:**
- Modify: `chapters.jsx:355-358`

- [ ] **Step 1: Verifica baseline**

Run:
```bash
grep -c 'IT00000000000' /Users/fede/Documents/siti-web/synapse-lab/chapters.jsx
```
Expected: `1`.

- [ ] **Step 2: Sostituisci VAT + Privacy con testo neutro "in attivazione"**

Edit `chapters.jsx`:

old_string:
```jsx
          <div className="fl-col">
            <b>{lang === 'en' ? 'Legal' : 'Legale'}</b>
            <span>VAT IT00000000000</span>
            <span>{lang === 'en' ? 'Privacy · Cookies' : 'Privacy · Cookie'}</span>
          </div>
```
new_string:
```jsx
          <div className="fl-col">
            <b>{lang === 'en' ? 'Legal' : 'Legale'}</b>
            <span>{lang === 'en' ? 'VAT — coming soon' : 'P.IVA in attivazione'}</span>
            <span>{lang === 'en' ? 'Privacy & Cookies — coming soon' : 'Privacy & Cookie in arrivo'}</span>
          </div>
```

> `IT00000000000` è un placeholder evidente; un "in attivazione" onesto non pregiudica la percezione di qualità. Quando la P.IVA sarà registrata, sostituire con la stringa reale e trasformare Privacy/Cookies in link alle relative pagine (piano separato).

- [ ] **Step 3: Verifica**

Run:
```bash
grep -c 'IT00000000000' /Users/fede/Documents/siti-web/synapse-lab/chapters.jsx
```
Expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add chapters.jsx
git commit -m "seo: rimuove VAT placeholder, privacy in attivazione"
```

---

### Task 12: `<h3>` dentro `<button>` → `<span role="heading">`

**Files:**
- Modify: `chapters.jsx:313, 337`

Le contact card 0 e 2 (indexed C.cards[0] e C.cards[2]) in `ChapterContact` sono `<button>` che racchiudono un `<h3 className="title">`. Nesting interactive > heading è HTML non valido e rompe la semantica dei parser. Sostituiamo con `<span>` annotato con ruolo e livello heading.

- [ ] **Step 1: Verifica baseline (2 match)**

Run:
```bash
grep -cn 'h3 className="title"' /Users/fede/Documents/siti-web/synapse-lab/chapters.jsx
```
Expected: `2`.

- [ ] **Step 2: Prima occorrenza (card #0, ~riga 313)**

Usa il tool Edit specificando come `old_string` l'intera riga completa così com'è nel file (trovala col Read del range 310-315); come `new_string` la stessa riga ma con:
- tag `h3` sostituito da `span`
- attributi `role="heading" aria-level="3"` aggiunti subito dopo `className="title"`
- tutto il resto (style, l'handler `...InnerHTML`, la chiusura self-closing) invariato

Struttura finale (schematicamente):
```
<span className="title" role="heading" aria-level="3" style={{ marginTop: 16 }} {...stesso-handler-di-prima}/>
```

- [ ] **Step 3: Seconda occorrenza (card #2, ~riga 337)**

Identico al passaggio precedente, ma per il riferimento `C.cards[2]`. Usa Edit con il contenuto esatto della riga corrente.

- [ ] **Step 4: Verifica**

Run:
```bash
grep -c 'h3 className="title"' /Users/fede/Documents/siti-web/synapse-lab/chapters.jsx
grep -c 'span className="title" role="heading"' /Users/fede/Documents/siti-web/synapse-lab/chapters.jsx
```
Expected: `0` e `2`.

- [ ] **Step 5: Verifica CSS (no regressioni di stile)**

I selettori in `style.css` dovrebbero colpire `.contact-card .title` indipendentemente dal tag.

Run:
```bash
grep -n '\.contact-card .title\|h3\.title\|h3.title' /Users/fede/Documents/siti-web/synapse-lab/style.css
```
Se appare qualche `h3.title` (con selettore legato al tag), aggiornalo a `.contact-card .title`. Se nessun match sul tag `h3`, niente da fare.

- [ ] **Step 6: Smoke test visuale**

```bash
cd /Users/fede/Documents/siti-web/synapse-lab
python3 -m http.server 8787 &>/dev/null &
sleep 1 && open "http://localhost:8787/#ch7"
```
Controlla che le 3 contact card mantengano lo stesso look. Per fermare:
```bash
pkill -f "http.server 8787"
```

- [ ] **Step 7: Commit**

```bash
git add chapters.jsx
git commit -m "a11y: h3 dentro button sostituito con span role=heading"
```

---

### Task 13: Email — valutazione (opzionale)

**Files:**
- Modify: `copy.jsx:164` (solo se lo vuoi fare)

L'indirizzo `battistella.business@gmail.com` compare in `copy.jsx:145` (About, già come `mailto:`) e `copy.jsx:164` (Contact, testo card). I crawler di email fanno regex su `\S+@\S+` quindi un obfuscation parziale riduce il rischio spam ma non lo elimina.

- [ ] **Step 1: Decisione**

Skip questo task se non c'è spam evidente. L'email deve essere recuperabile per la funzione business della pagina.

- [ ] **Step 2: (Solo se si procede) Obfuscation leggera nella card**

Edit `copy.jsx:164`:

old_string:
```javascript
        email: "battistella.business@gmail.com",
```
new_string:
```javascript
        email: "battistella.business" + String.fromCharCode(64) + "gmail.com",
```

Visivamente identico (JS concatena al render), ma il regex naive non trova più la `@`.

- [ ] **Step 3: Commit (solo se modificato)**

```bash
git add copy.jsx
git commit -m "seo: obfuscation leggera email nel DOM"
```

---

## Fase 4 — Smoke test + docs

### Task 14: Script di verifica automatica

**Files:**
- Create: `scripts/seo-check.sh`

- [ ] **Step 1: Crea cartella + script**

Run:
```bash
mkdir -p /Users/fede/Documents/siti-web/synapse-lab/scripts
```

Crea `/Users/fede/Documents/siti-web/synapse-lab/scripts/seo-check.sh`:

```bash
#!/usr/bin/env bash
# SEO smoke test — exit 0 se tutto ok, 1 al primo fallimento.
set -e
cd "$(dirname "$0")/.."

fail() { echo "❌ $1"; exit 1; }
pass() { echo "✓ $1"; }

html=index.html
grep -q 'lang="it"' $html                                   && pass "lang=it"          || fail "lang=it missing"
grep -q '<title>.*Milano</title>' $html                     && pass "title has geo"    || fail "title geo missing"
grep -q 'name="description" content="Synapse Lab è' $html   && pass "description IT"   || fail "description not IT"
grep -q 'rel="canonical"' $html                             && pass "canonical"        || fail "canonical missing"
grep -q 'hreflang="it"' $html                               && pass "hreflang it"      || fail "hreflang it missing"
grep -q 'hreflang="en"' $html                               && pass "hreflang en"      || fail "hreflang en missing"
grep -q 'property="og:title"' $html                         && pass "og:title"         || fail "og:title missing"
grep -q 'property="og:image"' $html                         && pass "og:image"         || fail "og:image missing"
grep -q 'name="twitter:card"' $html                         && pass "twitter:card"     || fail "twitter:card missing"
grep -q 'application/ld+json' $html                         && pass "JSON-LD present"  || fail "JSON-LD missing"
grep -q 'rel="icon"' $html                                  && pass "favicon link"     || fail "favicon link missing"

[ -f robots.txt ]   && pass "robots.txt"   || fail "robots.txt missing"
[ -f sitemap.xml ]  && pass "sitemap.xml"  || fail "sitemap.xml missing"
[ -f favicon.svg ]  && pass "favicon.svg"  || fail "favicon.svg missing"
[ -f og-image.png ] && pass "og-image.png" || fail "og-image.png missing"

python3 -c "import xml.etree.ElementTree as ET; ET.parse('sitemap.xml')" 2>/dev/null \
  && pass "sitemap valid XML" || fail "sitemap XML broken"

python3 <<'PY' && pass "JSON-LD valid" || fail "JSON-LD broken"
import re, json
html = open('index.html').read()
m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
data = json.loads(m.group(1))
assert data.get("@context") == "https://schema.org"
PY

echo ""
echo "🎉 SEO check passed"
```

- [ ] **Step 2: Rendi eseguibile e lancia**

Run:
```bash
chmod +x /Users/fede/Documents/siti-web/synapse-lab/scripts/seo-check.sh
/Users/fede/Documents/siti-web/synapse-lab/scripts/seo-check.sh
```
Expected: tutti i check con `✓` e riga finale `🎉 SEO check passed`.

- [ ] **Step 3: Commit**

```bash
git add scripts/seo-check.sh
git commit -m "seo: script di smoke test per i tag critici"
```

---

### Task 15: README con stato SEO

**Files:**
- Create o Modify: `README.md`

- [ ] **Step 1: Check esistenza**

Run:
```bash
ls /Users/fede/Documents/siti-web/synapse-lab/README.md 2>/dev/null && echo exists || echo missing
```

- [ ] **Step 2: Crea o aggiungi sezione SEO**

Crea (o append) `/Users/fede/Documents/siti-web/synapse-lab/README.md`:

```markdown
# Synapse Lab

Sito vetrina dell'agenzia Synapse Lab — digital craft studio di Milano.

Dominio: https://federico-cyber.github.io/synapse-lab/

## Stack

- HTML5 + CSS3 statico
- React 18 via CDN + Babel standalone (design prototype — migrazione a Vite pianificata in piano separato)
- Canvas 2D per la rete neurale di background
- Zero dipendenze npm

## Sviluppo locale

```bash
python3 -m http.server 8787
# apri http://localhost:8787
```

## SEO

Meta tag, JSON-LD, `robots.txt`, `sitemap.xml`, `favicon.svg` e `og-image.png` sono curati manualmente. Prima di ogni deploy:

```bash
./scripts/seo-check.sh
```

Dopo il deploy, validare in rete:

- Rich results: https://search.google.com/test/rich-results
- Schema.org validator: https://validator.schema.org/
- OG preview: https://www.opengraph.xyz/
- PageSpeed: https://pagespeed.web.dev/

## Deploy

GitHub Pages serve la branch `main`. Push → online in ~1 minuto.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README con stato SEO e guida verifica"
```

---

## Fase 5 — Deploy e validazione live

### Task 16: Push + check live

- [ ] **Step 1: Push finale**

```bash
cd /Users/fede/Documents/siti-web/synapse-lab
git push origin main
```

- [ ] **Step 2: Attendi build GitHub Pages (~1-2 min)**

```bash
gh run list --repo federico-cyber/synapse-lab --limit 1
```

- [ ] **Step 3: Smoke test online**

Run:
```bash
curl -sI https://federico-cyber.github.io/synapse-lab/ | head -3
curl -s https://federico-cyber.github.io/synapse-lab/ | grep -c 'og:image'
curl -sI https://federico-cyber.github.io/synapse-lab/robots.txt | head -1
curl -sI https://federico-cyber.github.io/synapse-lab/sitemap.xml | head -1
curl -sI https://federico-cyber.github.io/synapse-lab/og-image.png | head -1
```
Expected: tutti `HTTP/2 200`; `og:image` count `2`.

- [ ] **Step 4: Validazione schema**

Apri:
- https://search.google.com/test/rich-results?url=https%3A%2F%2Ffederico-cyber.github.io%2Fsynapse-lab%2F
- https://www.opengraph.xyz/url/https%3A%2F%2Ffederico-cyber.github.io%2Fsynapse-lab%2F

Verifica:
- Rich Results: "Valid items detected — ProfessionalService, WebSite"
- OpenGraph: preview con titolo, descrizione e og-image.png

- [ ] **Step 5: Submit sitemap a Google Search Console (manuale)**

1. https://search.google.com/search-console
2. Aggiungi property `https://federico-cyber.github.io/synapse-lab/`
3. Verifica ownership (HTML tag se richiesto)
4. Sitemaps → aggiungi `sitemap.xml`

> Step via browser loggato — non scriptabile.

---

## Out of scope — piani separati

### Piano B (raccomandato come prossimo): Build pipeline + prerendering

- Migrazione React+Babel-standalone → Vite con bundling JSX
- Prerendering statico (`vite-plugin-ssr`, `react-snap` o passaggio ad Astro) per rendere `<main>` indicizzabile senza JS
- React production build
- Font self-host

### Piano C: Contenuti legali + AI visibility

- Pagine `privacy.html` + `cookies.html` conformi GDPR
- Banner cookie (se verrà integrato analytics)
- Skill `/searchfit-seo:ai-visibility` per tracking citazioni AI

---

## Self-Review

**Spec coverage:**
- ✓ Critical: rendering CSR → out of scope consapevolmente (Piano B)
- ✓ Critical: lang/description mismatch → Task 1
- ✓ Critical: robots.txt → Task 7
- ✓ Critical: sitemap.xml → Task 8
- ✓ Critical: canonical → Task 2
- ✓ Warning: OG/Twitter → Task 3
- ✓ Warning: JSON-LD → Task 9
- ✓ Warning: dead social links → Task 10
- ✓ Warning: favicon + manifest → Task 4 (manifest è extra, non critico per single-page)
- ✓ Warning: email in chiaro → Task 13 (opzionale con decisione documentata)
- ✓ Warning: description breve/generica → Task 1
- ✓ Warning: title corto → Task 1
- ✓ Opportunity: preload font → Task 5
- ✓ Opportunity: React dev build → out of scope (Piano B)
- ✓ Opportunity: h3 dentro button → Task 12
- ✓ Opportunity: VAT placeholder → Task 11
- ✓ Opportunity: pagine privacy/cookies → out of scope (Piano C)

**Placeholder scan:** nessun TBD/TODO generico; ogni step ha codice o comando completo. Task 12 step 2-3 usa una descrizione semi-astratta perché l'attributo JSX `{...}` con valore inline varia tra le due occorrenze — l'engineer deve fare Read sul range di righe per ottenere la stringa esatta prima dell'Edit. Questo è un compromesso accettabile vs copiare due blocchi di codice quasi identici che rischierebbero drift.

**Type consistency:** classi CSS (`title`, `svc-title`, `contact-card`, `socials`) coerenti tra JSX e CSS esistenti. Path `og-image.png` in Task 3 (referenziato) e Task 6 (creato): l'ordine espone un 404 per 3 commit — se ti dà fastidio, eseguire Task 6 PRIMA di Task 3 (l'ordine tra i due è swappabile senza altri effetti).

**Dipendenze:** Task 14 richiede che Task 1-9 siano completi (altrimenti il check fallisce come previsto — è il suo lavoro). Task 16 richiede tutto il resto.
