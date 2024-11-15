module.exports = function(hljs) {
  var ELIXIR_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_.]*(\\!|\\?)?';
  var ELIXIR_METHOD_RE = '[a-zA-Z_]\\w*[!?=]?|[-+~]\\@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?';
  var ELIXIR_KEYWORDS =
    'and false then defined module in return redo retry end for true self when ' +
    'next until do begin unless nil break not case cond alias while ensure or ' +
    'include use alias fn quote require import with|0';
  var SUBST = {
    className: 'subst',
    begin: '#\\{', end: '}',
    lexemes: ELIXIR_IDENT_RE,
    keywords: ELIXIR_KEYWORDS
  };

  var SIGIL_DELIMITERS = '[/|([{<"\']'
  var LOWERCASE_SIGIL = {
    className: 'string',
    begin: '~[a-z]' + '(?=' + SIGIL_DELIMITERS + ')',
    contains: [
      {
        endsParent:true,
        contains: [{
          contains: [hljs.BACKSLASH_ESCAPE, SUBST],
          variants: [
            { begin: /"/, end: /"/ },
            { begin: /'/, end: /'/ },
            { begin: /\//, end: /\// },
            { begin: /\|/, end: /\|/ },
            { begin: /\(/, end: /\)/ },
            { begin: /\[/, end: /\]/ },
            { begin: /\{/, end: /\}/ },
            { begin: /</, end: />/ }
          ]
        }]
      },
    ],
  };

  var UPCASE_SIGIL = {
    className: 'string',
    begin: '~[A-Z]' + '(?=' + SIGIL_DELIMITERS + ')',
    contains: [
      { begin: /"/, end: /"/ },
      { begin: /'/, end: /'/ },
      { begin: /\//, end: /\// },
      { begin: /\|/, end: /\|/ },
      { begin: /\(/, end: /\)/ },
      { begin: /\[/, end: /\]/ },
      { begin: /\{/, end: /\}/ },
      { begin: /\</, end: /\>/ }
    ]
  };

  var STRING = {
    className: 'string',
    contains: [hljs.BACKSLASH_ESCAPE, SUBST],
    variants: [
      {
        begin: /"""/, end: /"""/,
      },
      {
        begin: /'''/, end: /'''/,
      },
      {
        begin: /~S"""/, end: /"""/,
        contains: []
      },
      {
        begin: /~S"/, end: /"/,
        contains: []
      },
      {
        begin: /~S'''/, end: /'''/,
        contains: []
      },
      {
        begin: /~S'/, end: /'/,
        contains: []
      },
      {
        begin: /'/, end: /'/
      },
      {
        begin: /"/, end: /"/
      },
    ]
  };
  var FUNCTION = {
    className: 'function',
    beginKeywords: 'def defp defmacro', end: /\B\b/, // the mode is ended by the title
    contains: [
      hljs.inherit(hljs.TITLE_MODE, {
        begin: ELIXIR_IDENT_RE,
        endsParent: true
      })
    ]
  };
  var CLASS = hljs.inherit(FUNCTION, {
    className: 'class',
    beginKeywords: 'defimpl defmodule defprotocol defrecord', end: /\bdo\b|$|;/
  });
  var ELIXIR_DEFAULT_CONTAINS = [
    STRING,
    UPCASE_SIGIL,
    LOWERCASE_SIGIL,
    hljs.HASH_COMMENT_MODE,
    CLASS,
    FUNCTION,
    {
      begin: '::'
    },
    {
      className: 'symbol',
      begin: ':(?![\\s:])',
      contains: [STRING, {begin: ELIXIR_METHOD_RE}],
      relevance: 0
    },
    {
      className: 'symbol',
      begin: ELIXIR_IDENT_RE + ':(?!:)',
      relevance: 0
    },
    {
      className: 'number',
      begin: '(\\b0o[0-7_]+)|(\\b0b[01_]+)|(\\b0x[0-9a-fA-F_]+)|(-?\\b[1-9][0-9_]*(.[0-9_]+([eE][-+]?[0-9]+)?)?)',
      relevance: 0
    },
    {
      className: 'variable',
      begin: '(\\$\\W)|((\\$|\\@\\@?)(\\w+))'
    },
    {
      begin: '->'
    },
    { // regexp container
      begin: '(' + hljs.RE_STARTERS_RE + ')\\s*',
      contains: [
        hljs.HASH_COMMENT_MODE,
        {
          className: 'regexp',
          illegal: '\\n',
          contains: [hljs.BACKSLASH_ESCAPE, SUBST],
          variants: [
            {
              begin: '/', end: '/[a-z]*'
            },
            {
              begin: '%r\\[', end: '\\][a-z]*'
            }
          ]
        }
      ],
      relevance: 0
    }
  ];
  SUBST.contains = ELIXIR_DEFAULT_CONTAINS;

  return {
    lexemes: ELIXIR_IDENT_RE,
    keywords: ELIXIR_KEYWORDS,
    contains: ELIXIR_DEFAULT_CONTAINS
  };
};