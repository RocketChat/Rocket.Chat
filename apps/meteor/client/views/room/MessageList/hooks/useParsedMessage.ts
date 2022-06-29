import { IMessage } from '@rocket.chat/core-typings';
import { Root, parse } from '@rocket.chat/message-parser';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export function useParsedMessage(message: Pick<IMessage, 'md' | 'msg'>): Root {
	const colors = useSetting('HexColorPreview_Enabled') as boolean;
	const katexDollarSyntax = useSetting('Katex_Dollar_Syntax') as boolean;
	const katexParenthesisSyntax = useSetting('Katex_Parenthesis_Syntax') as boolean;

	return useMemo(() => {
		if (message.md) {
			return message.md;
		}

		if (!message.msg) {
			return [];
		}

		return parse(message.msg, {
			colors,
			emoticons: true,
			katex: {
				dollarSyntax: katexDollarSyntax,
				parenthesisSyntax: katexParenthesisSyntax,
			},
		});
	}, [colors, katexDollarSyntax, katexParenthesisSyntax, message.md, message.msg]);
}
