import { base, jest, mocha, react } from '@rocket.chat/eslint-config';
import globals from 'globals';

export default base(
	{
		ignores: ['packages/**/*', 'definition/**/*', '.scripts/**/*', 'imports/client/**/*'],
	},
	jest(),
	mocha(),
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
