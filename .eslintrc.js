module.exports = {
	'env': {
		'browser': true,
		'commonjs': true,
		'es6': true,
		'node': true,
		'jquery': true
	},
	'rules': {
		// 'no-alert': 0,
		// 'no-array-constructor': 0,
		// 'no-bitwise': 0,
		// 'no-caller': 0,
		// 'no-catch-shadow': 0,
		// 'no-continue': 0,
		// 'no-div-regex': 0,
		// 'no-else-return': 0,
		// 'no-eq-null': 0,
		// 'no-extra-bind': 0,
		// 'no-extra-parens': 0,
		// 'no-floating-decimal': 0,
		// 'no-implied-eval': 0,
		// 'no-inline-comments': 0,
		// 'no-iterator': 0,
		// 'no-label-var': 0,
		// 'no-labels': 0,
		// 'no-lone-blocks': 0,
		// 'no-lonely-if': 0,
		// 'no-loop-func': 0,
		// 'no-mixed-requires': [0, false],
		// 'no-multi-spaces': 0,
		// 'no-multiple-empty-lines': [0, {'max': 2}],
		// 'no-native-reassign': 0,
		// 'no-nested-ternary': 0,
		// 'no-new': 0,
		// 'no-new-func': 0,
		// 'no-new-object': 0,
		// 'no-new-require': 0,
		// 'no-new-wrappers': 0,
		// 'no-octal-escape': 0,
		// 'no-param-reassign': 0,
		// 'no-path-concat': 0,
		// 'no-plusplus': 0,
		// 'no-process-env': 0,
		// 'no-process-exit': 0,
		// 'no-proto': 0,
		// 'no-restricted-modules': 0,
		// 'no-return-assign': 0,
		// 'no-script-url': 0,
		// 'no-self-compare': 0,
		// 'no-sequences': 0,
		// 'no-shadow': 0,
		// 'no-shadow-restricted-names': 0,
		// 'no-spaced-func': 0,
		// 'no-sync': 0,
		// 'no-ternary': 0,
		// 'no-trailing-spaces': 0,
		// 'no-this-before-super': 0,
		// 'no-throw-literal': 0,
		// 'no-undef-init': 0,
		// 'no-undefined': 0,
		// 'no-unexpected-multiline': 0,
		// 'no-underscore-dangle': 0,
		// 'no-unneeded-ternary': 0,
		// 'no-unused-expressions': 0,
		// 'no-useless-call': 0,
		// 'no-void': 0,
		// 'no-var': 0,
		// 'no-warning-comments': [0, { 'terms': ['todo', 'fixme', 'xxx'], 'location': 'start' }],
		// 'no-with': 0,
		// 'no-console': 0, // disallow use of console
		'no-eval': 2,                              // disallow use of eval()
		'no-extend-native': 2,                     // disallow adding to native types
		'no-multi-str': 2,                         // disallow use of multiline strings
		'no-use-before-define': 2,                 // disallow use of variables before they are defined
		'no-const-assign': 2,                      // disallow modifying variables that are declared using const
		'no-cond-assign': 2,                       // disallow assignment in conditional expressions
		'no-constant-condition': 2,                // disallow use of constant expressions in conditions
		'no-control-regex': 2,                     // disallow control characters in regular expressions
		'no-debugger': 2,                          // disallow use of debugger
		'no-delete-var': 2,                        // disallow deletion of variables
		'no-dupe-keys': 2,                         // disallow duplicate keys when creating object literals
		'no-dupe-args': 2,                         // disallow duplicate arguments in functions
		'no-duplicate-case': 2,                    // disallow a duplicate case label
		'no-empty': 2,                             // disallow empty block statements
		'no-empty-character-class': 2,             // disallow the use of empty character classes in regular expressions
		'no-ex-assign': 2,                         // disallow assigning to the exception in a catch block
		'no-extra-boolean-cast': 2,                // disallow double-negation boolean casts in a boolean context
		'no-extra-semi': 2,                        // disallow unnecessary semicolons
		'no-fallthrough': 2,                       // disallow fallthrough of case statements
		'no-func-assign': 2,                       // disallow overwriting functions written as function declarations
		'no-inner-declarations': [2, 'functions'], // disallow function or variable declarations in nested blocks
		'no-invalid-regexp': 2,                    // disallow invalid regular expression strings in the RegExp constructor
		'no-irregular-whitespace': 2,              // disallow irregular whitespace outside of strings and comments
		'no-mixed-spaces-and-tabs': [2, false],    // disallow mixed spaces and tabs for indentation
		'no-sparse-arrays': 2,                     // disallow sparse arrays
		'no-negated-in-lhs': 2,                    // disallow negation of the left operand of an in expression
		'no-obj-calls': 2,                         // disallow the use of object properties of the global object (Math and JSON) as functions
		'no-octal': 2,                             // disallow use of octal literals
		'no-redeclare': 2,                         // disallow declaring the same variable more than once
		'no-regex-spaces': 2,                      // disallow multiple spaces in a regular expression literal
		'no-undef': 2,                             // disallow use of undeclared variables unless mentioned in a /*global */ block
		'no-unreachable': 2,                       // disallow unreachable statements after a return, throw, continue, or break statement
		'no-unused-vars': [2, {                    // disallow declaration of variables that are not used in the code
			'vars': 'all',
			'args': 'after-used'
		}],

		// 'array-bracket-spacing': [0, 'never'],
		// 'arrow-parens': 0,
		// 'arrow-spacing': 0,
		// 'accessor-pairs': 0,
		// 'brace-style': [0, '1tbs'],
		// 'callback-return': 0,
		// 'camelcase': 0,
		// 'comma-spacing': 0,
		// 'comma-style': 0,
		// 'complexity': [0, 11],
		// 'computed-property-spacing': [0, 'never'],
		// 'consistent-return': 0,
		// 'consistent-this': [0, 'that'],
		// 'constructor-super': 0,
		// 'default-case': 0,
		// 'dot-location': 0,
		// 'dot-notation': [0, { 'allowKeywords': true }],
		// 'eol-last': 0,
		// 'func-names': 0,
		// 'func-style': [0, 'declaration'],
		// 'generator-star-spacing': 0,
		// 'handle-callback-err': 0,
		// 'indent': 0,
		// 'init-declarations': 0,
		// 'key-spacing': [0, { 'beforeColon': false, 'afterColon': true }],
		// 'lines-around-comment': 0,
		// 'max-depth': [0, 4],
		// 'max-nested-callbacks': [0, 2],
		// 'max-params': [0, 3],
		// 'max-statements': [0, 10],
		// 'new-parens': 0,
		// 'newline-after-var': 0,
		// 'object-curly-spacing': [0, 'never'],
		// 'object-shorthand': 0,
		// 'one-var': 0,
		// 'operator-assignment': [0, 'always'],
		// 'operator-linebreak': 0,
		// 'padded-blocks': 0,
		// 'prefer-const': 0,
		// 'prefer-spread': 0,
		// 'quote-props': 0,
		// 'radix': 0,
		// 'require-yield': 0,
		// 'semi-spacing': [0, {'before': false, 'after': true}],
		// 'sort-vars': 0,
		// 'space-before-blocks': [0, 'always'],
		// 'space-before-function-paren': [0, 'always'],
		// 'space-in-parens': [0, 'never'],
		// 'space-infix-ops': 0,
		// 'space-unary-ops': [0, { 'words': true, 'nonwords': false }],
		// 'spaced-comment': 0,
		// 'strict': 0,
		// 'valid-jsdoc': 0,
		// 'vars-on-top': 0,
		// 'wrap-regex': 0,
		// 'yoda': [0, 'never'],
		// 'max-len': [0, 80, 4],
		// 'indent': [2, 'tab', {'SwitchCase': 1}], //specify tab or space width for your code
		// 'comma-dangle': [2, 'never'],   // disallow or enforce trailing commas
		'guard-for-in': 2,
		'wrap-iife': 2,                 // wrap-iife
		'block-scoped-var': 2,          // treat var statements as if they were block scoped
		'curly': [2, 'all'],            // specify curly brace conventions for all control statements
		'eqeqeq': [2, 'allow-null'],    // require use of === and !==
		'new-cap': 2,                   // require a capital letter for constructors
		'use-isnan': 2,                 // disallow comparisons with the value NaN
		'valid-typeof': 2,              // ensure results of typeof are compared against a valid string
		'linebreak-style': [2, 'unix'], // enforce linebreak style
		'quotes': [2, 'single'],        // specify whether backticks, double or single quotes should be used
		'semi': [2, 'always']           // require or disallow use of semicolons instead of ASI
	},
	'globals': {
		'_'                           : false,
		'__meteor_runtime_config__'   : false,
		'AccountBox'                  : false,
		'Accounts'                    : false,
		'AgentUsers'                  : false,
		'Assets'                      : false,
		'Blaze'                       : false,
		'BlazeLayout'                 : false,
		'ChatMessage'                 : false,
		'ChatMessages'                : false,
		'ChatRoom'                    : false,
		'ChatSubscription'            : false,
		'check'                       : false,
		'Department'                  : false,
		'EJSON'                       : false,
		'Email'                       : false,
		'FlowRouter'                  : false,
		'getNextAgent'                : false,
		'LivechatCustomField'         : false,
		'LivechatDepartment'          : false,
		'LivechatDepartmentAgents'    : false,
		'livechatManagerRoutes'       : true,
		'LivechatPageVisited'         : false,
		'LivechatTrigger'             : false,
		'Logger'                      : false,
		'Match'                       : false,
		'Meteor'                      : false,
		'moment'                      : false,
		'Mongo'                       : false,
		'Npm'                         : false,
		'Package'                     : false,
		'parentCall'                  : false,
		'Promise'                     : false,      // Avoid 'redefinition of Promise' warning
		'Random'                      : false,
		'ReactiveVar'                 : false,
		'RocketChat'                  : true,
		'RocketChatFile'              : false,
		'RocketChatFileAvatarInstance': false,
		'RoomHistoryManager'          : false,
		's'                           : false,
		'ServiceConfiguration'        : false,
		'Session'                     : false,
		'Settings'                    : false,
		'SHA256'                      : false,
		'SideNav'                     : false,
		'swal'                        : false,
		't'                           : false,
		'TAPi18n'                     : false,
		'Template'                    : false,
		'TimeSync'                    : false,
		'toastr'                      : false,
		'Tracker'                     : false,
		'Trigger'                     : false,
		'Triggers'                    : false,
		'UAParser'                    : false,
		'visitor'                     : false,
		'WebApp'                      : false
	}
};
