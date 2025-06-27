import { base } from '@rocket.chat/eslint-config';
import pluginJest from 'eslint-plugin-jest';
export default base({
	files: ['**/*.spec.js', '**/*.spec.jsx'],
	plugins: { jest: pluginJest },
	languageOptions: {
		globals: pluginJest.environments.globals.globals,
	},
});
