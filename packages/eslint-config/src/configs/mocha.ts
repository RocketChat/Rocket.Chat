import mochaPlugin from 'eslint-plugin-mocha';
import globals from 'globals';
import type { Linter } from 'eslint';
import { getRules } from './helpers/plugin.js';

export default function mocha(config: Linter.Config = {}): Linter.Config {
	return {
		name: 'mocha',
		files: config.files ?? [
			'**/*.spec.js',
			'**/*.test.js',
			'**/*.tests.js',
			'**/*.mock.js',
			'**/*.spec.ts',
			'**/*.test.ts',
			'**/*.tests.ts',
			'**/*.mock.ts',
		],
		plugins: { mocha: mochaPlugin },
		languageOptions: {
			globals: config.languageOptions?.globals ?? globals.mocha,
		},
		rules: {
			...getRules(mochaPlugin, 'recommended'),
			...config.rules,
		},
	};
}
