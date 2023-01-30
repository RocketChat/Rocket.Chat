import type { IRoom, IMessage, MessageTypesValues } from '@rocket.chat/core-typings';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { useSetting, useUserSubscription } from '@rocket.chat/ui-contexts';
import type { Mongo } from 'meteor/mongo';
import { useCallback, useMemo } from 'react';

import { Messages } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import type { MessageWithMdEnforced } from '../../../../lib/parseMessageTextToAstMarkdown';
import { parseMessageTextToAstMarkdown, removePossibleNullMessageValues } from '../../../../lib/parseMessageTextToAstMarkdown';
import { useAutoTranslate } from './useAutoTranslate';
import { useKatex } from './useKatex';

export const useMessages = ({ rid }: { rid: IRoom['_id'] }): MessageWithMdEnforced[] => {
	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();
	const subscription = useUserSubscription(rid);

	const autoTranslateOptions = useAutoTranslate(subscription);
	const showColors = Boolean(useSetting('HexColorPreview_Enabled'));
	const hideSysMes = useSetting<MessageTypesValues[]>('Hide_System_Messages');

	const hideSysMessages = useStableArray(Array.isArray(hideSysMes) ? hideSysMes : []);

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
	}, [showColors, katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled, autoTranslateOptions]);

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
		useCallback(
			() =>
				Messages.find(query, {
					sort: {
						ts: 1,
					},
				})
					.fetch()
					.map(normalizeMessage),
			[query, normalizeMessage],
		),
	);
};
