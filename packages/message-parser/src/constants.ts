// Shared constants and small helpers for the message-parser hot paths

export const EMOTICON_MAP: Record<string, string> = {
  ':)': 'slight_smile',
  ':-)': 'slight_smile',
  ':(': 'frowning',
  ':-(': 'frowning',
  'D:': 'fearful',
  ':D': 'grinning',
  ':-D': 'grinning',
  ':P': 'stuck_out_tongue',
  ':-P': 'stuck_out_tongue',
  ':p': 'stuck_out_tongue',
  ':-p': 'stuck_out_tongue',
  ';)': 'wink',
  ';-)': 'wink',
  ':o': 'open_mouth',
  ':-o': 'open_mouth',
  ':O': 'open_mouth',
  ':-O': 'open_mouth',
  ':|': 'neutral_face',
  ':-|': 'neutral_face',
  ':/': 'confused',
  ':-/': 'confused',
  ':\\': 'confused',
  ':-\\': 'confused',
  ':*': 'kissing_heart',
  '-_-': 'expressionless',
};

export const EMOTICON_KEYS_DESC = Object.keys(EMOTICON_MAP).sort((a, b) => b.length - a.length);

export const ESCAPABLE_MARKUP_CHARS = new Set([
  '*', '_', '~', '`', '(', ')', '#', '.', '+', '-', '!', '|', '{', '}', '^', ':'
]);
export const isEscapable = (ch: string): boolean => ESCAPABLE_MARKUP_CHARS.has(ch);

export const VALID_TIMESTAMP_FORMATS = new Set(['t', 'T', 'd', 'D', 'f', 'F', 'R']);

export const RE_URL_PREFIX = /^(https?:\/\/|ftp:\/\/|ssh:\/\/|[a-zA-Z]+:\/\/|www\.|[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z0-9]{2,})/;
