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

// Common regexes for block parsing and other hot paths
export const RE_HEADING = /^(#{1,4})\s+(.+)$/;
export const RE_BLOCKQUOTE_LINE = /^\s*>/;
export const RE_TASK_ITEM_LINE = /^\s*-\s*\[[x ]\]\s/;
export const RE_TASK_ITEM_EXTRACT = /^\s*-\s*\[([x ])\]\s(.*)$/;
export const RE_UNORDERED_BULLET = /^\s*[-*]\s/;
export const RE_UNORDERED_BULLET_EMPTY = /^\s*[-*]\s*[*_~]?\s*$/;
export const RE_UNORDERED_STAR_INLINE = /^\s*\*\s.*\*\s*$/;
export const RE_UNORDERED_MARKER = /^\s*([-*])\s/;
export const RE_ORDERED_LINE = /^\s*\d+\.\s/;
export const RE_ORDERED_EXTRACT = /^\s*(\d+)\.\s(.*)$/;

export const RE_NON_DIGITS_GLOBAL = /[^0-9]/g;

// Timestamp-related regexes
export const RE_TIMESTAMP_ALL_DIGITS = /^\d+$/;
export const RE_TIMESTAMP_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/;
export const RE_TIMESTAMP_TIME_ONLY = /^\d{1,2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2})?$/;
export const RE_TIMESTAMP_TIME_CAPTURE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?([+-]\d{2}:\d{2})?$/;

// Characters that can start interesting tokens in the inline scanner
export const TRIGGER_CHARS = new Set(['*', '_', '~', '`', '(', ')', '<', '!', '[', ']', ':', '@', '#']);
