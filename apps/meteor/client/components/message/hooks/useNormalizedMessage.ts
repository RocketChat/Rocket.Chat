import type { IMessage } from '@rocket.chat/core-typings';
import type { Options } from '@rocket.chat/message-parser';
import { useMemo } from 'react';

import type { MessageWithMdEnforced } from '../../../lib/parseMessageTextToAstMarkdown';
import { normalizeMessage } from '../../../providers/MessagesProvider/normalizeMessage';
import { useAutoLinkDomains } from '../../../views/room/MessageList/hooks/useAutoLinkDomains';
import { useMessageListAutoTranslate, useMessageListKatex, useMessageListShowColors } from '../list/MessageListContext';

export const useNormalizedMessage = <TMessage extends IMessage>(message: TMessage): MessageWithMdEnforced => {
	const katex = useMessageListKatex();
	const katexEnabled = !!katex;
	const customDomains = useAutoLinkDomains();
	const autoTranslateOptions = useMessageListAutoTranslate();
	const showColors = useMessageListShowColors();

	return useMemo(() => {
		const parseOptions: Options = {
			colors: showColors,
			emoticons: true,
			customDomains,
			...(katexEnabled && {
				katex: {
					dollarSyntax: katex.dollarSyntaxEnabled,
					parenthesisSyntax: katex.parenthesisSyntaxEnabled,
				},
			}),
		};

		return normalizeMessage(message, parseOptions, autoTranslateOptions);
	}, [showColors, customDomains, katexEnabled, katex?.dollarSyntaxEnabled, katex?.parenthesisSyntaxEnabled, message, autoTranslateOptions]);
};
