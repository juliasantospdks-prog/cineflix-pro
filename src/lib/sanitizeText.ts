// Single source of truth for cleaning anything Ashley says.
// Removes markdown, broken characters (mojibake), control chars and
// keeps at most one emoji per message so the tone stays human.

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu;

const MOJIBAKE_RE = /[\uFFFD]|Ã[\u0080-\u00BF]|â€[\u0080-\u00BF]|Ã¯Â¿Â½/g;

export const stripMarkdown = (text: string): string =>
  (text || '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^\s*[-•●▪]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}/g, '')
    .replace(/_{2,}/g, '');

export const limitEmojis = (text: string, max = 1): string => {
  let kept = 0;
  return text.replace(EMOJI_RE, (match) => {
    // zero-width joiner / variation selectors belong to the previous emoji
    if (/[\u{FE0F}\u{200D}]/u.test(match)) return kept > 0 && kept <= max ? match : '';
    kept += 1;
    return kept <= max ? match : '';
  });
};

export const sanitizeAshleyText = (text: string, maxEmojis = 1): string => {
  const cleaned = stripMarkdown(text || '')
    .replace(MOJIBAKE_RE, '')
    // strip control characters without using regex control escapes
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code > 31 || code === 10 || code === 9;
    })
    .join('');

  return limitEmojis(cleaned, maxEmojis)
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
};
