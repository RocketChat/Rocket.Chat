/* eslint-disable complexity */
import type * as AST from './definitions';
import * as ast from './utils';

export * from './definitions';

export { isNodeOfType } from './guards';

export type Options = {
  colors?: boolean;
  emoticons?: boolean;
  katex?: {
    dollarSyntax?: boolean;
    parenthesisSyntax?: boolean;
  };
  customDomains?: string[];
};

// Helper function to detect unicode emoji
const isEmoji = (char: string): boolean => {
  // Check for emoji surrogate pairs
  const codePoint = char.codePointAt(0);
  if (!codePoint) return false;

  // Emoji ranges (simplified)
  return (
    (codePoint >= 0x1f600 && codePoint <= 0x1f64f) || // Emoticons
    (codePoint >= 0x1f300 && codePoint <= 0x1f5ff) || // Misc Symbols and Pictographs
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) || // Transport and Map
    (codePoint >= 0x2600 && codePoint <= 0x26ff) || // Misc symbols
    (codePoint >= 0x2700 && codePoint <= 0x27bf) // Dingbats
  );
};

// Helper function to get full emoji character (including surrogate pairs)
const getEmojiChar = (
  text: string,
  index: number,
): { char: string; length: number } => {
  const char = text[index];
  const nextChar = text[index + 1];

  // Check if this is a surrogate pair
  if (char && nextChar && isEmoji(char + nextChar)) {
    return { char: char + nextChar, length: 2 };
  }
  if (isEmoji(char)) {
    return { char, length: 1 };
  }

  return { char: '', length: 0 };
};

// Helper function to parse bold markup
const parseBoldMarkup = (
  text: string,
  i: number,
  options?: Options,
): { tokens: AST.Inlines[]; nextIndex: number } | null => {
  const char = text[i];
  const nextChar = text[i + 1];

  if (char !== '*') return null;

  const isBold = nextChar === '*';
  const delimiter = isBold ? '**' : '*';
  const delimiterLength = isBold ? 2 : 1;

  const endIndex = text.indexOf(delimiter, i + delimiterLength);
  if (endIndex !== -1 && endIndex > i + delimiterLength) {
    const content = text.slice(i + delimiterLength, endIndex);
    const nestedContent = parseInlineContent(content, options);
    // Filter to only valid bold content types
    const validContent = nestedContent.filter(
      (
        token,
      ): token is
        | AST.MarkupExcluding<AST.Bold>
        | AST.Link
        | AST.Emoji
        | AST.UserMention
        | AST.ChannelMention
        | AST.InlineCode =>
        token.type !== 'BOLD' &&
        token.type !== 'TIMESTAMP' &&
        token.type !== 'IMAGE' &&
        token.type !== 'COLOR' &&
        token.type !== 'INLINE_KATEX',
    );
    return {
      tokens: [ast.bold(validContent)],
      nextIndex: endIndex + delimiterLength,
    };
  }

  return null;
};

// Helper function to parse italic markup
const parseItalicMarkup = (
  text: string,
  i: number,
  options?: Options,
): { tokens: AST.Inlines[]; nextIndex: number } | null => {
  const char = text[i];
  const nextChar = text[i + 1];

  if (char !== '_') return null;

  const isItalic = nextChar === '_';
  const delimiter = isItalic ? '__' : '_';
  const delimiterLength = isItalic ? 2 : 1;

  const endIndex = text.indexOf(delimiter, i + delimiterLength);
  if (endIndex !== -1 && endIndex > i + delimiterLength) {
    const content = text.slice(i + delimiterLength, endIndex);
    const nestedContent = parseInlineContent(content, options);
    // Filter to only valid italic content types
    const validContent = nestedContent.filter(
      (
        token,
      ): token is
        | AST.MarkupExcluding<AST.Italic>
        | AST.Link
        | AST.Emoji
        | AST.UserMention
        | AST.ChannelMention
        | AST.InlineCode =>
        token.type !== 'ITALIC' &&
        token.type !== 'TIMESTAMP' &&
        token.type !== 'IMAGE' &&
        token.type !== 'COLOR' &&
        token.type !== 'INLINE_KATEX',
    );
    return {
      tokens: [ast.italic(validContent)],
      nextIndex: endIndex + delimiterLength,
    };
  }

  return null;
};

