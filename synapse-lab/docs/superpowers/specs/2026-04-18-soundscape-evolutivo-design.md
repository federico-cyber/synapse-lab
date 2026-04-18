# Soundscape Evolutivo — Design Spec

**Data**: 2026-04-18
**Autore**: Federico Battistella + Claude
**Stato**: Design approvato, pronto per plan

---

## 1. Obiettivo

Sostituire l'attuale `sound.js` (drone statico + click UI) con un **soundscape ambient evolutivo** ispirato al soundtrack di No Man's Sky (65daysofstatic). Il suono deve essere vivo, stratificato, rispettoso della lettura, e cambiare in base alla sezione del sito e alle interazioni dell'utente.

**Non-obiettivo**: replicare fedelmente il soundtrack di NMS (richiederebbe strumenti reali e registrazione in studio). Ci avviciniamo al carattere, non alle note specifiche.

---

## 2. Requisiti di alto livello

- **Tre mood** distinti che coesistono nel soundscape: `melancholic`, `luminous`, `tense`.
- **Evoluzione guidata dallo scroll** (sezione del sito → mood di base) **+ dalle interazioni** (hover, click → accenti sovrapposti).
- **Livello musicale**: texture ambient + arpeggi generativi lenti (pattern Markov su scale definite per mood).
- **Presenza sonora**: presente ma non invadente (master gain ~0.55 a pieno regime).
- **Default su mobile**: audio off. Toggle visibile, funzionante se attivato.
- **API pubblica invariata**: `window.__sound.{start, stop, toggle, isOn}`.
- **Graceful degradation**: se `AudioContext` manca, il toggle è nascosto e il sito funziona normalmente.
- **Accessibility**: rispetta `prefers-reduced-motion: reduce` (audio off anche su desktop, toggle sempre disponibile manualmente).

---

## 3. Architettura

### 3.1 Signal graph

```
[DroneLayer] ──────────────────────► [dryBus] ─┐
(sempre on)                                    │
                                               │
[MoodLayer:melancholic] ─┐                     │
[MoodLayer:luminous]    ─┼─► [moodBus] ────────┤
[MoodLayer:tense]       ─┘       │             │
(crossfade, solo uno attivo)     │             │
                                 ├──► [reverbSend] ──► [ConvolverNode] ──► [reverbBus] ─┐
[Arpeggiator]  ───────────────── │                                                      │
(una nota ogni 5-18s)            │                                                      │
                                 │                                                      │
[AccentLayer]  ───────────────── ┘                                                      │
(hover, click, whoosh)                                                                  │
                                                                                        │
[dryBus] + [reverbBus] ──► [masterGain] ──► destination                                 │
                               ▲                                                         │
                               └─────────────────────────────────────────────────────────┘
                               (fade in/out su toggle, visibility API)
```

### 3.2 Moduli (tutti dentro l'IIFE di `sound.js`)

| Modulo | Responsabilità |
|--------|----------------|
| `AudioEngine` | Singleton. Possiede `AudioContext`, `masterGain`, `reverbNode`. Espone `start/stop/fadeIn/fadeOut`. |
| `ReverbBus` | `ConvolverNode` con IR generata proceduralmente (noise + decay esponenziale, 3s stereo). |
| `DroneLayer` | 3 oscillatori detuned in registro basso + lowpass con LFO lento (come attuale, leggermente riarmonizzato). Sempre attivo. |
| `MoodLayer` | Factory: produce 3 istanze (`melancholic`, `luminous`, `tense`), ognuna con i suoi oscillatori/filtri. Gain a 0 finché non selezionata. |
| `Arpeggiator` | Timer per-mood. A ogni tick, probabilità di suonare una nota pescata dalla matrice Markov del mood corrente. |
| `AccentLayer` | Event listener per `mouseover`, `click`, `scroll`. Emette shimmer/blip/whoosh. Rate limiting 3/sec. |
| `StateController` | Orchestratore. `IntersectionObserver` sui capitoli → setMood(). Debounce 800ms. Emette whoosh al cambio. |

### 3.3 File toccati

- `sound.js` — **riscritto da zero** (~450 righe)
- `index.html` — nessuna modifica
- Nessun asset esterno in v1 (IR generata proceduralmente)

---

## 4. Definizione dei tre mood

### 4.1 Parametri sintesi

