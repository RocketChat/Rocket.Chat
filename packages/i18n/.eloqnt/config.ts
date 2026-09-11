import { defineConfig } from '@eloqnt/cli';

export default defineConfig({
	messages: {
		path: './src/locales/{locale}',
		locales: 'infer',
		sourceLocale: 'en',
		format: {
			codec: '@eloqnt/format-i18next-json',
			extension: '.i18n.json',
		},
	},
	lint: {
		rules: {
			// Keys missing from a locale fall back to `en` at runtime
			'missing-translation': 'off',
		},
		overrides: [
			{
				// Plurals are nested objects that the build flattens to i18next's `key_one`/`key_other`,
				// so locales with more CLDR forms than `en` (`few`, `many`, …) read as extra keys here
				keys: ['*.zero', '*.two', '*.few', '*.many'],
				rules: { 'superfluous-key': 'off' },
			},
		],
	},
});
