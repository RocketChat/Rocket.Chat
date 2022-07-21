import { IMessage, isTranslatedMessage, ITranslatedMessage } from '@rocket.chat/core-typings';
import { Root, parse } from '@rocket.chat/message-parser';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useShowTranslated } from '../contexts/MessageListContext';
import { useAutotranslateLanguage } from './useAutotranslateLanguage';

export function useParsedMessage(message: IMessage & Partial<ITranslatedMessage>): Root {
	const colors = useSetting('HexColorPreview_Enabled') as boolean;
	const katexDollarSyntax = useSetting('Katex_Dollar_Syntax') as boolean;
	const katexParenthesisSyntax = useSetting('Katex_Parenthesis_Syntax') as boolean;
	const autoTranslateLanguage = useAutotranslateLanguage(message.rid);
	const translated = useShowTranslated({ message });

	return useMemo(() => {
		const parseOptions = {
			colors,
			emoticons: true,
			katex: {
				dollarSyntax: katexDollarSyntax,
				parenthesisSyntax: katexParenthesisSyntax,
			},
		};

		if (translated && autoTranslateLanguage && isTranslatedMessage(message)) {
			return parse(message.translations[autoTranslateLanguage], parseOptions);
		}
		if (message.md) {
			return message.md;
		}

		if (!message.msg) {
			return [];
		}

		return parse(message.msg, parseOptions);
	}, [colors, katexDollarSyntax, katexParenthesisSyntax, autoTranslateLanguage, message.md, message.msg, message.translations]);
}
