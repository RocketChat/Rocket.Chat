import React, { useMemo, FC, memo } from 'react';

import { EmojiPicker } from '../../../../../app/emoji/client';
import { IMessage, isTranslatedMessage, isMessageReactionsNormalized } from '../../../../../definition/IMessage';
import { IRoom } from '../../../../../definition/IRoom';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useEndpoint } from '../../../../contexts/ServerContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useUser, useUserPreference, useUserSubscription } from '../../../../contexts/UserContext';
import { MessageListContext, MessageListContextValue } from '../contexts/MessageListContext';
import { useAutotranslateLanguage } from '../hooks/useAutotranslateLanguage';

const fields = {};

export const MessageListProvider: FC<{
	rid: IRoom['_id'];
}> = memo(function MessageListProvider({ rid, ...props }) {
	const reactToMessage = useEndpoint('POST', 'chat.react');
	const user = useUser();
	const uid = user?._id;
	const username = user?.username;
	const subscription = useUserSubscription(rid, fields);

	const { isMobile } = useLayout();

	const showUsernames = Boolean(useSetting('UI_Use_Real_Name')) && !isMobile;
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled');
	const showRoles = Boolean(!useUserPreference<boolean>('hideRoles') && !isMobile);

	const autoTranslateLanguage = useAutotranslateLanguage(rid);

	const hasSubscription = Boolean(subscription);

	const context: MessageListContextValue = useMemo(
		() => ({
			useReactionsFilter: (message: IMessage): ((reaction: string) => string[]) => {
				const { reactions } = message;
				return !showUsernames
					? (reaction: string): string[] =>
							reactions?.[reaction]?.usernames.filter((user) => user !== username).map((username) => `@${username}`) || []
					: (reaction: string): string[] => {
							if (!reactions || !reactions[reaction]) {
								return [];
							}
							if (!isMessageReactionsNormalized(message)) {
								return (message.reactions && message.reactions[reaction]?.usernames.map((username) => `@${username}`)) || [];
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
							Boolean(message.reactions && message.reactions[reaction].usernames.includes(username))
				: () => (): boolean => false,
			useShowFollowing: uid
				? ({ message }): boolean => Boolean(message.replies && message.replies.indexOf(uid) > -1)
				: (): boolean => false,
			useShowTranslated:
				uid && autoTranslateEnabled && hasSubscription && autoTranslateLanguage
					? ({ message }): boolean =>
							message.u && message.u._id !== uid && isTranslatedMessage(message) && Boolean(message.translations[autoTranslateLanguage])
					: (): boolean => false,
			useShowStarred: hasSubscription
				? ({ message }): boolean => Boolean(Array.isArray(message.starred) && message.starred.find((star) => star._id === uid))
				: (): boolean => false,
			useMessageDateFormatter:
				() =>
				(date: Date): string =>
					date.toLocaleString(),

			showRoles,
			showUsernames,

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
		[uid, autoTranslateEnabled, hasSubscription, autoTranslateLanguage, showRoles, username, reactToMessage, showUsernames],
	);

	return <MessageListContext.Provider value={context} {...props} />;
});
