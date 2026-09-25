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
