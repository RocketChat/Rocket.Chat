import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import antiTrojanSourcePlugin from 'eslint-plugin-anti-trojan-source';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
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
	eslint.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},
	importPlugin.flatConfigs.recommended,
	importPlugin.flatConfigs.typescript,
	jsxA11yPlugin.flatConfigs.recommended,
	{
		name: 'rocket.chat/jsx-a11y',
		rules: {
			'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
		},
	},
	reactPlugin.configs.flat.recommended,
	reactPlugin.configs.flat['jsx-runtime'],
	{
		name: 'rocket.chat/react',
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			'react/jsx-curly-brace-presence': 'error',
			'react/jsx-fragments': ['error', 'syntax'],
			'react/jsx-key': ['error', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true }],
			'react/jsx-no-target-blank': 'warn',
			'react/no-multi-comp': 'error',
			'react/no-unescaped-entities': 'warn',
			'react/prop-types': 'warn',
		},
	},
	reactHooksPlugin.configs.flat.recommended,
	{
		name: 'rocket.chat/react-hooks',
		rules: {
			// Core hooks rules
			'react-hooks/exhaustive-deps': 'error',

			// React Compiler rules (currently not in use)
			'react-hooks/component-hook-factories': 'off',
			'react-hooks/config': 'off',
			'react-hooks/error-boundaries': 'off',
			'react-hooks/gating': 'off',
			'react-hooks/globals': 'off',
			'react-hooks/immutability': 'off',
			'react-hooks/incompatible-library': 'off',
			'react-hooks/preserve-manual-memoization': 'off',
			'react-hooks/purity': 'off',
			'react-hooks/refs': 'off',
			'react-hooks/set-state-in-effect': 'off',
			'react-hooks/set-state-in-render': 'off',
			'react-hooks/static-components': 'off',
			'react-hooks/unsupported-syntax': 'off',
			'react-hooks/use-memo': 'off',
		},
	},
	{
		files: ['**/*.@(spec|test).@(ts|tsx|js|jsx|mjs|cjs)'],
		...jestPlugin.configs['flat/recommended'],
		...testingLibraryPlugin.configs['flat/react'],
		plugins: {
			...jestPlugin.configs['flat/recommended'].plugins,
			...testingLibraryPlugin.configs['flat/react'].plugins,
		},
		rules: {
			...jestPlugin.configs['flat/recommended'].rules,
			...testingLibraryPlugin.configs['flat/react'].rules,
			'jest/no-conditional-expect': 'warn',
			'jest/no-done-callback': 'warn',
			'jest/no-export': 'warn',
			'jest/no-identical-title': 'warn',
			'jest/no-standalone-expect': 'warn',
			'jest/no-test-prefixes': 'warn',
			'jest/valid-describe-callback': 'warn',
			'jest/valid-expect-in-promise': 'warn',
			'jest/valid-expect': 'warn',
			'jest/valid-title': 'warn',
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
	...storybookPlugin.configs['flat/recommended'],
	{
		name: 'rocket.chat/anti-trojan',
		plugins: {
			'anti-trojan-source': antiTrojanSourcePlugin,
		},
		rules: {
			'anti-trojan-source/no-bidi': 'error',
		},
	},
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
	{
		name: 'rocket.chat/best-practices',
		rules: {
			'array-callback-return': ['error', { allowImplicit: true }],
			'block-scoped-var': 'error',
			'complexity': ['warn', 31],
			'dot-notation': ['error', { allowKeywords: true }],
			'eqeqeq': ['error', 'allow-null'],
			'guard-for-in': 'error',
			'no-caller': 'error',
			'no-div-regex': 'off',
			'no-else-return': ['error', { allowElseIf: false }],
			'no-empty-function': [
				'error',
				{
					allow: ['arrowFunctions', 'functions', 'methods'],
				},
			],
			'no-eval': 'error',
			'no-extend-native': 'error',
			'no-extra-bind': 'error',
			'no-extra-label': 'error',
			'no-implied-eval': 'error',
			'no-invalid-this': 'off',
			'no-iterator': 'error',
			'no-lone-blocks': 'error',
			'no-loop-func': 'error',
			'no-multi-str': 'error',
			'no-new-wrappers': 'error',
			'no-proto': 'error',
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
			'no-return-assign': ['error', 'always'],
			'no-return-await': 'error',
			'no-self-compare': 'error',
			'no-sequences': 'error',
			'no-throw-literal': 'error',
			'no-useless-call': 'off',
			'no-useless-catch': 'warn',
			'no-useless-concat': 'error',
			'no-useless-return': 'error',
			'no-void': 'off',
			'preserve-caught-error': 'warn',
			'yoda': 'error',
		},
	},
	{
		name: 'rocket.chat/common-mistakes',
		rules: {
			'getter-return': ['error', { allowImplicit: true }],
			'no-async-promise-executor': 'warn',
			'no-case-declarations': 'warn',
			'no-constant-binary-expression': 'warn',
			'no-debugger': 'error',
			'no-inner-declarations': ['error', 'functions'],
			'no-negated-in-lhs': 'error',
			'no-prototype-builtins': 'warn',
			'no-unsafe-optional-chaining': 'warn',
			'no-useless-assignment': 'warn',
			'require-atomic-updates': 'off',
			'valid-typeof': ['error', { requireStringLiterals: true }],
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
	{
		name: 'rocket.chat/stylistic',
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
			'no-array-constructor': 'error',
			'no-lonely-if': 'error',
			'no-multi-assign': 'error',
			'no-nested-ternary': 'error',
			'no-unneeded-ternary': ['error', { defaultAssignment: false }],
			'no-useless-escape': 'warn',
			'one-var': ['error', 'never'],
			'operator-assignment': ['error', 'always'],
			'prefer-object-spread': 'off',
		},
	},
	{
		name: 'rocket.chat/variables',
		rules: {
			'no-unused-vars': [
				'error',
				{
					vars: 'all',
					args: 'after-used',
					ignoreRestSiblings: true,
					caughtErrors: 'none',
				},
			],
			'no-use-before-define': ['error', { functions: true, classes: true, variables: true }],
		},
	},
	{
		name: 'rocket.chat/es2015',
		rules: {
			'no-duplicate-imports': 'off',
			'no-useless-computed-key': 'error',
			'no-useless-constructor': 'error',
			'no-useless-rename': [
				'error',
				{
					ignoreDestructuring: false,
					ignoreImport: false,
					ignoreExport: false,
				},
			],
			'no-var': 'error',
			'object-shorthand': 'error',
			'prefer-const': [
				'error',
				{
					destructuring: 'any',
					ignoreReadBeforeAssign: true,
				},
			],
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
			'prefer-rest-params': 'error',
			'prefer-template': 'error',
		},
	},
	{
		name: 'rocket.chat/import',
		settings: {
			'import/resolver': {
				node: true,
				typescript: true,
			},
		},
		rules: {
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
			'import/export': 'error',
			'import/no-named-as-default': 'off',
			'import/no-named-as-default-member': 'off',
			'import/first': 'error',
			'import/no-duplicates': 'error',
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
			'import/no-absolute-path': 'error',
			'import/no-dynamic-require': 'error',
			'import/no-self-import': 'error',
			'import/no-cycle': 'off',
			'import/no-useless-path-segments': 'error',
		},
	},
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
	{
		name: 'rocket.chat/react-testing',
		files: ['**/*.stories.@(ts|tsx|mts|cts|js|jsx|mjs|cjs)', '**/*.spec.@(ts|tsx|js|jsx|mjs|cjs)'],
		rules: {
			'react/display-name': 'off',
			'react/no-multi-comp': 'off',
		},
	},
);
