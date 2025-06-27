import { base } from '@rocket.chat/eslint-config';

export default base({
	languageOptions: {
		parserOptions: {
			projectService: {
				allowDefaultProject: ['tests/*.ts', 'tests/utils/*.ts'],
			},
		},
	},
});
