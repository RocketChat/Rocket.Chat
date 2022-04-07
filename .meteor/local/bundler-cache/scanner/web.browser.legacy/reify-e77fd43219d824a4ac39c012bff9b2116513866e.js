module.exports = function(hljs) {
  var SUBST = {
    className: 'subst',
    variants: [{
      begin: '\\$[A-Za-z0-9_]+'
    }],
  };

  var BRACED_SUBST = {
    className: 'subst',
    variants: [{
      begin: '\\${',
      end: '}'
    }, ],
    keywords: 'true false null this is new super',
  };

  var STRING = {
    className: 'string',
    variants: [{
        begin: 'r\'\'\'',
        end: '\'\'\''
      },
      {
        begin: 'r"""',
        end: '"""'
      },
      {
        begin: 'r\'',
        end: '\'',
        illegal: '\\n'
      },
      {
        begin: 'r"',
        end: '"',
        illegal: '\\n'
      },
      {
        begin: '\'\'\'',
        end: '\'\'\'',
        contains: [hljs.BACKSLASH_ESCAPE, SUBST, BRACED_SUBST]
      },
      {
        begin: '"""',
        end: '"""',
        contains: [hljs.BACKSLASH_ESCAPE, SUBST, BRACED_SUBST]
      },
      {
        begin: '\'',
        end: '\'',
        illegal: '\\n',
        contains: [hljs.BACKSLASH_ESCAPE, SUBST, BRACED_SUBST]
      },
      {
        begin: '"',
        end: '"',
        illegal: '\\n',
        contains: [hljs.BACKSLASH_ESCAPE, SUBST, BRACED_SUBST]
      }
    ]
  };
  BRACED_SUBST.contains = [
    hljs.C_NUMBER_MODE, STRING
  ];

  var KEYWORDS = {
    keyword: 'abstract as assert async await break case catch class const continue covariant default deferred do ' +
      'dynamic else enum export extends extension external factory false final finally for Function get hide if ' +
      'implements import in inferface is library mixin new null on operator part rethrow return set show static ' +
      'super switch sync this throw true try typedef var void while with yield',
    built_in:
      // dart:core
      'Comparable DateTime Duration Function Iterable Iterator List Map Match Null Object Pattern RegExp Set ' +
      'Stopwatch String StringBuffer StringSink Symbol Type Uri bool double dynamic int num print ' +
      // dart:html
      'Element ElementList document querySelector querySelectorAll window'
  };

  return {
    keywords: KEYWORDS,
    contains: [
      STRING,
      hljs.COMMENT(
        '/\\*\\*',
        '\\*/', {
          subLanguage: 'markdown'
        }
      ),
      hljs.COMMENT(
        '///+\\s*',
        '$', {
          contains: [{
            subLanguage: 'markdown',
            begin: '.',
            end: '$',
          }]
        }
      ),
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: 'class',
        beginKeywords: 'class interface',
        end: '{',
        excludeEnd: true,
        contains: [{
            beginKeywords: 'extends implements'
          },
          hljs.UNDERSCORE_TITLE_MODE
        ]
      },
      hljs.C_NUMBER_MODE,
      {
        className: 'meta',
        begin: '@[A-Za-z]+'
      },
      {
        begin: '=>' // No markup, just a relevance booster
      }
    ]
  }
};