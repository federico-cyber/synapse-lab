// Offuscamento email: i pezzi stanno in un array, mai come stringa
// completa nel sorgente né nel DOM renderizzato. Ricomposizione
// solo a runtime dentro handler onClick.

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
