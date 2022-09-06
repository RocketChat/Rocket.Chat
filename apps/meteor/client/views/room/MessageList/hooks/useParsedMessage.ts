import { IMessage, isTranslatedMessage, ITranslatedMessage } from '@rocket.chat/core-typings';
import { Root, parse } from '@rocket.chat/message-parser';
import { useMemo } from 'react';

import { useMessageListContext, useShowTranslated } from '../contexts/MessageListContext';

export function useParsedMessage(message: IMessage & Partial<ITranslatedMessage>): Root {
	const { autoTranslateLanguage, katex, showColors } = useMessageListContext();
	const translated = useShowTranslated({ message });
	const translations = isTranslatedMessage(message) && message.translations;
	const { md, msg } = message;

	return useMemo(() => {
		const parseOptions = {
			colors: showColors,
			emoticons: true,
			...(katex && {
				katex: {
					dollarSyntax: katex.dollarSyntaxEnabled,
					parenthesisSyntax: katex.parenthesisSyntaxEnabled,
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
	}, [showColors, katex, autoTranslateLanguage, md, msg, translated, translations]);
}
