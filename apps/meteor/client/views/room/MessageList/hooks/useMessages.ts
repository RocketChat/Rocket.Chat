import { IRoom, IMessage } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';
import { useCallback, useMemo } from 'react';

import { ChatMessage } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useMessageListContext } from '../contexts/MessageListContext';
import { parseMessage } from '../lib/parseMessage';

const options = {
	sort: {
		ts: 1,
	},
};

export const useMessages = ({ rid }: { rid: IRoom['_id'] }): IMessage[] => {
	const { autoTranslateLanguage, katex, showColors, useShowTranslated } = useMessageListContext();

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

	const query: Mongo.Query<IMessage> = useMemo(
		() => ({
			rid,
			_hidden: { $ne: true },
			$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
		}),
		[rid],
	);

	return useReactiveValue<IMessage[]>(
		useCallback(
			() =>
				ChatMessage.find(query, options)
					.fetch()
					.map((message) => parseMessage(message, parseOptions, autoTranslateLanguage, useShowTranslated)),
			[query],
		),
	);
};
