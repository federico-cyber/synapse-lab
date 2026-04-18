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
