module.exports = function(hljs) {
  var KEYWORDS = {
    keyword:
      'actor addressof and as be break class compile_error compile_intrinsic ' +
      'consume continue delegate digestof do else elseif embed end error ' +
      'for fun if ifdef in interface is isnt lambda let match new not object ' +
      'or primitive recover repeat return struct then trait try type until ' +
      'use var where while with xor',
    meta:
      'iso val tag trn box ref',
    literal:
      'this false true'
  };

  var TRIPLE_QUOTE_STRING_MODE = {
    className: 'string',
    begin: '"""', end: '"""',
    relevance: 10
  };

  var QUOTE_STRING_MODE = {
    className: 'string',
    begin: '"', end: '"',
    contains: [hljs.BACKSLASH_ESCAPE]
  };

  var SINGLE_QUOTE_CHAR_MODE = {
    className: 'string',
    begin: '\'', end: '\'',
    contains: [hljs.BACKSLASH_ESCAPE],
    relevance: 0
  };

  var TYPE_NAME = {
    className: 'type',
    begin: '\\b_?[A-Z][\\w]*',
    relevance: 0
  };

  var PRIMED_NAME = {
    begin: hljs.IDENT_RE + '\'', relevance: 0
  };

  var NUMBER_MODE = {
    className: 'number',
    begin: '(-?)(\\b0[xX][a-fA-F0-9]+|\\b0[bB][01]+|(\\b\\d+(_\\d+)?(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)',
    relevance: 0
  };

  /**
   * The `FUNCTION` and `CLASS` modes were intentionally removed to simplify
   * highlighting and fix cases like
   * ```
   * interface Iterator[A: A]
   *   fun has_next(): Bool
   *   fun next(): A?
   * ```
   * where it is valid to have a function head without a body
   */

  return {
    keywords: KEYWORDS,
    contains: [
      TYPE_NAME,
      TRIPLE_QUOTE_STRING_MODE,
      QUOTE_STRING_MODE,
      SINGLE_QUOTE_CHAR_MODE,
      PRIMED_NAME,
      NUMBER_MODE,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE
    ]
  };
};