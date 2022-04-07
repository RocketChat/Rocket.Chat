module.exports = function(hljs){

  var TYPES =
    ["string", "char", "byte", "int", "long", "bool",  "decimal",  "single",
     "double", "DateTime", "xml", "array", "hashtable", "void"];

  // https://msdn.microsoft.com/en-us/library/ms714428(v=vs.85).aspx
  var VALID_VERBS =
    'Add|Clear|Close|Copy|Enter|Exit|Find|Format|Get|Hide|Join|Lock|' +
    'Move|New|Open|Optimize|Pop|Push|Redo|Remove|Rename|Reset|Resize|' +
    'Search|Select|Set|Show|Skip|Split|Step|Switch|Undo|Unlock|' +
    'Watch|Backup|Checkpoint|Compare|Compress|Convert|ConvertFrom|' +
    'ConvertTo|Dismount|Edit|Expand|Export|Group|Import|Initialize|' +
    'Limit|Merge|New|Out|Publish|Restore|Save|Sync|Unpublish|Update|' +
    'Approve|Assert|Complete|Confirm|Deny|Disable|Enable|Install|Invoke|Register|' +
    'Request|Restart|Resume|Start|Stop|Submit|Suspend|Uninstall|' +
    'Unregister|Wait|Debug|Measure|Ping|Repair|Resolve|Test|Trace|Connect|' +
    'Disconnect|Read|Receive|Send|Write|Block|Grant|Protect|Revoke|Unblock|' +
    'Unprotect|Use|ForEach|Sort|Tee|Where';

  var COMPARISON_OPERATORS =
    '-and|-as|-band|-bnot|-bor|-bxor|-casesensitive|-ccontains|-ceq|-cge|-cgt|' +
    '-cle|-clike|-clt|-cmatch|-cne|-cnotcontains|-cnotlike|-cnotmatch|-contains|' +
    '-creplace|-csplit|-eq|-exact|-f|-file|-ge|-gt|-icontains|-ieq|-ige|-igt|' +
    '-ile|-ilike|-ilt|-imatch|-in|-ine|-inotcontains|-inotlike|-inotmatch|' +
    '-ireplace|-is|-isnot|-isplit|-join|-le|-like|-lt|-match|-ne|-not|' +
    '-notcontains|-notin|-notlike|-notmatch|-or|-regex|-replace|-shl|-shr|' +
    '-split|-wildcard|-xor';

  var KEYWORDS = {
    keyword: 'if else foreach return do while until elseif begin for trap data dynamicparam ' +
    'end break throw param continue finally in switch exit filter try process catch ' +
    'hidden static parameter'
    // TODO: 'validate[A-Z]+' can't work in keywords
  };

  var TITLE_NAME_RE = /\w[\w\d]*((-)[\w\d]+)*/;

  var BACKTICK_ESCAPE = {
    begin: '`[\\s\\S]',
    relevance: 0
  };

  var VAR = {
    className: 'variable',
    variants: [
      { begin: /\$\B/ },
      { className: 'keyword', begin: /\$this/ },
      { begin: /\$[\w\d][\w\d_:]*/ }
    ]
  };

  var LITERAL = {
    className: 'literal',
    begin: /\$(null|true|false)\b/
  };

  var QUOTE_STRING = {
    className: "string",
    variants: [{ begin: /"/, end: /"/ }, { begin: /@"/, end: /^"@/ }],
    contains: [
      BACKTICK_ESCAPE,
      VAR,
      {
        className: 'variable',
        begin: /\$[A-z]/, end: /[^A-z]/
      }
    ]
  };

  var APOS_STRING = {
    className: 'string',
    variants: [
      { begin: /'/, end: /'/ },
      { begin: /@'/, end: /^'@/ }
    ]
  };

  var PS_HELPTAGS = {
    className: "doctag",
    variants: [
      /* no paramater help tags */
      {
        begin: /\.(synopsis|description|example|inputs|outputs|notes|link|component|role|functionality)/
      },
      /* one parameter help tags */
      { begin: /\.(parameter|forwardhelptargetname|forwardhelpcategory|remotehelprunspace|externalhelp)\s+\S+/ }
    ]
  };

  var PS_COMMENT = hljs.inherit(
    hljs.COMMENT(null, null),
    {
      variants: [
        /* single-line comment */
        { begin: /#/, end: /$/ },
        /* multi-line comment */
        { begin: /<#/, end: /#>/ }
      ],
      contains: [PS_HELPTAGS]
    }
  );

  var CMDLETS = {
    className: 'built_in',
    variants: [
      { begin: '('.concat(VALID_VERBS, ')+(-)[\\w\\d]+') }
    ]
  };

  var PS_CLASS = {
    className: 'class',
    beginKeywords: 'class enum', end: /\s*[{]/, excludeEnd: true,
    relevance: 0,
    contains: [hljs.TITLE_MODE]
  };

  var PS_FUNCTION = {
    className: 'function',
    begin: /function\s+/, end: /\s*\{|$/,
    excludeEnd: true,
    returnBegin: true,
    relevance: 0,
    contains: [
      { begin: "function", relevance: 0, className: "keyword" },
      { className: "title",
        begin: TITLE_NAME_RE, relevance:0 },
      { begin: /\(/, end: /\)/, className: "params",
        relevance: 0,
        contains: [VAR] }
      // CMDLETS
    ]
  };

  // Using statment, plus type, plus assembly name.
  var PS_USING = {
    begin: /using\s/, end: /$/,
    returnBegin: true,
    contains: [
      QUOTE_STRING,
      APOS_STRING,
      { className: 'keyword', begin: /(using|assembly|command|module|namespace|type)/ }
    ]
  };

  // Comperison operators & function named parameters.
  var PS_ARGUMENTS = {
    variants: [
      // PS literals are pretty verbose so it's a good idea to accent them a bit.
      { className: 'operator', begin: '('.concat(COMPARISON_OPERATORS, ')\\b') },
      { className: 'literal', begin: /(-)[\w\d]+/, relevance:0 }
    ]
  };

  var STATIC_MEMBER = {
    className: 'selector-tag',
    begin: /::\w+\b/, end: /$/,
    returnBegin: true,
    contains: [
      { className: 'attribute', begin: /\w+/, endsParent: true }
    ]
  };

  var HASH_SIGNS = {
    className: 'selector-tag',
    begin: /\@\B/,
    relevance: 0
  };

  var PS_NEW_OBJECT_TYPE = {
    className: 'built_in',
    begin: /New-Object\s+\w/, end: /$/,
    returnBegin: true,
    contains: [
      { begin: /New-Object\s+/, relevance: 0 },
      { className: 'meta', begin: /([\w\.])+/, endsParent: true }
    ]
  };

  // It's a very general rule so I'll narrow it a bit with some strict boundaries
  // to avoid any possible false-positive collisions!
  var PS_METHODS = {
    className: 'function',
    begin: /\[.*\]\s*[\w]+[ ]??\(/, end: /$/,
    returnBegin: true,
    relevance: 0,
    contains: [
      {
        className: 'keyword', begin: '('.concat(
        KEYWORDS.keyword.toString().replace(/\s/g, '|'
        ), ')\\b'),
        endsParent: true,
        relevance: 0
      },
      hljs.inherit(hljs.TITLE_MODE, { endsParent: true })
    ]
  };

  var GENTLEMANS_SET = [
    // STATIC_MEMBER,
    PS_METHODS,
    PS_COMMENT,
    BACKTICK_ESCAPE,
    hljs.NUMBER_MODE,
    QUOTE_STRING,
    APOS_STRING,
    // PS_NEW_OBJECT_TYPE,
    CMDLETS,
    VAR,
    LITERAL,
    HASH_SIGNS
  ];

  var PS_TYPE = {
    begin: /\[/, end: /\]/,
    excludeBegin: true,
    excludeEnd: true,
    relevance: 0,
    contains: [].concat(
      'self',
      GENTLEMANS_SET,
      { begin: "(" + TYPES.join("|") + ")", className: "built_in", relevance:0 },
      { className: 'type', begin: /[\.\w\d]+/, relevance: 0 }
    )
  };

  PS_METHODS.contains.unshift(PS_TYPE)

  return {
    aliases: ["ps", "ps1"],
    lexemes: /-?[A-z\.\-]+/,
    case_insensitive: true,
    keywords: KEYWORDS,
    contains: GENTLEMANS_SET.concat(
      PS_CLASS,
      PS_FUNCTION,
      PS_USING,
      PS_ARGUMENTS,
      PS_TYPE
    )
  };
};