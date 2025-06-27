// @ts-check
import { base, jest, mocha, react } from '@rocket.chat/eslint-config';
import globals from 'globals';

export default base(
	{
		ignores: ['packages/**/*', 'definition/**/*', '.scripts/**/*', 'imports/client/**/*'],
	},
	jest(),
	mocha({
		rules: {
			'mocha/no-mocha-arrows': 'off', // Allow arrow functions in tests
		},
	}),
	react({
		files: ['server/**/*', 'app/*/server/**/*', 'app/*/lib/**/*'],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.meteor,
				__meteor_runtime_config__: 'readonly',
			},
			parserOptions: {
				projectService: true,
			},
		},
	}),
);