| Mood | Scala | Oscillatori | Filtro | Registro | Carattere |
|------|-------|-------------|--------|----------|-----------|
| **melancholic** | A minor pentatonic (A2, C3, D3, E3, G3) | 2× sine + 1× triangle | lowpass 600 Hz, Q 0.8 | basso-medio | pad lento, intervalli aperti, sospensione |
| **luminous** | C Lydian (C4, D4, E4, F♯4, G4, A4) | 2× sine + 1× sawtooth soft | highpass 200 Hz + lowpass 3 kHz | medio-alto | shimmer cristallino, note che "brillano" |
| **tense** | D Phrygian (D2, E♭2, F2, G2, A2) | 1× sine + 2× sawtooth detuned | lowpass 400 Hz + LFO pulse 0.5 Hz | basso + sub | pulsazione subgrave, attesa trattenuta |

### 4.2 Arpeggiatore per mood

| Mood | Intervallo tra note | P(suonare) | Ottava | Timbro nota | ADSR |
|------|---------------------|-----------|--------|-------------|------|
| melancholic | 9-14s | 45% | A3-G4 | sine puro | 2.0s / 0.3s / 0.6 / 4.0s |
| luminous | 5-9s | 65% | C5-A5 | sine + FM modulation leggera (bell) | 1.5s / 0.2s / 0.7 / 3.0s |
| tense | 11-18s | 30% | D3-A3 | sawtooth filtrato | 2.5s / 0.4s / 0.5 / 3.5s |

### 4.3 Markov transition matrix (esempio: melancholic)

```
Nota corrente → Probabilità prossima nota (A, C, D, E, G)
A → [10%, 30%, 25%, 20%, 15%]
C → [25%, 10%, 35%, 20%, 10%]
D → [15%, 30%,  5%, 35%, 15%]
E → [30%, 20%, 20%,  5%, 25%]
G → [40%, 15%, 15%, 20%, 10%]
```

Proprietà: diagonali basse (niente ripetizioni), preferenza per intervalli di terza/quinta. Matrici analoghe per `luminous` e `tense`.

### 4.4 Signal chain nota singola

```
OscillatorNode ──► GainNode(ADSR) ──► DelayNode(375ms stereo L/R) ──► send split:
                                                                      ├──► dryBus (70%)
                                                                      └──► reverbSend (30%)
```

---

## 5. Mapping sezioni → mood

Basato sui capitoli reali del sito (`chapters.jsx`):

| Chapter | Sezione | Mood | Rationale |
|---------|---------|------|-----------|
| ch1 | Hero | melancholic | Contemplazione, incipit, "sinapsi digitali con cura" |
| ch2 | Manifesto | melancholic | Riflessivo, dichiarazione di valori |
| ch3 | Services | luminous | Offerta, capability, apertura |
| ch4 | Process | luminous | Metodo, costruzione, positivo |
| ch5 | Stack | luminous (più shimmer) | Celebrazione del craft |
| ch6 | About | melancholic | Personale, introspettivo |
| ch7 | Contact | tense | Call-to-action, urgenza sottile |

---

## 6. Crossfade e transizioni

### 6.1 Crossfade mood

- Durata: **3.5 secondi**
- Curve: `linearRampToValueAtTime` su `gain` dei due `MoodLayer` (uscente 1→0, entrante 0→1)
- Il `DroneLayer` non cambia, resta come continuità
- L'arpeggiatore del mood uscente viene **fermato immediatamente**; quello del mood entrante parte dopo 2s (evita sovrapposizioni)

### 6.2 Whoosh al cambio sezione

- Trigger: all'inizio del crossfade
- Sintesi: `BufferSource` con white noise 900ms → `BiquadFilterNode` lowpass con frequenza in `exponentialRampToValueAtTime` da 4000 Hz → 400 Hz
- Gain: 0.15, inviato al reverb al 90%
- Effetto: transizione "cinematica", l'utente percepisce il passaggio

### 6.3 Trigger scroll → mood

- `IntersectionObserver` su tutti i `.chapter`, `threshold: 0.5`
- Quando un capitolo attraversa il 50% del viewport → `setMood(moodOf(chapterId))`
- **Debounce 800ms** per evitare flip-flop durante scroll veloci

---

## 7. Accenti interattivi

| Trigger | Suono | Volume | Reverb send | Note |
|---------|-------|--------|-------------|------|
| `mouseover` su `[data-magnet]` | shimmer: sine 2-3 kHz, attack 80ms, release 400ms, pitch random ±15 cent | 0.04 | 30% | probabilità 30% per evitare ripetizione |
| `click` su `a, button, [data-magnet]` | blip: sine discendente ottava in 150ms | 0.10 | 30% | tutti i click |
| Cambio sezione (auto) | whoosh: noise → lowpass sweep 4k→400 Hz, 900ms | 0.15 | 90% | all'inizio crossfade |

