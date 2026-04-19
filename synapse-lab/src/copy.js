/* Copy module — all IT/EN strings for every chapter, in one place. */
export const COPY = {
  nav: {
    manifesto: { it: "Manifesto", en: "Manifesto" },
    services:  { it: "Servizi",   en: "Work" },
    studio:    { it: "Studio",    en: "Studio" },
    start:     { it: "Inizia un progetto", en: "Start a project" },
  },
  hero: {
    metaLab: { it: "Studio di digital craft", en: "Digital craft studio" },
    metaLoc: { it: "Milano, Italia", en: "Milano, Italy" },
    metaYr:  { it: "Fondato MMXXV", en: "Est. MMXXV" },
    metaAvail: { it: "Disponibili da Q3 · 2026", en: "Booking from Q3 · 2026" },
    titleBoldIT: ["Sinapsi", "digitali,", "progettate con", "cura."],
    titleBoldEN: ["Digital", "synapses,", "crafted with", "care."],
    titleEditIT: ["Sinapsi", "digitali,", "progettate con cura."],
    titleEditEN: ["Digital", "synapses,", "crafted with care."],
    sub: {
      it: "Synapse Lab progetta e costruisce esperienze web al confine tra design, codice e sperimentazione interattiva. Pochi progetti l'anno — <b>ognuno come fosse l'unico</b>.",
      en: "Synapse Lab designs and builds web experiences at the edge of design, code, and interactive experimentation. Few projects a year — <b>each one treated like the only one</b>."
    },
    ctaMain: { it: "Prenota una call", en: "Book a call" },
    ctaSecond: { it: "Guarda i lavori", en: "See the work" },
    scroll: { it: "Scorri", en: "Scroll" },
  },
  manifesto: {
    label: { it: "Capitolo 02 · Manifesto", en: "Chapter 02 · Manifesto" },
    q1: {
      it: ["Crediamo che il web meriti di essere", "un'", "esperienza", ", non un documento."],
      en: ["We believe the web deserves to be", "an ", "experience", ", not a document."]
    },
    q2: {
      it: ["Costruiamo pochi siti l'anno,", "ognuno", " come fosse l'unico."],
      en: ["We build few sites a year —", "each one", " like it's the only one."]
    },
    q3: {
      it: ["Il dettaglio non è un lusso:", "è", " il mestiere."],
      en: ["Detail isn't a luxury —", "it's", " the craft."]
    },
  },
  services: {
    label:   { it: "Capitolo 03 · Cosa facciamo", en: "Chapter 03 · What we do" },
    title:   {
      it: "Quattro mestieri, <em>una sola mano</em>.",
      en: "Four disciplines, <em>one pair of hands</em>."
    },
    lead:    {
      it: "Design e codice non sono due fasi: sono lo stesso atto. Lavoriamo end-to-end, così il risultato non perde nulla nel passaggio.",
      en: "Design and code aren't two phases — they're one act. We work end-to-end so nothing gets lost in handoff."
    },
    items: [
      { num: "01", tag: { it: "Design", en: "Design" },
        title: { it: "Web Design & <em>Art Direction</em>", en: "Web Design & <em>Art Direction</em>" },
        desc: {
          it: "Sistemi visivi, identità digitale, direzione creativa. Progettiamo siti che hanno un punto di vista.",
          en: "Visual systems, digital identity, creative direction. Sites with a point of view — not templates with a coat of paint."
        },
        chips: ["Art Direction", "Brand digitale", "UI systems", "Prototyping"],
        chipsEn: ["Art Direction", "Digital brand", "UI systems", "Prototyping"]
      },
      { num: "02", tag: { it: "Build", en: "Build" },
        title: { it: "Development & <em>Performance</em>", en: "Development & <em>Performance</em>" },
        desc: {
          it: "Next.js, React, Three.js. AI integrata nei workflow, Lighthouse verde, accessibilità seria.",
          en: "Next.js, React, Three.js. AI woven into the workflow, green Lighthouse, accessibility taken seriously."
        },
        chips: ["Next.js", "React / R3F", "TypeScript", "A11y · WCAG AA"],
        chipsEn: ["Next.js", "React / R3F", "TypeScript", "A11y · WCAG AA"]
      },
      { num: "03", tag: { it: "Motion", en: "Motion" },
        title: { it: "Motion & <em>Interaction</em>", en: "Motion & <em>Interaction</em>" },
        desc: {
          it: "WebGL, scroll-driven storytelling, microinterazioni. Il movimento racconta quello che il testo non dice.",
          en: "WebGL, scroll-driven storytelling, microinteractions. Movement carries the meaning words can't."
        },
        chips: ["GSAP", "Three.js / Shaders", "Lenis", "Framer Motion"],
        chipsEn: ["GSAP", "Three.js / Shaders", "Lenis", "Framer Motion"]
      },
      { num: "04", tag: { it: "Strategia", en: "Strategy" },
        title: { it: "Strategy & <em>Product</em>", en: "Strategy & <em>Product</em>" },
        desc: {
          it: "Positioning, information architecture, struttura pronta per crescere. Il design parte prima del pixel.",
          en: "Positioning, information architecture, growth-ready structure. Design starts before the first pixel."
        },
        chips: ["Positioning", "IA", "Content", "Roadmap"],
        chipsEn: ["Positioning", "IA", "Content", "Roadmap"]
      },
    ]
  },
  process: {
    label: { it: "Capitolo 04 · Processo", en: "Chapter 04 · Process" },
    title: { it: "Quattro passi. <em>Una sola spina dorsale.</em>",
             en: "Four steps. <em>One single spine.</em>" },
    steps: [
      { n: "01", title: { it: "Discovery", en: "Discovery" },
        desc: { it: "Ascoltiamo, mappiamo, sfidiamo le assunzioni. Niente brief accettati a scatola chiusa.",
                en: "We listen, map, and challenge assumptions. No briefs accepted blind." },
        meta: { it: "1 – 2 settimane", en: "1 – 2 weeks" } },
      { n: "02", title: { it: "Direzione", en: "Direction" },
        desc: { it: "Moodboard, prototipi, prove di concetto. La direzione si sceglie, non si subisce.",
                en: "Moodboards, prototypes, proofs of concept. Direction gets chosen, not inherited." },
        meta: { it: "2 – 3 settimane", en: "2 – 3 weeks" } },
      { n: "03", title: { it: "Costruzione", en: "Build" },
        desc: { it: "Design e codice in parallelo. Iterazione stretta, preview live, zero handoff teatrali.",
                en: "Design and code in parallel. Tight iteration, live previews, no theatrical handoffs." },
        meta: { it: "4 – 8 settimane", en: "4 – 8 weeks" } },
      { n: "04", title: { it: "Lancio & cura", en: "Launch & care" },
        desc: { it: "Deploy, monitoring, evoluzione. Un sito è vivo — lo trattiamo come tale.",
                en: "Deploy, monitoring, evolution. A site is alive — we treat it that way." },
        meta: { it: "In corso", en: "Ongoing" } },
    ]
  },
  stack: {
    label: { it: "Capitolo 05 · Capabilities", en: "Chapter 05 · Capabilities" },
    title: { it: "L'officina. <em>Tutto ciò che sappiamo maneggiare.</em>",
             en: "The workshop. <em>Every tool we reach for.</em>" },
    sub: {
      it: "Non inseguiamo il nuovo. Usiamo ciò che ci permette di consegnare qualcosa di cui siamo fieri.",
      en: "We don't chase novelty. We use what lets us ship something we're proud of."
    },
    items: [
      { name: "Next.js",     cat: "Framework", why: { it: "SSR, edge, routing serio.", en: "SSR, edge, serious routing." } },
      { name: "React + TS",  cat: "UI",        why: { it: "Composizione + sicurezza a lungo termine.", en: "Composition + long-term safety." } },
      { name: "Three.js / R3F", cat: "WebGL",  why: { it: "Scene 3D dichiarative in React.", en: "Declarative 3D scenes inside React." } },
      { name: "GSAP",        cat: "Motion",    why: { it: "Timing chirurgico, scroll-trigger.", en: "Surgical timing, scroll-trigger." } },
      { name: "Tailwind",    cat: "Styling",   why: { it: "Design tokens che vivono nel codice.", en: "Design tokens that live in code." } },
      { name: "shadcn/ui",   cat: "UI kit",    why: { it: "Base solida, personalizzabile al 100%.", en: "Solid base, 100% customisable." } },
      { name: "Figma",       cat: "Design",    why: { it: "Dove nascono le prime versioni.", en: "Where first versions are born." } },
      { name: "Blender",     cat: "3D",        why: { it: "Per gli asset che non si disegnano in codice.", en: "For assets that don't belong in code." } },
      { name: "Vercel",      cat: "Hosting",   why: { it: "Edge network + preview deploy.", en: "Edge network + preview deploys." } },
      { name: "Supabase",    cat: "Backend",   why: { it: "Postgres, auth, storage — sensato.", en: "Postgres, auth, storage — sensible." } },
      { name: "Sanity",      cat: "CMS",       why: { it: "CMS per chi lo userà davvero.", en: "A CMS the client will actually use." } },
      { name: "Claude Code", cat: "AI",        why: { it: "Pair programmer, non sostituto.", en: "Pair programmer, not replacement." } },
    ]
  },
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
  about: {
    label: { it: "Capitolo 06 · Studio", en: "Chapter 06 · Studio" },
    name: { it: "<em>Federico Battistella.</em>", en: "<em>Federico Battistella.</em>" },
    role: { it: "Fondatore & Principal", en: "Founder & Principal" },
    bio: {
      it: "Progetto e costruisco siti da quando il web era brutto. Synapse Lab è il mio tentativo di farlo come credo si debba fare: pochi progetti, fatti bene, con cura. Nessun team di ventitré persone. Nessuna roadmap di deck. Solo il lavoro, e il tempo per farlo.",
      en: "I've been designing and building sites since the web was ugly. Synapse Lab is my attempt to do it the way I think it should be done: few projects, done well, with care. No team of twenty-three. No deck-shaped roadmap. Just the work, and the time to do it."
    },
    contacts: [
      { label: "Email",  href: "mailto:battistella.business@gmail.com", text: "battistella.business@gmail.com" },
      { label: "X",      href: "#", text: "@battistella" },
      { label: "GitHub", href: "#", text: "/battistella" },
      { label: "LinkedIn", href: "#", text: "/in/battistella" },
    ]
  },
  contact: {
    label: { it: "Capitolo 07 · Contatti", en: "Chapter 07 · Contact" },
    title: {
      it: "Pronti a costruire <em>qualcosa di memorabile?</em>",
      en: "Ready to build <em>something memorable?</em>"
    },
    cards: [
      { tag: { it: "Via preferita", en: "Preferred" },
        title: { it: "Prenota una <em>call</em>", en: "Book a <em>call</em>" },
        desc: { it: "30 minuti. Senza briefing preparato. Raccontami cosa ti gira in testa.",
                en: "30 minutes. No pre-prepared brief. Tell me what's on your mind." },
        action: { it: "Apri Calendly", en: "Open Calendly" } },
      { tag: { it: "Email diretta", en: "Direct email" },
        email: "battistella.business@gmail.com",
        desc: { it: "Risposta entro 48h, sempre. Anche per dire di no.",
                en: "Reply within 48h, always. Even to say no." },
        action: { it: "Copia indirizzo", en: "Copy address" } },
      { tag: { it: "Preferisci scrivere?", en: "Prefer to type?" },
        title: { it: "Form <em>conversazionale</em>", en: "Conversational <em>form</em>" },
        desc: { it: "Tre domande, una alla volta. Senza tendine, senza checkbox.",
                en: "Three questions, one at a time. No dropdowns, no checkboxes." },
        action: { it: "Inizia la conversazione", en: "Start the conversation" } },
    ],
    footer: {
      joke: {
        it: "// built with care in Milano, Italy — and just enough espresso",
        en: "// built with care in Milano, Italy — and just enough espresso"
      }
    }
  }
};
