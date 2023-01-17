import { useSetting } from '@rocket.chat/ui-contexts';

export const useKatex = (): {
	katexEnabled: boolean;
	katexDollarSyntaxEnabled: boolean;
	katexParenthesisSyntaxEnabled: boolean;
} => {
	const katexEnabled = Boolean(useSetting('Katex_Enabled'));
	const katexDollarSyntaxEnabled = Boolean(useSetting('Katex_Dollar_Syntax')) && katexEnabled;
	const katexParenthesisSyntaxEnabled = Boolean(useSetting('Katex_Parenthesis_Syntax')) && katexEnabled;

	return {
		katexEnabled,
		katexDollarSyntaxEnabled,
		katexParenthesisSyntaxEnabled,
	};
};
