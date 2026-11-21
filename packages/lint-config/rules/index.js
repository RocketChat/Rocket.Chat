import noGenericModelMethods from './no-generic-model-methods.js';
import spacingScale from './spacing-scale.js';

export default {
	meta: { name: '@rocket.chat/lint-config/rules' },
	rules: {
		'no-generic-model-methods': noGenericModelMethods,
		'spacing-scale': spacingScale,
	},
};