### 7.1 Rate limiting

- Massimo **3 accenti/secondo globali**. Oltre, i nuovi accenti vengono ignorati (no queue).
- **Velocity compensation**: se ≥2 accenti negli ultimi 500ms, il gain del prossimo viene × 0.6.

### 7.2 Comportamento audio-off

Gli event listener restano installati. Ogni handler controlla `isRunning` come prima cosa e fa early return. Zero overhead CPU se l'audio è spento.

---

## 8. Comportamento mobile

- **Rilevamento**: `matchMedia('(pointer: coarse)').matches`
- **Default**: audio off (toggle visibile)
- **Hover accents**: naturalmente inattivi su touch (`mouseover` non si scatena)
- **Click e whoosh**: funzionanti normalmente
- **Performance**: stesso budget di desktop (~5% CPU con tutti i layer attivi)

---

## 9. Accessibility & lifecycle

### 9.1 `prefers-reduced-motion`

Se `matchMedia('(prefers-reduced-motion: reduce)').matches`:
- Audio resta off di default anche su desktop
- Toggle disponibile manualmente (l'utente può attivarlo consapevolmente)
- Nessun auto-start

### 9.2 Page Visibility API

- `visibilitychange` → hidden: fade-out masterGain in 500ms (ma lascia i nodi vivi)
- `visibilitychange` → visible: se `isOn()`, fade-in in 500ms
- Evita audio che continua mentre l'utente ha cambiato tab

### 9.3 Compatibilità

- Chrome 80+, Safari 14+, Firefox 76+, Edge 80+
- `AudioContext.createStereoPanner` → usato con fallback (già presente nell'attuale `sound.js`)
- `matchMedia` → sempre disponibile nei browser target

---

## 10. API pubblica

```js
window.__sound = {
  start(),            // avvia / resume audio (fade-in)
  stop(),             // stop / suspend audio (fade-out)
  toggle(),           // stop se running, start altrimenti
  isOn()              // boolean
};
```

Invariata rispetto all'attuale. Il bottone `#sound-toggle` in navbar continua a funzionare senza modifiche HTML.

---

## 11. Testing manuale

Checklist da eseguire prima di considerare la feature completa:

- [ ] Toggle on da desktop: drone parte con fade-in, nessun click/pop
- [ ] Scroll attraverso tutti i 7 capitoli: mood cambiano correttamente con whoosh
- [ ] Arpeggiatore: note emergono casualmente, nessuna stonatura rispetto al drone
- [ ] Hover su `[data-magnet]`: shimmer discreto, non invadente
- [ ] Click rapidi (5+ in 2s): rate limiter evita saturazione
- [ ] Toggle off: fade-out in 450ms, nessun audio residuo
- [ ] Tab in background: audio fade-out, al ritorno fade-in
- [ ] Mobile (iOS Safari, Android Chrome): toggle visibile, audio parte al tap, no errori console
- [ ] `prefers-reduced-motion: reduce`: audio off di default, toggle disponibile
- [ ] Performance: Chrome DevTools → <1% CPU idle, <5% con tutti i layer
- [ ] Compatibilità: Firefox e Safari desktop senza errori console

---

## 12. Rischi e mitigazioni

| Rischio | Probabilità | Mitigazione |
|---------|-------------|-------------|
| IR proceduralmente generata suona "piatta" | Media | Se il risultato non convince, iter 2: sostituire con file `.wav` IR reale (~40 KB) |
| Arpeggio suona "a caso" nonostante Markov | Bassa | Test su campioni di 2-3 minuti prima di confermare matrici |
| Performance degradata su dispositivi low-end | Bassa | Ridurre oscillatori per mood a 2 invece di 3 se serve; rimuovere delay stereo |
| Autoplay policy blocca AudioContext | N/A | Già gestito: audio parte solo su tap esplicito del toggle |
| Crossfade troppo evidente / troppo lento | Media | 3.5s è il punto di partenza; facilmente regolabile post-test |

---

## 13. Out of scope (v1)

Esplicitamente non incluso in questa versione, possibile aggiungere in iter successive:

- **Scroll-velocity air noise** (discusso, tagliato per YAGNI)
- **Motivo sonoro ricorrente brandable** (discusso, scartato: rischio ripetitività)
- **IR reale da file** (valutare dopo v1 se l'IR generata suona troppo sintetica)
- **Sample pre-registrati** (approccio C scartato per coerenza con brand generativo)
- **Controllo volume fine da UI** (attualmente è binario on/off; slider si può aggiungere)
