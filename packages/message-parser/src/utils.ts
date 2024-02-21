import { parse as tldParse } from 'tldts';

import type {
  BigEmoji,
  Code,
  Color,
  Heading,
  Markup,
  Paragraph,
  Types,
  Task,
  ListItem,
  Inlines,
  LineBreak,
  Emoji,
  KaTeX,
  InlineKaTeX,
  Link,
  Timestamp,
} from './definitions';

const generate =
  <Type extends keyof Types>(type: Type) =>
  (value: Types[Type]['value']): Types[Type] =>
    ({ type, value } as any);

export const paragraph = generate('PARAGRAPH');

export const bold = generate('BOLD');

export const color = (r: number, g: number, b: number, a = 255): Color => ({
  type: 'COLOR',
  value: { r, g, b, a },
});

export const heading = (
  value: Heading['value'],
  level: Heading['level'] = 1
): Heading => ({
  type: 'HEADING',
  level,
  value,
});

export const code = (
  value: Code['value'],
  language?: Code['language']
): Code => ({
  type: 'CODE',
  language: language || 'none',
  value,
});

export const bigEmoji = (value: BigEmoji['value']): BigEmoji => ({
  type: 'BIG_EMOJI',
  value,
});

export const task = (value: Task['value'], status: boolean): Task => ({
  type: 'TASK',
  status,
  value,
});

export const inlineCode = generate('INLINE_CODE');
export const tasks = generate('TASKS');

export const italic = generate('ITALIC');

export const plain = generate('PLAIN_TEXT');
export const strike = generate('STRIKE');

export const codeLine = generate('CODE_LINE');

const isValidLink = (link: string) => {
  try {
    return Boolean(new URL(link));
  } catch (error) {
    return false;
  }
};

export const link = (src: string, label?: Markup[]): Link => ({
  type: 'LINK',
  value: { src: plain(src), label: label ?? [plain(src)] },
});

export const autoLink = (src: string, customDomains?: string[]) => {
  const validHosts = ['localhost', ...(customDomains ?? [])];
  const { isIcann, isIp, isPrivate, domain } = tldParse(src, {
    detectIp: false,
    allowPrivateDomains: true,
    validHosts,
  });

  if (
    !(isIcann || isIp || isPrivate || (domain && validHosts.includes(domain)))
  ) {
    return plain(src);
  }

  const href = isValidLink(src) || src.startsWith('//') ? src : `//${src}`;

  return link(href, [plain(src)]);
};

export const autoEmail = (src: string) => {
  const href = `mailto:${src}`;

  const { isIcann, isIp, isPrivate } = tldParse(href, {
    detectIp: false,
    allowPrivateDomains: true,
  });

  if (!(isIcann || isIp || isPrivate)) {
    return plain(src);
  }

  return link(href, [plain(src)]);
};

export const image = (() => {
  const fn = generate('IMAGE');
  return (src: string, label?: Markup) =>
    fn({ src: plain(src), label: label || plain(src) });
})();

export const quote = generate('QUOTE');

export const mentionChannel = (() => {
  const fn = generate('MENTION_CHANNEL');
  return (value: string) => fn(plain(value));
})();

export const orderedList = generate('ORDERED_LIST');

export const unorderedList = generate('UNORDERED_LIST');

export const listItem = (text: Inlines[], number?: number): ListItem => ({
  type: 'LIST_ITEM',
  value: text,
  ...(number && { number }),
});

export const mentionUser = (() => {
  const fn = generate('MENTION_USER');
  return (value: string) => fn(plain(value));
})();

export const emoji = (shortCode: string): Emoji => ({
  type: 'EMOJI',
  value: plain(shortCode),
  shortCode,
});

export const emojiUnicode = (unicode: string): Emoji => ({
  type: 'EMOJI',
  value: undefined,
  unicode,
});

export const emoticon = (emoticon: string, shortCode: string): Emoji => ({
  type: 'EMOJI',
  value: plain(emoticon),
  shortCode,
});

const joinEmoji = (
  current: Inlines,
  previous: Inlines | undefined,
  next: Inlines | undefined
): Inlines => {
  if (current.type !== 'EMOJI' || !current.value || (!previous && !next)) {
    return current;
  }

  const hasEmojiAsNeighbor =
    previous?.type === current.type || current.type === next?.type;
  const hasPlainAsNeighbor =
    (previous?.type === 'PLAIN_TEXT' && previous.value.trim() !== '') ||
    (next?.type === 'PLAIN_TEXT' && next.value.trim() !== '');
  const isEmoticon = current.shortCode !== current.value.value;

  if (current.value && (hasEmojiAsNeighbor || hasPlainAsNeighbor)) {
    if (isEmoticon) {
      return current.value;
    }

    return {
      ...current.value,
      value: `:${current.value.value}:`,
    };
  }

  return current;
};

export const reducePlainTexts = (
  values: Paragraph['value']
): Paragraph['value'] =>
  values
    .flatMap((item) => item)
    .reduce((result, item, index, values) => {
      const next = values[index + 1];
      const current = joinEmoji(item, values[index - 1], next);
      const previous: Inlines = result[result.length - 1];

      if (previous) {
        if (current.type === 'PLAIN_TEXT' && current.type === previous.type) {
          previous.value += current.value;
          return result;
        }
      }
      return [...result, current];
    }, [] as Paragraph['value']);
export const lineBreak = (): LineBreak => ({
  type: 'LINE_BREAK',
  value: undefined,
});

export const katex = (content: string): KaTeX => ({
  type: 'KATEX',
  value: content,
});

export const inlineKatex = (content: string): InlineKaTeX => ({
  type: 'INLINE_KATEX',
  value: content,
});

export const phoneChecker = (text: string, number: string) => {
  if (number.length < 5) {
    return plain(text);
  }

  return link(`tel:${number}`, [plain(text)]);
};

export const timestamp = (
  value: string,
  type?: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R'
): Timestamp => {
  return {
    type: 'TIMESTAMP',
    value: {
      timestamp: value,
      format: type || 't',
    },
  };
};
