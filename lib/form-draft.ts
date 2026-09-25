// Preserves in-progress /submit-need and /submit-product form state across
// the sign-up/sign-in redirect, so a visitor who fills out the form before
// authenticating never has to retype anything. sessionStorage only (per-tab,
// cleared on submit or on tab close) -- this is a short-lived draft, not
// state that needs to survive across devices or persist long-term, so
// browser storage is the right tool rather than a database table.
const PREFIX = 'needsaas:draft:';

export function saveDraft<T>(key: string, data: T) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch {
    // Private browsing / storage disabled -- the redirect still works, the
    // visitor just has to retype. Not worth failing the submit over.
  }
}

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    // Ignore.
  }
}
