/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		rules: {
			// enforces return statements in callbacks of array's methods
			// https://eslint.org/docs/rules/array-callback-return
			'array-callback-return': ['error', { allowImplicit: true }],

			// treat var statements as if they were block scoped
			'block-scoped-var': 'error',

			// specify the maximum cyclomatic complexity allowed in a program
			'complexity': ['warn', 31],

			// specify curly brace conventions for all control statements
			'curly': ['error', 'all'],

			// encourages use of dot notation whenever possible
			'dot-notation': ['error', { allowKeywords: true }],

			// enforces consistent newlines before or after dots
			// https://eslint.org/docs/rules/dot-location
			'dot-location': ['error', 'property'],

			// require the use of === and !==
			// https://eslint.org/docs/rules/eqeqeq
			'eqeqeq': ['error', 'allow-null'],

			// make sure for-in loops have an if statement
			'guard-for-in': 'error',

			// disallow use of arguments.caller or arguments.callee
			'no-caller': 'error',

			// disallow division operators explicitly at beginning of regular expression
			// https://eslint.org/docs/rules/no-div-regex
			'no-div-regex': 'off',

			// disallow else after a return in an if
			// https://eslint.org/docs/rules/no-else-return
			'no-else-return': ['error', { allowElseIf: false }],

			// disallow empty functions, except for standalone funcs/arrows
			// https://eslint.org/docs/rules/no-empty-function
			'no-empty-function': [
				'error',
				{
					allow: ['arrowFunctions', 'functions', 'methods'],
				},
			],

			// disallow empty destructuring patterns
			// https://eslint.org/docs/rules/no-empty-pattern
			'no-empty-pattern': 'error',

			// disallow use of eval()
			'no-eval': 'error',

			// disallow adding to native types
			'no-extend-native': 'error',

			// disallow unnecessary function binding
			'no-extra-bind': 'error',

			// disallow Unnecessary Labels
			// https://eslint.org/docs/rules/no-extra-label
			'no-extra-label': 'error',

			// disallow fallthrough of case statements
			'no-fallthrough': 'error',

			// disallow the use of leading or trailing decimal points in numeric literals
			'no-floating-decimal': 'error',

			// disallow use of eval()-like methods
			'no-implied-eval': 'error',

			// disallow this keywords outside of classes or class-like objects
			'no-invalid-this': 'off',

			// disallow usage of __iterator__ property
			'no-iterator': 'error',

			// disallow unnecessary nested blocks
			'no-lone-blocks': 'error',

			// disallow creation of functions within loops
			'no-loop-func': 'error',

			// disallow use of multiple spaces
			'no-multi-spaces': 'error',

			// disallow use of multiline strings
			'no-multi-str': 'error',

			// disallows creating new instances of String, Number, and Boolean
			'no-new-wrappers': 'error',

			// disallow use of (old style) octal literals
			'no-octal': 'error',

			// disallow usage of __proto__ property
			'no-proto': 'error',

			// disallow declaring the same variable more then once
			'no-redeclare': 'error',

			// disallow certain object properties
			// https://eslint.org/docs/rules/no-restricted-properties
			'no-restricted-properties': [
				'error',
				{
					object: 'describe',
					property: 'only',
				},
				{
					object: 'it',
					property: 'only',
				},
				{
					object: 'context',
					property: 'only',
				},
			],

			// disallow use of assignment in return statement
			'no-return-assign': ['error', 'always'],

			// disallow redundant `return await`
			'no-return-await': 'error',

			// disallow comparisons where both sides are exactly the same
			'no-self-compare': 'error',

			// disallow use of comma operator
			'no-sequences': 'error',

			// restrict what can be thrown as an exception
			'no-throw-literal': 'error',

			// disallow unused labels
			// https://eslint.org/docs/rules/no-unused-labels
			'no-unused-labels': 'error',

			// disallow unnecessary .call() and .apply()
			'no-useless-call': 'off',

			// disallow useless string concatenation
			// https://eslint.org/docs/rules/no-useless-concat
			'no-useless-concat': 'error',

			// disallow redundant return; keywords
			// https://eslint.org/docs/rules/no-useless-return
			'no-useless-return': 'error',

			// disallow use of void operator
			// https://eslint.org/docs/rules/no-void
			'no-void': 'off',

			// require immediate function invocation to be wrapped in parentheses
			// https://eslint.org/docs/rules/wrap-iife.html
			'wrap-iife': ['error', 'outside', { functionPrototypeMethods: false }],

			// require or disallow Yoda conditions
			'yoda': 'error',
		},
	},
];
