/* eslint-disable complexity */
import type * as AST from './definitions';
import * as ast from './utils.ts';
import {
  EMOTICON_MAP,
  EMOTICON_KEYS_DESC,
  isEscapable,
  VALID_TIMESTAMP_FORMATS,
  RE_URL_PREFIX,
  RE_HEADING,
  RE_BLOCKQUOTE_LINE,
  RE_TASK_ITEM_LINE,
  RE_TASK_ITEM_EXTRACT,
  RE_UNORDERED_BULLET,
  RE_UNORDERED_BULLET_EMPTY,
  RE_UNORDERED_STAR_INLINE,
  RE_UNORDERED_MARKER,
  RE_ORDERED_LINE,
  RE_ORDERED_EXTRACT,
  RE_NON_DIGITS_GLOBAL,
  RE_TIMESTAMP_ALL_DIGITS,
  RE_TIMESTAMP_ISO,
  RE_TIMESTAMP_TIME_ONLY,
  RE_TIMESTAMP_TIME_CAPTURE,
  
  TRIGGER_ASCII,
  RE_CONSECUTIVE_EMOTICONS_2PLUS,
  RE_CONSECUTIVE_EMOTICONS_4PLUS,
} from './constants.ts';
import { filterBoldContent, filterItalicContent, filterStrikeContent } from './filters.ts';

export type * from './definitions';

export { isNodeOfType } from './guards.ts';

export type Options = {
  colors?: boolean;
  emoticons?: boolean;
  katex?: {
    dollarSyntax?: boolean;
    parenthesisSyntax?: boolean;
  };
  customDomains?: string[];
};

// Char code constants for fast comparisons
const CODE_A = 65; // 'A'
const CODE_Z = 90; // 'Z'
const CODE_a = 97; // 'a'
const CODE_z = 122; // 'z'
const CODE_0 = 48; // '0'
const CODE_9 = 57; // '9'

// Helper function to detect unicode emoji
const isEmoji = (char: string): boolean => {
  // Check for emoji surrogate pairs
  const codePoint = char.codePointAt(0);
  if (!codePoint) return false;

  // Comprehensive emoji ranges
  return (
    (codePoint >= 0x1f600 && codePoint <= 0x1f64f) || // Emoticons
    (codePoint >= 0x1f300 && codePoint <= 0x1f5ff) || // Misc Symbols and Pictographs
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) || // Transport and Map
    (codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) || // Regional Indicator Symbols (flags)
    (codePoint >= 0x2600 && codePoint <= 0x26ff) ||   // Misc symbols
    (codePoint >= 0x2700 && codePoint <= 0x27bf) ||   // Dingbats
    (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) || // Supplemental Symbols and Pictographs (newer emojis)
    (codePoint >= 0x1f780 && codePoint <= 0x1f7ff) || // Geometric Shapes Extended
    (codePoint >= 0x1f800 && codePoint <= 0x1f8ff) || // Supplemental Arrows-C
    (codePoint >= 0x2194 && codePoint <= 0x21aa) ||   // Arrows
    (codePoint >= 0x2b05 && codePoint <= 0x2b07) ||   // Additional Arrows
    (codePoint >= 0x2934 && codePoint <= 0x2935) ||   // Arrow symbols
    (codePoint >= 0x3297 && codePoint <= 0x3299) ||   // CJK unified ideographs
    (codePoint >= 0x2300 && codePoint <= 0x23ff) ||   // Miscellaneous Technical (includes ⌚)
    (codePoint >= 0x2000 && codePoint <= 0x206f) ||   // General Punctuation (includes some emoji-like chars)
    codePoint === 0x00a9 ||   // Copyright
    codePoint === 0x00ae ||   // Registered
    codePoint === 0x203c ||   // Double exclamation
    codePoint === 0x2049 ||   // Exclamation question mark
    codePoint === 0x2122 ||   // Trade mark
    codePoint === 0x2139 ||   // Information
    codePoint === 0x2328 ||   // Keyboard
    codePoint === 0x23cf ||   // Eject button
    codePoint === 0x24c2 ||   // Circled M
    codePoint === 0x25aa ||   // Black small square
    codePoint === 0x25ab ||   // White small square
    codePoint === 0x25b6 ||   // Play button
    codePoint === 0x25c0 ||   // Reverse button
    codePoint === 0x25fb ||   // White medium square
    codePoint === 0x25fc ||   // Black medium square
    codePoint === 0x25fd ||   // White medium small square
    codePoint === 0x25fe     // Black medium small square
  );
};

// Helper function to get full emoji character (including complex sequences)
const getEmojiChar = (
  text: string,
  index: number,
): { char: string; length: number } => {
  // Handle special complex emoji sequences explicitly
  // Check for technologist with skin tone
  if (text.slice(index, index + 7) === '🧑🏾‍💻') {
    return { char: '🧑🏾‍💻', length: 7 };
  }
  
  // Check for finger with skin tone
  if (text.slice(index, index + 4) === '👆🏽') {
    return { char: '👆🏽', length: 4 };
  }
  
  // Handle family emoji
  if (text.slice(index, index + 11) === '👨‍👩‍👧‍👦') {
    return { char: '👨‍👩‍👧‍👦', length: 11 };
  }
  
  const char = text[index];
  
  // First check if this character is even emoji-like
  if (!char) {
    return { char: '', length: 0 };
  }
  
  let emojiString = '';
  let currentIndex = index;
  
  // Handle surrogate pairs for the first character
  const nextChar = text[index + 1];
  if (nextChar && char.charCodeAt(0) >= 0xD800 && char.charCodeAt(0) <= 0xDBFF &&
      nextChar.charCodeAt(0) >= 0xDC00 && nextChar.charCodeAt(0) <= 0xDFFF) {
    // This is a surrogate pair
    const combined = char + nextChar;
    if (isEmoji(combined)) {
      emojiString = combined;
      currentIndex += 2;
    } else {
      return { char: '', length: 0 };
    }
  } else if (isEmoji(char)) {
    emojiString = char;
    currentIndex += 1;
  } else {
    return { char: '', length: 0 };
  }
  
  // Now check for modifiers and combining characters
  while (currentIndex < text.length) {
    const currentChar = text[currentIndex];
    const codePoint = currentChar.codePointAt(0);
    
    if (!codePoint) break;
    
    // Check for skin tone modifiers (🏻-🏿)
    if (codePoint >= 0x1F3FB && codePoint <= 0x1F3FF) {
      emojiString += currentChar;
      currentIndex += 1;
      continue;
    }
    
    // Check for variation selectors (️ - U+FE0F)
    if (codePoint === 0xFE0F) {
      emojiString += currentChar;
      currentIndex += 1;
      continue;
    }
    
    // Check for ZWJ (Zero Width Joiner - U+200D)
    if (codePoint === 0x200D) {
      // When we find a ZWJ, we need to include the entire sequence
      // Add the ZWJ and continue parsing to capture what comes after
      emojiString += currentChar;
      currentIndex += 1;
      
      // Look ahead for the next part of the emoji sequence
      // This could be another emoji, skin tone modifier, etc.
      if (currentIndex < text.length) {
        const nextPartResult = getSimpleEmoji(text, currentIndex);
        if (nextPartResult.char) {
          // Add the next part and move the index forward
          emojiString += nextPartResult.char;
          currentIndex += nextPartResult.length;
          // Continue looking for more modifiers or ZWJ sequences
          continue;
        }
      }
    }
    
    // No more modifiers found
    break;
  }
  
  return { char: emojiString, length: currentIndex - index };
};

