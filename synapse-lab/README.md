# Synapse Lab

Sito vetrina dell'agenzia Synapse Lab — digital craft studio di Milano.

**Produzione:** https://federico-cyber.github.io/synapse-lab/

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

Lo script verifica 17 tag critici e la validità di sitemap XML + JSON-LD. Exit non-zero se qualcosa manca.

### Rigenerazione OG image

`og-image.html` è il sorgente. Per rigenerare la PNG:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1200,800 --force-device-scale-factor=1 \
  --virtual-time-budget=8000 \
  --screenshot="$(pwd)/og-image-raw.png" \
  "file://$(pwd)/og-image.html"

python3 -c "
from PIL import Image
Image.open('og-image-raw.png').crop((0, 0, 1200, 630)).save('og-image.png', optimize=True)
"
rm og-image-raw.png
```

Nota: il render avviene a 1200×800 e si fa top-crop a 1200×630 con Pillow per aggirare un bug di Chrome headless quando viewport == body.

### Validazione online (dopo deploy)

- Rich results: https://search.google.com/test/rich-results
- Schema.org validator: https://validator.schema.org/
- OG preview: https://www.opengraph.xyz/
- PageSpeed: https://pagespeed.web.dev/

## Deploy

GitHub Actions → GitHub Pages. Push della branch `main` → online in ~1 minuto. Il workflow (`.github/workflows/deploy-pages.yml`) deploya il contenuto di `./synapse-lab` come root del sito.
