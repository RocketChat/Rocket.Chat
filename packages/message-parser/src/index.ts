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

// Helper function to detect URLs
const detectURL = (
  text: string,
  startIndex: number,
): { url: string; length: number } | null => {
  // Check for proper word boundary - URLs should be preceded by whitespace or start of string
  if (startIndex > 0) {
    const prevChar = text[startIndex - 1];
    if (!/[\s\n\r\t]/.test(prevChar)) {
      return null;
    }
  }

  // More comprehensive URL pattern - allow numbers in TLDs for flexibility
  const urlPattern = /^(https?:\/\/|ftp:\/\/|ssh:\/\/|[a-zA-Z]+:\/\/|www\.|[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z0-9]{2,})/;
  const remaining = text.slice(startIndex);
  
  // Check if it starts like a URL
  if (!urlPattern.test(remaining)) {
    return null;
  }

  // Find the end of the URL - stop at whitespace or angle brackets, but allow commas in query params
  let endIndex = startIndex;
  while (
    endIndex < text.length &&
    !/[\s\n\r<>]/.test(text[endIndex])
  ) {
    // Stop at certain punctuation only if it's at the end of the string or followed by whitespace
    const char = text[endIndex];
    if (/[!.]/.test(char)) {
      const nextChar = text[endIndex + 1];
      if (!nextChar || /[\s\n\r]/.test(nextChar)) {
        // This punctuation is at end or followed by whitespace, so it's likely sentence punctuation
        break;
      }
    }
    endIndex++;
  }

  let url = text.slice(startIndex, endIndex);
  
  // Remove trailing commas from URLs (they're usually sentence punctuation)
  while (url.endsWith(',')) {
    url = url.slice(0, -1);
    endIndex--;
  }
  
  // Basic validation for auto-linking
  // URLs with protocols must have double slashes
  if (/^https?:\/\//.test(url) || /^[a-zA-Z]+:\/\//.test(url)) {
    // Reject URLs with single slash after protocol
    if (/^https?:\/[^\/]/.test(url) || /^[a-zA-Z]+:\/[^\/]/.test(url)) {
      return null;
    }
    return { url, length: endIndex - startIndex };
  }
  
  // For URLs without protocol, require at least one dot for domain
  if (url.includes('.') && url.length > 3) {
    return { url, length: endIndex - startIndex };
  }

  return null;
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

    // Handle escape characters first
    if (char === '\\' && i + 1 < text.length) {
      const nextChar = text[i + 1];
      
      // Escape markdown special characters (but not structural ones like [])
      const markupChars = ['*', '_', '~', '`', '(', ')', '#', '.', '+', '-', '!', '|', '{', '}', '^', ':'];
      
      if (markupChars.includes(nextChar)) {
        // Escape the markup character by treating it as plain text
        tokens.push(ast.plain(nextChar));
        i += 2; // Skip both the backslash and the escaped character
        continue;
      }
      // If it's not a markup character, treat the backslash as literal
      // Fall through to normal character processing
    }

    // URL auto-detection (before other parsing to avoid conflicts)
    const urlResult = detectURL(text, i);
    if (urlResult) {
      tokens.push(ast.autoLink(urlResult.url, options?.customDomains));
      i += urlResult.length;
      continue;
    }

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
      // Don't treat as emoji if it's part of a URL
      const beforeColon = text.slice(Math.max(0, i - 8), i);
      const afterColon = text.slice(i, i + 10);
      if (/https?$/.test(beforeColon) || /^:\/\//.test(afterColon)) {
        // This is likely part of a URL, skip emoji processing
      } else {
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

    // Inline code with `code`
    if (char === '`') {
      const endIndex = text.indexOf('`', i + 1);
      if (endIndex !== -1 && endIndex > i + 1) {
        const content = text.slice(i + 1, endIndex);
        tokens.push(ast.inlineCode(ast.plain(content)));
        i = endIndex + 1;
        continue;
      }
    }

    // Markdown links [text](url) - only at word boundaries
    if (char === '[') {
      // Check if this is at a word boundary (start of string or after whitespace/punctuation)
      const atWordBoundary = i === 0 || /[\s\n\r\t\(\)\[\]{}.,;:!?]/.test(text[i - 1]);
      
      if (atWordBoundary) {
        const closeBracket = text.indexOf(']', i + 1);
        if (
          closeBracket !== -1 &&
          closeBracket < text.length - 1 &&
          text[closeBracket + 1] === '('
        ) {
          const closeParens = text.indexOf(')', closeBracket + 2);
          if (closeParens !== -1) {
            const labelText = text.slice(i + 1, closeBracket);
            const url = text.slice(closeBracket + 2, closeParens);

            // Parse label content for nested markup, filter to valid types
            const labelContent = labelText
              ? parseInlineContent(labelText, options).filter(
                  (
                    token,
                  ): token is
                    | AST.Plain
                    | AST.Bold
                    | AST.Italic
                    | AST.Strike
                    | AST.ChannelMention =>
                    token.type === 'PLAIN_TEXT' ||
                    token.type === 'BOLD' ||
                    token.type === 'ITALIC' ||
                    token.type === 'STRIKE' ||
                    token.type === 'MENTION_CHANNEL',
                )
              : [ast.plain(url)];

            tokens.push(ast.link(url, labelContent));
            i = closeParens + 1;
            continue;
          }
        }
      }
    }    // Accumulate plain text until we hit markup or special characters
    let plainText = '';
    let tempI = i;
    
    while (tempI < text.length) {
      const currentChar = text[tempI];
      
      // Handle escape characters in plain text accumulation
      if (currentChar === '\\' && tempI + 1 < text.length) {
        const nextChar = text[tempI + 1];
        
        // Always escape backslash with backslash
        if (nextChar === '\\') {
          plainText += '\\';
          tempI += 2; // Skip both backslashes
          
          // After double backslash, the next character should be literal
          if (tempI < text.length) {
            plainText += text[tempI]; // Add the literal character
            tempI++; // Skip the literal character
          }
          continue;
        }
        
        // Escape markdown special characters (but not structural ones like [])
        const markupChars = ['*', '_', '~', '`', '(', ')', '#', '.', '+', '-', '!', '|', '{', '}', '^', ':'];
        
        if (markupChars.includes(nextChar)) {
          // Escape the markup character by treating it as plain text
          plainText += nextChar;
          tempI += 2; // Skip both the backslash and the escaped character
          continue;
        }
        // If it's not a markup character, treat the backslash as literal
        // Fall through to normal character processing
      }
      
      // Stop if we hit markup characters
      if (['*', '_', '~', '@', '#', '`', '['].includes(currentChar)) {
        break;
      }
      
      // Stop if we hit an emoji
      if (getEmojiChar(text, tempI).char) {
        break;
      }
      
      // Special handling for colon - only treat as delimiter if it could be emoji shortcode
      if (currentChar === ':') {
        // Don't break on colon if it's clearly part of a URL
        const beforeColon = text.slice(Math.max(0, tempI - 8), tempI);
        const afterColon = text.slice(tempI, tempI + 10);
        if (/https?$/.test(beforeColon) || /^:\/\//.test(afterColon)) {
          // This is likely part of a URL, continue accumulating
          plainText += currentChar;
          tempI++;
          continue;
        }
        
        // Check if this could be the start of an emoji shortcode
        const colonEnd = text.indexOf(':', tempI + 1);
        if (colonEnd !== -1 && colonEnd > tempI + 1) {
          const potentialShortCode = text.slice(tempI + 1, colonEnd);
          if (potentialShortCode && !potentialShortCode.includes(' ') && !potentialShortCode.includes(':')) {
            // This looks like an emoji shortcode, stop accumulating
            break;
          }
        }
      }
      
      // Check if we've hit the start of a URL
      const urlCheck = detectURL(text, tempI);
      if (urlCheck) {
        // If we found a URL, stop accumulating plain text here
        break;
      }
      
      plainText += currentChar;
      tempI++;
    }

    if (plainText) {
      tokens.push(ast.plain(plainText));
      i = tempI;
    } else {
      // If we couldn't accumulate any text (because we immediately hit a special character),
      // treat the current character as plain text and continue
      tokens.push(ast.plain(char));
      i++;
    }
  }

  return consolidatePlainText(tokens);
};

// Helper function to consolidate adjacent plain text nodes
const consolidatePlainText = (tokens: AST.Inlines[]): AST.Inlines[] => {
  const result: AST.Inlines[] = [];
  let currentPlainText = '';

  for (const token of tokens) {
    if (token.type === 'PLAIN_TEXT') {
      currentPlainText += token.value;
    } else {
      // Non-plain text token
      if (currentPlainText) {
        result.push(ast.plain(currentPlainText));
        currentPlainText = '';
      }
      result.push(token);
    }
  }

  // Add any remaining plain text
  if (currentPlainText) {
    result.push(ast.plain(currentPlainText));
  }

  return result;
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
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '') {
      // Empty line creates a line break element
      result.push(ast.lineBreak);
    } else {
      // Non-empty line creates a paragraph
      const inlineContent = parseInlineContent(line, options);
      result.push(ast.paragraph(inlineContent));
    }
  }

  return result;
};
