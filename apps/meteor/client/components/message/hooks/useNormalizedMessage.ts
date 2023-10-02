import type { IMessage } from '@rocket.chat/core-typings';
import type { Options } from '@rocket.chat/message-parser';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { MessageWithMdEnforced } from '../../../lib/parseMessageTextToAstMarkdown';
import { parseMessageTextToAstMarkdown, removePossibleNullMessageValues } from '../../../lib/parseMessageTextToAstMarkdown';
import { useAutoLinkDomains } from '../../../views/room/MessageList/hooks/useAutoLinkDomains';
import { useAutoTranslate } from '../../../views/room/MessageList/hooks/useAutoTranslate';
import { useKatex } from '../../../views/room/MessageList/hooks/useKatex';
import { useSubscriptionFromMessageQuery } from './useSubscriptionFromMessageQuery';

export const useNormalizedMessage = <TMessage extends IMessage>(message: TMessage): MessageWithMdEnforced => {
	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();
	const customDomains = useAutoLinkDomains();
	const subscription = useSubscriptionFromMessageQuery(message).data ?? undefined;
	const autoTranslateOptions = useAutoTranslate(subscription);
	const showColors = useSetting<boolean>('HexColorPreview_Enabled');

	return useMemo(() => {
		const parseOptions: Options = {
			colors: showColors,
			emoticons: true,
			customDomains,
			...(katexEnabled && {
				katex: {
					dollarSyntax: katexDollarSyntaxEnabled,
					parenthesisSyntax: katexParenthesisSyntaxEnabled,
				},
			}),
		};

		return parseMessageTextToAstMarkdown(removePossibleNullMessageValues(message), parseOptions, autoTranslateOptions);
	}, [showColors, customDomains, katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled, message, autoTranslateOptions]);
};
