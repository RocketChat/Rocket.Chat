import validTranslation from './rules/valid-translation.js';

export default {
	meta: { name: '@rocket.chat/eslint-plugin' },
	rules: {
		'valid-translation': validTranslation,
	},
};
