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

export const EMOTICON_KEYS_DESC = Object.keys(EMOTICON_MAP).sort(
  (a, b) => b.length - a.length,
);

export const ESCAPABLE_MARKUP_CHARS = new Set([
  '*',
  '_',
  '~',
  '`',
  '(',
  ')',
  '#',
  '.',
  '+',
  '-',
  '!',
  '|',
  '{',
  '}',
  '^',
  ':',
]);

export const VALID_TIMESTAMP_FORMATS = new Set([
  't',
  'T',
  'd',
  'D',
  'f',
  'F',
  'R',
]);

export const RE_URL_PREFIX =
  /^(https?:\/\/|ftp:\/\/|ssh:\/\/|[a-zA-Z]+:\/\/|www\.|[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z0-9]{2,})/;

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

/**
 * Regular expression for matching all-digit timestamps.
 *
 * @example
 * This is a message with a timestamp: 123456
 */
export const RE_TIMESTAMP_ALL_DIGITS = /^\d+$/;

/**
 * Regular expression for matching ISO 8601 timestamps.
 *
 * @example
 * This is a message with a timestamp: 2023-03-15T12:34:56Z
 */
export const RE_TIMESTAMP_ISO =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/;

/**
 * Extracts the time portion from a timestamp string.
 *
 * @example
 * This is a message with a timestamp: 12:34:56
 */
export const RE_TIMESTAMP_TIME_ONLY =
  /^\d{1,2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2})?$/;

/**
 * Capturing groups for the various components of a timestamp
 *
 * - Hours (1 or 2 digits)
 * - Minutes (2 digits)
 * - Seconds (2 digits, optional)
 * - Timezone offset (optional)
 */
export const RE_TIMESTAMP_TIME_CAPTURE =
  /^(\d{1,2}):(\d{2})(?::(\d{2}))?([+-]\d{2}:\d{2})?$/;

/**
 * Precomputed ASCII trigger bitset for faster hot-path checks
 *
 * @summary This is a performance optimization to avoid repeated string.charCodeAt calls.
 * @description The TRIGGER_ASCII constant is a precomputed bitset that allows for faster checks of trigger characters in the message parser.
 */
export const TRIGGER_ASCII = (() => {
  const arr = new Uint8Array(128);
  const triggers = [
    '*',
    '_',
    '~',
    '`',
    '(',
    ')',
    '<',
    '!',
    '[',
    ']',
    ':',
    '@',
    '#',
  ];
  for (let i = 0; i < triggers.length; i++) {
    const code = triggers[i].charCodeAt(0);
    if (code < 128) arr[code] = 1;
  }
  return arr;
})();

/**
 * Emoticon special-case detection (2 or more in a row)
 *
 * @example
 * This is a message with multiple emoticons: :) :) :D
 */
export const RE_CONSECUTIVE_EMOTICONS_2PLUS = /^\s*(?::\)|D:){2,}\s*$/;
/**
 * Emoticon special-case detection (4 or more in a row)
 *
 * @example
 * This is a message with multiple emoticons: :) :) :D :) :) :D
 */
export const RE_CONSECUTIVE_EMOTICONS_4PLUS = /^(?::\)|D:){4,}$/;
