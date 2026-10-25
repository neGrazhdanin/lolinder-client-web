export interface RiotId {
  gameName: string;
  tagLine: string;
}

export type RiotIdError = 'empty' | 'missingTag' | 'invalidName' | 'invalidTag';

export type RiotIdParseResult = { ok: true; value: RiotId } | { ok: false; error: RiotIdError };

const MAX_GAME_NAME = 16;
const TAG_LINE = /^[\p{L}\p{N}]{1,5}$/u;

export function parseRiotId(input: string): RiotIdParseResult {
  // Japanese and Chinese keyboards type the full-width ＃.
  const text = input.trim().replace(/＃/g, '#');
  if (!text) return { ok: false, error: 'empty' };

  const hash = text.lastIndexOf('#');
  if (hash === -1) return { ok: false, error: 'missingTag' };

  const gameName = text.slice(0, hash).trim().replace(/\s+/g, ' ');
  const tagLine = text.slice(hash + 1).trim();

  if (!gameName || gameName.length > MAX_GAME_NAME || gameName.includes('#')) {
    return { ok: false, error: 'invalidName' };
  }
  if (!tagLine) return { ok: false, error: 'missingTag' };
  if (!TAG_LINE.test(tagLine)) return { ok: false, error: 'invalidTag' };

  return { ok: true, value: { gameName, tagLine } };
}

export function formatRiotId({ gameName, tagLine }: RiotId): string {
  return `${gameName}#${tagLine}`;
}

// Tag lines are alphanumeric, so the last dash always separates the tag even when the name has one.
export function riotIdToSlug({ gameName, tagLine }: RiotId): string {
  return `${gameName}-${tagLine}`;
}

export function riotIdFromSlug(slug: string): RiotId | null {
  const dash = slug.lastIndexOf('-');
  if (dash <= 0) return null;
  const parsed = parseRiotId(`${slug.slice(0, dash)}#${slug.slice(dash + 1)}`);
  return parsed.ok ? parsed.value : null;
}
