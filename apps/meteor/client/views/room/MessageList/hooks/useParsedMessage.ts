import { IMessage, isTranslatedMessage, ITranslatedMessage } from '@rocket.chat/core-typings';
import { Root, parse } from '@rocket.chat/message-parser';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useShowTranslated } from '../contexts/MessageListContext';
import { useAutotranslateLanguage } from './useAutotranslateLanguage';

export function useParsedMessage(message: IMessage & Partial<ITranslatedMessage>): Root {
	const colors = useSetting('HexColorPreview_Enabled') as boolean;
	const katexEnabled = useSetting('Katex_Enabled') as boolean;
	const katexDollarSyntax = useSetting('Katex_Dollar_Syntax') as boolean;
	const katexParenthesisSyntax = useSetting('Katex_Parenthesis_Syntax') as boolean;
	const autoTranslateLanguage = useAutotranslateLanguage(message.rid);
	const translated = useShowTranslated({ message });
	const translations = isTranslatedMessage(message) ? message.translations : undefined;
	const { md, msg } = message;

	return useMemo(() => {
		const parseOptions = {
			colors,
			emoticons: true,
			...(katexEnabled && {
				katex: {
					dollarSyntax: katexDollarSyntax,
					parenthesisSyntax: katexParenthesisSyntax,
				},
			}),
		};

		if (translated && autoTranslateLanguage && translations) {
			return parse(translations[autoTranslateLanguage], parseOptions);
		}
		if (md) {
			return md;
		}

		if (!msg) {
			return [];
		}

		return parse(msg, parseOptions);
	}, [colors, katexEnabled, katexDollarSyntax, katexParenthesisSyntax, autoTranslateLanguage, md, msg, translated, translations]);
}
