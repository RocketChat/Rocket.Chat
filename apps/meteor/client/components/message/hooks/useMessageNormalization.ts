import type { IMessage } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { MessageWithMdEnforced } from '../../../lib/parseMessageTextToAstMarkdown';
import { parseMessageTextToAstMarkdown, removePossibleNullMessageValues } from '../../../lib/parseMessageTextToAstMarkdown';
import { useAutoTranslate } from '../../../views/room/MessageList/hooks/useAutoTranslate';
import { useKatex } from '../../../views/room/MessageList/hooks/useKatex';
import { useRoomSubscription } from '../../../views/room/contexts/RoomContext';

export const useMessageNormalization = (): (<TMessage extends IMessage>(message: TMessage) => MessageWithMdEnforced) => {
	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();

	const subscription = useRoomSubscription();
	const autoTranslateOptions = useAutoTranslate(subscription);
	const showColors = useSetting<boolean>('HexColorPreview_Enabled');

	return useMemo(() => {
		const parseOptions = {
			colors: showColors,
			emoticons: true,
			...(katexEnabled && {
				katex: {
					dollarSyntax: katexDollarSyntaxEnabled,
					parenthesisSyntax: katexParenthesisSyntaxEnabled,
				},
			}),
		};

		return <TTMessage extends IMessage>(message: TTMessage): MessageWithMdEnforced =>
			parseMessageTextToAstMarkdown(removePossibleNullMessageValues(message), parseOptions, autoTranslateOptions);
	}, [showColors, katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled, autoTranslateOptions]);
};
