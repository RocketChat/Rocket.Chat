import type * as AST from './definitions';
import * as ast from './utils.ts';

// Filter nested content for bold, converting unsupported nodes to plain text
export const filterBoldContent = (
  tokens: AST.Inlines[],
): (
  | AST.MarkupExcluding<AST.Bold>
  | AST.Link
  | AST.Emoji
  | AST.UserMention
  | AST.ChannelMention
  | AST.InlineCode
)[] => {
  const valid: (
    | AST.MarkupExcluding<AST.Bold>
    | AST.Link
    | AST.Emoji
    | AST.UserMention
    | AST.ChannelMention
    | AST.InlineCode
  )[] = [];
  for (const token of tokens) {
    if (
      token.type === 'BOLD' ||
      token.type === 'TIMESTAMP' ||
      token.type === 'IMAGE' ||
      token.type === 'COLOR' ||
      token.type === 'INLINE_KATEX'
    ) {
      if (token.type === 'TIMESTAMP') {
        const format = token.value.format && token.value.format !== 't' ? `:${token.value.format}` : '';
        valid.push(ast.plain(`<t:${token.value.timestamp}${format}>`));
      } else {
        valid.push(ast.plain('[unsupported content]'));
      }
    } else {
      valid.push(token);
    }
  }
  return valid;
};

// Filter out invalid italic content
export const filterItalicContent = (
  tokens: AST.Inlines[],
): (
  | AST.MarkupExcluding<AST.Italic>
  | AST.Link
  | AST.Emoji
  | AST.UserMention
  | AST.ChannelMention
  | AST.InlineCode
)[] => {
  return tokens.filter(
    (token): token is
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
};

// Filter out invalid strike content
export const filterStrikeContent = (
  tokens: AST.Inlines[],
): (
  | AST.MarkupExcluding<AST.Strike>
  | AST.Link
  | AST.Emoji
  | AST.UserMention
  | AST.ChannelMention
  | AST.InlineCode
  | AST.Italic
  | AST.Timestamp
)[] => {
  return tokens.filter(
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
};
