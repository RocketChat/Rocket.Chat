import renderElementSpread from './render-element-spread.js';
import spacingScale from './spacing-scale.js';

export default {
	meta: { name: '@rocket.chat/lint-config/rules' },
	rules: {
		'render-element-spread': renderElementSpread,
		'spacing-scale': spacingScale,
	},
};
