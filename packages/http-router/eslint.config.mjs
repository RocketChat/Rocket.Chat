import { defineConfig } from '@rocket.chat/eslint-config/base';

export default defineConfig({
	languageOptions: {
		parserOptions: {
			projectService: {
				allowDefaultProject: ['src/*.spec.ts', 'src/middlewares/*.spec.ts'],
			},
		},
	},
});
