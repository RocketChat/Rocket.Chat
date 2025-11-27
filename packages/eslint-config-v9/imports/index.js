import importPlugin from 'eslint-plugin-import';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		plugins: {
			import: importPlugin,
		},
		languageOptions: {
			ecmaVersion: 6,
			sourceType: 'module',
		},
		settings: {
			'import/resolver': {
				node: {
					extensions: ['.mjs', '.js', '.json'],
				},
			},
			'import/extensions': ['.js', '.mjs', '.jsx'],
			'import/core-modules': [],
			'import/ignore': ['node_modules', '\\.(coffee|scss|css|less|hbs|svg|json)$'],
		},
		rules: {
			// Static analysis:

			// ensure imports point to files/modules that can be resolved
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-unresolved.md
			'import/no-unresolved': [
				'error',
				{
					commonjs: true,
					caseSensitive: true,
					amd: true,
					ignore: ['^meteor/.+$'],
				},
			],

			// ensure named imports coupled with named exports
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/named.md#when-not-to-use-it
			'import/named': 'off',

			// ensure default import coupled with default export
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/default.md#when-not-to-use-it
			'import/default': 'off',

			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/namespace.md
			'import/namespace': 'off',

			// Helpful warnings:

			// disallow invalid exports, e.g. multiple defaults
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/export.md
			'import/export': 'error',

			// do not allow a default import name to match a named export
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-named-as-default.md
			'import/no-named-as-default': 'off',

			// warn on accessing default export property names that are also named exports
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-named-as-default-member.md
			'import/no-named-as-default-member': 'off',

			// Style guide:

			// disallow non-import statements appearing before import statements
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/first.md
			'import/first': 'error',

			// disallow duplicate imports
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-duplicates.md
			'import/no-duplicates': 'error',

			// ensure absolute imports are above relative imports and that unassigned imports are ignored
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/order.md
			// TODO: enforce a stricter convention in module import order?
			'import/order': [
				'error',
				{
					'newlines-between': 'always',
					'groups': ['builtin', ['external', 'internal'], ['parent', 'sibling', 'index']],
					'alphabetize': {
						order: 'asc',
					},
				},
			],

			// Require a newline after the last import/require in a group
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/newline-after-import.md
			'import/newline-after-import': 'error',

			// Forbid import of modules using absolute paths
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-absolute-path.md
			'import/no-absolute-path': 'error',

			// Forbid require() calls with expressions
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-dynamic-require.md
			'import/no-dynamic-require': 'error',

			// Forbid a module from importing itself
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-self-import.md
			'import/no-self-import': 'error',

			// Forbid cyclical dependencies between modules
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-cycle.md
			'import/no-cycle': 'off',

			// Ensures that there are no useless path segments
			// https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-useless-path-segments.md
			'import/no-useless-path-segments': 'error',
		},
	},
];

