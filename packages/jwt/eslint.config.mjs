import { defineConfig } from '@rocket.chat/eslint-config/base';

export default defineConfig({
	languageOptions: {
		parserOptions: {
			projectService: {
				allowDefaultProject: ['__tests__/*.spec.ts'],
			},
		},
	},
});
