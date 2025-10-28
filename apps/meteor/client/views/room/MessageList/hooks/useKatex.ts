import { useSetting } from '@rocket.chat/ui-contexts';

export const useKatex = (): {
	katexEnabled: boolean;
	katexDollarSyntaxEnabled: boolean;
	katexParenthesisSyntaxEnabled: boolean;
} => {
	const katexEnabled = useSetting('Katex_Enabled', true);
	const katexDollarSyntaxEnabled = useSetting('Katex_Dollar_Syntax', false) && katexEnabled;
	const katexParenthesisSyntaxEnabled = useSetting('Katex_Parenthesis_Syntax', true) && katexEnabled;

	return {
		katexEnabled,
		katexDollarSyntaxEnabled,
		katexParenthesisSyntaxEnabled,
	};
};
