import rocketChatConfig from '@rocket.chat/eslint-config/flat.mjs';
import jestPlugin from 'eslint-plugin-jest';
import noFloatingPromisePlugin from 'eslint-plugin-no-floating-promise';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import youDontNeedLodashUnderscorePlugin from 'eslint-plugin-you-dont-need-lodash-underscore';
import globals from 'globals';

function getAbsolutePath(path) {
	return new URL(path, import.meta.url).pathname;
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
			'!apps/meteor/**/.mocharc.js',
			'!apps/meteor/**/.mocharc.*.js',
			'!apps/meteor/**/.scripts',
			'!apps/meteor/**/.storybook',
			'apps/meteor/**/storybook-static',
			'apps/meteor/**/packages',
			'apps/meteor/.meteor/**',
		],
	},
	{
		files: ['apps/meteor/**/*'],
		languageOptions: {
			globals: {
				__meteor_bootstrap__: 'readonly',
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
		rules: {
			'import/named': 'error',
			'import/no-unresolved': [
				'error',
				{
					commonjs: true,
					caseSensitive: true,
					amd: true,
					ignore: ['^meteor/.+$'],
				},
			],
			'react-hooks/exhaustive-deps': [
				'warn',
				{
					additionalHooks: '(useComponentDidUpdate)',
				},
			],
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
		files: ['apps/meteor/**/*.ts', 'apps/meteor/**/*.tsx'],
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
		languageOptions: {
			parserOptions: {
				project: getAbsolutePath('./apps/meteor/tsconfig.json'),
			},
		},
	},
	{
		files: ['apps/meteor/**/*.tests.js', 'apps/meteor/**/*.tests.ts', 'apps/meteor/**/*.spec.ts'],
		languageOptions: {
			globals: {
				...globals.mocha,
			},
		},
	},
	{
		files: ['apps/meteor/**/*.spec.ts', 'apps/meteor/**/*.spec.tsx'],
		...testingLibraryPlugin.configs['flat/react'],
		rules: {
			'testing-library/no-await-sync-events': 'warn',
			'testing-library/no-manual-cleanup': 'warn',
			'testing-library/prefer-explicit-assert': 'warn',
			'testing-library/prefer-user-event': 'warn',
		},
		languageOptions: {
			globals: {
				...globals.mocha,
			},
		},
	},
	{
		files: [
			'apps/meteor/**/*.stories.js',
			'apps/meteor/**/*.stories.jsx',
			'apps/meteor/**/*.stories.ts',
			'apps/meteor/**/*.stories.tsx',
			'apps/meteor/**/*.spec.tsx',
		],
		rules: {
			'react/display-name': 'off',
			'react/no-multi-comp': 'off',
		},
	},
	{
		files: ['apps/meteor/**/*.stories.ts', 'apps/meteor/**/*.stories.tsx'],
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
		},
	},
	{
		files: ['apps/meteor/client/**/*.ts', 'apps/meteor/client/**/*.tsx', 'apps/meteor/ee/client/**/*.ts', 'apps/meteor/ee/client/**/*.tsx'],
		rules: {
			'@typescript-eslint/no-misused-promises': 'off',
			'@typescript-eslint/no-floating-promises': 'off',
		},
	},
	{
		files: ['apps/meteor/tests/e2e/**/*'],
		languageOptions: {
			parserOptions: {
				project: getAbsolutePath('./apps/meteor/tsconfig.json'),
			},
		},
		plugins: {
			'testing-library': testingLibraryPlugin,
			'no-floating-promise': noFloatingPromisePlugin,
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
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
		files: ['apps/uikit-playground/**/*'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.es2020,
			},
		},
		plugins: {
			'react-refresh': reactRefreshPlugin,
		},
		rules: {
			'@typescript-eslint/consistent-type-imports': 'off',
			'import/order': 'off',
			'prettier/prettier': 'off',
			'react-refresh/only-export-components': 'warn',
			'spaced-comment': 'off',
			'array-callback-return': 'off',
			'@typescript-eslint/no-floating-promises': 'off',
			'import/export': 'off',
			'jsx-quotes': 'off',
			'import/newline-after-import': 'off',
			'react/jsx-curly-brace-presence': 'off',
			'prefer-destructuring': 'off',
			'object-shorthand': 'off',
			'import/no-duplicates': 'off',
			'@typescript-eslint/naming-convention': 'off',
			'react/jsx-key': 'off',
			'jsx-a11y/click-events-have-key-events': 'off',
			'jsx-a11y/no-static-element-interactions': 'off',
			'no-nested-ternary': 'off',
			'new-cap': 'off',
		},
	},
	{
		ignores: [
			'apps/uikit-playground/build',
			'apps/uikit-playground/storybook-static',
			'!apps/uikit-playground/.jest',
			'!apps/uikit-playground/.storybook',
			'apps/uikit-playground/.storybook/jest-results.json',
			'apps/uikit-playground/.DS_Store',
			'apps/uikit-playground/.env.local',
			'apps/uikit-playground/.env.development.local',
			'apps/uikit-playground/.env.test.local',
			'apps/uikit-playground/.env.production.local',
			'apps/uikit-playground/npm-debug.log*',
			'apps/uikit-playground/yarn-debug.log*',
			'apps/uikit-playground/yarn-error.log*',
		],
	},
	{
		files: ['ee/apps/account-service/**/*.spec.js', 'ee/apps/account-service/**/*.spec.jsx'],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
	{
		files: ['ee/apps/authorization-service/**/*.spec.js', 'ee/apps/authorization-service/**/*.spec.jsx'],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
	{
		files: ['ee/apps/ddp-streamer/**/*.spec.js', 'ee/apps/ddp-streamer/**/*.spec.jsx'],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
	{
		files: ['ee/apps/presence-service/**/*.spec.js', 'ee/apps/presence-service/**/*.spec.jsx'],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
	{
		ignores: ['ee/packages/federation-matrix/src/api/.well-known/server.ts'],
	},
	{
		ignores: ['!ee/packages/pdf-worker/.storybook'],
	},
	{
		files: ['packages/apps-engine/**/*.ts'],
		languageOptions: {
			parserOptions: {
				project: getAbsolutePath('./packages/apps-engine/tsconfig-lint.json'),
			},
		},
		rules: {
			'@typescript-eslint/ban-types': [
				'error',
				{
					types: {
						'{}': false,
					},
				},
			],
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
			'no-await-in-loop': 'off',
		},
	},
	{
		ignores: [
			'packages/apps-engine/**/client/**/*',
			'packages/apps-engine/**/definition/**/*',
			'packages/apps-engine/**/docs/**/*',
			'packages/apps-engine/**/server/**/*',
			'packages/apps-engine/**/lib/**/*',
			'packages/apps-engine/**/deno-runtime/**/*',
			'packages/apps-engine/**/.deno/**/*',
			'packages/apps-engine/**/.deno-cache/**/*',
		],
	},
	{
		files: ['packages/core-typings/**/*'],
		rules: {
			'@typescript-eslint/no-empty-interface': 'off',
		},
	},
	{
		files: ['packages/core-typings/**/*.spec.js', 'packages/core-typings/**/*.spec.jsx'],
		languageOptions: {
			globals: {
				...globals.jest,
			},
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
		files: ['packages/favicon/**/*'],
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'off',
		},
	},
	{
		ignores: ['packages/fuselage-ui-kit/storybook-static', '!packages/fuselage-ui-kit/.storybook'],
	},
	{
		files: ['packages/fuselage-ui-kit/**/*.ts', 'packages/fuselage-ui-kit/**/*.tsx'],
		rules: {
			'@typescript-eslint/no-misused-promises': 'off',
		},
	},
	{
		ignores: ['packages/gazzodown/storybook-static', '!packages/gazzodown/.storybook'],
	},
	{
		files: ['packages/instance-status/**/*.spec.js', 'packages/instance-status/**/*.spec.jsx'],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
	{
		ignores: ['packages/jest-presets/client/**', 'packages/jest-presets/server/**'],
	},
	{
		files: ['packages/livechat/**/*'],
		ignores: ['packages/livechat/storybook-static', '!packages/livechat/.storybook'],
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
			'react/no-find-dom-node': 'error',
			'react/no-is-mounted': 'error',
			'react/no-multi-comp': 'off',
			'react/no-string-refs': 'error',
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
		files: ['packages/livechat/**/*.ts', 'packages/livechat/**/*.tsx'],
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
			'@typescript-eslint/no-misused-promises': 'off',
		},
	},
	{
		files: ['packages/password-policies/**/*'],
		plugins: {
			jest: jestPlugin,
		},
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
	{
		files: ['packages/release-changelog/**/*'],
		plugins: {
			jest: jestPlugin,
		},
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
	{
		ignores: ['packages/storybook-config/*.d.ts', 'packages/storybook-config/*.js'],
	},
	{
		ignores: ['packages/ui-avatar/storybook-static', '!packages/ui-avatar/.storybook'],
	},
	{
		ignores: ['packages/ui-client/storybook-static', '!packages/ui-client/.storybook'],
	},
	{
		files: ['packages/ui-client/**/*.ts', 'packages/ui-client/**/*.tsx'],
		rules: {
			'@typescript-eslint/no-misused-promises': 'off',
		},
	},
	{
		ignores: ['packages/ui-composer/storybook-static', '!packages/ui-composer/.storybook'],
	},
	{
		files: ['packages/ui-contexts/**/*.ts', 'packages/ui-contexts/**/*.tsx'],
		rules: {
			'@typescript-eslint/no-misused-promises': 'off',
		},
	},
	{
		ignores: ['packages/ui-video-conf/storybook-static', '!packages/ui-video-conf/.storybook'],
	},
	{
		ignores: ['packages/ui-voip/storybook-static', '!packages/ui-voip/.storybook'],
	},
	{
		files: ['packages/ui-voip/**/*.ts', 'packages/ui-voip/**/*.tsx'],
		rules: {
			'@typescript-eslint/no-misused-promises': 'off',
		},
	},
	{
		files: ['packages/web-ui-registration/**/*'],
		ignores: ['packages/web-ui-registration/storybook-static', '!packages/web-ui-registration/.storybook'],
	},
	{
		files: ['packages/web-ui-registration/**/*.ts', 'packages/web-ui-registration/**/*.tsx'],
		rules: {
			'@typescript-eslint/no-misused-promises': 'off',
		},
	},
	{
		files: ['packages/sha256/**/*', 'packages/models/**/*'],
		rules: {
			'new-cap': [
				'error',
				{
					capIsNewExceptions: ['SHA256'],
				},
			],
		},
	},
];
