import {
	IRoom,
	IMessage,
	isTranslatedMessage,
	isMessageReactionsNormalized,
	MessageAttachment,
	isThreadMainMessage,
} from '@rocket.chat/core-typings';
import { useLayout, useUser, useUserPreference, useUserSubscription, useSetting, useEndpoint, useUserRoom } from '@rocket.chat/ui-contexts';
import React, { useMemo, FC, memo } from 'react';

import { AutoTranslate } from '../../../../../app/autotranslate/client';
import { EmojiPicker } from '../../../../../app/emoji/client';
import { getRegexHighlight, getRegexHighlightUrl } from '../../../../../app/highlight-words/client/helper';
import ToolboxProvider from '../../providers/ToolboxProvider';
import { MessageListContext, MessageListContextValue } from '../contexts/MessageListContext';
import { useAutotranslateLanguage } from '../hooks/useAutotranslateLanguage';

const fields = {};

export const MessageListProvider: FC<{
	rid: IRoom['_id'];
}> = memo(function MessageListProvider({ rid, ...props }) {
	const reactToMessage = useEndpoint('POST', '/v1/chat.react');
	const user = useUser();
	const uid = user?._id;
	const username = user?.username;
	const subscription = useUserSubscription(rid, fields);

	const { isMobile } = useLayout();

	const showRealName = Boolean(useSetting('UI_Use_Real_Name')) && !isMobile;
	const showReadReceipt = Boolean(useSetting('Message_Read_Receipt_Enabled'));
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled');
	const katexEnabled = Boolean(useSetting('Katex_Enabled'));
	const katexDollarSyntaxEnabled = Boolean(useSetting('Katex_Dollar_Syntax'));
	const katexParenthesisSyntaxEnabled = Boolean(useSetting('Katex_Parenthesis_Syntax'));
	const showColors = useSetting('HexColorPreview_Enabled') as boolean;

	const showRoles = Boolean(!useUserPreference<boolean>('hideRoles') && !isMobile);
	const showUsername = Boolean(!useUserPreference<boolean>('hideUsernames') && !isMobile);
	const highlights = useUserPreference<string[]>('highlights');

	const autoTranslateLanguage = useAutotranslateLanguage(rid);

	const hasSubscription = Boolean(subscription);

	const context: MessageListContextValue = useMemo(
		() => ({
			showColors,
			useReactionsFilter: (message: IMessage): ((reaction: string) => string[]) => {
				const { reactions } = message;
				return !showRealName
					? (reaction: string): string[] =>
							reactions?.[reaction]?.usernames.filter((user) => user !== username).map((username) => `@${username}`) || []
					: (reaction: string): string[] => {
							if (!reactions || !reactions[reaction]) {
								return [];
							}
							if (!isMessageReactionsNormalized(message)) {
								return message.reactions?.[reaction]?.usernames.filter((user) => user !== username).map((username) => `@${username}`) || [];
							}
							if (!username) {
								return message.reactions[reaction].names;
							}
							const index = message.reactions[reaction].usernames.indexOf(username);
							if (index === -1) {
								return message.reactions[reaction].names;
							}

							return message.reactions[reaction].names.splice(index, 1);
					  };
			},
			useUserHasReacted: username
				? (message) =>
						(reaction): boolean =>
							Boolean(message.reactions?.[reaction].usernames.includes(username))
				: () => (): boolean => false,
			useShowFollowing: uid
				? ({ message }): boolean => Boolean(message.replies && message.replies.indexOf(uid) > -1 && !isThreadMainMessage(message))
				: (): boolean => false,
			autoTranslateLanguage,
			useShowTranslated:
				uid && autoTranslateEnabled && hasSubscription && autoTranslateLanguage
					? ({ message }): boolean =>
							Boolean(message.u) &&
							message.u?._id !== uid &&
							isTranslatedMessage(message) &&
							Boolean(message.translations[autoTranslateLanguage]) &&
							!message.autoTranslateShowInverse
					: (): boolean => false,
			useTranslateProvider:
				autoTranslateEnabled && autoTranslateLanguage
					? ({ message }): string | boolean =>
							isTranslatedMessage(message) && AutoTranslate.providersMetadata[message.translationProvider]?.displayName
					: (): boolean => false,
			useTranslateAttachments:
				uid && autoTranslateEnabled && hasSubscription && autoTranslateLanguage
					? ({ message }): MessageAttachment[] =>
							(isTranslatedMessage(message) &&
								message.u?._id !== uid &&
								message.attachments &&
								AutoTranslate.translateAttachments(message.attachments, autoTranslateLanguage, !!message.autoTranslateShowInverse)) ||
							message.attachments ||
							[]
					: ({ message }): MessageAttachment[] => message.attachments || [],
			useShowStarred: hasSubscription
				? ({ message }): boolean => Boolean(Array.isArray(message.starred) && message.starred.find((star) => star._id === uid))
				: (): boolean => false,
			useMessageDateFormatter:
				() =>
				(date: Date): string =>
					date.toLocaleString(),
			showReadReceipt,
			showRoles,
			showRealName,
			showUsername,
			...(katexEnabled && {
				katex: {
					dollarSyntaxEnabled: katexDollarSyntaxEnabled,
					parenthesisSyntaxEnabled: katexParenthesisSyntaxEnabled,
				},
			}),
			highlights: highlights
				?.map((str) => str.trim())
				.map((highlight) => ({
					highlight,
					regex: getRegexHighlight(highlight),
					urlRegex: getRegexHighlightUrl(highlight),
				})),
			useReactToMessage: uid
				? (message) =>
						(reaction): void =>
							reactToMessage({ messageId: message._id, reaction }) as unknown as void
				: () => (): void => undefined,

			useOpenEmojiPicker: uid
				? (message) =>
						(e): void => {
							e.nativeEvent.stopImmediatePropagation();
							EmojiPicker.open(
								e.currentTarget,
								(emoji: string) => reactToMessage({ messageId: message._id, reaction: emoji }) as unknown as void,
							);
						}
				: () => (): void => undefined,
		}),
		[
			username,
			uid,
			autoTranslateEnabled,
			hasSubscription,
			autoTranslateLanguage,
			showRoles,
			showRealName,
			showUsername,
			showReadReceipt,
			katexEnabled,
			katexDollarSyntaxEnabled,
			katexParenthesisSyntaxEnabled,
			highlights,
			reactToMessage,
			showColors,
		],
	);

	const room = useUserRoom(rid);

	if (!room) {
		throw new Error('Room not found');
	}

	return (
		<ToolboxProvider room={room}>
			<MessageListContext.Provider value={context} {...props} />
		</ToolboxProvider>
	);
});
