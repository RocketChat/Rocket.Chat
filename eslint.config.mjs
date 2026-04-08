import { fileURLToPath } from 'node:url';

import rocketChatConfig from '@rocket.chat/eslint-config';
import youDontNeedLodashUnderscorePlugin from 'eslint-plugin-you-dont-need-lodash-underscore';
import globals from 'globals';

function getAbsolutePath(path) {
	return fileURLToPath(new URL(path, import.meta.url));
}

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	...rocketChatConfig,
	{
		ignores: [
			'apps/meteor/app/emoji-emojione/generateEmojiIndex.js',
			'apps/meteor/**/public',
			'apps/meteor/**/private/moment-locales',
			'apps/meteor/**/imports',
			'apps/meteor/**/packages',
			'apps/meteor/.meteor/**',
		],
	},
	{
		files: ['apps/meteor/**/*'],
		languageOptions: {
			globals: {
				__meteor_runtime_config__: 'readonly',
				Assets: 'readonly',
				chrome: 'readonly',
				jscolor: 'readonly',
				...globals.browser,
			},
		},
		plugins: {
			'you-dont-need-lodash-underscore': youDontNeedLodashUnderscorePlugin,
		},
		settings: {
			'import/ignore': ['meteor/.+'],
		},
		rules: {
			'import/named': 'error',
			'import/no-unresolved': [
				'error',
				{
					commonjs: true,
					caseSensitive: true,
					ignore: ['meteor/.+'],
				},
			],
			'react-hooks/exhaustive-deps': 'warn',
			'you-dont-need-lodash-underscore/concat': 'error',
			'you-dont-need-lodash-underscore/drop': 'error',
			'you-dont-need-lodash-underscore/drop-right': 'error',
			'you-dont-need-lodash-underscore/index-of': 'error',
			'you-dont-need-lodash-underscore/join': 'error',
			'you-dont-need-lodash-underscore/last': 'error',
			'you-dont-need-lodash-underscore/last-index-of': 'error',
			'you-dont-need-lodash-underscore/reverse': 'error',
			'you-dont-need-lodash-underscore/fill': 'error',
			'you-dont-need-lodash-underscore/detect': 'error',
			'you-dont-need-lodash-underscore/first': 'error',
			'you-dont-need-lodash-underscore/is-array': 'error',
			'you-dont-need-lodash-underscore/slice': 'error',
			'you-dont-need-lodash-underscore/bind': 'error',
			'you-dont-need-lodash-underscore/is-finite': 'error',
			'you-dont-need-lodash-underscore/is-integer': 'error',
			'you-dont-need-lodash-underscore/is-nan': 'error',
			'you-dont-need-lodash-underscore/is-nil': 'error',
			'you-dont-need-lodash-underscore/is-null': 'error',
			'you-dont-need-lodash-underscore/is-undefined': 'error',
			'you-dont-need-lodash-underscore/keys': 'error',
			'you-dont-need-lodash-underscore/extend-own': 'error',
			'you-dont-need-lodash-underscore/assign': 'error',
			'you-dont-need-lodash-underscore/values': 'error',
			'you-dont-need-lodash-underscore/entries': 'error',
			'you-dont-need-lodash-underscore/to-pairs': 'error',
			'you-dont-need-lodash-underscore/pairs': 'error',
			'you-dont-need-lodash-underscore/split': 'error',
			'you-dont-need-lodash-underscore/starts-with': 'error',
			'you-dont-need-lodash-underscore/ends-with': 'error',
			'you-dont-need-lodash-underscore/to-lower': 'error',
			'you-dont-need-lodash-underscore/to-upper': 'error',
			'you-dont-need-lodash-underscore/trim': 'error',
			'you-dont-need-lodash-underscore/pad-start': 'error',
			'you-dont-need-lodash-underscore/pad-end': 'error',
			'you-dont-need-lodash-underscore/repeat': 'error',
			'you-dont-need-lodash-underscore/uniq': 'error',
			'you-dont-need-lodash-underscore/replace': 'error',
			'you-dont-need-lodash-underscore/omit': 'error',
			'you-dont-need-lodash-underscore/flatten': 'error',
			'you-dont-need-lodash-underscore/throttle': 'error',
			'you-dont-need-lodash-underscore/is-string': 'error',
			'you-dont-need-lodash-underscore/cast-array': 'error',
			'you-dont-need-lodash-underscore/clone-deep': 'error',
			'you-dont-need-lodash-underscore/is-function': 'error',
			'you-dont-need-lodash-underscore/capitalize': 'error',
			'you-dont-need-lodash-underscore/is-date': 'error',
			'you-dont-need-lodash-underscore/defaults': 'error',
			'you-dont-need-lodash-underscore/head': 'error',
			'you-dont-need-lodash-underscore/find': 'warn',
			'you-dont-need-lodash-underscore/find-index': 'warn',
			'you-dont-need-lodash-underscore/each': 'warn',
			'you-dont-need-lodash-underscore/for-each': 'warn',
			'you-dont-need-lodash-underscore/every': 'warn',
			'you-dont-need-lodash-underscore/all': 'warn',
			'you-dont-need-lodash-underscore/filter': 'warn',
			'you-dont-need-lodash-underscore/select': 'warn',
			'you-dont-need-lodash-underscore/map': 'warn',
			'you-dont-need-lodash-underscore/collect': 'warn',
			'you-dont-need-lodash-underscore/reduce': 'warn',
			'you-dont-need-lodash-underscore/inject': 'warn',
			'you-dont-need-lodash-underscore/foldl': 'warn',
			'you-dont-need-lodash-underscore/reduce-right': 'warn',
			'you-dont-need-lodash-underscore/foldr': 'warn',
			'you-dont-need-lodash-underscore/size': 'warn',
			'you-dont-need-lodash-underscore/some': 'warn',
			'you-dont-need-lodash-underscore/any': 'warn',
			'you-dont-need-lodash-underscore/includes': 'warn',
			'you-dont-need-lodash-underscore/contains': 'warn',
			'you-dont-need-lodash-underscore/take-right': 'warn',
			'you-dont-need-lodash-underscore/get': 'warn',
			'you-dont-need-lodash-underscore/union-by': 'warn',
			'you-dont-need-lodash-underscore/is-array-buffer': 'warn',
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
			'prefer-arrow-callback': [
				'error',
				{
					allowNamedFunctions: true,
				},
			],
		},
	},
	{
		files: ['apps/meteor/**/*.@(ts|tsx)'],
		ignores: ['apps/meteor/.scripts/*.ts', 'apps/meteor/**/*.d.ts'],
		rules: {
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: ['function', 'parameter', 'variable'],
					modifiers: ['destructured'],
					format: null,
				},
				{
					selector: ['variable'],
					format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: ['function'],
					format: ['camelCase', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: ['parameter'],
					format: ['PascalCase'],
					filter: {
						regex: 'Component$',
						match: true,
					},
				},
				{
					selector: ['parameter'],
					format: ['camelCase'],
					leadingUnderscore: 'allow',
				},
				{
					selector: ['parameter'],
					format: ['camelCase'],
					modifiers: ['unused'],
					leadingUnderscore: 'require',
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
					selector: ['interface'],
					format: ['PascalCase'],
					custom: {
						regex: '^I[A-Z]',
						match: true,
					},
				},
			],
			'no-unreachable-loop': 'error',
		},
	},
	{
		files: ['apps/meteor/**/*.tests.js'],
		languageOptions: {
			globals: {
				...globals.mocha,
			},
		},
	},
	{
		files: ['apps/meteor/tests/@(end-to-end|unit)/**/*.spec.ts'],
		rules: {
			'jest/expect-expect': 'off',
			'jest/no-conditional-expect': 'off',
			'jest/no-done-callback': 'off',
			'jest/no-export': 'off',
			'jest/no-identical-title': 'off',
			'jest/no-standalone-expect': 'off',
			'jest/no-test-prefixes': 'off',
			'jest/valid-describe-callback': 'off',
			'jest/valid-expect-in-promise': 'off',
			'jest/valid-expect': 'off',
			'jest/valid-title': 'off',
		},
	},
	{
		files: ['apps/meteor/tests/@(end-to-end|unit)/**/*.ts'],
		rules: {
			'@typescript-eslint/no-unused-expressions': 'off',
		},
	},
	{
		files: [
			'apps/meteor/client/**/*.@(ts|tsx)',
			'apps/meteor/server/**/*.ts',
			'apps/meteor/ee/app/**/*.ts',
			'apps/meteor/ee/client/**/*.@(ts|tsx)',
			'apps/meteor/ee/server/**/*.ts',
			'packages/i18n/src/scripts/common.mts',
		],
		rules: {
			'@typescript-eslint/no-floating-promises': 'off',
		},
	},
	{
		files: ['apps/meteor/tests/e2e/**/*'],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
		rules: {
			'@typescript-eslint/no-floating-promises': 'error',
			'import/named': 'error',
			'import/order': [
				'error',
				{
					'newlines-between': 'always',
					'groups': ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
					'alphabetize': {
						order: 'asc',
					},
				},
			],
		},
	},
	{
		files: ['apps/meteor/packages/**/*'],
		languageOptions: {
			globals: {
				Package: 'readonly',
				Npm: 'readonly',
			},
		},
	},
	{
		files: ['packages/apps-engine/**/*.ts'],
		languageOptions: {
			parserOptions: {
				project: getAbsolutePath('./packages/apps-engine/tsconfig-lint.json'),
			},
		},
		rules: {
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'error',
			'@typescript-eslint/no-wrapper-object-types': 'error',
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: ['function', 'parameter', 'variable'],
					modifiers: ['destructured'],
					format: null,
				},
				{
					selector: ['variable'],
					format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: ['function'],
					format: ['camelCase', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: ['parameter'],
					format: ['camelCase'],
					leadingUnderscore: 'allow',
				},
				{
					selector: ['parameter'],
					format: ['camelCase'],
					modifiers: ['unused'],
					leadingUnderscore: 'allow',
				},
				{
					selector: ['interface'],
					format: ['PascalCase'],
					custom: {
						regex: '^I[A-Z]',
						match: true,
					},
				},
			],
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
			'new-cap': 'off',
		},
	},
	{
		ignores: ['packages/apps-engine/**/@(client|definition|docs|server|lib|deno-runtime|.deno|.deno-cache)/**'],
	},
	{
		files: ['packages/core-typings/**/*'],
		rules: {
			'@typescript-eslint/no-empty-interface': 'off',
		},
	},
	{
		files: ['packages/ddp-client/**/*'],
		rules: {
			'@typescript-eslint/naming-convention': [
				'error',
				{ selector: 'variableLike', format: ['camelCase'], leadingUnderscore: 'allow' },
				{
					selector: ['variable'],
					format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: ['function'],
					format: ['camelCase', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: 'parameter',
					format: ['camelCase'],
					modifiers: ['unused'],
					leadingUnderscore: 'require',
				},
			],
		},
	},
	{
		ignores: ['packages/jest-presets/@(client|server)/**'],
	},
	{
		files: ['packages/livechat/**/*'],
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
		settings: {
			react: {
				pragma: 'h',
				pragmaFrag: 'Fragment',
				version: 'detect',
			},
		},
		rules: {
			'import/order': [
				'error',
				{
					'newlines-between': 'always',
					'groups': ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
					'alphabetize': {
						order: 'asc',
					},
				},
			],
			'jsx-a11y/alt-text': 'off',
			'jsx-a11y/click-events-have-key-events': 'off',
			'jsx-a11y/media-has-caption': 'off',
			'jsx-a11y/no-static-element-interactions': 'off',
			'jsx-quotes': ['error', 'prefer-single'],
			'react/jsx-curly-brace-presence': 'off',
			'react/display-name': [
				'warn',
				{
					ignoreTranspilerName: false,
				},
			],
			'react/jsx-fragments': ['error', 'syntax'],
			'react/jsx-key': 'off',
			'react/jsx-no-bind': [
				'warn',
				{
					ignoreRefs: true,
					allowFunctions: true,
					allowArrowFunctions: true,
				},
			],
			'react/jsx-no-comment-textnodes': 'error',
			'react/jsx-no-duplicate-props': 'error',
			'react/jsx-no-target-blank': 'error',
			'react/jsx-no-undef': 'error',
			'react/jsx-tag-spacing': [
				'error',
				{
					beforeSelfClosing: 'always',
				},
			],
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react/no-children-prop': 'error',
			'react/no-danger': 'warn',
			'react/no-deprecated': 'error',
			'react/no-did-mount-set-state': 'error',
			'react/no-did-update-set-state': 'error',
			'react/no-direct-mutation-state': 'warn',
			'react/no-find-dom-node': 'error',
			'react/no-is-mounted': 'error',
			'react/no-multi-comp': 'off',
			'react/no-string-refs': 'error',
			'react/no-unknown-property': ['error', { ignore: ['class'] }],
			'react/prefer-es6-class': 'error',
			'react/prefer-stateless-function': 'warn',
			'react/require-render-return': 'error',
			'react/self-closing-comp': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'no-sequences': 'off',
		},
	},
	{
		files: ['packages/livechat/**/*.@(ts|tsx)'],
		rules: {
			'@typescript-eslint/naming-convention': [
				'error',
				{ selector: 'variableLike', format: ['camelCase'], leadingUnderscore: 'allow' },
				{
					selector: ['variable'],
					format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: ['function'],
					format: ['camelCase', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: 'parameter',
					format: ['camelCase'],
					modifiers: ['unused'],
					leadingUnderscore: 'require',
				},
			],
		},
	},
	{
		ignores: ['packages/node-poplib/**', 'packages/storybook-config/*.@(d.ts|js)', 'scripts/**', '.github/**', '.houston/**'],
	},
	{
		ignores: ['scripts/**'],
	},
	{
		files: [
			'apps/meteor/client/**/*.@(ts|tsx)',
			'apps/meteor/app/**/*.ts',
			'apps/meteor/ee/app/**/*.ts',
			'apps/meteor/ee/client/**/*.@(ts|tsx)',
			'apps/meteor/ee/server/**/*.ts',
			'apps/meteor/server/**/*.ts',
			'packages/fuselage-ui-kit/**/*.@(ts|tsx)',
			'packages/livechat/**/*.@(ts|tsx)',
			'packages/ui-client/**/*.@(ts|tsx)',
			'packages/ui-voip/**/*.@(ts|tsx)',
			'packages/web-ui-registration/**/*.@(ts|tsx)',
		],
		rules: {
			'@typescript-eslint/no-misused-promises': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					varsIgnorePattern: 'Endpoints?$|Routes$|^invites$|^livechatVisitorDepartmentTransfer$', // FIXME?
					argsIgnorePattern: '^_',
					ignoreRestSiblings: true,
					caughtErrors: 'none',
				},
			],
		},
	},
	{
		files: ['packages/@(sha256|models)/**/*'],
		rules: {
			'new-cap': [
				'error',
				{
					capIsNewExceptions: ['SHA256'],
				},
			],
		},
	},
	// FIXME: React 19 useEffectEvent conflicts with fuselage-hooks
	{
		files: ['**/*.@(ts|tsx)'],
		rules: {
			'react-hooks/exhaustive-deps': 'warn',
			'react-hooks/rules-of-hooks': 'warn',
		},
	},
	// FIXME: these rules require type information and the files are not included in the main tsconfig.json
	{
		files: [
			'**/*.d.ts',
			'**/__tests__/**',
			'**/*.@(spec|test).@(ts|tsx)',
			'**/tests/**',
			'**/.storybook/**',
			'**/jest.config.@(ts|js)',
			'**/jest.config.*.@(ts|js)',
			'**/webpack.config.@(ts|js)',
			'**/vite.config.@(ts|js)',
			'**/rollup.config.@(ts|js)',

			'apps/meteor/.storybook/logo.svg.d.ts',
			'packages/fuselage-ui-kit/.storybook/logo.svg.d.ts',
			'packages/storybook-config/src/logo.svg.d.ts',

			'@(ee/packages|packages)/*/jest.config.ts',

			'ee/packages/pdf-worker/.storybook/*.@(ts|tsx)',
			'packages/@(gazzodown|ui-client|ui-composer|ui-voip|web-ui-registration)/.storybook/*.@(ts|tsx)',
		],
		rules: {
			'@typescript-eslint/prefer-optional-chain': 'off',
			'@typescript-eslint/no-misused-promises': 'off',
		},
	},
	// FIXME: these storybook rules cannot be enabled until Storybook is upgraded to >=9
	{
		files: ['**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)'],
		rules: {
			'storybook/no-renderer-packages': 'off',
		},
	},
	// FIXME
	{
		files: ['ee/packages/federation-matrix/src/api/.well-known/server.ts'],
		rules: {
			'import/order': 'warn',
		},
	},
];
