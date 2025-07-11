import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';

import globals from 'globals';
import type { Linter } from 'eslint';

const configs = {
	'testing-library': {
		files: ['**/*.stories.js', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.tsx', '**/*.spec.tsx'],
		plugins: {
			'testing-library': testingLibrary,
		},
		rules: {
			'testing-library/await-async-events': ['warn', { eventModule: 'userEvent' }],
			'testing-library/await-async-queries': 'warn',
			'testing-library/await-async-utils': 'warn',
			'testing-library/no-await-sync-events': ['warn', { eventModules: ['fire-event'] }],
			'testing-library/no-await-sync-queries': 'warn',
			'testing-library/no-container': 'warn',
			'testing-library/no-debugging-utils': 'warn',
			'testing-library/no-dom-import': ['warn', 'react'],
			'testing-library/no-global-regexp-flag-in-query': 'warn',
			'testing-library/no-manual-cleanup': 'warn',
			'testing-library/no-node-access': 'warn',
			'testing-library/no-promise-in-fire-event': 'warn',
			'testing-library/no-render-in-lifecycle': 'warn',
			'testing-library/no-unnecessary-act': 'warn',
			'testing-library/no-wait-for-multiple-assertions': 'warn',
			'testing-library/no-wait-for-side-effects': 'warn',
			'testing-library/no-wait-for-snapshot': 'warn',
			'testing-library/prefer-find-by': 'warn',
			'testing-library/prefer-presence-queries': 'warn',
			'testing-library/prefer-query-by-disappearance': 'warn',
			'testing-library/prefer-screen-queries': 'warn',
			'testing-library/render-result-naming-convention': 'warn',
		},
	},
	'jsx-a11y': {
		plugins: {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			'jsx-a11y': jsxA11y,
		},
		rules: {
			'jsx-a11y/click-events-have-key-events': 'warn',
			'jsx-a11y/no-static-element-interactions': 'warn',
			'jsx-a11y/no-autofocus': 'warn',
			'jsx-a11y/media-has-caption': 'warn',
			'jsx-a11y/iframe-has-title': 'warn',
			'jsx-a11y/alt-text': 'warn',
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
	},
} satisfies Record<string, Linter.Config>;

type ReactRules = {
	[Key in keyof (typeof reactPlugin)['rules'] as `react/${Key}`]?: Linter.RuleEntry<unknown[]>;
};

export default function react(config: Linter.Config<ReactRules> = {}): Linter.Config[] {
	return [
		reactPlugin.configs.flat['recommended']!,
		reactPlugin.configs.flat['jsx-runtime']!,
		reactHooks.configs['recommended-latest'],
		reactRefresh.configs.recommended,
		configs['jsx-a11y'],
		configs['testing-library'],
		{
			languageOptions: {
				globals: globals.browser,
			},
		},
		config,
	];
}
