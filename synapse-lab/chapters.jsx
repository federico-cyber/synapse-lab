/* Synapse Lab — chapters as React components.
   Each chapter responds to body[data-lang] plus uses TWEAKS to vary
   layout/styling. 7 chapters total (cases chapter removed per design).
   NOTE: dangerouslySetInnerHTML is used with static COPY values defined
   in copy.jsx only — no user input flows into these strings. */

const { useState, useEffect, useRef, useMemo } = React;

const L = (it, en) => (window.__lang === 'en' ? en : it);

/* ------------------- Split text helpers ------------------- */
function SplitLine({ children, delay = 0 }) {
  return (
    <span className="split-line">
      <span className="split-line-inner" style={{ transitionDelay: `${delay}ms` }}>{children}</span>
    </span>
  );
}

const rawHtml = (s) => ({ __html: s });

/* ------------------- Ch1 — Hero ------------------- */
function ChapterHero({ lang }) {
  const titleRef = useRef(null);
  const heroStyle = window.TWEAKS.hero || 'bold-type';
  useEffect(() => {
    const el = titleRef.current;
    if (el) setTimeout(() => el.classList.add('in'), 120);
  }, [lang, heroStyle]);

  const C = window.COPY.hero;
  const titleBold = lang === 'en' ? C.titleBoldEN : C.titleBoldIT;
  const titleEdit = lang === 'en' ? C.titleEditEN : C.titleEditIT;
  const titleBrutal = lang === 'en' ? ["Digital", "synapses,", "with care."] : ["Sinapsi", "digitali,", "con cura."];

  return (
    <section id="ch1" className="chapter hero" data-screen-label="01 Hero" data-style={heroStyle}>
      <div className="hero-wrap">
        <div className="hero-top reveal">
          <div className="kv"><span>SYN / LAB</span><b>{L(C.metaLab.it, C.metaLab.en)}</b></div>
          <div className="kv"><span>LOC</span><b>{L(C.metaLoc.it, C.metaLoc.en)}</b></div>
          <div className="kv"><span>YEAR</span><b>{L(C.metaYr.it, C.metaYr.en)}</b></div>
          <div className="kv"><span>STATUS</span><b>{L(C.metaAvail.it, C.metaAvail.en)}</b></div>
        </div>

        <h1 className="hero-title reveal" ref={titleRef}>
          {heroStyle === 'bold-type' && (
            <>
              <SplitLine delay={80}>{titleBold[0]}&nbsp;</SplitLine>
              <SplitLine delay={180}><span className="strike">{titleBold[1]}</span></SplitLine>
              <SplitLine delay={280}>{titleBold[2]}&nbsp;</SplitLine>
              <SplitLine delay={380}><em>{titleBold[3]}</em></SplitLine>
            </>
          )}
          {heroStyle === 'editorial' && (
            <>
              <SplitLine delay={80}><em>{titleEdit[0]}</em>&nbsp;</SplitLine>
              <SplitLine delay={200}>{titleEdit[1]}</SplitLine>
              <br/>
              <SplitLine delay={320}>{titleEdit[2]}</SplitLine>
            </>
          )}
          {heroStyle === 'brutal' && (
            <>
              <SplitLine delay={80}>{titleBrutal[0]}</SplitLine>
              <SplitLine delay={200}>{titleBrutal[1]}</SplitLine>
              <SplitLine delay={320}><em>{titleBrutal[2]}</em></SplitLine>
            </>
          )}
        </h1>

        <p className="hero-sub reveal" dangerouslySetInnerHTML={rawHtml(L(C.sub.it, C.sub.en))} />

        <div className="hero-bottom reveal">
          <div className="hero-ctas">
            <a className="btn-primary" href="#ch7" data-magnet>
              {L(C.ctaMain.it, C.ctaMain.en)}
              <span className="arrow">↗</span>
            </a>
            <a className="btn-ghost" href="#ch3" data-magnet>
              {L(C.ctaSecond.it, C.ctaSecond.en)}
            </a>
          </div>
          <div className="scroll-hint">
            <span>{L(C.scroll.it, C.scroll.en)}</span>
            <span className="line"></span>
            <span>01 / 07</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------- Ch2 — Manifesto ------------------- */
function ChapterManifesto({ lang }) {
  const C = window.COPY.manifesto;
  const q = (qObj) => qObj[lang];
  return (
    <section id="ch2" className="chapter" data-screen-label="02 Manifesto">
      <div className="chapter-meta reveal">
        <span className="chapter-num">02</span>
        <span className="dot"/>
        <span>{L(C.label.it, C.label.en)}</span>
      </div>
      <div className="manifesto">
        <blockquote className="reveal">
          <span className="qnum">N° 01</span>
          {q(C.q1)[0]} <em>{q(C.q1)[1]}{q(C.q1)[2]}</em>{q(C.q1)[3]}
        </blockquote>
        <blockquote className="reveal">
          <span className="qnum">N° 02</span>
          {q(C.q2)[0]} <em>{q(C.q2)[1]}</em>{q(C.q2)[2]}
        </blockquote>
        <blockquote className="reveal">
          <span className="qnum">N° 03</span>
          {q(C.q3)[0]} <em>{q(C.q3)[1]}</em>{q(C.q3)[2]}
        </blockquote>
      </div>
    </section>
  );
}

/* ------------------- Ch3 — Services ------------------- */
function ChapterServices({ lang }) {
  const C = window.COPY.services;
  const layout = window.TWEAKS.servicesLayout || 'grid-soft';

  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <section id="ch3" className="chapter" data-screen-label="03 Services">
      <div className="chapter-meta reveal">
        <span className="chapter-num">03</span><span className="dot"/>
        <span>{L(C.label.it, C.label.en)}</span>
      </div>
      <div className="services-head">
        <h2 className="services-title reveal" dangerouslySetInnerHTML={rawHtml(L(C.title.it, C.title.en))} />
        <p className="services-lead reveal">{L(C.lead.it, C.lead.en)}</p>
      </div>
      <div className="services" data-layout={layout}>
        {C.items.map((svc, i) => {
          const chips = lang === 'en' ? svc.chipsEn : svc.chips;
          return (
            <article key={i} className="svc reveal" onMouseMove={handleMove}>
              <div className="svc-top">
                <span className="svc-num">N° {svc.num}</span>
                <span className="svc-tag">{L(svc.tag.it, svc.tag.en)}</span>
              </div>
              {layout === 'rows' ? (
                <div className="svc-body">
                  <span className="svc-num">{svc.num}</span>
                  <div className="svc-copy">
                    <h3 className="svc-title" dangerouslySetInnerHTML={rawHtml(L(svc.title.it, svc.title.en))} />
                    <p className="svc-desc" style={{ marginTop: 12 }}>{L(svc.desc.it, svc.desc.en)}</p>
                  </div>
                  <div className="svc-list">
                    {chips.map((c, j) => <span key={j}>{c}</span>)}
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="svc-title" dangerouslySetInnerHTML={rawHtml(L(svc.title.it, svc.title.en))} />
                  <p className="svc-desc">{L(svc.desc.it, svc.desc.en)}</p>
                  <div className="svc-list">
                    {chips.map((c, j) => <span key={j}>{c}</span>)}
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------- Ch4 — Process ------------------- */
function ChapterProcess({ lang }) {
  const C = window.COPY.process;
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = 1 - Math.max(0, Math.min(1, (r.bottom - vh * 0.4) / (r.height)));
      setProgress(Math.max(0, Math.min(1, p)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeIdx = Math.floor(progress * 4);

  return (
    <section id="ch4" className="chapter" ref={sectionRef} data-screen-label="04 Process">
      <div className="chapter-meta reveal">
        <span className="chapter-num">04</span><span className="dot"/>
        <span>{L(C.label.it, C.label.en)}</span>
      </div>
      <div className="process-head">
        <h2 className="process-title reveal" dangerouslySetInnerHTML={rawHtml(L(C.title.it, C.title.en))} />
      </div>
      <div className="spine" style={{ '--progress': `${progress * 100}%` }}>
        {C.steps.map((s, i) => (
          <div key={i} className={`step reveal ${i <= activeIdx ? 'active' : ''}`}>
            <div className="step-node"/>
            <span className="step-num">N° {s.n}</span>
            <h3 className="step-title">{L(s.title.it, s.title.en)}</h3>
            <p className="step-desc">{L(s.desc.it, s.desc.en)}</p>
            <span className="step-meta">{L(s.meta.it, s.meta.en)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------- Ch5 — Stack ------------------- */
function ChapterStack({ lang }) {
  const C = window.COPY.stack;
  return (
    <section id="ch5" className="chapter" data-screen-label="05 Stack">
      <div className="chapter-meta reveal">
        <span className="chapter-num">05</span><span className="dot"/>
        <span>{L(C.label.it, C.label.en)}</span>
      </div>
      <div className="stack-head">
        <h2 className="stack-title reveal" dangerouslySetInnerHTML={rawHtml(L(C.title.it, C.title.en))} />
        <p className="services-lead reveal">{L(C.sub.it, C.sub.en)}</p>
      </div>
      <div className="constellation reveal">
        <div className="tech-grid">
          {C.items.map((t, i) => (
            <div key={i} className="tech" data-magnet>
              <div>
                <span className="tech-num">N° {String(i+1).padStart(2,'0')}</span>
                <div className="tech-name" style={{ marginTop: 8 }}>{t.name}</div>
              </div>
              <div>
                <span className="tech-cat">{t.cat}</span>
                <p className="tech-why">{L(t.why.it, t.why.en)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------- Ch6 — About ------------------- */
function ChapterAbout({ lang }) {
  const C = window.COPY.about;
  return (
    <section id="ch6" className="chapter" data-screen-label="06 About">
      <div className="chapter-meta reveal">
        <span className="chapter-num">06</span><span className="dot"/>
        <span>{L(C.label.it, C.label.en)}</span>
      </div>
      <div className="about-wrap">
        <div className="reveal">
          <span className="about-role">{L(C.role.it, C.role.en)}</span>
          <h2 className="about-name" dangerouslySetInnerHTML={rawHtml(L(C.name.it, C.name.en))}/>
        </div>
        <p className="about-bio reveal">{L(C.bio.it, C.bio.en)}</p>
        <div className="about-sign reveal">F. Battistella</div>
        <div className="about-contacts reveal">
          {C.contacts.map((c, i) => (
            <div key={i}>
              <span style={{ color: 'var(--ink-faint)' }}>{c.label} &nbsp;</span>
              <a href={c.href} data-magnet>{c.text}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------- Ch7 — Contact ------------------- */
function ChapterContact({ lang, onToggleTheme, theme }) {
  const C = window.COPY.contact;
  const [copied, setCopied] = useState(false);
  const copyEmail = () => {
    const email = C.cards[1].email;
    if (navigator.clipboard) navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section id="ch7" className="chapter" data-screen-label="07 Contact">
      <div className="chapter-meta reveal">
        <span className="chapter-num">07</span><span className="dot"/>
        <span>{L(C.label.it, C.label.en)}</span>
      </div>
      <h2 className="contact-title reveal" dangerouslySetInnerHTML={rawHtml(L(C.title.it, C.title.en))} />

      <div className="contact-grid">
        <button className="contact-card reveal" data-magnet>
          <div>
            <span className="tag">{L(C.cards[0].tag.it, C.cards[0].tag.en)}</span>
            <h3 className="title" style={{ marginTop: 16 }} dangerouslySetInnerHTML={rawHtml(L(C.cards[0].title.it, C.cards[0].title.en))}/>
            <p className="desc" style={{ marginTop: 14 }}>{L(C.cards[0].desc.it, C.cards[0].desc.en)}</p>
          </div>
          <div className="action">
            <span>{L(C.cards[0].action.it, C.cards[0].action.en)}</span>
            <span className="arr">↗</span>
          </div>
        </button>

        <button className={`contact-card contact-email-card reveal ${copied ? 'copied' : ''}`} data-magnet onClick={copyEmail}>
          <div>
            <span className="tag">{L(C.cards[1].tag.it, C.cards[1].tag.en)}</span>
            <p className="email" style={{ marginTop: 20 }}>{C.cards[1].email}</p>
            <p className="desc" style={{ marginTop: 14 }}>{L(C.cards[1].desc.it, C.cards[1].desc.en)}</p>
          </div>
          <div className="action">
            <span>{copied ? (lang === 'en' ? 'Copied' : 'Copiato') : L(C.cards[1].action.it, C.cards[1].action.en)}</span>
            <span className="copy-state">✓</span>
          </div>
        </button>

        <button className="contact-card reveal" data-magnet>
          <div>
            <span className="tag">{L(C.cards[2].tag.it, C.cards[2].tag.en)}</span>
            <h3 className="title" style={{ marginTop: 16 }} dangerouslySetInnerHTML={rawHtml(L(C.cards[2].title.it, C.cards[2].title.en))}/>
            <p className="desc" style={{ marginTop: 14 }}>{L(C.cards[2].desc.it, C.cards[2].desc.en)}</p>
          </div>
          <div className="action">
            <span>{L(C.cards[2].action.it, C.cards[2].action.en)}</span>
            <span className="arr">↗</span>
          </div>
        </button>
      </div>

      <footer className="footer">
        <div className="fl-cols">
          <div className="fl-col">
            <b>Synapse Lab</b>
            <span>45.4642° N · 9.1900° E</span>
            <span>Milano, IT</span>
          </div>
          <div className="fl-col">
            <b>{lang === 'en' ? 'Legal' : 'Legale'}</b>
            <span>VAT IT00000000000</span>
            <span>{lang === 'en' ? 'Privacy · Cookies' : 'Privacy · Cookie'}</span>
          </div>
          <div className="fl-col socials" style={{ alignSelf: 'flex-end' }}>
            <a href="#">Twitter</a>
            <a href="#">GitHub</a>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram</a>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
          <button className="theme-toggle" data-magnet onClick={onToggleTheme}>
            <span className="sun"/>
            <span>{theme === 'light' ? (lang === 'en' ? 'Light' : 'Chiaro') : (lang === 'en' ? 'Dark' : 'Scuro')}</span>
            <span className="moon"/>
          </button>
          <span className="footer-joke">{L(C.footer.joke.it, C.footer.joke.en)}</span>
          <span>© 2026 · SYNAPSE LAB</span>
        </div>
      </footer>
    </section>
  );
}

/* Expose all chapters */
Object.assign(window, {
  ChapterHero, ChapterManifesto, ChapterServices, ChapterProcess,
  ChapterStack, ChapterAbout, ChapterContact
});
