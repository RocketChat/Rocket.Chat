import { IMessage, isTranslatedMessage, ITranslatedMessage } from '@rocket.chat/core-typings';
import type { Root } from '@rocket.chat/message-parser';

import { useMessageListContext, useShowTranslated } from '../contexts/MessageListContext';
import { useParsedText } from './useParsedText';

export const useParsedMessage = (message: IMessage & Partial<ITranslatedMessage>): Root => {
	const { autoTranslateLanguage, katex, showColors } = useMessageListContext();
	const translated = useShowTranslated({ message });
	const translations = isTranslatedMessage(message) && message.translations;

	const { md, msg } = message;

	const text = (translated && autoTranslateLanguage && translations && translations[autoTranslateLanguage]) || msg;

	return useParsedText(md || text, { katexEnabled: Boolean(katex), ...katex, showColors });
};
