module.exports = function (hljs) {
  var BUILT_INS = {'builtin-name': 'each in with if else unless bindattr action collection debugger log outlet template unbound view yield lookup'};

  var IDENTIFIER_PLAIN_OR_QUOTED = {
    begin: /".*?"|'.*?'|\[.*?\]|\w+/
  };

  var EXPRESSION_OR_HELPER_CALL = hljs.inherit(IDENTIFIER_PLAIN_OR_QUOTED, {
    keywords: BUILT_INS,
    starts: {
      // helper params
      endsWithParent: true,
      relevance: 0,
      contains: [hljs.inherit(IDENTIFIER_PLAIN_OR_QUOTED, {relevance: 0})]
    }
  });

  var BLOCK_MUSTACHE_CONTENTS = hljs.inherit(EXPRESSION_OR_HELPER_CALL, {
    className: 'name'
  });

  var BASIC_MUSTACHE_CONTENTS = hljs.inherit(EXPRESSION_OR_HELPER_CALL, {
    // relevance 0 for backward compatibility concerning auto-detection
    relevance: 0
  });

  var ESCAPE_MUSTACHE_WITH_PRECEEDING_BACKSLASH = {begin: /\\\{\{/, skip: true};
  var PREVENT_ESCAPE_WITH_ANOTHER_PRECEEDING_BACKSLASH = {begin: /\\\\(?=\{\{)/, skip: true};

  return {
    aliases: ['hbs', 'html.hbs', 'html.handlebars'],
    case_insensitive: true,
    subLanguage: 'xml',
    contains: [
      ESCAPE_MUSTACHE_WITH_PRECEEDING_BACKSLASH,
      PREVENT_ESCAPE_WITH_ANOTHER_PRECEEDING_BACKSLASH,
      hljs.COMMENT(/\{\{!--/, /--\}\}/),
      hljs.COMMENT(/\{\{!/, /\}\}/),
      {
        // open raw block "{{{{raw}}}} content not evaluated {{{{/raw}}}}"
        className: 'template-tag',
        begin: /\{\{\{\{(?!\/)/, end: /\}\}\}\}/,
        contains: [BLOCK_MUSTACHE_CONTENTS],
        starts: {end: /\{\{\{\{\//, returnEnd: true, subLanguage: 'xml'}
      },
      {
        // close raw block
        className: 'template-tag',
        begin: /\{\{\{\{\//, end: /\}\}\}\}/,
        contains: [BLOCK_MUSTACHE_CONTENTS]
      },
      {
        // open block statement
        className: 'template-tag',
        begin: /\{\{[#\/]/, end: /\}\}/,
        contains: [BLOCK_MUSTACHE_CONTENTS],
      },
      {
        // template variable or helper-call that is NOT html-escaped
        className: 'template-variable',
        begin: /\{\{\{/, end: /\}\}\}/,
        keywords: BUILT_INS,
        contains: [BASIC_MUSTACHE_CONTENTS]
      },
      {
        // template variable or helper-call that is html-escaped
        className: 'template-variable',
        begin: /\{\{/, end: /\}\}/,
        keywords: BUILT_INS,
        contains: [BASIC_MUSTACHE_CONTENTS]
      }
    ]
  };
};