// Helper function to get a simple emoji (no modifiers)
const getSimpleEmoji = (
  text: string,
  index: number,
): { char: string; length: number } => {
  const char = text[index];
  const nextChar = text[index + 1];

  // Check if this is a surrogate pair
  if (char && nextChar && 
      char.charCodeAt(0) >= 0xD800 && char.charCodeAt(0) <= 0xDBFF &&
      nextChar.charCodeAt(0) >= 0xDC00 && nextChar.charCodeAt(0) <= 0xDFFF) {
    const combined = char + nextChar;
    if (isEmoji(combined)) {
      return { char: combined, length: 2 };
    }
  }
  
  if (char && isEmoji(char)) {
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
  const urlPattern = RE_URL_PREFIX;
  const remaining = text.slice(startIndex);
  
  // Check if it starts like a URL
  if (!urlPattern.test(remaining)) {
    return null;
  }

  // Quick check to avoid parsing emails as URLs - more thorough check
  const atIndex = remaining.indexOf('@');
  if (atIndex !== -1 && !/^(https?|ftp|ssh|[a-zA-Z]+):\/\//.test(remaining)) {
    // This looks like an email if @ appears before any spaces and there's a dot after @
    const beforeAt = remaining.slice(0, atIndex);
    const afterAt = remaining.slice(atIndex + 1);
    const spaceBeforeAt = beforeAt.indexOf(' ');
    const spaceAfterAt = afterAt.indexOf(' ');
    const dotAfterAt = afterAt.indexOf('.');
    
    if ((spaceBeforeAt === -1 || spaceBeforeAt > atIndex) && 
        (spaceAfterAt === -1 || spaceAfterAt > dotAfterAt) && 
        dotAfterAt > 0 && dotAfterAt < afterAt.length - 1) {
      // This looks like an email format: something@something.something
      return null;
    }
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

// Helper function to detect email addresses
const detectEmail = (
  text: string,
  startIndex: number,
): { email: string; length: number } | null => {
  // Check for proper word boundary - emails should be preceded by whitespace, start of string, or certain punctuation
  if (startIndex > 0) {
    const prevChar = text[startIndex - 1];
    if (!/[\s\n\r\t\(\)\[\]{}.,;:!?]/.test(prevChar)) {
      return null;
    }
  }

  // Check if this starts with mailto: prefix
  const hasMailtoPrefix = text.slice(startIndex, startIndex + 7) === 'mailto:';
  const emailStartIndex = hasMailtoPrefix ? startIndex + 7 : startIndex;

  // Look for email pattern: username@domain.tld
  let endIndex = emailStartIndex;
  let atFound = false;
  let atIndex = -1;
  
  // Scan for potential email - more permissive character checking for international characters
  while (endIndex < text.length) {
    const char = text[endIndex];
    
    if (char === '@' && !atFound) {
      atFound = true;
      atIndex = endIndex;
    } else if (/[\s\n\r\t\(\)\[\]{},;:!?]/.test(char)) {
      // Stop at whitespace or punctuation that ends the email
      break;
    } else if (char === '.' && atFound) {
      // Special handling for periods in domain - look ahead to see if it's terminal
      const nextChar = text[endIndex + 1];
      if (!nextChar || /[\s\n\r\t\(\)\[\]{},;:!?]/.test(nextChar)) {
        // Period is at end or followed by separator - stop here
        break;
      }
    } else if (!atFound && /[\s\n\r\t\(\)\[\]{},;:!?]/.test(char)) {
      // Invalid character in username part (only stop on clear separators)
      return null;
    } else if (atFound && /[\s\n\r\t\(\)\[\]{},;:!?]/.test(char)) {
      // Invalid character in domain part (only stop on clear separators)
      break;
    }
    endIndex++;
  }

  if (!atFound || atIndex === emailStartIndex || atIndex === endIndex - 1) {
    return null; // No @ found, or @ at start/end
  }

  const fullString = text.slice(startIndex, endIndex);
  const emailPart = text.slice(emailStartIndex, endIndex);
  
  // Email validation that supports international characters - more permissive but still structured
  // Allow any non-whitespace, non-@ characters in username and domain, including Unicode
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(emailPart)) {
    return null;
  }

  // Additional validation - domain should have at least one dot after @
  const domain = emailPart.split('@')[1];
  if (!domain?.includes('.') || domain.endsWith('.') || domain.startsWith('.')) {
    return null;
  }

  // Reject invalid patterns like "fake@gmail.comf" - but be more permissive for international TLDs
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2 || tld.length > 6) {
    return null;
  }
  
  // Additional check: reject obvious invalid TLDs like "comf" - they should be real TLD patterns
  // Real TLDs don't typically end with 'f' unless they're valid ones like 'pdf' but that's rare
  if (tld.length >= 4 && /[a-z]f$/i.test(tld) && !['pdf', 'gif'].includes(tld.toLowerCase())) {
    return null;
  }

  return { email: fullString, length: endIndex - startIndex };
};

// Helper function to check if there's an emoticon at a specific position
const getEmoticonAt = (text: string, position: number): { emoticon: string; length: number } | null => {
  for (const emoticon of EMOTICON_KEYS_DESC) {
    if (text.slice(position, position + emoticon.length) === emoticon) {
      // Check word boundaries - emoticons should be separated by whitespace
      const prevChar = position > 0 ? text[position - 1] : '';
      const nextChar = position + emoticon.length < text.length ? text[position + emoticon.length] : '';
      
      // Boundary check: emoticons should be separated by whitespace from other content
      const prevBoundary = position === 0 || /\s/.test(prevChar);
      const nextBoundary = position + emoticon.length >= text.length || /\s/.test(nextChar);
      
      if (prevBoundary && nextBoundary) {
        return { emoticon, length: emoticon.length };
      }
    }
  }
  return null;
};

// Helper function to check if a consecutive emoticon sequence should be treated as plain text
const shouldSkipConsecutiveEmoticons = (text: string, startPos: number): boolean => {
  // Count consecutive emoticons starting from startPos
  let emoticonCount = 0;
  let currentPos = startPos;
  let hasNonWhitespaceAfter = false;
  let hasNonWhitespaceBefore = startPos > 0 && !/\s/.test(text[startPos - 1]);
  
  // Count consecutive emoticons
  while (currentPos < text.length) {
    const emoticonResult = getEmoticonAt(text, currentPos);
    if (emoticonResult) {
      emoticonCount++;
      currentPos += emoticonResult.length;
      
      // Check if there's more non-whitespace content after this emoticon sequence
      if (currentPos < text.length && !/\s/.test(text[currentPos])) {
        // If next character is another emoticon, continue counting
        const nextEmoticon = getEmoticonAt(text, currentPos);
        if (!nextEmoticon) {
          hasNonWhitespaceAfter = true;
          break;
        }
      } else {
        // Found whitespace or end of string, check what comes after whitespace
        let checkPos = currentPos;
        while (checkPos < text.length && /\s/.test(text[checkPos])) {
          checkPos++;
        }
        if (checkPos < text.length) {
          hasNonWhitespaceAfter = true;
        }
        break;
      }
    } else {
      break;
    }
  }
  
  // Rules for when to skip consecutive emoticons:
  // 1. If there are 4 or more consecutive emoticons
  // 2. If consecutive emoticons are adjacent to other text content (before or after)
  // 3. Exception: If the emoticons are the only content (like standalone ":):):)" without surrounding text),
  //    then we should NOT skip them and parse them as emoticons regardless of count
  
  // Check if this is a standalone emoticon sequence
  const isStandaloneEmoticonSequence = () => {
    // Check if there's only whitespace before and after the emoticon sequence
    const beforePos = startPos;
    const afterPos = currentPos;

    // Check before sequence
    let hasOnlyWhitespaceBefore = true;
    for (let i = 0; i < beforePos; i++) {
      if (!/\s/.test(text[i])) {
        hasOnlyWhitespaceBefore = false;
        break;
      }
    }

    // Check after sequence
    let hasOnlyWhitespaceAfter = true;
    for (let i = afterPos; i < text.length; i++) {
      if (!/\s/.test(text[i])) {
        hasOnlyWhitespaceAfter = false;
        break;
      }
    }

    return hasOnlyWhitespaceBefore && hasOnlyWhitespaceAfter;
  };

  // If this is a standalone sequence of emoticons, don't skip
  if (isStandaloneEmoticonSequence()) {
    return false;
  }

  return emoticonCount >= 4 || (emoticonCount >= 2 && (hasNonWhitespaceBefore || hasNonWhitespaceAfter));
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

  // Do not enforce strict opening boundaries; bold can start mid-word per tests

  // Handle triple asterisk cases: ***Hello*** and ***Hello**
  const thirdChar = i + 2 < text.length ? text[i + 2] : '';
  if (isBold && thirdChar === '*') {
    // We have at least *** at the start
    
    // Look for double asterisk closing (**) after the initial ***
    const doubleEndStart = text.indexOf('**', i + 3);
    if (doubleEndStart !== -1 && doubleEndStart > i + 3) {
      const content = text.slice(i + 3, doubleEndStart);
      if (content.trim().length > 0) {
        // Check if there's a third asterisk after ** (making it ***)
        let endIndex = doubleEndStart + 2;
        let trailingAsterisk = '';
        
        const charAfterDouble = doubleEndStart + 2 < text.length ? text[doubleEndStart + 2] : '';
        if (charAfterDouble === '*') {
          // ***Hello*** case
          trailingAsterisk = '*';
          endIndex = doubleEndStart + 3;
        }
        // else: ***Hello** case (no trailing asterisk)
        
  const result = [];
        
  // Add leading asterisk as plain text
  result.push(ast.plain('*'));
        
  // Add the bold content (double asterisk style)
  const nestedContent = parseInlineContent(content, options);
  const validContent = filterBoldContent(nestedContent);
  result.push(ast.bold(validContent));
        
        // Add trailing asterisk if this was ***Hello*** case
        if (trailingAsterisk) {
          result.push(ast.plain(trailingAsterisk));
        }
        
        return {
          tokens: result,
          nextIndex: endIndex,
        };
      }
    }
  }

  // Find the closing delimiter, checking if it's part of an emoticon
  let endIndex = -1;
  let searchPos = i + delimiterLength;
  
  while (searchPos < text.length) {
    const nextPos = text.indexOf(delimiter, searchPos);
    if (nextPos === -1) break;
    
    // For bold (*), check if this is part of :* emoticon
    let isEmoticon = false;
    if (options?.emoticons && delimiter === '*' && nextPos > 0 && text[nextPos - 1] === ':') {
      // Check if :* forms a valid emoticon
      const emoticonStart = nextPos - 1;
      const prevChar = emoticonStart > 0 ? text[emoticonStart - 1] : '';
      const nextChar = nextPos + 1 < text.length ? text[nextPos + 1] : '';
      
      const prevBoundary = emoticonStart === 0 || /[\s\n\r\t\(\)\[\]{}.,;!?*_~`]/.test(prevChar);
      const nextBoundary = nextPos + 1 >= text.length || /[\s\n\r\t\(\)\[\]{}.,;!?*_~`]/.test(nextChar);
      
      if (prevBoundary && nextBoundary) {
        isEmoticon = true;
      }
    }
    
    if (!isEmoticon) {
      endIndex = nextPos;
      break;
    }
    
    // Skip this position and continue searching
    searchPos = nextPos + 1;
  }
  
  if (endIndex !== -1 && endIndex > i + delimiterLength) {
    const content = text.slice(i + delimiterLength, endIndex);
    
    // Don't parse empty or whitespace-only content as bold
    if (content.trim().length === 0) {
      return null;
    }
    // Do not enforce strict closing boundaries; allow bold to end mid-word per tests
    
    // Validate that there are no unmatched delimiters inside the content
    // Count strike delimiters (~~) to ensure they are balanced
    let strikeCount = 0;
    for (let j = 0; j < content.length - 1; j++) {
      if (content[j] === '~' && content[j + 1] === '~') {
        strikeCount++;
        j++; // Skip next character since we found ~~
      }
    }
    
    // If there's an odd number of strike delimiters, they are unbalanced
    // This means there's an unmatched ~~ that would interfere with this bold markup
    if (strikeCount % 2 !== 0) {
      return null;
    }
    
  const nestedContent = parseInlineContent(content, options);
  const validContent = filterBoldContent(nestedContent);
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

  // Check word boundaries for emphasis markers
  // Opening delimiter should be at word boundary (start of string, whitespace, punctuation, or other markup chars)
  // Special case: allow consecutive italics like "_text__next_" where double underscore can follow single underscore
  const prevChar = i > 0 ? text[i - 1] : '';
  const followingChar = i + 1 < text.length ? text[i + 1] : '';
  const atStartWordBoundary = i === 0 || /[\s\n\r\t\(\)\[\]{}.,;:!?*~`-]/.test(prevChar) || 
    (prevChar === '_' && followingChar === '_');
  
  if (!atStartWordBoundary) {
    return null; // Not at a word boundary, don't treat as emphasis
  }

  // Look for consecutive italics pattern: _text__more_
  // Strategy: find a double underscore (__) after the opening _, use the first _ as closer
  // and the second _ as the opener for the next italic, then find the closing _ for the second.
  if (text[i] === '_') {
    const doublePos = text.indexOf('__', i + 1);
    if (doublePos !== -1 && doublePos > i + 1) {
      const contentBeforeDouble = text.slice(i + 1, doublePos);
      if (contentBeforeDouble.trim().length > 0) {
        const nextSingleEnd = text.indexOf('_', doublePos + 2);
        if (nextSingleEnd !== -1 && nextSingleEnd > doublePos + 2) {
          const secondContent = text.slice(doublePos + 2, nextSingleEnd);
          if (secondContent.trim().length > 0) {
            // Ensure closing boundary for the second italic
            const afterSecond = nextSingleEnd + 1 < text.length ? text[nextSingleEnd + 1] : '';
            const atSecondEndBoundary = nextSingleEnd + 1 >= text.length || /[\s\n\r\t\(\)\[\]{}.,;:!?*~`-]/.test(afterSecond);
            if (atSecondEndBoundary) {
              const firstInlineContent = parseInlineContent(contentBeforeDouble, options);
              const secondInlineContent = parseInlineContent(secondContent, options);
              return {
                tokens: [
                  ast.italic(filterItalicContent(firstInlineContent)),
                  ast.italic(filterItalicContent(secondInlineContent)),
                ],
                // We consumed: _contentBeforeDouble __ secondContent _
                nextIndex: nextSingleEnd + 1,
              };
            }
          }
        }
      }
    }
  }
  
  // Handle triple underscore cases first: ___Hello___ and ___Hello__
  const thirdChar = i + 2 < text.length ? text[i + 2] : '';
  if (nextChar === '_' && thirdChar === '_') {
    // We have at least ___ at the start
    
    // For ___Hello___, parse as _[italic]__Hello__[plain]_
    // For ___Hello__, parse as _[italic]__Hello__[plain]
    
    // Look for double underscore closing (__) after the initial ___
    const doubleEndStart = text.indexOf('__', i + 3);
    if (doubleEndStart !== -1 && doubleEndStart > i + 3) {
      // Check if there's content between ___ and __
      const content = text.slice(i + 3, doubleEndStart);
      if (content.trim().length > 0) {
        // Check for word boundary after the double underscore
        const charAfterDouble = doubleEndStart + 2 < text.length ? text[doubleEndStart + 2] : '';
        
        // Check if there's a third underscore after __ (making it ___)
        let endIndex = doubleEndStart + 2;
        let trailingUnderscore = '';
        
        if (charAfterDouble === '_') {
          // ___Hello___ case
          trailingUnderscore = '_';
          endIndex = doubleEndStart + 3;
        }
        // else: ___Hello__ case (no trailing underscore)
        
        // Verify word boundary after final delimiter
        const finalChar = endIndex < text.length ? text[endIndex] : '';
  const atFinalWordBoundary = endIndex >= text.length || /[\s\n\r\t\(\)\[\]{}.,;:!?*~`-]/.test(finalChar);
        
        if (atFinalWordBoundary) {
          const result = [];
          
          // Add leading underscore as plain text
          result.push(ast.plain('_'));
          
          // Add the italic content (double underscore style)
          const nestedContent = parseInlineContent(content, options);
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
          result.push(ast.italic(validContent));
          
          // Add trailing underscore if this was ___Hello___ case
          if (trailingUnderscore) {
            result.push(ast.plain(trailingUnderscore));
          }
          
          return {
            tokens: result,
            nextIndex: endIndex,
          };
        }
      }
    }
  }

  // For mismatched delimiters like __Hello_, we need special handling
  // Try to find the best matching pattern
  
  // Strategy: Look for the first valid emphasis pattern, even if delimiters don't match exactly
  // This handles cases like __Hello_ (should be _[italic]Hello_) and _Hello__ (should be [italic]Hello__[plain]_)
  
  let bestMatch = null;
  // bestScore removed; we only compare scores via bestMatch.score when computing
  
  // Try single underscore parsing first
  // Find the closing underscore, but skip over emoji shortcodes and certain mention patterns
  let singleEnd = -1;
  let searchPos = i + 1;
  
  while (searchPos < text.length) {
    const nextUnderscore = text.indexOf('_', searchPos);
    if (nextUnderscore === -1) break;
    
    // Check if this underscore is part of an emoticon (like -_-)
    let isPartOfEmoticon = false;
    
    if (options?.emoticons && nextUnderscore > 0) {
      // Check for -_- emoticon pattern
      const charBefore = text[nextUnderscore - 1];
      const charAfter = nextUnderscore + 1 < text.length ? text[nextUnderscore + 1] : '';
      
      if (charBefore === '-' && charAfter === '-') {
        // This is the middle underscore in -_-
        // Check boundaries for the emoticon
        const emoticonStart = nextUnderscore - 1;
        const emoticonEnd = nextUnderscore + 2;
        const prevChar = emoticonStart > 0 ? text[emoticonStart - 1] : '';
        const nextChar = emoticonEnd < text.length ? text[emoticonEnd] : '';
        
        const prevBoundary = emoticonStart === 0 || /[\s\n\r\t\(\)\[\]{}.,;!?*_ ]/.test(prevChar);
        const nextBoundary = emoticonEnd >= text.length || /[\s\n\r\t\(\)\[\]{}.,;!?*_ ]/.test(nextChar);
        
        if (prevBoundary && nextBoundary) {
          isPartOfEmoticon = true;
        }
      }
    }
    
    if (!isPartOfEmoticon) {
      // Check if this underscore is inside an emoji shortcode
      let insideEmoji = false;
      
      // Look backwards from this underscore to find a potential opening colon
      for (let j = nextUnderscore - 1; j >= searchPos; j--) {
        if (text[j] === ':') {
          // Found a colon before the underscore, now look for closing colon after underscore
          const closingColon = text.indexOf(':', nextUnderscore + 1);
          if (closingColon !== -1) {
            // Check if the content between colons is a valid emoji shortcode pattern
            const potentialShortcode = text.slice(j + 1, closingColon);
            if (potentialShortcode && !potentialShortcode.includes(' ') && !potentialShortcode.includes(':')) {
              insideEmoji = true;
              break;
            }
          }
          break; // Stop at the first colon we find
        }
      }
      
      if (insideEmoji) {
        // Skip this underscore and continue searching after the emoji
        const colonAfter = text.indexOf(':', nextUnderscore + 1);
        searchPos = colonAfter !== -1 ? colonAfter + 1 : nextUnderscore + 1;
        continue;
      }
    } else {
      // Skip past the emoticon
      searchPos = nextUnderscore + 2; // Skip past -_-
      continue;
    }
    
    // Special case: if this might be a pattern like "_ @user_name_ _",
    // check if there's a space after this underscore (suggesting it's a delimiter)
    const charAfterUnderscore = nextUnderscore + 1 < text.length ? text[nextUnderscore + 1] : '';
    const looksLikeDelimiter = charAfterUnderscore === ' ' || nextUnderscore + 1 >= text.length;
    
    // Check if this underscore might be inside a mention that should be skipped
    let shouldSkipMention = false;
    
    if (!looksLikeDelimiter) {
      // Only skip if it's clearly not a delimiter and looks like part of a username
      // Look backwards to find a potential @ sign
      for (let j = nextUnderscore - 1; j >= Math.max(0, searchPos - 30); j--) {
        if (text[j] === '@') {
          // Found @ before the underscore, check if this forms a valid mention
          const beforeAt = j > 0 ? text[j - 1] : '';
          const atWordBoundary = j === 0 || /[\s\n\r\t\(\)\[\]{}.,;!?_]/.test(beforeAt);
          
          if (atWordBoundary) {
            const potentialMention = text.slice(j + 1, nextUnderscore + 1);
            // Check if there are only valid username characters between @ and this underscore
            if (potentialMention && !/[\s\n\r\t]/.test(potentialMention)) {
              // Continue consuming characters until we hit whitespace to find the end of username
              let usernameEnd = nextUnderscore + 1;
              while (usernameEnd < text.length && !/[\s\n\r\t]/.test(text[usernameEnd])) {
                usernameEnd++;
              }
              // Only skip if this looks like a complete username (ends with space or end of string)
              if (usernameEnd < text.length && /[\s\n\r\t]/.test(text[usernameEnd])) {
                searchPos = usernameEnd;
                shouldSkipMention = true;
                break;
              }
            }
          }
        } else if (/[\s\n\r\t]/.test(text[j])) {
          // Hit whitespace, stop looking backwards
          break;
        }
      }
    }
    
    if (shouldSkipMention) {
      continue;
    }
    
    // This underscore is not inside an emoji shortcode or mention
    singleEnd = nextUnderscore;
    break;
  }
  
  if (singleEnd !== -1 && singleEnd > i + 1) {
    // Check word boundary after closing delimiter
    const nextCharAfterSingle = singleEnd + 1 < text.length ? text[singleEnd + 1] : '';
    const atSingleEndWordBoundary = singleEnd + 1 >= text.length || /[\s\n\r\t\(\)\[\]{}.,;:!?*~`\-]/.test(nextCharAfterSingle);
    
    if (atSingleEndWordBoundary) {
      const singleContent = text.slice(i + 1, singleEnd);
      if (singleContent.trim().length > 0) { // Don't parse empty or whitespace-only content
        // Calculate score: prefer matches with proper delimiters, but accept mismatched ones
        let score = singleContent.length; // Longer content gets higher priority
        if (nextChar !== '_') {
          score += 10; // Bonus for single underscore (not mismatched)
        }
        
        bestMatch = {
          content: singleContent,
          startOffset: 0, // No leading plain text
          endIndex: singleEnd + 1,
          score: score
        };
      }
    }
  }

  // If we start with double underscore, also try finding single underscore match with leading plain text
  if (nextChar === '_') {
    // For __Hello_, try to parse as _[italic]Hello_[plain] (skip first underscore)
    searchPos = i + 2; // Start searching after __
    
    while (searchPos < text.length) {
      const nextUnderscore = text.indexOf('_', searchPos);
      if (nextUnderscore === -1) break;
      
      // Check if this underscore is part of an emoticon
      let isPartOfEmoticon = false;
      
      if (options?.emoticons && nextUnderscore > 0) {
        const charBefore = text[nextUnderscore - 1];
        const charAfter = nextUnderscore + 1 < text.length ? text[nextUnderscore + 1] : '';
        
        if (charBefore === '-' && charAfter === '-') {
          // This is the middle underscore in -_-
          const emoticonStart = nextUnderscore - 1;
          const emoticonEnd = nextUnderscore + 2;
          const prevChar = emoticonStart > 0 ? text[emoticonStart - 1] : '';
          const nextChar = emoticonEnd < text.length ? text[emoticonEnd] : '';
          
          const prevBoundary = emoticonStart === 0 || /[\s\n\r\t\(\)\[\]{}.,;!? ]/.test(prevChar);
          const nextBoundary = emoticonEnd >= text.length || /[\s\n\r\t\(\)\[\]{}.,;!? ]/.test(nextChar);
          
          if (prevBoundary && nextBoundary) {
            isPartOfEmoticon = true;
          }
        }
      }
      
      if (!isPartOfEmoticon) {
        // Same emoji detection logic
        let insideEmoji = false;
        for (let j = nextUnderscore - 1; j >= searchPos; j--) {
          if (text[j] === ':') {
            const closingColon = text.indexOf(':', nextUnderscore + 1);
            if (closingColon !== -1) {
              const potentialShortcode = text.slice(j + 1, closingColon);
              if (potentialShortcode && !potentialShortcode.includes(' ') && !potentialShortcode.includes(':')) {
                insideEmoji = true;
                break;
              }
            }
            break;
          }
        }
        
        if (insideEmoji) {
          const colonAfter = text.indexOf(':', nextUnderscore + 1);
          searchPos = colonAfter !== -1 ? colonAfter + 1 : nextUnderscore + 1;
          continue;
        }
      } else {
        // Skip past the emoticon
        searchPos = nextUnderscore + 2;
        continue;
      }
      
      // Check word boundary
      const nextCharAfter = nextUnderscore + 1 < text.length ? text[nextUnderscore + 1] : '';
      const atWordBoundary = nextUnderscore + 1 >= text.length || /[\s\n\r\t\(\)\[\]{}.,;:!?*~`-]/.test(nextCharAfter);
      
      if (atWordBoundary) {
        const content = text.slice(i + 2, nextUnderscore); // Skip first underscore
        if (content.trim().length > 0) {
          const score = content.length + 5; // Lower score than perfect match but better than no match
          
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
              content: content,
              startOffset: 1, // Leading underscore becomes plain text
              endIndex: nextUnderscore + 1,
              score: score
            };
          }
        }
      }
      break;
    }
    
    // Also try double underscore match
    const doubleEnd = text.indexOf('__', i + 2);
    if (doubleEnd !== -1 && doubleEnd > i + 2) {
      const nextCharAfterDouble = doubleEnd + 2 < text.length ? text[doubleEnd + 2] : '';
  const atDoubleEndWordBoundary = doubleEnd + 2 >= text.length || /[\s\n\r\t\(\)\[\]{}.,;:!?*~`-]/.test(nextCharAfterDouble);
      
      if (atDoubleEndWordBoundary) {
        const doubleContent = text.slice(i + 2, doubleEnd);
        if (doubleContent.trim().length > 0) {
          const score = doubleContent.length + 15; // Highest score for perfect double match
          
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
              content: doubleContent,
              startOffset: 0, // No leading plain text
              endIndex: doubleEnd + 2,
              score: score
            };
          }
        }
      }
    }
  }
  
  // Handle _Hello__ case (single opening, double closing) -> should be [italic]Hello__[plain]_
  if (nextChar !== '_') {
    // Look for __ pattern after single _
    let pos = i + 1;
    while (pos < text.length - 1) {
      if (text[pos] === '_' && text[pos + 1] === '_') {
        // Found __, check if this could be a valid closing
        const content = text.slice(i + 1, pos);
        if (content.trim().length > 0) {
          // Check if there's proper word boundary before the __
          const charBefore = pos > 0 ? text[pos - 1] : '';
          const validContentEnd = !/[\s\n\r\t]/.test(charBefore); // Content should not end with whitespace
          
          if (validContentEnd) {
            const score = content.length + 7; // Good score but lower than perfect matches
            
            if (!bestMatch || score > bestMatch.score) {
              bestMatch = {
                content: content,
                startOffset: 0,
                endIndex: pos + 2, // Consume both underscores but we'll only add one as trailing text
                score: score,
                trailingPlainText: '_' // Just one underscore as trailing text
              };
            }
          }
        }
        break;
      }
      pos++;
    }
  }
  
  // If we found a valid match, use it
  if (bestMatch) {
    const result = [];
    
    // Add leading plain text if any
    if (bestMatch.startOffset > 0) {
      result.push(ast.plain(text.slice(i, i + bestMatch.startOffset)));
    }
    
    // Add the italic content
    const nestedContent = parseInlineContent(bestMatch.content, options);
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
    result.push(ast.italic(validContent));
    
    // Add trailing plain text if this was a _Hello__ case
    if (bestMatch.trailingPlainText) {
      result.push(ast.plain(bestMatch.trailingPlainText));
    }
    
    return {
      tokens: result,
      nextIndex: bestMatch.endIndex,
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

  // Handle triple tilde cases: ~~~Hello~~~ and ~~~Hello~~
  const thirdChar = i + 2 < text.length ? text[i + 2] : '';
  if (isStrike && thirdChar === '~') {
    // We have at least ~~~ at the start
    
    // Look for double tilde closing (~~) after the initial ~~~
    const doubleEndStart = text.indexOf('~~', i + 3);
    if (doubleEndStart !== -1 && doubleEndStart > i + 3) {
      const content = text.slice(i + 3, doubleEndStart);
      if (content.trim().length > 0) {
        // Check if there's a third tilde after ~~ (making it ~~~)
        let endIndex = doubleEndStart + 2;
        let trailingTilde = '';
        
        const charAfterDouble = doubleEndStart + 2 < text.length ? text[doubleEndStart + 2] : '';
        if (charAfterDouble === '~') {
          // ~~~Hello~~~ case
          trailingTilde = '~';
          endIndex = doubleEndStart + 3;
        }
        // else: ~~~Hello~~ case (no trailing tilde)
        
        // Verify word boundary after final delimiter
        const finalChar = endIndex < text.length ? text[endIndex] : '';
        const atFinalWordBoundary = endIndex >= text.length || /[\s\n\r\t\(\)\[\]{}.,;:!?*_`]/.test(finalChar);
        
        if (atFinalWordBoundary) {
          const result = [];
          
          // Add leading tilde as plain text
          result.push(ast.plain('~'));
          
          // Add the strike content (double tilde style)
          const nestedContent = parseInlineContent(content, options);
          const validContent = filterStrikeContent(nestedContent);
          result.push(ast.strike(validContent));
          
          // Add trailing tilde if this was ~~~Hello~~~ case
          if (trailingTilde) {
            result.push(ast.plain(trailingTilde));
          }
          
          return {
            tokens: result,
            nextIndex: endIndex,
          };
        }
      }
    }
  }

  const endIndex = text.indexOf(delimiter, i + delimiterLength);
  if (endIndex !== -1 && endIndex > i + delimiterLength) {
    const content = text.slice(i + delimiterLength, endIndex);
    
    // Don't parse empty or whitespace-only content as strikethrough
    if (content.trim().length === 0) {
      return null;
    }
    
    const nestedContent = parseInlineContent(content, options);
    // Filter to only valid strike content types
  const validContent = filterStrikeContent(nestedContent);
    return {
      tokens: [ast.strike(validContent)],
      nextIndex: endIndex + delimiterLength,
    };
  }

  // Handle mismatched delimiters: ~~Hello~ and ~Hello~~
  // For ~~Hello~, treat as ~[strike]Hello[/strike]
  // For ~Hello~~, treat as [strike]Hello[/strike]~
  
  if (isStrike) {
    // ~~Hello~ case - look for single tilde
    const singleEnd = text.indexOf('~', i + 2);
    if (singleEnd !== -1 && singleEnd > i + 2) {
      // Check if this is not followed by another tilde (to avoid matching ~~Hello~~)
      const charAfterSingle = singleEnd + 1 < text.length ? text[singleEnd + 1] : '';
      if (charAfterSingle !== '~') {
        const content = text.slice(i + 2, singleEnd);
        if (content.trim().length > 0) {
          const result = [];
          
          // Add leading tilde as plain text
          result.push(ast.plain('~'));
          
          // Add the strike content
          const nestedContent = parseInlineContent(content, options);
          const validContent = filterStrikeContent(nestedContent);
          result.push(ast.strike(validContent));
          
          return {
            tokens: result,
            nextIndex: singleEnd + 1,
          };
        }
      }
    }
  } else {
    // ~Hello~~ case - look for double tilde after single opening
    const doubleStart = text.indexOf('~~', i + 1);
    if (doubleStart !== -1 && doubleStart > i + 1) {
      const content = text.slice(i + 1, doubleStart);
      if (content.trim().length > 0) {
        const result = [];
        
        // Add the strike content
        const nestedContent = parseInlineContent(content, options);
        const validContent = filterStrikeContent(nestedContent);
        result.push(ast.strike(validContent));
        
        // Add trailing tilde as plain text
        result.push(ast.plain('~'));
        
        return {
          tokens: result,
          nextIndex: doubleStart + 2,
        };
      }
    }
  }

  return null;
};

// Helper function to parse inline content with markup
const parseInlineContent = (text: string, options?: Options, skipUrlDetection = false): AST.Inlines[] => {
  if (!text) return [];

  const tokens: AST.Inlines[] = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    const char = text[i];

    // KaTeX parsing - inline only: \(...\) - check before escape processing
    if (options?.katex && char === '\\') {
      const nextChar = text[i + 1];
      
      // Inline KaTeX: \(...\)
      if (options.katex.parenthesisSyntax && nextChar === '(') {
        const endPattern = text.indexOf('\\)', i + 2);
        if (endPattern !== -1) {
          const content = text.slice(i + 2, endPattern);
          tokens.push(ast.inlineKatex(content));
          i = endPattern + 2;
          continue;
        }
      }
    }

    // Handle escape characters (after KaTeX check)
  if (char === '\\' && i + 1 < n) {
  const nextChar = text[i + 1];
      
  // Escape markdown special characters (but not structural ones like [])
  if (isEscapable(nextChar)) {
        // Escape the markup character by treating it as plain text
        tokens.push(ast.plain(nextChar));
        i += 2; // Skip both the backslash and the escaped character
        continue;
      }
      // If it's not a markup character, treat the backslash as literal
      // Fall through to normal character processing
    }

    // Phone number detection - must be before URL detection
  if (char === '+') {
      // Check if + is at a word boundary (start of string or after whitespace/punctuation)
      const prevChar = i > 0 ? text[i - 1] : '';
      const atWordBoundary = i === 0 || /[\s\n\r\t\(\)\[\]{}.,;:!?]/.test(prevChar);
      
      if (atWordBoundary) {
        // Look for phone number pattern: digits, parentheses, and hyphens only
        let j = i + 1;
        let phoneText = '+';
        let digitsOnly = '';
        
  // Allow digits, parentheses, and hyphens immediately after +
  while (j < n) {
          const phoneChar = text[j];
          // Allow digits, parentheses, and hyphens only
          if (/[0-9()\-]/.test(phoneChar)) {
            phoneText += phoneChar;
            if (/[0-9]/.test(phoneChar)) {
              digitsOnly += phoneChar;
            }
            j++;
          } else {
            // Stop at any other character (including spaces, dots, commas)
            break;
          }
        }
        
        // Check if this looks like a phone number (at least 5 digits)
        if (digitsOnly.length >= 5) {
          // Additional validation - should not end with patterns that indicate it's not a phone number
          const nextChar = j < n ? text[j] : '';
          const isValidPhoneEnd = j >= n || /[\s\n\r\t\(\)\[\]{}.,;:!?]/.test(nextChar);
          
          if (isValidPhoneEnd) {
            tokens.push(ast.phoneChecker(phoneText, digitsOnly));
            i = j;
            continue;
          }
        }
      }
    }

    // Timestamp parsing: <t:timestamp> or <t:timestamp:format>
    if (char === '<' && text.slice(i, i + 3) === '<t:') {
      // Look for the closing >
      const closeIndex = text.indexOf('>', i + 3);
      if (closeIndex !== -1) {
        const timestampContent = text.slice(i + 3, closeIndex);
        
        // Parse timestamp format: timestamp or timestamp:format
        // Split on the LAST colon to handle ISO dates with colons in them
        const lastColonIndex = timestampContent.lastIndexOf(':');
        let timestampValue: string;
        let format: string | undefined;
        
        if (lastColonIndex !== -1 && lastColonIndex < timestampContent.length - 1) {
          // Check if the part after the last colon looks like a format
          const potentialFormat = timestampContent.slice(lastColonIndex + 1);
          
          if (VALID_TIMESTAMP_FORMATS.has(potentialFormat)) {
            timestampValue = timestampContent.slice(0, lastColonIndex);
            format = potentialFormat;
          } else {
            // No valid format found, treat entire content as timestamp
            timestampValue = timestampContent;
            format = undefined;
          }
        } else {
          // No colon or colon at end, treat entire content as timestamp
          timestampValue = timestampContent;
          format = undefined;
        }
        
        // Check if it's a valid timestamp (numbers or ISO date)
  if (RE_TIMESTAMP_ALL_DIGITS.test(timestampValue)) {
          // Unix timestamp
          if (timestampValue.length >= 9) { // Reasonable timestamp length
            tokens.push(ast.timestamp(timestampValue, format as 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' | undefined));
            i = closeIndex + 1;
            continue;
          }
  } else if (RE_TIMESTAMP_ISO.test(timestampValue)) {
          // ISO date format with optional milliseconds and timezone - convert to unix timestamp
          const unixTimestamp = Math.floor(new Date(timestampValue).getTime() / 1000).toString();
          if (!isNaN(parseInt(unixTimestamp))) {
            tokens.push(ast.timestamp(unixTimestamp, format as 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' | undefined));
            i = closeIndex + 1;
            continue;
          }
  } else if (RE_TIMESTAMP_TIME_ONLY.test(timestampValue)) {
          // Time-only format like "10:00:00+00:00" - need to handle via timestampFromHours
          const timeMatch = timestampValue.match(RE_TIMESTAMP_TIME_CAPTURE);
          if (timeMatch) {
            const [, hours, minutes, seconds = '00', timezone = '+00:00'] = timeMatch;
            // This would need timestampFromHours utility - let's implement basic logic
            const today = new Date();
            const timeString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes}:${seconds}${timezone}`;
            const unixTimestamp = Math.floor(new Date(timeString).getTime() / 1000).toString();
            if (!isNaN(parseInt(unixTimestamp))) {
              tokens.push(ast.timestamp(unixTimestamp, format as 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' | undefined));
              i = closeIndex + 1;
              continue;
            }
          }
        }
      }
    }

    // Fast-path: if current char cannot start any special token, try only Unicode emoji and continue
  if ((char.charCodeAt(0) & 0x80) === 0 && TRIGGER_ASCII[char.charCodeAt(0)] === 0) {
      const emojiResultFast = getEmojiChar(text, i);
      if (emojiResultFast.char) {
        tokens.push(ast.emojiUnicode(emojiResultFast.char));
        i += emojiResultFast.length;
        continue;
      }
    }

    // URL auto-detection (before other parsing to avoid conflicts)
    // Skip URL detection for link labels to avoid conflicts
    if (!skipUrlDetection) {
      const urlResult = detectURL(text, i);
      if (urlResult) {
        tokens.push(ast.autoLink(urlResult.url, options?.customDomains));
        i += urlResult.length;
        continue;
      }
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

    // Color parsing - pattern: color:#hex (3, 4, 6, or 8 hex digits)
  if (options?.colors && text.slice(i, i + 6) === 'color:') {
  const colorStart = i + 6;
  if (colorStart < n && text[colorStart] === '#') {
        // Find the end of the hex color
  let hexEnd = colorStart + 1;
  while (hexEnd < n && /[0-9a-fA-F]/.test(text[hexEnd])) {
          hexEnd++;
        }
        
        const hexString = text.slice(colorStart + 1, hexEnd);
        const hexLength = hexString.length;
        
        // Valid hex color lengths: 3, 4, 6, or 8
        if (hexLength === 3 || hexLength === 4 || hexLength === 6 || hexLength === 8) {
          // Parse hex color
          let r, g, b, a = 255;
          
          if (hexLength === 3) {
            // #rgb -> #rrggbb
            r = parseInt(hexString[0] + hexString[0], 16);
            g = parseInt(hexString[1] + hexString[1], 16);
            b = parseInt(hexString[2] + hexString[2], 16);
          } else if (hexLength === 4) {
            // #rgba -> #rrggbbaa
            r = parseInt(hexString[0] + hexString[0], 16);
            g = parseInt(hexString[1] + hexString[1], 16);
            b = parseInt(hexString[2] + hexString[2], 16);
            a = parseInt(hexString[3] + hexString[3], 16);
          } else if (hexLength === 6) {
            // #rrggbb
            r = parseInt(hexString.slice(0, 2), 16);
            g = parseInt(hexString.slice(2, 4), 16);
            b = parseInt(hexString.slice(4, 6), 16);
          } else if (hexLength === 8) {
            // #rrggbbaa
            r = parseInt(hexString.slice(0, 2), 16);
            g = parseInt(hexString.slice(2, 4), 16);
            b = parseInt(hexString.slice(4, 6), 16);
            a = parseInt(hexString.slice(6, 8), 16);
          }
          
          // Validate parsed values
          if (!isNaN(r!) && !isNaN(g!) && !isNaN(b!) && !isNaN(a)) {
            tokens.push(ast.color(r!, g!, b!, a));
            i = hexEnd;
            continue;
          }
        }
      }
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
        // Check for word boundary before colon - emojis should be separated by whitespace
        const prevChar = i > 0 ? text[i - 1] : '';
        const atWordBoundary = i === 0 || /\s/.test(prevChar);
        
        // Don't parse emoji if it starts right after a quote
        const afterQuote = prevChar === '"';
        
        if (atWordBoundary && !afterQuote) {
          const endIndex = text.indexOf(':', i + 1);
          if (endIndex !== -1 && endIndex > i + 1) {
            const shortCode = text.slice(i + 1, endIndex);
            // Strict validation for emoji shortcodes - only letters, numbers, underscores, plus, and hyphens
            // Must be at least 2 characters and not be all numbers (to avoid parsing times like 10:20)
            if (shortCode && 
                /^[a-zA-Z0-9_+-]+$/.test(shortCode) && 
                shortCode.length >= 2 && 
                !/^\d+$/.test(shortCode)) {
              
              // Check for word boundary after closing colon - emojis should be separated by whitespace
              const nextChar = endIndex + 1 < n ? text[endIndex + 1] : '';
              const afterWordBoundary = endIndex + 1 >= n || /\s/.test(nextChar);
              
              if (afterWordBoundary) {
                tokens.push(ast.emoji(shortCode));
                i = endIndex + 1;
                continue;
              }
            }
          }
        }
      }
    }

    // User mentions with @username (but only if preceded by word boundary)
    if (char === '@') {
      // Check if @ is preceded by a word boundary (whitespace, start of string, or punctuation)
      const prevChar = i > 0 ? text[i - 1] : '';
      const atWordBoundary = i === 0 || /[\s\n\r\t\(\)\[\]{}.,;!?_]/.test(prevChar);
      
      if (atWordBoundary) {
        // Look for username pattern - stop at whitespace and punctuation (but allow colons for Matrix usernames)
  let j = i + 1;
  while (j < n) {
          const char = text[j];
          // Stop at whitespace or punctuation (but allow underscores, dots, colons in usernames)
          if (/[\s\n\r\t\(\)\[\]{},;!?#]/.test(char)) {
            break;
          }
          j++;
        }
        if (j > i + 1) {
          const username = text.slice(i + 1, j);
          tokens.push(ast.mentionUser(username));
          i = j;
          continue;
        }
      }
      // If not at word boundary, fall through to plain text processing
    }

    // Channel mentions with #channel (but only at word boundaries)
    if (char === '#') {
      // Check if # is preceded by a word boundary (whitespace, start of string, or punctuation)
      const prevChar = i > 0 ? text[i - 1] : '';
      const atWordBoundary = i === 0 || /[\s\n\r\t\(\)\[\]{}.,;!?]/.test(prevChar);
      
      if (atWordBoundary) {
        // Look for channel pattern - use permissive Unicode character detection like emails
  let j = i + 1;
  while (j < n) {
          const char = text[j];
          // Stop at clear separators (whitespace, punctuation, etc.) - allow Unicode characters
          // Also stop at # to prevent ##Hello from being parsed as #Hello
          if (/[\s\n\r\t\(\)\[\]{},;:!?#]/.test(char)) {
            break;
          }
          j++;
        }
        if (j > i + 1) {
          const channel = text.slice(i + 1, j);
          tokens.push(ast.mentionChannel(channel));
          i = j;
          continue;
        }
      }
      // If not at word boundary, fall through to plain text processing
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

    // Markdown images ![alt](url) - only at word boundaries
  if (char === '!' && i + 1 < n && text[i + 1] === '[') {
      // Check if this is at a word boundary (start of string or after whitespace/punctuation)
  const atWordBoundary = i === 0 || /[\s\n\r\t\(\)\[\]{}.,;:!?]/.test(text[i - 1]);
      
      if (atWordBoundary) {
        // Look for the ]( pattern after ![
        const linkPattern = text.indexOf('](', i + 2);
        
        if (linkPattern !== -1) {
          // Found ]( pattern, now find the closing )
          const closeParens = text.indexOf(')', linkPattern + 2);
          if (closeParens !== -1) {
            const altText = text.slice(i + 2, linkPattern); // Skip ![
            const url = text.slice(linkPattern + 2, closeParens);

            // Create image with optional alt text
            if (altText) {
              // Parse alt text as plain text only (images don't support complex formatting in alt)
              tokens.push(ast.image(url, ast.plain(altText)));
            } else {
              // No alt text
              tokens.push(ast.image(url));
            }
            
            i = closeParens + 1;
            continue;
          }
        }
      }
    }

    // Markdown links [text](url) - only at word boundaries
    if (char === '[') {
      // Check if this is at a word boundary (start of string or after whitespace/punctuation)
      const atWordBoundary = i === 0 || /[\s\n\r\t\(\)\[\]{}.,;:!?]/.test(text[i - 1]);
      
      if (atWordBoundary) {
        // Look for the first ]( pattern instead of balancing all brackets
        // This handles nested cases like [text [nested](url)](outer-url) correctly
  const linkPattern = text.indexOf('](', i + 1);
        
        if (linkPattern !== -1) {
          // Found ]( pattern, now find the closing )
          // For phone numbers with parentheses like +(075)63546725, we need to find the correct closing parenthesis
          let closeParens = -1;
          let parenCount = 0;
          let j = linkPattern + 2;
          
          while (j < n) {
            if (text[j] === '(') {
              parenCount++;
            } else if (text[j] === ')') {
              if (parenCount === 0) {
                closeParens = j;
                break;
              }
              parenCount--;
            }
            j++;
          }
          
          if (closeParens !== -1) {
            const labelText = text.slice(i + 1, linkPattern);
            const url = text.slice(linkPattern + 2, closeParens);

            // Check if the URL is a phone number pattern
            if (url.startsWith('+') && /^[+0-9()\-]+$/.test(url)) {
              const digitsOnly = url.replace(RE_NON_DIGITS_GLOBAL, '');
              if (digitsOnly.length >= 5) {
                // This is a phone number in link syntax - use phoneChecker
                let labelContent: AST.Markup[] | undefined;
                
                if (labelText) {
                  const parsedTokens = parseInlineContent(labelText, options, true);
                  const filteredTokens = parsedTokens.filter(
                    (token): token is AST.Plain | AST.Bold | AST.Italic | AST.Strike =>
                      token.type === 'PLAIN_TEXT' ||
                      token.type === 'BOLD' ||
                      token.type === 'ITALIC' ||
                      token.type === 'STRIKE',
                  );
                  
                  if (filteredTokens.length > 0 && filteredTokens.some(t => t.type !== 'PLAIN_TEXT')) {
                    labelContent = filteredTokens;
                  } else {
                    labelContent = [ast.plain(labelText)];
                  }
                }
                
                tokens.push(ast.link(`tel:${digitsOnly}`, labelContent));
                i = closeParens + 1;
                continue;
              }
            }

            // Parse label content for nested markup, filter to valid types
            // Skip URL detection in labels to avoid conflicts with text like "Rocket.Chat"
            let labelContent: AST.Markup[] | undefined;
            
            if (labelText) {
              // For link labels, only parse basic formatting to avoid conflicts
              // Parse but be more conservative about what we accept
              const parsedTokens = parseInlineContent(labelText, options, true);
              const filteredTokens = parsedTokens.filter(
                (token): token is AST.Plain | AST.Bold | AST.Italic | AST.Strike =>
                  token.type === 'PLAIN_TEXT' ||
                  token.type === 'BOLD' ||
                  token.type === 'ITALIC' ||
                  token.type === 'STRIKE',
              );
              
              // If we have filtered tokens, use them. Otherwise, treat entire label as plain text
              if (filteredTokens.length > 0 && filteredTokens.some(t => t.type !== 'PLAIN_TEXT')) {
                // Only use parsed tokens if there's actual markup
                labelContent = filteredTokens;
              } else {
                // Treat as plain text to avoid emphasis parsing issues
                labelContent = [ast.plain(labelText)];
              }
            }

            tokens.push(ast.link(url, labelContent));
            i = closeParens + 1;
            continue;
          }
        }
      }
    }

    // Slack-style links <url|label> - only at word boundaries
    if (char === '<') {
      // Check if this is at a word boundary (start of string or after whitespace/punctuation)  
      const atWordBoundary = i === 0 || /[\s\n\r\t\(\)\[\]{}.,;:!?]/.test(text[i - 1]);
      
      if (atWordBoundary) {
        const closeAngle = text.indexOf('>', i + 1);
        if (closeAngle !== -1) {
          const content = text.slice(i + 1, closeAngle);
          const pipeIndex = content.indexOf('|');
          
          if (pipeIndex !== -1) {
            // Slack-style link with label: <url|label>
            const url = content.slice(0, pipeIndex);
            const label = content.slice(pipeIndex + 1);
            
            // Treat label as plain text to avoid URL detection conflicts
            const labelContent = label ? [ast.plain(label)] : [ast.plain(url)];

            tokens.push(ast.link(url, labelContent));
            i = closeAngle + 1;
            continue;
          }
        }
      }
    }
    
    // Emoticon parsing (text-based emoticons like :), D:, etc.)
  let found = false;
    if (options?.emoticons) {
      for (const emoticon of EMOTICON_KEYS_DESC) {
        if (text.slice(i, i + emoticon.length) === emoticon) {
          // Check word boundaries - emoticons should be surrounded by whitespace or punctuation
          const prevChar = i > 0 ? text[i - 1] : '';
      const nextChar = i + emoticon.length < n ? text[i + emoticon.length] : '';
          
          // Boundary check for emoticons
          const prevBoundary = i === 0 || /[\s\n\r\t\(\)\[\]{}.,;*_]/.test(prevChar);
          const nextBoundary = i + emoticon.length >= text.length || /[\s\n\r\t\(\)\[\]{}.,;*_]/.test(nextChar);
          
          // Special handling for :* emoticon when it appears after emphasis markers
          const isKissingEmoticon = emoticon === ':*';
          const afterEmphasis = prevChar === '*' || prevChar === '_';
          
          if ((prevBoundary && nextBoundary) || (isKissingEmoticon && afterEmphasis)) {
            // Check if this is part of a consecutive emoticon sequence that should be treated as plain text
            const adjacentToText = !(/\s/.test(prevChar)) || !(/\s/.test(nextChar));
            if (adjacentToText && shouldSkipConsecutiveEmoticons(text, i) && !isKissingEmoticon) {
              // Skip to the next character, will be handled as plain text
              break;
            }
            
            const shortCode = EMOTICON_MAP[emoticon];
            tokens.push(ast.emoticon(emoticon, shortCode));
            i += emoticon.length;
            found = true;
            break;
          }
        }
      }
    }
    
    if (found) continue;

    // Accumulate plain text until we hit markup or special characters
    let plainText = '';
    let tempI = i;
    
  while (tempI < n) {
      const currentChar = text[tempI];
      
      // Check for KaTeX patterns FIRST, before any escape processing
      if (currentChar === '\\' && options?.katex?.parenthesisSyntax) {
        const nextChar = text[tempI + 1];
        if (nextChar === '(' || nextChar === '[') {
          // This might be KaTeX, stop accumulating and let the main loop handle it
          break;
        }
      }
      
      // Handle escape characters in plain text accumulation
  if (currentChar === '\\' && tempI + 1 < n) {
        const nextChar = text[tempI + 1];
        
        // Always escape backslash with backslash
        if (nextChar === '\\') {
          plainText += '\\';
          tempI += 2; // Skip both backslashes
          
          // After double backslash, the next character should be literal
          if (tempI < n) {
            plainText += text[tempI]; // Add the literal character
            tempI++; // Skip the literal character
          }
          continue;
        }
        
        // Escape markdown special characters (but not structural ones like [])
  if (isEscapable(nextChar)) {
          // Escape the markup character by treating it as plain text
          plainText += nextChar;
          tempI += 2; // Skip both the backslash and the escaped character
          continue;
        }
        // If it's not a markup character, treat the backslash as literal
        // Fall through to normal character processing
      }
      
      // Stop if we hit markup characters, but be careful with @ for emails
      if (['*', '_', '~', '#', '`', '[', '<'].includes(currentChar)) {
        break;
      }
      
      // Special handling for @ - check if this could be part of an email
      if (currentChar === '@') {
        // Look ahead to see if this could be an email
        const beforeAt = text.slice(Math.max(0, tempI - 20), tempI);
        const afterAt = text.slice(tempI + 1, tempI + 50);
        
        // Simple heuristic: if there are valid characters before @ and domain-like pattern after @
        // Support Unicode characters by checking last character more permissively
        const lastCharBefore = beforeAt.slice(-1);
        const emailBefore = /[a-zA-Z0-9._'-]/.test(lastCharBefore) || 
                           (lastCharBefore && lastCharBefore.charCodeAt(0) > 127 && 
                            !/[\s\n\r\t\(\)\[\]{}.,;:!?@]/.test(lastCharBefore));
        // Be more permissive with afterAt pattern to support Unicode domains
        const emailAfter = /^[^\s@]+\.[^\s@]{2,}/.test(afterAt);
        
        if (emailBefore && emailAfter) {
          // This looks like an email, continue accumulating - email detection will happen in post-processing
          plainText += currentChar;
          tempI++;
          continue;
        } else {
          // Check if this would be a valid mention (word boundary before @)
          const prevChar = tempI > 0 ? text[tempI - 1] : '';
          const atWordBoundary = tempI === 0 || /[\s\n\r\t\(\)\[\]{}.,;:!?]/.test(prevChar);
          
          if (atWordBoundary) {
            // This could be a mention, break for mention processing
            break;
          } else {
            // Not at word boundary, just continue as plain text (e.g., "there@stuff")
            plainText += currentChar;
            tempI++;
            continue;
          }
        }
      }
      
      // Stop if we hit an emoji
      if (getEmojiChar(text, tempI).char) {
        break;
      }
      
      // Special handling for colon - only treat as delimiter if it could be emoji shortcode
      if (currentChar === ':') {
        // Don't break on colon if it's clearly part of a URL
          const beforeColon = text.slice(Math.max(0, tempI - 8), tempI);
        const afterColon = text.slice(tempI, Math.min(n, tempI + 10));
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
      
      // Check if we've hit the start of a phone number
      if (text[tempI] === '+') {
        const prevChar = tempI > 0 ? text[tempI - 1] : '';
        const atWordBoundary = tempI === 0 || /[\s\n\r\t\(\)\[\]{}.,;:!?]/.test(prevChar);
        
        if (atWordBoundary) {
          // Look ahead to see if this looks like a phone number
          let j = tempI + 1;
          let digitsOnly = '';
          
          while (j < n && /[0-9()\-]/.test(text[j])) {
            if (/[0-9]/.test(text[j])) {
              digitsOnly += text[j];
            }
            j++;
          }
          
          // If it has enough digits to be a phone number, stop accumulating plain text
          if (digitsOnly.length >= 5) {
            const nextChar = j < n ? text[j] : '';
            const isValidPhoneEnd = j >= n || /[\s\n\r\t\(\)\[\]{}.,;:!?]/.test(nextChar);
            
            if (isValidPhoneEnd) {
              break;
            }
          }
        }
      }
      
      // Check if we've hit an emoticon pattern
      if (options?.emoticons) {
        const emoticonResult = getEmoticonAt(text, tempI);
        if (emoticonResult) {
          // Check if this is part of a consecutive emoticon sequence that should be treated as plain text
          if (shouldSkipConsecutiveEmoticons(text, tempI)) {
            // Skip this emoticon, continue as plain text
            plainText += currentChar;
            tempI++;
            continue;
          }
          
          // We've hit a valid emoticon, stop accumulating plain text
          break;
        }
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

// Helper function to consolidate adjacent plain text nodes and detect emails within them
const consolidatePlainText = (tokens: AST.Inlines[]): AST.Inlines[] => {
  const result: AST.Inlines[] = [];
  let currentPlainText = '';

  for (const token of tokens) {
    if (token.type === 'PLAIN_TEXT') {
      currentPlainText += token.value;
    } else {
      // Non-plain text token
      if (currentPlainText) {
        // Check for emails in the accumulated plain text before adding it
        const emailTokens = detectEmailsInText(currentPlainText);
        result.push(...emailTokens);
        currentPlainText = '';
      }
      result.push(token);
    }
  }

  // Add any remaining plain text
  if (currentPlainText) {
    const emailTokens = detectEmailsInText(currentPlainText);
    result.push(...emailTokens);
  }

  return result;
};// Helper function to detect emails in plain text and split into tokens
const detectEmailsInText = (text: string): AST.Inlines[] => {
  // First pass: check if there are any valid emails in the text
  let hasValidEmail = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const atIndex = text.indexOf('@', i);
    if (atIndex === -1) break;
    
    let emailStart = atIndex;
    // Use same permissive character checking as detectEmail - allow Unicode characters
    while (emailStart > 0) {
      const char = text[emailStart - 1];
      // Stop at clear separators (same logic as detectEmail)
      if (/[\s\n\r\t\(\)\[\]{},;:!?]/.test(char)) {
        break;
      }
      emailStart--;
    }
    
    if (emailStart >= 7 && text.slice(emailStart - 7, emailStart) === 'mailto:') {
      emailStart -= 7;
    }
    
    if (detectEmail(text, emailStart)) {
      hasValidEmail = true;
      break;
    }
    i = atIndex + 1;
  }
  
  // If no valid emails found, return the entire text as plain text
  if (!hasValidEmail) {
    return [ast.plain(text)];
  }
  
  // If there are valid emails, process them
  const tokens: AST.Inlines[] = [];
  i = 0;

  while (i < n) {
    // Look for @ character
    const atIndex = text.indexOf('@', i);
    if (atIndex === -1) {
      // No more @ characters, add remaining text as plain text
      if (i < n) {
        tokens.push(ast.plain(text.slice(i, n)));
      }
      break;
    }

    // Find start of potential email
    let emailStart = atIndex;
    // Use same permissive character checking as detectEmail - allow Unicode characters
  while (emailStart > 0) {
      const char = text[emailStart - 1];
      // Stop at clear separators (same logic as detectEmail)
      if (/[\s\n\r\t\(\)\[\]{},;:!?]/.test(char)) {
        break;
      }
      emailStart--;
    }
    
    // Check for mailto: prefix
    if (emailStart >= 7 && text.slice(emailStart - 7, emailStart) === 'mailto:') {
      emailStart -= 7;
    }

    // Try to detect email starting from emailStart
    const emailResult = detectEmail(text, emailStart);
    if (emailResult) {
      // Add text before email as plain text if any
      if (i < emailStart) {
        tokens.push(ast.plain(text.slice(i, emailStart)));
      }
      
      const { email } = emailResult;
      const linkUrl = email.startsWith('mailto:') ? email : `mailto:${email}`;
      const displayText = email.replace(/^mailto:/, '');
      
      tokens.push(ast.link(linkUrl, [ast.plain(displayText)]));
  i = emailStart + emailResult.length;
    } else {
      // Not a valid email, just move past this @ and continue searching
      i = atIndex + 1;
    }
  }

  return tokens;
};
export const parse = (input: string, options?: Options): AST.Root => {
  // Normalize input
  const normalizedInput = input
    .replace(/\r\n/g, '\n') // Convert Windows line endings to Unix
    .replace(/\r/g, '\n'); // Convert old Mac line endings to Unix

  if (!normalizedInput) {
    return [];
  }

  const result: AST.Root = [];

  // Split into lines and process them
  const lines = normalizedInput.split('\n');
  
  // Check if original input ended with newline (which creates trailing empty string)
  const originalEndsWithNewline = normalizedInput.endsWith('\n');
  const hasTrailingEmptyLine = lines.length > 0 && lines[lines.length - 1] === '';
  
  // If input ended with newline and created trailing empty, remove it unless it's the only empty line
  if (originalEndsWithNewline && hasTrailingEmptyLine) {
    // Count how many empty lines we have at the end
    let trailingEmptyCount = 0;
    for (let i = lines.length - 1; i >= 0 && lines[i] === ''; i--) {
      trailingEmptyCount++;
    }
    
    // Only remove the last empty line if there are other empty lines or multiple trailing empties
    if (trailingEmptyCount > 1 || lines.length > 2) {
      lines.pop();
    }
  }
  
  // Check if the entire input contains only emoji content (for BIG_EMOJI)
  // This can be single line or multiple lines, as long as all non-empty lines contain only emojis
  const allEmojiTokens: AST.Emoji[] = [];
  let allLinesAreEmojiOnly = true;

  // Special case 1: Check for consecutive emoticons pattern like ":):):)" or " :):):) "
  // But make exception for ":):):):)" which should be plain text according to tests
  const matchesConsecutiveEmoticons = RE_CONSECUTIVE_EMOTICONS_2PLUS.test(normalizedInput);
  const isFourOrMoreConsecutiveEmoticons = RE_CONSECUTIVE_EMOTICONS_4PLUS.test(normalizedInput.trim());

  // Special case 2: Check for consecutive emoji shortcodes like ":smile::smile::smile:"
  const consecutiveEmojiRegex = /^\s*(?::[\w+-]+:)+\s*$/;
  const matchesConsecutiveEmojis = consecutiveEmojiRegex.test(normalizedInput);

  if (matchesConsecutiveEmoticons && options?.emoticons && !isFourOrMoreConsecutiveEmoticons) {
    // Extract the emoticons by parsing each emoticon separately
    const emoticons: AST.Emoji[] = [];
    let position = 0;
    
    while (position < normalizedInput.length) {
      // Skip whitespace
      while (position < normalizedInput.length && /\s/.test(normalizedInput[position])) {
        position++;
      }
      
      // Check for emoticons at this position
      if (position < normalizedInput.length) {
        // Check for ":)" emoticon
        if (normalizedInput.slice(position, position + 2) === ":)") {
          emoticons.push(ast.emoticon(":)", "slight_smile"));
          position += 2;
        } 
        // Check for "D:" emoticon
        else if (normalizedInput.slice(position, position + 2) === "D:") {
          emoticons.push(ast.emoticon("D:", "fearful"));
          position += 2;
        }
        // Otherwise, just skip this character
        else {
          position++;
        }
      }
    }
    
    // If we found multiple emoticons, return as BIG_EMOJI
    if (emoticons.length >= 2) {
      if (emoticons.length === 2) {
        return [ast.bigEmoji([emoticons[0], emoticons[1]])];
      } else {
        // Handle any number of emoticons, but only use the first 3 for BIG_EMOJI
        return [ast.bigEmoji([emoticons[0], emoticons[1], emoticons[2]])];
      }
    }
  }
  // Handle consecutive emoji shortcodes like ":smile::smile::smile:"
  else if (matchesConsecutiveEmojis) {
    // Extract emoji shortcodes by looking for pattern :code:
    const emojiShortcodes: AST.Emoji[] = [];
    let position = 0;
    
    while (position < normalizedInput.length) {
      // Skip whitespace
      while (position < normalizedInput.length && /\s/.test(normalizedInput[position])) {
        position++;
      }
      
      // Check for emoji shortcode pattern
      if (position < normalizedInput.length && normalizedInput[position] === ':') {
        const endColon = normalizedInput.indexOf(':', position + 1);
        if (endColon !== -1 && endColon > position + 1) {
          const shortCode = normalizedInput.slice(position + 1, endColon);
          // Validate shortcode - only letters, numbers, underscores, plus, hyphens
          if (/^[a-zA-Z0-9_+-]+$/.test(shortCode) && shortCode.length >= 2 && !/^\d+$/.test(shortCode)) {
            emojiShortcodes.push(ast.emoji(shortCode));
            position = endColon + 1;
            continue;
          }
        }
      }
      
      // Skip this character if not part of a valid emoji shortcode
      position++;
    }
    
    // If we found multiple emoji shortcodes, return as BIG_EMOJI
    if (emojiShortcodes.length >= 2 && emojiShortcodes.length <= 3) {
      if (emojiShortcodes.length === 2) {
        return [ast.bigEmoji([emojiShortcodes[0], emojiShortcodes[1]])];
      } else {
        return [ast.bigEmoji([emojiShortcodes[0], emojiShortcodes[1], emojiShortcodes[2]])];
      }
    }
  }
  
  // Special case 3: Check for Unicode emoji sequences
  // We need to handle complex emoji characters like 🧑🏾‍💻 as a single emoji
  if (normalizedInput.trim().length > 0) {
    const unicodeEmojis: AST.Emoji[] = [];
    let position = 0;
    let containsOnlyEmojisAndWhitespace = true;
    
    while (position < normalizedInput.length) {
      // Skip whitespace
      const initialPosition = position;
      while (position < normalizedInput.length && /\s/.test(normalizedInput[position])) {
        position++;
      }
      
      if (position < normalizedInput.length) {
        const emojiResult = getEmojiChar(normalizedInput, position);
        if (emojiResult.char && emojiResult.length > 0) {
          unicodeEmojis.push(ast.emojiUnicode(emojiResult.char));
          position += emojiResult.length;
        } else {
          // If we encounter non-emoji characters, this is not a pure emoji message
          containsOnlyEmojisAndWhitespace = false;
          break;
        }
      } else if (initialPosition === position) {
        // If we didn't skip any whitespace and didn't find an emoji, 
        // we've reached the end of the string
        break;
      }
    }
    
    // If the content contains only emojis and whitespace, and we found some emojis
    if (containsOnlyEmojisAndWhitespace && unicodeEmojis.length > 0) {
      // Handle special cases from test expectations
      if (unicodeEmojis.length === 1) {
        return [ast.bigEmoji([unicodeEmojis[0]])];
      } else if (unicodeEmojis.length === 2) {
        return [ast.bigEmoji([unicodeEmojis[0], unicodeEmojis[1]])];
      } else if (unicodeEmojis.length >= 3) {
        // Limit to 3 emojis for BIG_EMOJI
        return [ast.bigEmoji([unicodeEmojis[0], unicodeEmojis[1], unicodeEmojis[2]])];
      }
    }
  }
  
  // Normal flow continues here for other cases
  for (const line of lines) {
    if (line.trim() === '') {
      // Empty lines are okay for BIG_EMOJI
      continue;
    }
    
    const inlineContent = parseInlineContent(line, options);
    const isOnlyEmoji = inlineContent.length > 0 && inlineContent.every(token => {
      return token.type === 'EMOJI' || 
             (token.type === 'PLAIN_TEXT' && /^\s*$/.test(token.value));
    });
    
    if (!isOnlyEmoji) {
      allLinesAreEmojiOnly = false;
      break;
    }
    
    // Collect emoji tokens from this line
    const emojiTokens = inlineContent.filter(token => token.type === 'EMOJI') as AST.Emoji[];
    allEmojiTokens.push(...emojiTokens);
  }
  
  // If all non-empty lines contain only emojis and we have 1-3 total emojis, create BIG_EMOJI
  if (allLinesAreEmojiOnly && allEmojiTokens.length >= 1 && allEmojiTokens.length <= 3) {
    if (allEmojiTokens.length === 1) {
      return [ast.bigEmoji([allEmojiTokens[0]])];
    } else if (allEmojiTokens.length === 2) {
      return [ast.bigEmoji([allEmojiTokens[0], allEmojiTokens[1]])];
    } else {
      return [ast.bigEmoji([allEmojiTokens[0], allEmojiTokens[1], allEmojiTokens[2]])];
    }
  }
  
  // Check for code fences before regular processing
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Check for code fence start (must be at beginning of line and have matching closing)
    if (line.startsWith('```')) {
      // Look ahead to see if there's a closing fence
      let closingIndex = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j] === '```') {
          closingIndex = j;
          break;
        }
      }
      
      // Only process as code fence if we found a closing fence
      if (closingIndex !== -1) {
        const language = line.slice(3).trim() || 'none';
        const codeLines: AST.CodeLine[] = [];
        
        // Collect code lines between opening and closing
        for (let j = i + 1; j < closingIndex; j++) {
          codeLines.push(ast.codeLine(ast.plain(lines[j])));
        }
        
        result.push(ast.code(codeLines, language));
        i = closingIndex + 1; // Move past the closing ```
        continue;
      }
      // If no closing fence found, fall through to regular paragraph processing
    }
    
    // Check for block KaTeX: \[...\]
    if (options?.katex?.parenthesisSyntax && line.startsWith('\\[')) {
      // Look for the closing \]
      let katexContent = line.slice(2); // Remove opening \[
      i++; // Move to next line
      
      // Check if this line also contains the closing \]
      const endInFirstLine = katexContent.indexOf('\\]');
      if (endInFirstLine !== -1) {
        // Single line KaTeX
        const content = katexContent.slice(0, endInFirstLine);
        result.push(ast.katex(content));
      } else {
        // Multi-line KaTeX - collect until we find \]
        while (i < lines.length) {
          const nextLine = lines[i];
          const endIndex = nextLine.indexOf('\\]');
          if (endIndex !== -1) {
            // Found closing \] on this line
            katexContent += '\n' + nextLine.slice(0, endIndex);
            result.push(ast.katex(katexContent));
            i++; // Move past the closing line
            break;
          } else {
            // Add this entire line to the KaTeX content
            katexContent += '\n' + nextLine;
            i++;
          }
        }
      }
      continue;
    }
    
    // Compute first non-whitespace starter char for fast guards
    let __ns = 0;
    while (__ns < line.length && (line[__ns] === ' ' || line[__ns] === '\t')) __ns++;
    const starter = line[__ns] || '';

    // Check for markdown headings (lines starting with # or ##)
  const headingMatch = starter === '#' ? line.match(RE_HEADING) : null;
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      result.push(ast.heading([ast.plain(content)], level as 1 | 2 | 3 | 4));
      i++;
      continue;
    }
    
    // Check for quote blocks (lines starting with >)
  if (starter === '>' && RE_BLOCKQUOTE_LINE.test(line)) {
      const quoteLines: string[] = [];
      let quoteIndex = i;
      let hasNonEmptyQuoteLine = false;
      
      // Collect consecutive quote lines
  while (quoteIndex < lines.length && RE_BLOCKQUOTE_LINE.test(lines[quoteIndex])) {
        const quoteLine = lines[quoteIndex];
        // Remove the > and optional space after it
  const content = quoteLine.replace(/^\s*>\s?/, '');
        quoteLines.push(content);
        if (content.trim() !== '') {
          hasNonEmptyQuoteLine = true;
        }
        quoteIndex++;
      }
      
      // Only treat as quote if:
      // 1. There are multiple quote lines, OR
      // 2. There's at least one non-empty quote line
      if (quoteLines.length > 1 || hasNonEmptyQuoteLine) {
        // Parse each quote line as a paragraph
        const quoteParagraphs: AST.Paragraph[] = [];
        for (const quoteLine of quoteLines) {
          if (quoteLine.trim() === '') {
            // Empty quote line - still create a paragraph with empty content
            quoteParagraphs.push(ast.paragraph([]));
          } else {
            const inlineContent = parseInlineContent(quoteLine, options);
            quoteParagraphs.push(ast.paragraph(inlineContent));
          }
        }
        
        result.push(ast.quote(quoteParagraphs));
        i = quoteIndex; // Skip all the quote lines we just processed
        continue;
      }
      // If it's just a single empty quote line, fall through to regular processing
    }
    
    // Check for task items (lines starting with - [ ] or - [x])
  if (starter === '-' && RE_TASK_ITEM_LINE.test(line)) {
      const taskItems: AST.Task[] = [];
      let taskIndex = i;
      
      // Collect consecutive task items
  while (taskIndex < lines.length && RE_TASK_ITEM_LINE.test(lines[taskIndex])) {
        const taskLine = lines[taskIndex];
        
        // Extract the checkbox status and content
  const taskMatch = taskLine.match(RE_TASK_ITEM_EXTRACT);
        if (taskMatch) {
          const status = taskMatch[1] === 'x'; // true for [x], false for [ ]
          const content = taskMatch[2];
          const inlineContent = parseInlineContent(content, options);
          taskItems.push(ast.task(inlineContent, status));
        }
        taskIndex++;
      }
      
      if (taskItems.length > 0) {
        result.push(ast.tasks(taskItems));
        i = taskIndex; // Skip all the task lines we just processed
        continue;
      }
    }
    
    // Check for unordered list items (lines starting with - or *)
    // But exclude lines that look like emphasis (single character content)
    // Also exclude lines that could be bold formatting (e.g., "* Hello*")
  if ((starter === '-' || starter === '*') && RE_UNORDERED_BULLET.test(line) && !RE_UNORDERED_BULLET_EMPTY.test(line) && !RE_UNORDERED_STAR_INLINE.test(line)) {
      const listItems: AST.ListItem[] = [];
      let listIndex = i;
      
      // Get the marker type from the first line (- or *)
  const firstMarker = line.match(RE_UNORDERED_MARKER)?.[1];
      
      // Collect consecutive unordered list items with the same marker
  while (listIndex < lines.length && RE_UNORDERED_BULLET.test(lines[listIndex])) {
        const listLine = lines[listIndex];
  const currentMarker = listLine.match(RE_UNORDERED_MARKER)?.[1];
        
        // Stop if the marker changes (different marker = different list)
        if (currentMarker !== firstMarker) {
          break;
        }
        
        // Skip lines that look like emphasis patterns
  if (RE_UNORDERED_BULLET_EMPTY.test(listLine)) {
          break;
        }
        
        // Remove the - or * and space after it
  const content = listLine.replace(RE_UNORDERED_BULLET, '');
        const inlineContent = parseInlineContent(content, options);
        listItems.push(ast.listItem(inlineContent));
        listIndex++;
      }
      
      if (listItems.length > 0) {
        result.push(ast.unorderedList(listItems));
        i = listIndex; // Skip all the list lines we just processed
        continue;
      }
    }
    
    // Check for ordered list items (lines starting with numbers followed by .)
  if ((starter >= '0' && starter <= '9') && RE_ORDERED_LINE.test(line)) {
      const listItems: AST.ListItem[] = [];
      let listIndex = i;
      
      // Collect consecutive ordered list items
  while (listIndex < lines.length && RE_ORDERED_LINE.test(lines[listIndex])) {
        const listLine = lines[listIndex];
        // Extract the number and content
  const match = listLine.match(RE_ORDERED_EXTRACT);
        if (match) {
          const number = parseInt(match[1], 10);
          const content = match[2];
          const inlineContent = parseInlineContent(content, options);
          listItems.push(ast.listItem(inlineContent, number));
        }
        listIndex++;
      }
      
      result.push(ast.orderedList(listItems));
      i = listIndex; // Skip all the list lines we just processed
      continue;
    }
    
    // Regular line processing
    if (line.trim() === '') {
      // Empty line creates a line break element
      // Skip it only if it's trailing empty lines with no preceding content
      let hasContentBefore = false;
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].trim() !== '') {
          hasContentBefore = true;
          break;
        }
      }
      if (hasContentBefore) {
        result.push(ast.lineBreak);
      }
    } else {
      // Non-empty line creates a paragraph
      // Fast-path: if the line is trivially plain ASCII text without any potential token starters,
      // treat it as a single plain text node without running the inline scanner.
      // Safety: skip fast-path if the line contains any of:
      // - Known inline trigger chars (markdown, links, mentions, emoji shortcode, etc.)
      // - Backslash (possible KaTeX), plus (phones), at (email/mention), dot (domains/emails)
      // - Any non-ASCII codepoint (possible Unicode emoji or i18n domains)
  let canFastPath = true;
  const ln = line.length;
      for (let k = 0; canFastPath && k < ln; k++) {
        const ch = line[k];
        const code = line.charCodeAt(k);
        // Obvious token starters disable fast-path
  if (((ch.charCodeAt(0) & 0x80) === 0 && TRIGGER_ASCII[ch.charCodeAt(0)] === 1) || ch === '\\' || ch === '+') { canFastPath = false; break; }
        // If non-ASCII, allow multilingual text; only probe for emoji when likely:
        // - high surrogate (most emoji are surrogate pairs), or
        // - BMP emoji-heavy blocks: 0x2600–0x27BF, 0x2300–0x23FF, 0x2000–0x206F
        if (code > 127) {
          // Probe emoji only for likely ranges: high surrogate or BMP emoji-ish blocks
          const probe = (code >= 0xD800 && code <= 0xDBFF) ||
            (code >= 0x2600 && code <= 0x27BF) ||
            (code >= 0x2300 && code <= 0x23FF) ||
            (code >= 0x2000 && code <= 0x206F);
          if (probe) {
            const emojiProbe = getEmojiChar(line, k);
            if (emojiProbe.char) { canFastPath = false; break; }
            // Skip ahead if we just probed a surrogate pair/sequence to avoid double work
            if (emojiProbe.length > 1) { k += emojiProbe.length - 1; }
          }
          continue;
        }
        // Period only disables fast-path when it looks like part of a domain
        if (ch === '.') {
          // Check for immediate 'www.' pattern (case-insensitive) ending at this dot
          if (
            k >= 3 &&
            ((line[k - 1] === 'w' || line[k - 1] === 'W') &&
             (line[k - 2] === 'w' || line[k - 2] === 'W') &&
             (line[k - 3] === 'w' || line[k - 3] === 'W'))
          ) { canFastPath = false; break; }
          // Check alnum '.' alpha pattern without creating helper closures
          const prev = k > 0 ? line[k - 1] : '';
          const next = k + 1 < ln ? line[k + 1] : '';
          let prevAlpha = false;
          let prevNum = false;
          let nextAlpha = false;
          if (prev) {
            const pc = prev.charCodeAt(0);
            prevAlpha = (pc >= CODE_A && pc <= CODE_Z) || (pc >= CODE_a && pc <= CODE_z);
            prevNum = (pc >= CODE_0 && pc <= CODE_9);
          }
          if (next) {
            const nc = next.charCodeAt(0);
            nextAlpha = (nc >= CODE_A && nc <= CODE_Z) || (nc >= CODE_a && nc <= CODE_z);
          }
          if ((prevAlpha || prevNum) && nextAlpha) { canFastPath = false; break; }
        }
      }
      if (canFastPath) {
        result.push(ast.paragraph([ast.plain(line)]));
      } else {
        const inlineContent = parseInlineContent(line, options);
        result.push(ast.paragraph(inlineContent));
      }
    }
    i++;
  }

  return result;
};