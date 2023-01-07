import type { IRoom, IMessage, MessageTypesValues } from '@rocket.chat/core-typings';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { Mongo } from 'meteor/mongo';
import { useCallback, useMemo } from 'react';

import { Messages } from '../../../../../app/models/client';
import { useMessageListContext } from '../../../../components/message/list/MessageListContext';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import type { MessageWithMdEnforced } from '../../../../lib/parseMessageTextToAstMarkdown';
import { parseMessageTextToAstMarkdown, removePossibleNullMessageValues } from '../../../../lib/parseMessageTextToAstMarkdown';

const options = {
	sort: {
		ts: 1,
	},
};

export const useMessages = ({ rid }: { rid: IRoom['_id'] }): MessageWithMdEnforced[] => {
	const { autoTranslateLanguage, katex, showColors, useShowTranslated } = useMessageListContext();
	const hideSysMessages = useStableArray(useSetting<MessageTypesValues[]>('Hide_System_Messages', []));

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
			t: { $nin: hideSysMessages },
			$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
		}),
		[rid, hideSysMessages],
	);

	return useReactiveValue<MessageWithMdEnforced[]>(
		useCallback(() => Messages.find(query, options).fetch().map(normalizeMessage), [query, normalizeMessage]),
	);
};
