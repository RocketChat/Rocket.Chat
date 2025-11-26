/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		rules: {
			// enforce spacing inside array brackets
			'array-bracket-spacing': ['error', 'never'],

			// enforce spacing inside single-line blocks
			// https://eslint.org/docs/rules/block-spacing
			'block-spacing': 'error',

			// enforce one true brace style
			'brace-style': ['error', '1tbs', { allowSingleLine: true }],

			// require trailing commas in multiline object literals
			'comma-dangle': ['error', 'always-multiline'],

			// enforce spacing before and after comma
			'comma-spacing': 'error',

			// enforce one true comma style
			'comma-style': 'error',

			// disallow padding inside computed properties
			'computed-property-spacing': ['error', 'never'],

			// enforce newline at the end of file, with no multiple empty lines
			'eol-last': ['error', 'always'],

			// enforce spacing between functions and their invocations
			// https://eslint.org/docs/rules/func-call-spacing
			'func-call-spacing': ['error', 'never'],

			// this option sets a specific tab width for your code
			// https://eslint.org/docs/rules/indent
			indent: ['error', 'tab', { SwitchCase: 1 }],

			// enforces spacing between keys and values in object literal properties
			'key-spacing': ['error', { beforeColon: false, afterColon: true }],

			// require a space before & after certain keywords
			'keyword-spacing': 'error',

			// disallow mixed 'LF' and 'CRLF' as linebreaks
			// https://eslint.org/docs/rules/linebreak-style
			'linebreak-style': ['error', 'unix'],

			// require or disallow an empty line between class members
			// https://eslint.org/docs/rules/lines-between-class-members
			'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: false }],

			// require or disallow newlines around directives
			// https://eslint.org/docs/rules/lines-around-directive
			'lines-around-directive': [
				'error',
				{
					before: 'always',
					after: 'always',
				},
			],

			// specify the maximum depth that blocks can be nested
			'max-depth': ['off', 4],

			// require a capital letter for constructors
			'new-cap': [
				'error',
				{
					capIsNewExceptions: [
						'Match.Optional',
						'Match.Maybe',
						'Match.OneOf',
						'Match.Where',
						'Match.ObjectIncluding',
						'Push.Configure',
						'SHA256',
					],
				},
			],

			// disallow the omission of parentheses when invoking a constructor with no arguments
			// https://eslint.org/docs/rules/new-parens
			'new-parens': 'error',

			// disallow use of the Array constructor
			'no-array-constructor': 'error',

			// disallow if as the only statement in an else block
			// https://eslint.org/docs/rules/no-lonely-if
			'no-lonely-if': 'error',

			// disallow un-paren'd mixes of different operators
			// https://eslint.org/docs/rules/no-mixed-operators
			'no-mixed-operators': [
				'error',
				{
					// the list of arthmetic groups disallows mixing `%` and `**`
					// with other arithmetic operators.
					groups: [
						['%', '**'],
						['%', '+'],
						['%', '-'],
						['%', '*'],
						['%', '/'],
						['**', '+'],
						['**', '-'],
						['**', '*'],
						['**', '/'],
						['&', '|', '^', '~', '<<', '>>', '>>>'],
						['==', '!=', '===', '!==', '>', '>=', '<', '<='],
						['&&', '||'],
						['in', 'instanceof'],
					],
					allowSamePrecedence: false,
				},
			],

			// disallow mixed spaces and tabs for indentation
			'no-mixed-spaces-and-tabs': 'error',

			// disallow use of chained assignment expressions
			// https://eslint.org/docs/rules/no-multi-assign
			'no-multi-assign': ['error'],

			// disallow multiple empty lines and only one newline at the end
			'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],

			// disallow nested ternary expressions
			'no-nested-ternary': 'error',

			// disallow space between function identifier and application
			'no-spaced-func': 'error',

			// disallow trailing whitespace at the end of lines
			'no-trailing-spaces': [
				'error',
				{
					skipBlankLines: false,
					ignoreComments: false,
				},
			],

			// disallow the use of Boolean literals in conditional expressions
			// also, prefer `a || b` over `a ? a : b`
			// https://eslint.org/docs/rules/no-unneeded-ternary
			'no-unneeded-ternary': ['error', { defaultAssignment: false }],

			// disallow whitespace before properties
			// https://eslint.org/docs/rules/no-whitespace-before-property
			'no-whitespace-before-property': 'error',

			// require padding inside curly braces
			'object-curly-spacing': ['error', 'always'],

			// enforce "same line" or "multiple line" on object properties.
			// https://eslint.org/docs/rules/object-property-newline
			'object-property-newline': [
				'error',
				{
					allowAllPropertiesOnSameLine: true,
				},
			],

			// allow just one var statement per function
			'one-var': ['error', 'never'],

			// require assignment operator shorthand where possible or prohibit it entirely
			// https://eslint.org/docs/rules/operator-assignment
			'operator-assignment': ['error', 'always'],

			// Requires operator at the beginning of the line in multiline statements
			// https://eslint.org/docs/rules/operator-linebreak
			'operator-linebreak': ['error', 'before', { overrides: { '=': 'none' } }],

			// disallow padding within blocks
			'padded-blocks': ['error', { blocks: 'never', classes: 'never', switches: 'never' }],

			// Prefer use of an object spread over Object.assign
			// https://eslint.org/docs/rules/prefer-object-spread
			// TODO: semver-major (eslint 5): enable
			'prefer-object-spread': 'off',

			// require quotes around object literal property names
			// https://eslint.org/docs/rules/quote-props.html
			'quote-props': ['error', 'as-needed', { keywords: false, unnecessary: true, numbers: false }],

			// specify whether double or single quotes should be used
			quotes: ['error', 'single', { avoidEscape: true }],

			// require or disallow use of semicolons instead of ASI
			semi: ['error', 'always'],

			// enforce spacing before and after semicolons
			'semi-spacing': ['error', { before: false, after: true }],

			// Enforce location of semicolons
			// https://eslint.org/docs/rules/semi-style
			'semi-style': ['error', 'last'],

			// require or disallow space before blocks
			'space-before-blocks': ['error', 'always'],

			// require or disallow space before function opening parenthesis
			// https://eslint.org/docs/rules/space-before-function-paren
			'space-before-function-paren': ['error', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],

			// require or disallow spaces inside parentheses
			'space-in-parens': ['error', 'never'],

			// require spaces around operators
			'space-infix-ops': 'error',

			// require or disallow a space immediately following the // or /* in a comment
			// https://eslint.org/docs/rules/spaced-comment
			'spaced-comment': 'error',

			// Enforce spacing around colons of switch statements
			// https://eslint.org/docs/rules/switch-colon-spacing
			'switch-colon-spacing': ['error', { after: true, before: false }],
		},
	},
];

