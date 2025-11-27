/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		languageOptions: {
			ecmaVersion: 6,
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					generators: false,
					objectLiteralDuplicateProperties: false,
				},
			},
		},
		rules: {
			// enforces no braces where they can be omitted
			// https://eslint.org/docs/rules/arrow-body-style
			// TODO: enable requireReturnForObjectLiteral?
			'arrow-body-style': [
				'error',
				'as-needed',
				{
					requireReturnForObjectLiteral: false,
				},
			],

			// require parens in arrow function arguments
			// https://eslint.org/docs/rules/arrow-parens
			'arrow-parens': ['error', 'always'],

			// require space before/after arrow function's arrow
			// https://eslint.org/docs/rules/arrow-spacing
			'arrow-spacing': ['error', { before: true, after: true }],

			// disallow arrow functions where they could be confused with comparisons
			// https://eslint.org/docs/rules/no-confusing-arrow
			'no-confusing-arrow': [
				'error',
				{
					allowParens: true,
				},
			],

			// disallow modifying variables that are declared using const
			'no-const-assign': 'error',

			// disallow duplicate class members
			// https://eslint.org/docs/rules/no-dupe-class-members
			'no-dupe-class-members': 'error',

			// disallow importing from the same path more than once
			// https://eslint.org/docs/rules/no-duplicate-imports
			// replaced by https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-duplicates.md
			'no-duplicate-imports': 'off',

			// disallow to use this/super before super() calling in constructors.
			// https://eslint.org/docs/rules/no-this-before-super
			'no-this-before-super': 'error',

			// disallow useless computed property keys
			// https://eslint.org/docs/rules/no-useless-computed-key
			'no-useless-computed-key': 'error',

			// disallow unnecessary constructor
			// https://eslint.org/docs/rules/no-useless-constructor
			'no-useless-constructor': 'error',

			// disallow renaming import, export, and destructured assignments to the same name
			// https://eslint.org/docs/rules/no-useless-rename
			'no-useless-rename': [
				'error',
				{
					ignoreDestructuring: false,
					ignoreImport: false,
					ignoreExport: false,
				},
			],

			// require let or const instead of var
			'no-var': 'error',

			// require method and property shorthand syntax for object literals
			// https://eslint.org/docs/rules/object-shorthand
			'object-shorthand': 'error',

			// suggest using of const declaration for variables that are never modified after declared
			'prefer-const': [
				'error',
				{
					destructuring: 'any',
					ignoreReadBeforeAssign: true,
				},
			],

			// Prefer destructuring from arrays and objects
			// https://eslint.org/docs/rules/prefer-destructuring
			'prefer-destructuring': [
				'error',
				{
					VariableDeclarator: {
						array: false,
						object: true,
					},
					AssignmentExpression: {
						array: false,
						object: false,
					},
				},
				{
					enforceForRenamedProperties: false,
				},
			],

			// use rest parameters instead of arguments
			// https://eslint.org/docs/rules/prefer-rest-params
			'prefer-rest-params': 'error',

			// suggest using template literals instead of string concatenation
			// https://eslint.org/docs/rules/prefer-template
			'prefer-template': 'error',

			// enforce spacing between object rest-spread
			// https://eslint.org/docs/rules/rest-spread-spacing
			'rest-spread-spacing': ['error', 'never'],

			// enforce usage of spacing in template strings
			// https://eslint.org/docs/rules/template-curly-spacing
			'template-curly-spacing': ['error', 'always'],
		},
	},
];