// Helper function to parse strike markup
const parseStrikeMarkup = (
  text: string,
  i: number,
  options?: Options,
): { tokens: AST.Inlines[]; nextIndex: number } | null => {
  const char = text[i];
  const nextChar = text[i + 1];

  if (char !== '~') return null;

  const isStrike = nextChar === '~';
  const delimiter = isStrike ? '~~' : '~';
  const delimiterLength = isStrike ? 2 : 1;

  const endIndex = text.indexOf(delimiter, i + delimiterLength);
  if (endIndex !== -1 && endIndex > i + delimiterLength) {
    const content = text.slice(i + delimiterLength, endIndex);
    const nestedContent = parseInlineContent(content, options);
    // Filter to only valid strike content types
    const validContent = nestedContent.filter(
      (
        token,
      ): token is
        | AST.MarkupExcluding<AST.Strike>
        | AST.Link
        | AST.Emoji
        | AST.UserMention
        | AST.ChannelMention
        | AST.InlineCode
        | AST.Italic
        | AST.Timestamp =>
        token.type !== 'STRIKE' &&
        token.type !== 'IMAGE' &&
        token.type !== 'COLOR' &&
        token.type !== 'INLINE_KATEX',
    );
    return {
      tokens: [ast.strike(validContent)],
      nextIndex: endIndex + delimiterLength,
    };
  }

  return null;
};

// Helper function to parse inline content with markup
const parseInlineContent = (text: string, options?: Options): AST.Inlines[] => {
  if (!text) return [];

  const tokens: AST.Inlines[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Try parsing markup
    const boldResult = parseBoldMarkup(text, i, options);
    if (boldResult) {
      tokens.push(...boldResult.tokens);
      i = boldResult.nextIndex;
      continue;
    }

    const italicResult = parseItalicMarkup(text, i, options);
    if (italicResult) {
      tokens.push(...italicResult.tokens);
      i = italicResult.nextIndex;
      continue;
    }

    const strikeResult = parseStrikeMarkup(text, i, options);
    if (strikeResult) {
      tokens.push(...strikeResult.tokens);
      i = strikeResult.nextIndex;
      continue;
    }

    // Unicode emoji
    const emojiResult = getEmojiChar(text, i);
    if (emojiResult.char) {
      tokens.push(ast.emojiUnicode(emojiResult.char));
      i += emojiResult.length;
      continue;
    }

    // Emoji with :shortcode:
    if (char === ':') {
      const endIndex = text.indexOf(':', i + 1);
      if (endIndex !== -1 && endIndex > i + 1) {
        const shortCode = text.slice(i + 1, endIndex);
        // Simple validation - no spaces or colons in shortcode
        if (shortCode && !shortCode.includes(' ') && !shortCode.includes(':')) {
          tokens.push(ast.emoji(shortCode));
          i = endIndex + 1;
          continue;
        }
      }
    }

    // User mentions with @username
    if (char === '@') {
      // Look for username pattern - letters, numbers, dots, dashes, underscores
      let j = i + 1;
      while (j < text.length && /[a-zA-Z0-9._\-:@]/.test(text[j])) {
        j++;
      }
      if (j > i + 1) {
        const username = text.slice(i + 1, j);
        tokens.push(ast.mentionUser(username));
        i = j;
        continue;
      }
    }

    // Channel mentions with #channel
    if (char === '#') {
      // Look for channel pattern - letters, numbers, dashes, underscores
      let j = i + 1;
      while (j < text.length && /[a-zA-Z0-9._\-]/.test(text[j])) {
        j++;
      }
      if (j > i + 1) {
        const channel = text.slice(i + 1, j);
        tokens.push(ast.mentionChannel(channel));
        i = j;
        continue;
      }
    }

    // For now, treat everything else as plain text
    // We'll implement other features later (links, etc.)
    let plainText = '';
    while (
      i < text.length &&
      !['*', '_', '~', ':', '@', '#'].includes(text[i]) &&
      !getEmojiChar(text, i).char
    ) {
      plainText += text[i];
      i++;
    }

    if (plainText) {
      tokens.push(ast.plain(plainText));
    } else {
      // Single character that didn't match any pattern
      tokens.push(ast.plain(char));
      i++;
    }
  }

  return tokens;
};
export const parse = (input: string, options?: Options): AST.Root => {
  // Normalize input
  const normalizedInput = input
    .replace(/\r\n/g, '\n') // Convert Windows line endings to Unix
    .replace(/\r/g, '\n') // Convert old Mac line endings to Unix
    .trim(); // Trim leading and trailing whitespace

  if (!normalizedInput) {
    return [];
  }

  const result: AST.Root = [];

  // Split into lines and process them
  const lines = normalizedInput.split('\n');
  let currentParagraphLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '') {
      // Empty line found
      if (currentParagraphLines.length > 0) {
        // Add current paragraph with inline parsing
        const paragraphText = currentParagraphLines.join('\n').trim();
        if (paragraphText) {
          const inlineContent = parseInlineContent(paragraphText, options);
          result.push(ast.paragraph(inlineContent));
        }
        currentParagraphLines = [];
      }

      // Add line break
      result.push(ast.lineBreak);
    } else {
      // Non-empty line
      currentParagraphLines.push(line);
    }
  }

  // Add remaining paragraph if any
  if (currentParagraphLines.length > 0) {
    const paragraphText = currentParagraphLines.join('\n').trim();
    if (paragraphText) {
      const inlineContent = parseInlineContent(paragraphText, options);
      result.push(ast.paragraph(inlineContent));
    }
  }

  return result;
};
