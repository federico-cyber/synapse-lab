#!/usr/bin/env bash
# SEO smoke test — valida dist/ post build+snapshot.
set -e
cd "$(dirname "$0")/.."

fail() { echo "❌ $1"; exit 1; }
pass() { echo "✓ $1"; }

[ -d dist ] || fail "dist/ missing — run 'npm run build && npm run snapshot' first"

html=dist/index.html
[ -f "$html" ] || fail "dist/index.html missing"

grep -q 'lang="it"' "$html"                                   && pass "lang=it"          || fail "lang=it missing"
grep -q '<title>.*Milano</title>' "$html"                     && pass "title has geo"    || fail "title geo missing"
grep -q 'name="description" content="Synapse Lab è' "$html"   && pass "description IT"   || fail "description not IT"
grep -q 'rel="canonical"' "$html"                             && pass "canonical"        || fail "canonical missing"
grep -q 'hreflang="it"' "$html"                               && pass "hreflang it"      || fail "hreflang it missing"
grep -q 'hreflang="en"' "$html"                               && pass "hreflang en"      || fail "hreflang en missing"
grep -q 'property="og:title"' "$html"                         && pass "og:title"         || fail "og:title missing"
grep -q 'property="og:image"' "$html"                         && pass "og:image"         || fail "og:image missing"
grep -q 'name="twitter:card"' "$html"                         && pass "twitter:card"     || fail "twitter:card missing"
grep -q 'application/ld+json' "$html"                         && pass "JSON-LD present"  || fail "JSON-LD missing"
grep -q 'rel="icon"' "$html"                                  && pass "favicon link"     || fail "favicon link missing"

# Count chapter sections (snapshot HTML è minificato su una singola riga — usa grep -o)
n_chapters=$(grep -o 'data-screen-label' "$html" | wc -l | tr -d ' ')
[ "$n_chapters" -eq 7 ] && pass "7 chapters prerendered" || fail "expected 7 chapters, got $n_chapters"

en=dist/en/index.html
[ -f "$en" ] && pass "dist/en/index.html exists" || fail "EN snapshot missing"
# EN content: hero title "Digital synapses, crafted with care" è splittato in span — cerca "crafted with"
grep -q 'crafted with' "$en" && pass "EN content rendered" || fail "EN content missing (hero not in english)"

[ -f dist/robots.txt ]   && pass "robots.txt"   || fail "robots.txt missing in dist"
[ -f dist/sitemap.xml ]  && pass "sitemap.xml"  || fail "sitemap.xml missing in dist"
[ -f dist/favicon.svg ]  && pass "favicon.svg"  || fail "favicon.svg missing in dist"
[ -f dist/og-image.png ] && pass "og-image.png" || fail "og-image.png missing in dist"

python3 -c "import xml.etree.ElementTree as ET; ET.parse('dist/sitemap.xml')" 2>/dev/null \
  && pass "sitemap valid XML" || fail "sitemap XML broken"

python3 <<'PY' && pass "JSON-LD valid" || fail "JSON-LD broken"
import re, json
html = open('dist/index.html').read()
m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
data = json.loads(m.group(1))
assert data.get("@context") == "https://schema.org"
PY

echo ""
echo "🎉 SEO check passed on dist/"
