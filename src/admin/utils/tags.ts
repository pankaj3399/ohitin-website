export const tagColorMap: Record<string, { bg: string; text: string; border: string }> = {
  INVESTOR: { bg: 'rgba(139,92,246,0.12)', text: '#C4B5FD', border: 'rgba(139,92,246,0.2)' },
  CREATIVE: { bg: 'rgba(59,130,246,0.12)', text: '#93C5FD', border: 'rgba(59,130,246,0.2)' },
  CREATIVE_COLLABORATION: { bg: 'rgba(99,102,241,0.12)', text: '#A5B4FC', border: 'rgba(99,102,241,0.2)' },
  GENERAL: { bg: 'rgba(100,116,139,0.12)', text: '#94A3B8', border: 'rgba(100,116,139,0.2)' },
  VIP: { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D', border: 'rgba(245,158,11,0.2)' },
  TALENT: { bg: 'rgba(236,72,153,0.12)', text: '#F9A8D4', border: 'rgba(236,72,153,0.2)' },
  BRAND: { bg: 'rgba(16,185,129,0.12)', text: '#6EE7B7', border: 'rgba(16,185,129,0.2)' },
  EMAIL_RECEIVED: { bg: 'rgba(16,185,129,0.12)', text: '#6EE7B7', border: 'rgba(16,185,129,0.2)' },
  PHONE_RECEIVED: { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D', border: 'rgba(245,158,11,0.2)' },
};

export const defaultTagColor = { bg: 'rgba(100,116,139,0.1)', text: '#94A3B8', border: 'rgba(100,116,139,0.15)' };

const genericTags = new Set([
  'NEW',
  'GENERAL_SUPPORT',
  'ENGAGED',
  'EMAIL_RECEIVED',
  'PHONE_RECEIVED',
]);

export function getDistinctiveTags(tags: string[]) {
  return tags.filter((tag) => !genericTags.has(tag.toUpperCase()));
}
