// Offuscamento email: i pezzi stanno in un array, mai come stringa
// completa nel sorgente né nel DOM renderizzato. Ricomposizione
// solo a runtime dentro handler onClick.
//
// Scope della protezione: ferma gli scraper che leggono il DOM/View-Source
// via regex (la stragrande maggioranza, non eseguono JS per costi).
// NON ferma i crawler JS-executing (Puppeteer, Playwright): nel bundle
// minificato l'array PARTS e il template che li unisce sono adiacenti,
// facilmente ricostruibili. Limitazione accettata: goal anti-bot, non
// anti-analisi JS avversariale.
//
// Niente fallback document.execCommand('copy'): API deprecata, rimozione
// in corso; la piccola quota di browser senza navigator.clipboard è un
// trade-off accettato.

const PARTS = ['battistella', 'business', 'gmail', 'com'];

export const getEmail = () => `${PARTS[0]}.${PARTS[1]}@${PARTS[2]}.${PARTS[3]}`;

export async function copyEmailToClipboard() {
  const email = getEmail();
  if (!navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(email);
    return true;
  } catch {
    return false;
  }
}

export function openMailto() {
  window.location.href = 'mailto:' + getEmail();
}
