import type { SolutionType } from '@/lib/types';

// Lightweight keyword heuristic, not an AI classifier -- explicitly out of
// scope for launch ("do not delay launch for a sophisticated AI
// classifier"). Always shown to the submitter as an editable suggestion,
// never applied silently -- see components/forms/need-form.tsx.
const KEYWORD_WEIGHTS: Record<SolutionType, string[]> = {
  ai_agent: [
    'agent', 'qualify', 'qualifies', 'qualifying', 'respond to', 'chatbot',
    'assistant that', 'book a call', 'book qualified', 'answer questions',
    'answer basic questions', 'follow up with', 'screen candidates', 'screens',
  ],
  automation: [
    'automate', 'automatically', 'automated', 'workflow', 'sync', 'syncs',
    'integrate', 'integration', 'trigger', 'whenever', 'every time', 'connect',
    'connects', 'pipeline',
  ],
  ai_tool: [
    'generate', 'generates', 'summarize', 'summarizes', 'write', 'draft',
    'transcribe', 'analyze', 'classify', 'extract', 'read invoices',
    'organize photos', 'organize the photos',
  ],
  internal_tool: [
    'internal', 'dashboard', 'track our', 'manage our', 'for our team',
    'our staff', 'our employees', 'spreadsheet',
  ],
  saas: [
    'app', 'software', 'platform', 'system', 'tool for', 'website', 'crm',
  ],
  other: [],
};

/**
 * Suggests a possible solution type from free-text title+description.
 * Returns null when nothing scores -- an honest "not sure" rather than
 * guessing, matching how a real unclassified Need should read.
 */
export function suggestSolutionType(title: string, description: string): SolutionType | null {
  const text = `${title} ${description}`.toLowerCase();
  let best: SolutionType | null = null;
  let bestScore = 0;

  (Object.keys(KEYWORD_WEIGHTS) as SolutionType[]).forEach((type) => {
    const score = KEYWORD_WEIGHTS[type].reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  });

  return bestScore > 0 ? best : null;
}

const ASK_MARKERS = [
  'i wish there were', 'i wish there was', 'i wish', 'i want', 'i need',
  "i'd like", 'i would like', 'looking for', "i'm trying to", 'i am trying to',
  'i want a way to', 'i need a way to', 'is there a way to', 'can someone',
  'does anyone know of', 'there should be', "it'd be great if", 'it would be great if',
];

const LEADING_FILLER = /^(a |an |the |simple |easy |way to |tool that could |tool to |system that could |system to |something that could |something to )/i;

function stripLeadingFiller(s: string): string {
  let out = s.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const marker of ASK_MARKERS) {
      const re = new RegExp(`^${marker}\\s*`, 'i');
      if (re.test(out)) {
        out = out.replace(re, '');
        changed = true;
      }
    }
    const beforeLen = out.length;
    out = out.replace(LEADING_FILLER, '');
    if (out.length !== beforeLen) changed = true;
  }
  return out.trim();
}

function toTitleCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const MAX_TITLE_LENGTH = 70;

function truncateAtWord(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  const cut = s.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-\s]+$/, '');
}

/**
 * Suggests a short title from a free-text problem description -- a plain
 * deterministic heuristic (sentence-splitting + filler-word stripping), not
 * an AI call, per the explicit instruction not to add an LLM dependency
 * just to make the form feel smarter. Always shown to the submitter as an
 * editable suggestion (see components/forms/need-form.tsx); this only has
 * to save them from staring at a blank "title" field, not be perfect.
 */
export function suggestTitle(description: string): string {
  const text = description.trim();
  if (!text) return '';

  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

  // Prefer whichever sentence actually states the ask ("I wish...",
  // "looking for...") over scene-setting context ("I run a cleaning
  // company...") -- that's usually the more title-worthy clause.
  const askSentence = sentences.find((s) => ASK_MARKERS.some((m) => s.toLowerCase().includes(m)));
  const base = askSentence || sentences[0] || text;

  const stripped = stripLeadingFiller(base).replace(/[.!?]+$/, '');
  const candidate = stripped.length >= 8 ? stripped : stripLeadingFiller(text).replace(/[.!?]+$/, '');

  return toTitleCase(truncateAtWord(candidate || text, MAX_TITLE_LENGTH));
}
