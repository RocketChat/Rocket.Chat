import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { Mongo } from 'meteor/mongo';
import { useCallback, useMemo } from 'react';

import { ChatMessage } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useMessageListContext } from '../contexts/MessageListContext';
import type { MessageWithMdEnforced } from '../lib/parseMessageTextToAstMarkdown';
import { parseMessageTextToAstMarkdown, removePossibleNullMessageValues } from '../lib/parseMessageTextToAstMarkdown';

const options = {
	sort: {
		ts: 1,
	},
};

export const useMessages = ({ rid }: { rid: IRoom['_id'] }): MessageWithMdEnforced[] => {
	const { autoTranslateLanguage, katex, showColors, useShowTranslated } = useMessageListContext();
	const hideSysMes = useSetting('Hide_System_Messages');

	const hideSysMessagesStable = useStableArray(Array.isArray(hideSysMes) ? hideSysMes : []);

	const normalizeMessage = useMemo(() => {
		const parseOptions = {
			colors: showColors,
			emoticons: true,
			...(Boolean(katex) && {
				katex: {
					dollarSyntax: katex?.dollarSyntaxEnabled,
					parenthesisSyntax: katex?.parenthesisSyntaxEnabled,
				},
			}),
		};
		return (message: IMessage): MessageWithMdEnforced =>
			parseMessageTextToAstMarkdown(removePossibleNullMessageValues(message), parseOptions, autoTranslateLanguage, useShowTranslated);
	}, [autoTranslateLanguage, katex, showColors, useShowTranslated]);

	const query: Mongo.Query<IMessage> = useMemo(
		() => ({
			rid,
			_hidden: { $ne: true },
			t: { $nin: hideSysMessagesStable },
			$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
		}),
		[rid, hideSysMessagesStable],
	);

	return useReactiveValue<MessageWithMdEnforced[]>(
		useCallback(() => ChatMessage.find(query, options).fetch().map(normalizeMessage), [query, normalizeMessage]),
	);
};
