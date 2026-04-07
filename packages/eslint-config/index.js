import { defineConfig } from 'eslint/config';
import antiTrojanSourcePlugin from 'eslint-plugin-anti-trojan-source';
import importPlugin from 'eslint-plugin-import';
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended';
import storybookPlugin from 'eslint-plugin-storybook';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
	{
		name: 'rocket.chat/linter',
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	},
	{
		name: 'rocket.chat/ignored',
		ignores: ['**/dist', '**/coverage', '**/storybook-static'],
	},
	// TypeScript recommended (type-checked) — NOT covered by oxlint
	tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},
	// Import plugin — only rules NOT covered by oxlint
	importPlugin.flatConfigs.recommended,
	importPlugin.flatConfigs.typescript,
	// Testing files config — testing-library NOT covered by oxlint
	{
		files: ['**/*.@(spec|test).@(ts|tsx|js|jsx|mjs|cjs)'],
		...testingLibraryPlugin.configs['flat/react'],
		plugins: {
			...testingLibraryPlugin.configs['flat/react'].plugins,
		},
		rules: {
			...testingLibraryPlugin.configs['flat/react'].rules,
			'testing-library/no-await-sync-events': 'warn',
			'testing-library/no-container': 'warn',
			'testing-library/no-manual-cleanup': 'warn',
			'testing-library/no-node-access': 'warn',
			'testing-library/no-render-in-lifecycle': 'warn',
			'testing-library/prefer-explicit-assert': 'warn',
			'testing-library/prefer-find-by': 'warn',
			'testing-library/prefer-screen-queries': 'warn',
			'testing-library/prefer-user-event': 'warn',
			'testing-library/render-result-naming-convention': 'warn',
		},
	},
	// Storybook — NOT covered by oxlint
	...storybookPlugin.configs['flat/recommended'],
	// Anti-trojan source — NOT covered by oxlint
	{
		name: 'rocket.chat/anti-trojan',
		plugins: {
			'anti-trojan-source': antiTrojanSourcePlugin,
		},
		rules: {
			'anti-trojan-source/no-bidi': 'error',
		},
	},
	// Prettier — NOT covered by oxlint
	prettierPluginRecommended,
	{
		name: 'rocket.chat/ecmascript',
		languageOptions: {
			ecmaVersion: 2024,
			sourceType: 'module',
		},
	},
	{
		name: 'rocket.chat/disable-typescript-rules-for-js',
		files: ['**/*.@(js|jsx|mjs|cjs)'],
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-array-constructor': 'off',
			'@typescript-eslint/no-duplicate-enum-values': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-extra-non-null-assertion': 'off',
			'@typescript-eslint/no-misused-new': 'off',
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-this-alias': 'off',
			'@typescript-eslint/no-unnecessary-type-constraint': 'off',
			'@typescript-eslint/no-unsafe-declaration-merging': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-wrapper-object-types': 'off',
			'@typescript-eslint/prefer-as-const': 'off',
			'@typescript-eslint/prefer-namespace-keyword': 'off',
			'@typescript-eslint/triple-slash-reference': 'off',
		},
	},
	{
		name: 'rocket.chat/disable-type-checked-rules-for-js',
		files: ['**/*.@(js|jsx|mjs|cjs)'],
		...tseslint.configs.disableTypeChecked,
	},
	// Rules NOT covered by oxlint — keep in ESLint
	{
		name: 'rocket.chat/best-practices-eslint-only',
		rules: {
			'complexity': ['warn', 31],
			'dot-notation': ['error', { allowKeywords: true }],
			'no-div-regex': 'off',
			'no-else-return': ['error', { allowElseIf: false }],
			'no-empty-function': [
				'error',
				{
					allow: ['arrowFunctions', 'functions', 'methods'],
				},
			],
			'no-implied-eval': 'error',
			'no-invalid-this': 'off',
			'no-loop-func': 'error',
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
			'no-return-await': 'error',
			'no-void': 'off',
			'preserve-caught-error': 'warn',
		},
	},
	{
		name: 'rocket.chat/stylistic-eslint-only',
		rules: {
			'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: false }],
			'lines-around-directive': [
				'error',
				{
					before: 'always',
					after: 'always',
				},
			],
			'max-depth': ['off', 4],
			'new-cap': 'error',
			'one-var': ['error', 'never'],
			'operator-assignment': ['error', 'always'],
			'prefer-object-spread': 'off',
			'object-shorthand': 'error',
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
		},
	},
	{
		name: 'rocket.chat/variables-eslint-only',
		rules: {
			'no-use-before-define': ['error', { functions: true, classes: true, variables: true }],
			'no-duplicate-imports': 'off',
		},
	},
	{
		name: 'rocket.chat/import-eslint-only',
		settings: {
			'import/resolver': {
				node: true,
				typescript: true,
			},
		},
		rules: {
			// Rules NOT covered by oxlint — keep in ESLint
			'import/no-unresolved': [
				'error',
				{
					commonjs: true,
					caseSensitive: true,
				},
			],
			'import/named': 'off',
			'import/default': 'off',
			'import/namespace': 'off',
			'import/no-named-as-default': 'off',
			'import/no-named-as-default-member': 'off',
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
			'import/newline-after-import': 'error',
			'import/no-dynamic-require': 'error',
			'import/no-useless-path-segments': 'error',
			'import/no-cycle': 'off',
		},
	},
	// TODO: disable, as they are not available in all environments
	{
		name: 'rocket.chat/node-globals',
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	// ── TypeScript rules (NOT covered by oxlint) ──
	{
		files: ['**/*.@(ts|tsx|cts|mts)'],
		rules: {
			'@typescript-eslint/no-empty-object-type': 'warn',
			'@typescript-eslint/no-unsafe-function-type': 'warn',
			'@typescript-eslint/no-wrapper-object-types': 'warn',
			'@typescript-eslint/no-restricted-types': [
				'warn',
				{
					types: {
						'FC': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'React.FC': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'VFC': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'React.VFC': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'FunctionComponent': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'React.FunctionComponent': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
					},
				},
			],
			'@typescript-eslint/ban-ts-comment': 'warn',
			'@typescript-eslint/consistent-type-exports': 'error',
			'@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
			'@typescript-eslint/naming-convention': [
				'error',
				{ selector: 'variableLike', format: ['camelCase'], leadingUnderscore: 'allow' },
				{
					selector: ['variable'],
					format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: 'function',
					format: ['camelCase', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: 'parameter',
					format: null,
					filter: {
						regex: '^Story$',
						match: true,
					},
				},
				{
					selector: 'parameter',
					format: ['PascalCase'],
					filter: {
						regex: 'Component$',
						match: true,
					},
				},
				{
					selector: 'parameter',
					format: ['camelCase'],
					modifiers: ['unused'],
					leadingUnderscore: 'require',
				},
				{
					selector: 'interface',
					format: ['PascalCase'],
					custom: {
						regex: '^I[A-Z]',
						match: true,
					},
				},
			],
			'@typescript-eslint/await-thenable': 'warn',
			'@typescript-eslint/no-array-delete': 'warn',
			'@typescript-eslint/no-base-to-string': 'warn',
			'@typescript-eslint/no-dupe-class-members': 'error',
			'@typescript-eslint/no-duplicate-enum-values': 'warn',
			'@typescript-eslint/no-duplicate-type-constituents': 'warn',
			'@typescript-eslint/no-empty-function': 'error',
			'@typescript-eslint/no-empty-interface': 'warn',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-for-in-array': 'warn',
			'@typescript-eslint/no-implied-eval': 'warn',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/no-redeclare': 'error',
			'@typescript-eslint/no-redundant-type-constituents': 'off',
			'@typescript-eslint/no-require-imports': 'warn',
			'@typescript-eslint/no-this-alias': 'error',
			'@typescript-eslint/no-unnecessary-type-assertion': 'warn',
			'@typescript-eslint/no-unused-expressions': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					ignoreRestSiblings: true,
					caughtErrors: 'none',
				},
			],
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'warn',
			'@typescript-eslint/no-unsafe-declaration-merging': 'warn',
			'@typescript-eslint/no-unsafe-enum-comparison': 'warn',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'warn',
			'@typescript-eslint/only-throw-error': 'warn',
			'@typescript-eslint/prefer-promise-reject-errors': 'warn',
			'@typescript-eslint/prefer-optional-chain': 'warn',
			'@typescript-eslint/require-await': 'off',
			'@typescript-eslint/restrict-plus-operands': 'warn',
			'@typescript-eslint/restrict-template-expressions': 'warn',
			'@typescript-eslint/unbound-method': 'off',
			'no-dupe-class-members': 'off',
			'no-empty-function': 'off',
			'no-redeclare': 'off',
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'no-use-before-define': 'off',
			'no-useless-constructor': 'off',
		},
	},
	{
		files: [
			'**/*.d.ts',
			'**/__tests__/**',
			'**/*.spec.ts',
			'**/*.spec.tsx',
			'**/*.test.ts',
			'**/*.test.tsx',
			'**/tests/**',
			'**/.storybook/**',
			'**/jest.config.ts',
			'**/jest.config.js',
			'**/jest.config.*.ts',
			'**/jest.config.*.js',
			'**/webpack.config.ts',
			'**/webpack.config.js',
			'**/vite.config.ts',
			'**/vite.config.js',
			'**/rollup.config.ts',
			'**/rollup.config.js',
		],
		...tseslint.configs.disableTypeChecked,
	},
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
		ignores: [
			'**/*.d.ts',
			'**/__tests__/**',
			'**/*.spec.ts',
			'**/*.spec.tsx',
			'**/*.test.ts',
			'**/*.test.tsx',
			'**/tests/**',
			'**/.storybook/**',
			'**/jest.config.ts',
			'**/jest.config.js',
			'**/jest.config.*.ts',
			'**/jest.config.*.js',
			'**/webpack.config.ts',
			'**/webpack.config.js',
			'**/vite.config.ts',
			'**/vite.config.js',
			'**/rollup.config.ts',
			'**/rollup.config.js',
		],
		rules: {
			'@typescript-eslint/no-misused-promises': [
				'error',
				{
					checksVoidReturn: {
						arguments: false,
						attributes: false,
						inheritedMethods: false,
					},
				},
			],
			'@typescript-eslint/no-floating-promises': 'error',
		},
	},
	{
		files: ['**/*.d.ts'],
		rules: {
			'@typescript-eslint/naming-convention': 'off',
		},
	},
);
