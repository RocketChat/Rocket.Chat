import { builtinRules } from 'eslint/use-at-your-own-risk';

// Exposes ESLint's core rules to oxlint's jsPlugins, for the rules oxlint lacks or reports differently.
export default {
	meta: { name: 'eslint-js' },
	rules: Object.fromEntries(builtinRules),
};
