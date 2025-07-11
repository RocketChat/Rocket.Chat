import { base, jest, mocha, react } from '@rocket.chat/eslint-config';
import globals from 'globals';

export default base(
	{
		ignores: ['packages/**/*', 'definition/**/*', '.scripts/**/*', 'imports/**/*'],
	},
	jest({
		rules: {
			'jest/valid-title': 'warn',
		},
	}),
	mocha({
		rules: {
			'mocha/no-mocha-arrows': 'warn',
			'mocha/consistent-spacing-between-blocks': 'warn',
			'mocha/no-sibling-hooks': 'warn',
			'mocha/no-setup-in-describe': 'warn',
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
	{
		rules: {
			'import-x/order': [
				'error',
				{
					'newlines-between': 'always',
					'groups': ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
					'alphabetize': {
						order: 'asc',
					},
				},
			],
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
		},
	},
);
