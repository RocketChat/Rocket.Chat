import { settings } from '../../settings';


export default {
	isEnabled: () => settings.get('Katex_Enabled'),

	isDollarSyntaxEnabled: () => settings.get('Katex_Dollar_Syntax'),

	isParenthesisSyntaxEnabled: () => settings.get('Katex_Parenthesis_Syntax'),
};
