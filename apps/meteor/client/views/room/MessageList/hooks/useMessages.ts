import type { IRoom, IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { Mongo } from 'meteor/mongo';
import { useCallback, useMemo } from 'react';

import { Messages } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import type { MessageWithMdEnforced } from '../lib/parseMessageTextToAstMarkdown';
import { parseMessageTextToAstMarkdown, removePossibleNullMessageValues } from '../lib/parseMessageTextToAstMarkdown';
import { useAutoTranslate } from './useAutoTranslate';
import { useKatex } from './useKatex';

const options = {
	sort: {
		ts: 1,
	},
};

export const useMessages = ({ rid, subscription }: { rid: IRoom['_id']; subscription?: ISubscription }): MessageWithMdEnforced[] => {
	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();
	const autoTranslateOptions = useAutoTranslate(subscription);
	const showColors = Boolean(useSetting('HexColorPreview_Enabled'));
	const hideSysMes = useSetting('Hide_System_Messages');

	const hideSysMessagesStable = useStableArray(Array.isArray(hideSysMes) ? hideSysMes : []);

	const normalizeMessage = useMemo(() => {
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
		return (message: IMessage): MessageWithMdEnforced =>
			parseMessageTextToAstMarkdown(removePossibleNullMessageValues(message), parseOptions, autoTranslateOptions);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		autoTranslateOptions.autoTranslateEnabled,
		autoTranslateOptions.autoTranslateLanguage,
		katexParenthesisSyntaxEnabled,
		katexEnabled,
		katexDollarSyntaxEnabled,
		showColors,
	]);

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
		useCallback(() => Messages.find(query, options).fetch().map(normalizeMessage), [query, normalizeMessage]),
	);
};
