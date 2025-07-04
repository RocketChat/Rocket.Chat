import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/build/**', '**/out/**', 'eslint.config.mjs'],
	},
	js.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: { projectService: true },
		},
	},
);
