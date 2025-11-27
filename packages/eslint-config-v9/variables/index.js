/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		rules: {
			// disallow deletion of variables
			'no-delete-var': 'error',

			// disallow use of undeclared variables unless mentioned in a /*global */ block
			'no-undef': 'error',

			// disallow declaration of variables that are not used in the code
			'no-unused-vars': [
				'error',
				{
					vars: 'all',
					args: 'after-used',
					ignoreRestSiblings: true,
				},
			],

			// disallow use of variables before they are defined
			'no-use-before-define': ['error', { functions: true, classes: true, variables: true }],
		},
	},
];

